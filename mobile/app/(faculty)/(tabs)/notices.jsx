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
import { useFacultyNotices } from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function FacultyNoticesScreen() {
  const router = useRouter();
  const { data: notices, isLoading, isError, error, refetch, isRefetching } = useFacultyNotices();
  const [filterAudience, setFilterAudience] = useState('ALL'); // 'ALL' | 'COLLEGE_WIDE' | 'DEPARTMENT_ONLY' | 'FACULTY_ONLY'

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving institutional circulars..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Notices"
          message={error?.message || 'Failed to retrieve college circulars.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const noticeList = notices || [];
  const filteredNotices = noticeList.filter((item) => {
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
          onPress={() => router.push(`/(faculty)/notice/${item.id}`)}
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
                  {isDepartment ? (item.department_name || 'DEPARTMENT') : item.audience || 'COLLEGE-WIDE'}
                </Text>
              </View>
            </View>

            <Text style={styles.publishDate}>
              {item.publish_date
                ? new Date(item.publish_date).toLocaleDateString()
                : 'Current'}
            </Text>
          </View>

          <Text style={styles.noticeTitle}>{item.title}</Text>
          <Text style={styles.noticeContent} numberOfLines={3}>
            {item.content}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.authorGroup}>
              <Ionicons name="person-circle-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.authorText}>
                {item.author_name || 'College Administration'}
              </Text>
            </View>
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
        <View>
          <Text style={styles.screenTitle}>Institutional Circulars</Text>
          <Text style={styles.screenSubtitle}>College Announcements & Department Advisories</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterAudience('ALL')}
        >
          <Text style={[styles.filterChipText, filterAudience === 'ALL' && styles.filterChipTextActive]}>
            All ({noticeList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'COLLEGE_WIDE' && styles.filterChipActive]}
          onPress={() => setFilterAudience('COLLEGE_WIDE')}
        >
          <Text style={[styles.filterChipText, filterAudience === 'COLLEGE_WIDE' && styles.filterChipTextActive]}>
            Campus Wide
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterAudience === 'DEPARTMENT_ONLY' && styles.filterChipActive]}
          onPress={() => setFilterAudience('DEPARTMENT_ONLY')}
        >
          <Text style={[styles.filterChipText, filterAudience === 'DEPARTMENT_ONLY' && styles.filterChipTextActive]}>
            Department
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNoticeItem}
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
            icon="notifications-off-outline"
            title="No Circulars Found"
            message="There are no active circulars matching your filter category."
            actionLabel="Reset Filter"
            onAction={() => setFilterAudience('ALL')}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  noticeCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  audiencePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  audiencePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  publishDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  noticeContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

