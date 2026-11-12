import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { USER_ROLES } from '../../src/constants/roles';
import { useAuth } from '../../src/hooks/useAuth';
import { useHodProfile } from '../../src/hooks/useHodData';
import { authService } from '../../src/services/authService';
import { Card, Button, RoleBadge, LoadingSpinner, ErrorView } from '../../src/components';

export default function HodProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile, isLoading, isError, error, refetch, isRefetching } = useHodProfile();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving institutional profile..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Profile"
          message={error?.message || 'Failed to retrieve profile data.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const hodName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Department HOD';

  const employeeId = profile?.employee_id || 'N/A';
  const email = profile?.email || user?.email || 'N/A';
  const phone = profile?.phone || 'Not Registered';
  const designation = profile?.designation || 'Head of Department';
  const qualification = profile?.qualification || 'Ph.D. in Computer Science';
  const departmentName = profile?.department_name || 'Academic Department';
  const departmentCode = profile?.department_code || 'CSE';
  const building = profile?.building || 'Main Campus';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{hodName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.fullName}>{hodName}</Text>
          <Text style={styles.designation}>{designation}</Text>
          <RoleBadge role={USER_ROLES.DEPARTMENT_STAFF} />
        </Card>

        {/* Department Info */}
        <Text style={styles.sectionHeader}>Department Governance</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{departmentName} ({departmentCode})</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValueBold}>{employeeId}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Qualification</Text>
            <Text style={styles.infoValue}>{qualification}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Office / Block</Text>
            <Text style={styles.infoValue}>{building}</Text>
          </View>
        </Card>

        {/* Contact Information */}
        <Text style={styles.sectionHeader}>Official Contact</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Direct Extension</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>
        </Card>

        {/* Security */}
        <Text style={styles.sectionHeader}>Security</Text>
        <Card style={styles.infoCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="key-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.actionLabel}>Change Account Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of HOD Workspace</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {passwordError ? <Text style={styles.modalError}>{passwordError}</Text> : null}
            {passwordMsg ? <Text style={styles.modalSuccess}>{passwordMsg}</Text> : null}

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor={COLORS.textMuted}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Minimum 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowPasswordModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={passwordLoading ? 'Updating...' : 'Save Password'}
                variant="primary"
                onPress={handleChangePassword}
                disabled={passwordLoading}
                style={{ flex: 1 }}
              />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  designation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutBtnText: {
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalError: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 10,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  modalSuccess: {
    color: COLORS.accent,
    fontSize: 12,
    marginBottom: 10,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});

