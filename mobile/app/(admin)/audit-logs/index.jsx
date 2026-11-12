import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminAuditLogs } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminAuditLogsScreen() {
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const { data: logs, isLoading, isError, error, refetch, isRefetching } = useAdminAuditLogs({
    limit: 60,
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!search.trim()) return logs;
    const term = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(term) ||
        l.entity_name?.toLowerCase().includes(term) ||
        l.entity_id?.toLowerCase().includes(term) ||
        l.user_email?.toLowerCase().includes(term)
    );
  }, [logs, search]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Querying Immutable Audit Logs..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to retrieve audit trail'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>System Audit Trail</Text>
        <Text style={styles.headerSubtitle}>
          Immutable Security and Governance Event Logs
        </Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by action, entity, user email..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No Log Entries Found"
            message={search ? 'No audit entries match your query.' : 'No system actions have been recorded yet.'}
          />
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <Card key={log.id} style={styles.logCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <View style={styles.logHeader}>
                    <View style={styles.actionTag}>
                      <Text style={styles.actionText}>{log.action}</Text>
                    </View>
                    <Text style={styles.logDate}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </Text>
                  </View>

                  <Text style={styles.entityTitle}>
                    Entity: <Text style={{ fontWeight: '700' }}>{log.entity_name}</Text>{' '}
                    {log.entity_id ? `(${log.entity_id})` : ''}
                  </Text>

                  <View style={styles.userRow}>
                    <Ionicons name="person-circle-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.userText}>
                      Initiated by: {log.user_email || 'System'} ({log.user_role || 'ADMIN'})
                    </Text>
                  </View>

                  <View style={styles.expandRow}>
                    <Text style={styles.expandText}>{isExpanded ? 'Hide Payload' : 'Inspect Payload'}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.payloadBox}>
                    {log.old_data ? (
                      <View style={styles.payloadSection}>
                        <Text style={styles.payloadLabel}>Previous State:</Text>
                        <Text style={styles.payloadJson}>
                          {JSON.stringify(log.old_data, null, 2)}
                        </Text>
                      </View>
                    ) : null}

                    {log.new_data ? (
                      <View style={styles.payloadSection}>
                        <Text style={styles.payloadLabel}>Applied State / Changes:</Text>
                        <Text style={styles.payloadJson}>
                          {JSON.stringify(log.new_data, null, 2)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  logCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTag: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  logDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  entityTitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  payloadBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  payloadSection: {
    marginBottom: 6,
  },
  payloadLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  payloadJson: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.textPrimary,
  },
});

