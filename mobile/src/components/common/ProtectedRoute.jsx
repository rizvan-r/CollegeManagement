import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { mapBackendRoleToInternal, getRoleRoute, ROLE_LABELS } from '../../constants/roles';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { Card } from './Card';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const userInternalRole = user ? mapBackendRoleToInternal(user.role) : null;
  const isAuthorized =
    allowedRoles.length === 0 ||
    (userInternalRole &&
      allowedRoles.some((role) => mapBackendRoleToInternal(role) === userInternalRole));

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else if (!isAuthorized) {
        // Automatically redirect to user's assigned dashboard
        const legitimateRoute = getRoleRoute(user.role);
        router.replace(legitimateRoute);
      }
    }
  }, [isLoading, isAuthenticated, isAuthorized, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Verifying session authorization..." />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAuthorized) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Card style={styles.unauthorizedCard}>
          <Text style={styles.unauthorizedIcon}>🚫</Text>
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            Your account role ({ROLE_LABELS[user?.role] || user?.role}) is not authorized to access this workspace.
          </Text>
          <Button
            title="Go to Your Assigned Workspace"
            variant="primary"
            onPress={() => router.replace(getRoleRoute(user?.role))}
            style={styles.unauthorizedButton}
          />
        </Card>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
  },
  unauthorizedCard: {
    padding: 24,
    alignItems: 'center',
  },
  unauthorizedIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  unauthorizedButton: {
    width: '100%',
  },
});

export default ProtectedRoute;

