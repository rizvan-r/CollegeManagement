import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/hooks/useAuth';
import { useAdminProfile } from '../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner } from '../../src/components';
import authService from '../../src/services/authService';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = useAdminProfile();

  // Change password modal
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your administrator session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please supply both current and new passwords.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    setPwdSubmitting(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwdModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Administrator password updated successfully.');
    } catch (err) {
      Alert.alert('Password Change Failed', err?.response?.data?.message || err.message);
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Administrator Credentials..." />
      </SafeAreaView>
    );
  }

  const p = profile || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{p.name || 'Executive Administration'}</Text>
          <Text style={styles.designation}>{p.designation || 'Chief Academic Registrar'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>INSTITUTIONAL ADMIN</Text>
          </View>
        </Card>

        {/* Institutional Details */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Authority &amp; Office</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Institution</Text>
            <Text style={styles.infoValue}>{p.institution || 'Metropolitan Institute of Technology'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Official Email</Text>
            <Text style={styles.infoValue}>{p.email || user?.email || 'admin@college.edu'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Physical Office</Text>
            <Text style={styles.infoValue}>{p.office || 'Executive Block, Room 101'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telephone</Text>
            <Text style={styles.infoValue}>{p.phone || '+1 (555) 019-9000'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, { color: COLORS.success, fontWeight: '700' }]}>
              Active &amp; Verified
            </Text>
          </View>
        </Card>

        {/* Security & Authentication */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Session Security</Text>
          <Text style={styles.securityDesc}>
            Your credentials grant root academic authority across student registries, faculty appointments, and roll call audits.
          </Text>

          <Button
            title="Change Account Password"
            variant="outline"
            onPress={() => setPwdModalVisible(true)}
            style={styles.changePwdBtn}
          />
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>End Administrator Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={pwdModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwdModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Administrator Password</Text>
            <Text style={styles.modalSubtitle}>
              Update root password for {user?.email || 'admin@college.edu'}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Current password"
                placeholderTextColor={COLORS.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="New password (min 6 chars)"
                placeholderTextColor={COLORS.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPwdModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePassword}
                disabled={pwdSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {pwdSubmitting ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  designation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  securityDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  changePwdBtn: {
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

