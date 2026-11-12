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
import { useFacultyNoticeDetail } from '../../../src/hooks/useFacultyData';
import { Card, LoadingSpinner, ErrorView } from '../../../src/components';

export default function FacultyNoticeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: notice, isLoading, isError, error, refetch, isRefetching } = useFacultyNoticeDetail(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving institutional circular..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !notice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Circular Not Found"
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
      >
        <Card style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.priorityPill,
                { backgroundColor: isUrgent ? '#FEF2F2' : '#EEF2FF' },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: isUrgent ? COLORS.danger : COLORS.primary },
                ]}
              >
                {notice.priority || 'NORMAL'} PRIORITY
              </Text>
            </View>

            <View style={styles.audiencePill}>
              <Text style={styles.audienceText}>
                {isDepartment ? (notice.department_name || 'DEPARTMENT') : notice.audience || 'COLLEGE-WIDE'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{notice.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                Published: {notice.publish_date ? new Date(notice.publish_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            {notice.expiry_date ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>
                  Valid until: {new Date(notice.expiry_date).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Content Card */}
        <Card style={styles.contentCard}>
          <Text style={styles.contentSectionHeader}>Announcement Directive</Text>
          <Text style={styles.contentText}>{notice.content}</Text>
        </Card>

        {/* Issuer Details Card */}
        <Card style={styles.issuerCard}>
          <Text style={styles.issuerSectionHeader}>Issuing Authority</Text>
          <View style={styles.issuerRow}>
            <View style={styles.issuerAvatar}>
              <Ionicons name="business" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.issuerInfo}>
              <Text style={styles.issuerName}>
                {notice.author_name || 'Dean of Academic Affairs'}
              </Text>
              <Text style={styles.issuerDept}>
                {notice.department_name || 'College Management & Administration'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  audiencePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  metaRow: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  contentCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  contentSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  issuerCard: {
    padding: 16,
    borderRadius: 14,
  },
  issuerSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  issuerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issuerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  issuerInfo: {
    flex: 1,
  },
  issuerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  issuerDept: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

