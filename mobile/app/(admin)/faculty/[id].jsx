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
  useAdminFacultyDetail,
  useUpdateFaculty,
  useDeleteFaculty,
  useResetFacultyPassword,
  useAdminDepartments,
} from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

const STATUSES = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'RETIRED'];
const DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Visiting Lecturer'];

export default function FacultyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: faculty, isLoading, isError, error, refetch } = useAdminFacultyDetail(id);
  const { data: departments } = useAdminDepartments();
  const updateMutation = useUpdateFaculty();
  const deleteMutation = useDeleteFaculty();
  const resetPasswordMutation = useResetFacultyPassword();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [departmentId, setDepartmentId] = useState('');

  // Password reset modal
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  useEffect(() => {
    if (faculty) {
      setFirstName(faculty.first_name || '');
      setLastName(faculty.last_name || '');
      setDesignation(faculty.designation || 'Assistant Professor');
      setQualification(faculty.qualification || '');
      setPhone(faculty.phone || '');
      setStatus(faculty.status || 'ACTIVE');
      setDepartmentId(faculty.department_id || '');
    }
  }, [faculty]);

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
        designation,
        qualification: qualification.trim(),
        phone: phone.trim() || null,
        status,
        departmentId,
      });

      Alert.alert('Success', 'Faculty record updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message);
    }
  };

  const handleResetPassword = () => {
    Alert.alert(
      'Reset Portal Password',
      `Generate a new temporary password for faculty member ${faculty?.first_name} ${faculty?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate Password',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await resetPasswordMutation.mutateAsync({ id });
              setTempPasswordModal({
                email: faculty?.email,
                employeeId: faculty?.employee_id,
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
      'Remove Faculty Member',
      `Are you sure you want to completely remove ${faculty?.first_name} ${faculty?.last_name} (${faculty?.employee_id})? If they are assigned to active courses, reassign them first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              Alert.alert('Deleted', 'Faculty member removed successfully.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Deletion Blocked', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Faculty Profile..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Faculty member not found'} onRetry={refetch} />
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
              <Ionicons name="briefcase" size={24} color="#D97706" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.facultyTitle}>
                {faculty?.first_name} {faculty?.last_name}
              </Text>
              <Text style={styles.empIdText}>{faculty?.employee_id}</Text>
              <Text style={styles.emailText}>{faculty?.email}</Text>
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
            <Text style={styles.label}>Appointed Department</Text>
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

          {/* Designation Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Academic Designation</Text>
            <View style={styles.desigOptions}>
              {DESIGNATIONS.map((desig) => (
                <TouchableOpacity
                  key={desig}
                  style={[
                    styles.desigChip,
                    designation === desig && styles.desigChipActive,
                  ]}
                  onPress={() => setDesignation(desig)}
                >
                  <Text
                    style={[
                      styles.desigChipText,
                      designation === desig && styles.desigChipTextActive,
                    ]}
                  >
                    {desig}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Qualification & Phone */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Qualification</Text>
              <TextInput
                style={styles.input}
                value={qualification}
                onChangeText={setQualification}
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

          {/* Faculty Status */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Employment / Faculty Status</Text>
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
              <Text style={styles.securityTitle}>Faculty Credentials</Text>
              <Text style={styles.securityDesc}>
                Reset instructor password and issue temporary login credentials.
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
            title="Save Faculty Record"
            onPress={handleSave}
            loading={updateMutation.isPending}
            style={styles.saveBtn}
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete Faculty Record</Text>
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
                Credentials generated for {tempPasswordModal.employeeId}:
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  facultyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  empIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
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
  desigOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  desigChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desigChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  desigChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  desigChipTextActive: {
    color: '#FFFFFF',
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

