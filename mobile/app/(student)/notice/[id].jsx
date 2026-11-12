import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useStudentNoticeDetail } from '../../../src/hooks/useStudentData';
import { Card, LoadingSpinner, ErrorView } from '../../../src/components';

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: notice, isLoading, isError, error, refetch, isRefetching } = useStudentNoticeDetail(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Fetching announcement details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !notice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Notice Not Found"
          message={error?.message || 'Could not retrieve information for this announcement.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const isUrgent = notice.priority === 'HIGH' || notice.priority === 'URGENT';
  const isDepartment = notice.audience === 'DEPARTMENT_ONLY';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: isUrgent ? '#FEF2F2' : '#EEF2FF' },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: isUrgent ? COLORS.danger : COLORS.primary },
                ]}
              >
                {notice.priority || 'NORMAL'}
              </Text>
            </View>

            <View style={styles.audienceBadge}>
              <Text style={styles.audienceText}>
                {isDepartment ? (notice.department_name || 'DEPARTMENT SPECIFIC') : 'CAMPUS WIDE'}
              </Text>
            </View>
          </View>

          <Text style={styles.noticeTitle}>{notice.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Published On</Text>
              <Text style={styles.metaValue}>
                {notice.publish_date ? String(notice.publish_date).split('T')[0] : 'N/A'}
              </Text>
            </View>

            {notice.expiry_date ? (
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Valid Until</Text>
                <Text style={styles.metaValue}>
                  {String(notice.expiry_date).split('T')[0]}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Issued By</Text>
              <Text style={styles.metaValue}>
                {notice.author_name || 'Administration Office'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Content Card */}
        <Card style={styles.contentCard}>
          <Text style={styles.contentHeading}>Official Directive / Information</Text>
          <Text style={styles.bodyText}>{notice.content}</Text>
        </Card>

        {/* Institutional Verification Stamp */}
        <View style={styles.stampCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
          <Text style={styles.stampText}>
            Verified Institutional Notice • Transmitted by College Management Portal
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    padding: 20,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  audienceBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  audienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noticeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  metaBlock: {
    minWidth: 90,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  contentCard: {
    padding: 20,
    marginBottom: 14,
  },
  contentHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  stampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  stampText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    fontWeight: '500',
  },
});
