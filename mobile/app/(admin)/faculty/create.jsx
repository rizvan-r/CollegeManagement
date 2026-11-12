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
import { useAdminDepartments, useCreateFaculty } from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner } from '../../../src/components';

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Visiting Lecturer',
];

export default function CreateFacultyScreen() {
  const router = useRouter();
  const { data: departments, isLoading: deptsLoading } = useAdminDepartments();
  const createFacultyMutation = useCreateFaculty();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('M.Tech');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

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
      const res = await createFacultyMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        departmentId,
        designation,
        qualification: qualification.trim() || 'M.Tech',
        phone: phone.trim() || null,
        password: password.trim() || undefined,
      });

      const creds = res.credentials || {};
      Alert.alert(
        'Faculty Registered Successfully',
        `Employee ID: ${res.employeeId || creds.employeeId || 'Generated'}\nEmail: ${email.toLowerCase()}\nTemporary Password: ${creds.password || 'Set'}`,
        [
          { text: 'Copy & Continue', onPress: () => router.back() },
        ]
      );
    } catch (err) {
      Alert.alert('Registration Failed', err?.response?.data?.message || err.message);
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
          <Text style={styles.title}>Register Faculty Member</Text>
          <Text style={styles.subtitle}>
            Appoint instructor to university faculty and provision portal credentials.
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
              placeholder="e.g. faculty.name@college.edu"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Department Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Appointed Department *</Text>
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

          {/* Academic Designation */}
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
                placeholder="e.g. Ph.D., M.Tech"
                placeholderTextColor={COLORS.textMuted}
                value={qualification}
                onChangeText={setQualification}
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

          {/* Initial Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Faculty Portal Password (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave blank to auto-generate temporary password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={styles.hint}>
              If left empty, a secure temporary PIN (e.g. Fac@592810) will be provisioned.
            </Text>
          </View>

          <Button
            title="Appoint Faculty Member"
            onPress={handleSubmit}
            loading={createFacultyMutation.isPending}
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
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 10,
  },
});

