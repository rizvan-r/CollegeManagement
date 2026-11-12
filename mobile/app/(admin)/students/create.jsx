import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminDepartments, useCreateStudent } from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner } from '../../../src/components';

export default function CreateStudentScreen() {
  const router = useRouter();
  const { data: departments, isLoading: deptsLoading } = useAdminDepartments();
  const createStudentMutation = useCreateStudent();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('1');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('2004-06-15');
  const [password, setPassword] = useState('');

  // Default department selection
  React.useEffect(() => {
    if (departments?.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !departmentId) {
      Alert.alert('Required Fields', 'First Name, Last Name, Email, and Department are mandatory.');
      return;
    }

    try {
      const res = await createStudentMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        departmentId,
        currentSemester: parseInt(semester, 10) || 1,
        phone: phone.trim() || null,
        dob: dob.trim() || '2004-01-01',
        password: password.trim() || undefined,
      });

      const creds = res.credentials || {};
      Alert.alert(
        'Student Enrolled Successfully',
        `Admission Number: ${res.admissionNumber || creds.admissionNumber || 'Generated'}\nEmail: ${email.toLowerCase()}\nTemporary Password: ${creds.password || 'Set'}`,
        [
          { text: 'Copy & Continue', onPress: () => router.back() },
        ]
      );
    } catch (err) {
      Alert.alert('Enrollment Failed', err?.response?.data?.message || err.message);
    }
  };

  if (deptsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Institutional Catalogs..." />
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
          <Text style={styles.title}>Enroll New Student</Text>
          <Text style={styles.subtitle}>
            Register scholar in university database and provision student portal account.
          </Text>

          {/* First & Last Name */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={COLORS.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={COLORS.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Institutional Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. student.name@college.edu"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Department Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Academic Department *</Text>
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
                placeholder="1"
                placeholderTextColor={COLORS.textMuted}
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
                placeholder="+1 555-0100"
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2004-06-15"
              placeholderTextColor={COLORS.textMuted}
              value={dob}
              onChangeText={setDob}
            />
          </View>

          {/* Initial Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Portal Password (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave blank to auto-generate temporary password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={styles.hint}>
              If omitted, a secure temporary PIN (e.g. Stu@849201) will be generated.
            </Text>
          </View>

          <Button
            title="Complete Scholar Enrollment"
            onPress={handleSubmit}
            loading={createStudentMutation.isPending}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
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
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 10,
  },
});

