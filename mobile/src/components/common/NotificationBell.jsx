import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { COLORS } from '../../constants/colors';

export function NotificationBell({ color = COLORS.primary, size = 24, style }) {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const handlePress = () => {
    router.push('/notifications');
  };

  const badgeText = unreadCount > 99 ? '99+' : unreadCount > 9 ? `${unreadCount}` : `${unreadCount}`;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, style]}
      activeOpacity={0.7}
      accessibilityLabel={`Notifications, ${unreadCount} unread`}
      accessibilityRole="button"
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default NotificationBell;

