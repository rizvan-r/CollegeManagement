import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useStudentNotices } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function StudentNoticesScreen() {
  const router = useRouter();
  const { data: notices, isLoading, isError, error, refetch, isRefetching } = useStudentNotices();
  const [filterAudience, setFilterAudience] = useState('ALL'); // 'ALL' | 'COLLEGE_WIDE' | 'DEPARTMENT_ONLY'

  const filteredNotices = (notices || []).filter((item) => {
    if (filterAudience === 'ALL') return true;
    return item.audience === filterAudience;
  });

  const renderNoticeItem = ({ item }) => {
    const isUrgent = item.priority === 'HIGH' || item.priority === 'URGENT';
    const isDepartment = item.audience === 'DEPARTMENT_ONLY';

    return (
      <Card style={styles.noticeCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/(student)/notice/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.badgesGroup}>
              <View
                style={[
                  styles.priorityPill,
                  { backgroundColor: isUrgent ? '#FEF2F2' : '#EEF2FF' },
                ]}
              >
                <Text
                  style={[
                    styles.priorityPillText,
                    { color: isUrgent ? COLORS.danger : COLORS.primary },
                  ]}
                >
                  {item.priority || 'NORMAL'}
                </Text>
              </View>

              <View style={styles.audiencePill}>
                <Text style={styles.audiencePillText}>
                  {isDepartment ? (item.department_name || 'DEPARTMENT') : 'COLLEGE-WIDE'}
                </Text>
              </View>
            </View>

            <Text style={styles.dateText}>
              {item.publish_date ? String(item.publish_date).split('T')[0] : 'Recent'}
            </Text>
          </View>

          <Text style={styles.noticeTitle}>{item.title}</Text>
          <Text style={styles.noticeSnippet} numberOfLines={2}>
            {item.content}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.authorText}>
              Issuer: {item.author_name || 'Administration'}
            </Text>
            <Text style={styles.readMoreText}>Read Announcement →</Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Institutional Circulars</Text>
        <Text style={styles.screenSubtitle}>
          Authorized College & Department Announcements
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterAudience('ALL')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterAudience === 'ALL' && styles.filterChipTextActive,
            ]}
          >
            All Notices ({notices?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'COLLEGE_WIDE' && styles.filterChipActive]}
          onPress={() => setFilterAudience('COLLEGE_WIDE')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterAudience === 'COLLEGE_WIDE' && styles.filterChipTextActive,
            ]}
          >
            Campus-Wide
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'DEPARTMENT_ONLY' && styles.filterChipActive]}
          onPress={() => setFilterAudience('DEPARTMENT_ONLY')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterAudience === 'DEPARTMENT_ONLY' && styles.filterChipTextActive,
            ]}
          >
            Department
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving authorized circulars..." />
        </View>
      ) : isError ? (
        <ErrorView
          title="Could Not Load Notices"
          message={error?.message || 'Failed to retrieve notice announcements.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={filteredNotices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNoticeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
              icon="notifications-off-outline"
              title="No Circulars Available"
              message="There are no active notices or announcements matching the selected filter."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.borderLight,
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noticeCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  audiencePill: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  audiencePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  noticeSnippet: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  authorText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
});

