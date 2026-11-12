import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { usePushNotificationSetup } from '../src/hooks/useNotifications';
import { COLORS } from '../src/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppNavigation() {
  // Mount push token registration and deep link response listener
  usePushNotificationSetup();

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'College Management Portal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(admin)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(hod)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(faculty)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(student)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{
            title: 'Notifications',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="notifications/preferences"
          options={{
            title: 'Notification Settings',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppNavigation />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}


