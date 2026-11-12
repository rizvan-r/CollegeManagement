import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useAdminCourseDetail,
  useUpdateCourse,
  useDeleteCourse,
  useAdminDepartments,
} from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: course, isLoading, isError, error, refetch } = useAdminCourseDetail(id);
  const { data: departments } = useAdminDepartments();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState('3');
  const [semester, setSemester] = useState('1');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setCredits(course.credits ? String(course.credits) : '3');
      setSemester(course.semester ? String(course.semester) : '1');
      setDepartmentId(course.department_id || '');
      setIsActive(course.is_active !== false);
    }
  }, [course]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Course Title cannot be blank.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        title: title.trim(),
        credits: parseInt(credits, 10) || 3,
        semester: parseInt(semester, 10) || 1,
        departmentId,
        isActive,
      });

      Alert.alert('Success', 'Course details updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Course',
      `Are you sure you want to delete ${course?.code} (${course?.title})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              Alert.alert('Deleted', 'Course removed from institutional catalog.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Cannot Delete', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Course Record..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Course not found'} onRetry={refetch} />
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
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{course?.code}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.courseTitle}>{course?.title}</Text>
              <Text style={styles.deptMeta}>{course?.department_name || 'Academic Subject'}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Course Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Department Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Department</Text>
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
                value={semester}
                onChangeText={setSemester}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          {/* Status Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Curriculum Status</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, isActive ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setIsActive(!isActive)}
            >
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={isActive ? COLORS.success : COLORS.danger}
              />
              <Text style={[styles.toggleText, { color: isActive ? COLORS.success : COLORS.danger }]}>
                {isActive ? 'ACTIVE IN CURRICULUM' : 'INACTIVE / ARCHIVED'}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Save Course Details"
            onPress={handleSave}
            loading={updateMutation.isPending}
            style={styles.saveBtn}
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete Course</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  deptMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  toggleActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  toggleInactive: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 10,
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
});

