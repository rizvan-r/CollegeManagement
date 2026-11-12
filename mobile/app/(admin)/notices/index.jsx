import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminNotices, useDeleteAdminNotice } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminNoticesScreen() {
  const router = useRouter();
  const { data: notices, isLoading, isError, error, refetch, isRefetching } = useAdminNotices();
  const deleteNoticeMutation = useDeleteAdminNotice();

  const handleDelete = (notice) => {
    Alert.alert(
      'Archive Notice',
      `Are you sure you want to remove announcement "${notice.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNoticeMutation.mutateAsync(notice.id);
              Alert.alert('Success', 'Notice removed from active bulletins.');
            } catch (err) {
              Alert.alert('Action Failed', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Institutional Notices..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load notices'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Institutional Bulletins</Text>
            <Text style={styles.subtitle}>{notices?.length || 0} Official Notices Published</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(admin)/notices/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="megaphone" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Publish</Text>
          </TouchableOpacity>
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
        {notices?.length === 0 ? (
          <EmptyState
            title="No Published Notices"
            message="No campus-wide or departmental announcements currently active."
          />
        ) : (
          notices.map((n) => {
            const isHigh = n.priority === 'HIGH' || n.priority === 'URGENT';
            return (
              <Card key={n.id} style={styles.noticeCard}>
                <View style={styles.noticeTop}>
                  <View style={styles.tagRow}>
                    <View style={[styles.priorityTag, isHigh ? styles.priorityHigh : styles.priorityNormal]}>
                      <Text style={[styles.priorityText, isHigh ? styles.priorityHighText : styles.priorityNormalText]}>
                        {n.priority}
                      </Text>
                    </View>
                    <View style={styles.audienceTag}>
                      <Text style={styles.audienceText}>{n.audience}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(n)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.noticeTitle}>{n.title}</Text>
                <Text style={styles.noticeContent}>{n.content}</Text>

                <View style={styles.noticeFooter}>
                  <Text style={styles.noticeMeta}>
                    Published: {n.publish_date ? String(n.publish_date).slice(0, 10) : 'Recent'} • By: {n.author_name || 'Administration'}
                  </Text>
                </View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  noticeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noticeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityNormal: {
    backgroundColor: '#EFF6FF',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  priorityHighText: {
    color: COLORS.danger,
  },
  priorityNormalText: {
    color: COLORS.primaryLight,
  },
  audienceTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  deleteBtn: {
    padding: 4,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  noticeContent: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  noticeFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  noticeMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

