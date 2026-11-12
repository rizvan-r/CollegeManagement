import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useAdminStudentDetail,
  useUpdateStudent,
  useDeleteStudent,
  useResetStudentPassword,
  useAdminDepartments,
} from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

const STATUSES = ['ACTIVE', 'SUSPENDED', 'ALUMNI', 'ARCHIVED'];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: student, isLoading, isError, error, refetch } = useAdminStudentDetail(id);
  const { data: departments } = useAdminDepartments();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const resetPasswordMutation = useResetStudentPassword();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [semester, setSemester] = useState('1');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [departmentId, setDepartmentId] = useState('');

  // Password reset modal
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  useEffect(() => {
    if (student) {
      setFirstName(student.first_name || '');
      setLastName(student.last_name || '');
      setSemester(student.current_semester ? String(student.current_semester) : '1');
      setPhone(student.phone || '');
      setStatus(student.status || 'ACTIVE');
      setDepartmentId(student.department_id || '');
    }
  }, [student]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'First Name and Last Name cannot be empty.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        currentSemester: parseInt(semester, 10) || 1,
        phone: phone.trim() || null,
        status,
        departmentId,
      });

      Alert.alert('Success', 'Student record updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message);
    }
  };

  const handleResetPassword = () => {
    Alert.alert(
      'Reset Portal Password',
      `Generate a new temporary password for scholar ${student?.first_name} ${student?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate Password',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await resetPasswordMutation.mutateAsync({ id });
              setTempPasswordModal({
                email: student?.email,
                admissionNumber: student?.admission_number,
                password: res?.credentials?.password || 'Reset successful',
              });
            } catch (err) {
              Alert.alert('Reset Failed', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Student Record',
      `Are you sure you want to completely remove ${student?.first_name} ${student?.last_name} (${student?.admission_number})? All related attendance logs and enrollments will be purged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              Alert.alert('Deleted', 'Student record removed successfully.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Deletion Failed', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Scholar Profile..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Student not found'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.avatarBadge}>
              <Ionicons name="school" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.studentTitle}>
                {student?.first_name} {student?.last_name}
              </Text>
              <Text style={styles.admissionText}>{student?.admission_number}</Text>
              <Text style={styles.emailText}>{student?.email}</Text>
            </View>
          </View>

          {/* First & Last Name */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Department Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Academic Department</Text>
            <View style={styles.deptOptions}>
              {departments?.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.deptChip,
                    departmentId === d.id && styles.deptChipActive,
                  ]}
                  onPress={() => setDepartmentId(d.id)}
                >
                  <Text
                    style={[
                      styles.deptChipText,
                      departmentId === d.id && styles.deptChipTextActive,
                    ]}
                  >
                    {d.code} - {d.name}
                  </Text>
                  {departmentId === d.id ? (
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Semester & Phone */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Semester (1-8)</Text>
              <TextInput
                style={styles.input}
                value={semester}
                onChangeText={setSemester}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1.5 }]}>
              <Text style={styles.label}>Phone Contact</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Academic Standing Status */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account / Academic Status</Text>
            <View style={styles.statusChipsRow}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChip,
                    status === st && styles.statusChipActive,
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      status === st && styles.statusChipTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Security & Password Reset Action */}
          <View style={styles.securityBox}>
            <View style={styles.securityTextGroup}>
              <Text style={styles.securityTitle}>Portal Credentials</Text>
              <Text style={styles.securityDesc}>
                Reset student password and generate one-time login credentials.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resetPwdBtn}
              onPress={handleResetPassword}
            >
              <Ionicons name="key-outline" size={16} color={COLORS.primary} />
              <Text style={styles.resetPwdText}>Reset PWD</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Save Scholar Record"
            onPress={handleSave}
            loading={updateMutation.isPending}
            style={styles.saveBtn}
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete Scholar Account</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Password Reset Modal */}
      {tempPasswordModal ? (
        <Modal
          visible={!!tempPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setTempPasswordModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.keyIconWrapper}>
                <Ionicons name="key" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Password Reset Complete</Text>
              <Text style={styles.modalSubtitle}>
                Credentials generated for {tempPasswordModal.admissionNumber}:
              </Text>

              <View style={styles.credentialBox}>
                <Text style={styles.credentialLabel}>Temporary Password:</Text>
                <Text style={styles.credentialValue} selectable>
                  {tempPasswordModal.password}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setTempPasswordModal(null)}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
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
  card: {
    padding: 18,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  studentTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  admissionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  emailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  nameRow: {
    flexDirection: 'row',
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
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  deptOptions: {
    gap: 6,
  },
  deptChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
  },
  deptChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  deptChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
  },
  securityTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  securityDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resetPwdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resetPwdText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveBtn: {
    marginTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 10,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
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
  keyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  credentialBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    borderRadius: 8,
    marginVertical: 14,
  },
  credentialLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

