import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ROLE_COLORS } from '../../constants/colors';
import { ROLE_LABELS, USER_ROLES } from '../../constants/roles';

export function RoleBadge({ role = USER_ROLES.STUDENT, style, textStyle }) {
  const roleConfig = ROLE_COLORS[role] || {
    background: '#F1F5F9',
    accent: '#64748B',
  };

  const label = ROLE_LABELS[role] || role;

  return (
    <View style={[styles.badge, { backgroundColor: roleConfig.background }, style]}>
      <Text style={[styles.badgeText, { color: roleConfig.accent }, textStyle]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RoleBadge;

