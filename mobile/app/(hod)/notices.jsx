import React from 'react';
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
import { COLORS } from '../../src/constants/colors';
import { useHodNotices } from '../../src/hooks/useHodData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../src/components';

export default function HodNoticesScreen() {
  const router = useRouter();
  const { data: notices, isLoading, isError, error, refetch, isRefetching } = useHodNotices();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving departmental notices..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Notices"
          message={error?.message || 'Unable to retrieve department announcements.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const noticeList = notices || [];

  const renderNoticeItem = ({ item }) => {
    const isUrgent = item.priority === 'HIGH' || item.priority === 'URGENT';
    const isDept = item.audience === 'DEPARTMENT_ONLY';

    return (
      <Card style={styles.noticeCard}>
        <View style={styles.topRow}>
          <View style={styles.badgesGroup}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: isUrgent ? '#FEF2F2' : '#EFF6FF' },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: isUrgent ? COLORS.danger : COLORS.primary },
                ]}
              >
                {item.priority || 'NORMAL'}
              </Text>
            </View>

            <View style={styles.audienceBadge}>
              <Text style={styles.audienceText}>
                {isDept ? 'DEPARTMENT' : item.audience || 'COLLEGE-WIDE'}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : 'Active'}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.authorText}>Author: {item.author_email || 'HOD Office'}</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Top Banner Action */}
      <View style={styles.topBanner}>
        <Text style={styles.bannerInfo}>
          Publish announcements directly to department scholars & faculty.
        </Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(hod)/notice/create')}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Publish Notice</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={noticeList}
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
            icon="megaphone-outline"
            title="No Notices Found"
            message="No announcements have been issued for this department yet."
            actionLabel="Publish First Notice"
            onAction={() => router.push('/(hod)/notice/create')}
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
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bannerInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
  },
  audienceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  audienceText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  content: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
  },
  authorText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});

