import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from './RoleBadge';
import { Button } from './Button';

export function UserProfileBar({ currentRole }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <RoleBadge role={user?.role || currentRole} style={styles.badge} />
        <Text style={styles.emailText} numberOfLines={1}>
          {user?.email || 'Authenticated Session'}
        </Text>
      </View>
      <Button
        title="Sign Out"
        variant="outline"
        onPress={handleLogout}
        style={styles.logoutButton}
        textStyle={styles.logoutText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  badge: {
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: COLORS.border,
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
});

export default UserProfileBar;

