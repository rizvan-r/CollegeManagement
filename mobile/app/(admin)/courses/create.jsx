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
import { useAdminDepartments, useCreateCourse } from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner } from '../../../src/components';

export default function CreateCourseScreen() {
  const router = useRouter();
  const { data: departments, isLoading: deptsLoading } = useAdminDepartments();
  const createCourseMutation = useCreateCourse();

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [credits, setCredits] = useState('3');
  const [semester, setSemester] = useState('1');

  React.useEffect(() => {
    if (departments?.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments]);

  const handleSubmit = async () => {
    if (!code.trim() || !title.trim() || !departmentId) {
      Alert.alert('Required Fields', 'Course Code, Title, and Department are mandatory.');
      return;
    }

    try {
      await createCourseMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        departmentId,
        credits: parseInt(credits, 10) || 3,
        semester: parseInt(semester, 10) || 1,
      });

      Alert.alert('Success', `Course ${code.toUpperCase()} registered successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Creation Failed', err?.response?.data?.message || err.message);
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
          <Text style={styles.title}>Register New Course</Text>
          <Text style={styles.subtitle}>
            Introduce a new academic subject to the curriculum catalog.
          </Text>

          {/* Course Code */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Course Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS401, EC302"
              placeholderTextColor={COLORS.textMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          {/* Course Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Course Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cloud Computing Architectures"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Department Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Hosting Department *</Text>
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

          {/* Credits & Semester */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Credits (1-6)</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                placeholderTextColor={COLORS.textMuted}
                value={credits}
                onChangeText={setCredits}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
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
          </View>

          <Button
            title="Create Course"
            onPress={handleSubmit}
            loading={createCourseMutation.isPending}
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
  nameRow: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: 10,
  },
});

