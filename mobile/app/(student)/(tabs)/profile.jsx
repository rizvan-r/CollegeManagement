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
import { COLORS } from '../../../src/constants/colors';
import { USER_ROLES } from '../../../src/constants/roles';
import { useAuth } from '../../../src/hooks/useAuth';
import { useStudentProfile } from '../../../src/hooks/useStudentData';
import { authService } from '../../../src/services/authService';
import { Card, Button, RoleBadge, LoadingSpinner, ErrorView } from '../../../src/components';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile, isLoading, isError, error, refetch, isRefetching } = useStudentProfile();

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
      setPasswordMsg('Security key updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
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

  const studentName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Enrolled Student';

  const admissionNumber = profile?.admission_number || 'N/A';
  const email = profile?.email || user?.email || 'N/A';
  const phone = profile?.phone || 'Not Registered';
  const departmentName = profile?.department_name || 'Academic Department';
  const semester = profile?.current_semester ? `Semester ${profile.current_semester}` : 'Semester 1';
  const academicYear = profile?.academic_year_name || '2025–2026';
  const status = profile?.status || 'ACTIVE';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Institutional Profile</Text>
        <Text style={styles.screenSubtitle}>Student Information System (SIS)</Text>
      </View>

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
        {/* Profile Identity Card */}
        <Card style={styles.identityCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.nameSection}>
              <RoleBadge role={USER_ROLES.STUDENT} style={styles.roleBadge} />
              <Text style={styles.fullName}>{studentName}</Text>
              <Text style={styles.admText}>{admissionNumber}</Text>
            </View>
          </View>

          <View style={styles.statusPillRow}>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statusText}>ENROLLMENT: {status}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>ACADEMIC AUDIT: CLEARED</Text>
            </View>
          </View>
        </Card>

        {/* Academic Records (Read Only) */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="school-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Academic Curriculum</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Department</Text>
            <Text style={styles.metaValue}>{departmentName}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Academic Term</Text>
            <Text style={styles.metaValue}>{academicYear}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Current Standing</Text>
            <Text style={styles.metaValue}>{semester}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Degree Level</Text>
            <Text style={styles.metaValue}>Undergraduate (B.E. / B.Tech)</Text>
          </View>
        </Card>

        {/* Contact & Account Specifications */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Institutional Contact</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Institutional Email</Text>
            <Text style={styles.metaValue}>{email}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Registered Contact</Text>
            <Text style={styles.metaValue}>{phone}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date of Birth</Text>
            <Text style={styles.metaValue}>
              {profile?.dob ? String(profile.dob).split('T')[0] : 'On Record'}
            </Text>
          </View>
        </Card>

        {/* Security & Actions */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="shield-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Account Security</Text>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionRowLeft}>
              <Ionicons name="key-outline" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.actionRowTitle}>Change Portal Password</Text>
                <Text style={styles.actionRowSubtitle}>Update your institutional login credentials</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Action */}
        <Button
          title="Sign Out of Portal"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: COLORS.danger, fontWeight: '700' }}
        />

        <Text style={styles.footerNote}>
          College Management Portal • Academic Session 2025–2026
        </Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Security Key</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{passwordError}</Text>
              </View>
            ) : null}

            {passwordMsg ? (
              <View style={styles.modalSuccessBox}>
                <Text style={styles.modalSuccessText}>{passwordMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                style={styles.modalInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                style={styles.modalInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                style={styles.modalInput}
              />
            </View>

            <Button
              title={passwordLoading ? 'Updating...' : 'Save Password'}
              variant="primary"
              loading={passwordLoading}
              onPress={handleChangePassword}
              style={styles.savePasswordBtn}
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
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  identityCard: {
    padding: 18,
    marginBottom: 14,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  nameSection: {
    flex: 1,
  },
  roleBadge: {
    marginBottom: 4,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  admText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPillRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionRowSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 8,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  footerNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    color: COLORS.danger,
  },
  modalSuccessBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalSuccessText: {
    fontSize: 12,
    color: COLORS.success,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  savePasswordBtn: {
    marginTop: 8,
  },
});

