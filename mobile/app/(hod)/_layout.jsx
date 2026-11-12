import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { ProtectedRoute } from '../../src/components';
import { INTERNAL_ROLES } from '../../src/constants/roles';

export default function HodLayout() {
  return (
    <ProtectedRoute allowedRoles={[INTERNAL_ROLES.HOD]}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="requests"
          options={{
            title: 'Department Requests',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="courses"
          options={{
            title: 'Department Courses',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notices"
          options={{
            title: 'Department Notices',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notice/create"
          options={{
            title: 'Publish Announcement',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'HOD Profile',
            headerShown: true,
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
