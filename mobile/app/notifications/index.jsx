import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../src/hooks/useNotifications';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS } from '../../src/constants/colors';
import EmptyState from '../../src/components/common/EmptyState';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'ANNOUNCEMENTS', label: 'Announcements' },
  { key: 'ATTENDANCE', label: 'Attendance' },
  { key: 'REQUESTS', label: 'Requests' },
  { key: 'ACADEMIC', label: 'Academic' },
];

function getCategoryMeta(category) {
  switch (category) {
    case 'ATTENDANCE':
      return {
        icon: 'calendar-outline',
        color: COLORS.danger,
        bgColor: '#FEF2F2',
        label: 'Attendance',
      };
    case 'REQUESTS':
      return {
        icon: 'document-text-outline',
        color: COLORS.accent,
        bgColor: '#F0FDFA',
        label: 'Request',
      };
    case 'ACADEMIC':
      return {
        icon: 'school-outline',
        color: COLORS.primaryLight,
        bgColor: '#EFF6FF',
        label: 'Academic',
      };
    case 'ANNOUNCEMENTS':
    default:
      return {
        icon: 'megaphone-outline',
        color: COLORS.primary,
        bgColor: '#EEF2FF',
        label: 'Notice',
      };
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const {
    data: notificationResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useNotificationsList({
    category: selectedCategory,
    limit: 50,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = notificationResponse?.data || [];
  const unreadCount = notificationResponse?.unreadCount ?? 0;

  const handleNotificationPress = (item) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }

    const data = item.data || {};
    const role = user?.role;

    if (data.noticeId) {
      if (role === 'STUDENT') router.push('/(student)/(tabs)/notices');
      else if (role === 'FACULTY') router.push('/(faculty)/(tabs)/notices');
      else if (role === 'DEPARTMENT_STAFF') router.push('/(hod)/(tabs)/notices');
      else if (role === 'ADMIN') router.push('/(admin)/notices');
    } else if (data.requestId) {
      if (role === 'DEPARTMENT_STAFF') router.push('/(hod)/(tabs)/requests');
      else if (role === 'ADMIN') router.push('/(admin)/requests');
    } else if (item.category === 'ATTENDANCE') {
      if (role === 'STUDENT') router.push('/(student)/(tabs)/attendance');
      else if (role === 'FACULTY') router.push('/(faculty)/(tabs)/attendance');
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0 && !markAllMutation.isPending) {
      markAllMutation.mutate();
    }
  };

  const renderNotificationItem = ({ item }) => {
    const meta = getCategoryMeta(item.category);
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isUnread && styles.itemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: meta.bgColor }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.badgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: meta.bgColor }]}>
                <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
          </View>

          <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]}>
            {item.title}
          </Text>

          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Action Subheader */}
      <View style={styles.actionHeader}>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllButton}
              disabled={markAllMutation.isPending}
            >
              <Text style={styles.markAllText}>
                {markAllMutation.isPending ? 'Marking...' : 'Mark all as read'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push('/notifications/preferences')}
            style={styles.settingsButton}
            accessibilityLabel="Notification settings"
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(cat) => cat.key}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.key)}
                style={[styles.chip, isSelected && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No Notifications"
              description={
                selectedCategory === 'ALL'
                  ? 'You have no notifications at this time.'
                  : `No ${selectedCategory.toLowerCase()} notifications found.`
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  itemUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemTitleBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

