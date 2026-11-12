import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/colors';
import { getRoleRoute } from '../../src/constants/roles';
import { useAuth } from '../../src/hooks/useAuth';
import { Card, Button } from '../../src/components';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Redirect already authenticated users directly to their assigned role dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const destination = getRoleRoute(user.role);
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, user]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(trimmedEmail, password);
      if (result?.success && result?.user?.role) {
        const destination = getRoleRoute(result.user.role);
        router.replace(destination);
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify credentials and backend connectivity.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo Banner */}
          <View style={styles.header}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>🏛️</Text>
            </View>
            <Text style={styles.title}>College Management Portal</Text>
            <Text style={styles.subtitle}>
              Sign in with your verified institutional credentials to access your academic dashboard.
            </Text>
          </View>

          {/* Login Form Card */}
          <Card style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institutional Email</Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="name@college.edu"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => setShowForgotModal(true)}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <Button
              title={isSubmitting ? 'Authenticating...' : 'Sign In'}
              variant="primary"
              loading={isSubmitting}
              onPress={handleLogin}
              style={styles.loginButton}
            />
          </Card>

          {/* Institutional Compliance Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeHeading}>Official Institutional Access</Text>
            <Text style={styles.noticeText}>
              Access is restricted to authorized College Administrators, Department Staff, Faculty, and Enrolled Students. All authentication events are logged for security compliance.
            </Text>
          </View>

          {/* Return to Welcome Screen */}
          <Button
            title="Return to Welcome Screen"
            variant="outline"
            onPress={() => router.replace('/')}
            style={styles.returnButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>🔑</Text>
            </View>
            <Text style={styles.modalTitle}>Password Recovery</Text>
            <Text style={styles.modalBody}>
              Self-service password reset is disabled for institutional security.
              {'\n\n'}
              Please contact your College IT Administrator or Department Office with your institutional ID to request a password reset.
            </Text>
            <Button
              title="Understood"
              variant="primary"
              onPress={() => setShowForgotModal(false)}
              style={styles.modalButton}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 18,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
  },
  noticeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    marginBottom: 16,
  },
  noticeHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  returnButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
  },
});
