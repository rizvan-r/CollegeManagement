import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { ProtectedRoute } from '../../src/components';
import { INTERNAL_ROLES } from '../../src/constants/roles';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={[INTERNAL_ROLES.ADMIN]}>
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
          name="departments/create"
          options={{
            title: 'New Department',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="departments/[id]"
          options={{
            title: 'Department Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="students/index"
          options={{
            title: 'Student Directory',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="students/create"
          options={{
            title: 'Enroll Student',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="students/[id]"
          options={{
            title: 'Student Record',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="faculty/index"
          options={{
            title: 'Faculty Directory',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="faculty/create"
          options={{
            title: 'Register Faculty',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="faculty/[id]"
          options={{
            title: 'Faculty Record',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="courses/index"
          options={{
            title: 'Course Catalog',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="courses/create"
          options={{
            title: 'New Course',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="courses/assign"
          options={{
            title: 'Faculty Allocation',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="courses/[id]"
          options={{
            title: 'Course Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notices/index"
          options={{
            title: 'Notice Board',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notices/create"
          options={{
            title: 'Publish Notice',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="requests/index"
          options={{
            title: 'Institutional Requests',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="audit-logs/index"
          options={{
            title: 'Audit Logs',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Administrator Profile',
            headerShown: true,
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
