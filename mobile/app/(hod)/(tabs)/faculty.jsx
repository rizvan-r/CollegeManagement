import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useHodFaculty } from '../../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function HodFacultyScreen() {
  const { data: faculty, isLoading, isError, error, refetch, isRefetching } = useHodFaculty();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving department faculty roster..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Faculty"
          message={error?.message || 'Unable to retrieve faculty directory.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const facultyList = faculty || [];
  const filteredFaculty = facultyList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.first_name?.toLowerCase().includes(q) ||
      item.last_name?.toLowerCase().includes(q) ||
      item.employee_id?.toLowerCase().includes(q) ||
      item.designation?.toLowerCase().includes(q) ||
      item.courses_summary?.toLowerCase().includes(q)
    );
  });

  const renderFacultyItem = ({ item }) => {
    const assignedCount = item.assigned_courses_count || 0;
    const coursesText = item.courses_summary || 'No active assignments';

    return (
      <Card style={styles.facultyCard}>
        <View style={styles.facultyHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(item.first_name || item.name || 'F').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.facultyName} numberOfLines={1}>
              {item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim()}
            </Text>
            <Text style={styles.designationText}>{item.designation}</Text>
            <Text style={styles.employeeIdText}>{item.employee_id}</Text>
          </View>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
          </View>
        </View>

        <View style={styles.qualRow}>
          <Ionicons name="school-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.qualText}>{item.qualification || 'M.Tech / Ph.D.'}</Text>
        </View>

        {/* Assigned Courses Section */}
        <View style={styles.coursesSection}>
          <View style={styles.coursesSectionHeader}>
            <Text style={styles.coursesSectionLabel}>Teaching Workload</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{assignedCount} Courses</Text>
            </View>
          </View>
          <Text style={styles.coursesListText} numberOfLines={2}>
            {coursesText}
          </Text>
        </View>

        <View style={styles.contactFooter}>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
          </View>
          {item.phone ? (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.screenTitle}>Department Faculty</Text>
          <Text style={styles.screenSubtitle}>Instructional Staff & Workload Directory</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillNum}>{facultyList.length}</Text>
          <Text style={styles.countPillLabel}>Staff</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by faculty name, ID, or course code..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredFaculty}
        keyExtractor={(item) => String(item.id || item.employee_id)}
        renderItem={renderFacultyItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? 'No Matching Faculty' : 'No Faculty Found'}
            message={
              searchQuery
                ? `No faculty members found matching "${searchQuery}".`
                : 'No faculty members are currently registered in this department.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Refresh List'}
            onAction={searchQuery ? () => setSearchQuery('') : refetch}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countPill: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  countPillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
  },
  countPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facultyCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
  },
  facultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  designationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginTop: 1,
  },
  employeeIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  qualText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  coursesSection: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  coursesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coursesSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  coursesListText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

