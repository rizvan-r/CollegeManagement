import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { ProtectedRoute } from '../../src/components';
import { INTERNAL_ROLES } from '../../src/constants/roles';

export default function FacultyLayout() {
  return (
    <ProtectedRoute allowedRoles={[INTERNAL_ROLES.FACULTY]}>
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
          name="course/[id]"
          options={{
            title: 'Course & Roster',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="attendance/mark"
          options={{
            title: 'Mark Attendance',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="attendance/history"
          options={{
            title: 'Attendance Records',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notice/[id]"
          options={{
            title: 'Notice Details',
            headerShown: true,
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
