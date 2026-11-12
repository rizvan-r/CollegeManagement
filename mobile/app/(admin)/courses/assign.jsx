import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useAdminCourseAssignments,
  useAdminCourses,
  useAdminFaculty,
  useCreateCourseAssignment,
  useDeleteCourseAssignment,
} from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

export default function CourseAssignScreen() {
  const router = useRouter();

  const { data: assignments, isLoading, isError, error, refetch, isRefetching } = useAdminCourseAssignments();
  const { data: courses } = useAdminCourses();
  const { data: faculty } = useAdminFaculty();

  const createAssignmentMutation = useCreateCourseAssignment();
  const deleteAssignmentMutation = useDeleteCourseAssignment();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [section, setSection] = useState('A');

  React.useEffect(() => {
    if (courses?.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
    if (faculty?.length > 0 && !selectedFacultyId) {
      setSelectedFacultyId(faculty[0].id);
    }
  }, [courses, faculty]);

  const handleAssign = async () => {
    if (!selectedCourseId || !selectedFacultyId) {
      Alert.alert('Required Selection', 'Please select both a Course and a Faculty instructor.');
      return;
    }

    try {
      await createAssignmentMutation.mutateAsync({
        courseId: selectedCourseId,
        facultyId: selectedFacultyId,
        section: section.trim().toUpperCase() || 'A',
      });

      Alert.alert('Success', 'Faculty allocated to course section successfully!');
    } catch (err) {
      Alert.alert('Allocation Failed', err?.response?.data?.message || err.message);
    }
  };

  const handleDelete = (assign) => {
    Alert.alert(
      'Remove Course Assignment',
      `Unassign ${assign.faculty_name} from ${assign.course_code} (Section ${assign.section})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssignmentMutation.mutateAsync(assign.id);
              Alert.alert('Success', 'Course assignment removed.');
            } catch (err) {
              Alert.alert('Cannot Remove', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Course Allocations..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load assignments'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Allocation Form Card */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Allocate Faculty to Course</Text>
          <Text style={styles.formSubtitle}>
            Pair an academic subject with an instructor for roll call and lectures.
          </Text>

          {/* Course Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Course *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {courses?.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.chip,
                    selectedCourseId === c.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedCourseId(c.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCourseId === c.id && styles.chipTextActive,
                    ]}
                  >
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Faculty Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Instructor *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {faculty?.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.chip,
                    selectedFacultyId === f.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedFacultyId(f.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedFacultyId === f.id && styles.chipTextActive,
                    ]}
                  >
                    {f.first_name} {f.last_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Section */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Section (e.g. A, B)</Text>
            <TextInput
              style={styles.input}
              value={section}
              onChangeText={setSection}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          <Button
            title="Confirm Course Allocation"
            onPress={handleAssign}
            loading={createAssignmentMutation.isPending}
            style={styles.assignBtn}
          />
        </Card>

        {/* Existing Allocations List */}
        <Text style={styles.sectionHeading}>
          Active Allocations ({assignments?.length || 0})
        </Text>

        {assignments?.map((a) => (
          <Card key={a.id} style={styles.assignCard}>
            <View style={styles.assignTop}>
              <View style={styles.assignBadge}>
                <Text style={styles.assignBadgeText}>{a.course_code}</Text>
              </View>
              <View style={styles.assignInfo}>
                <Text style={styles.assignCourseTitle}>{a.course_title}</Text>
                <Text style={styles.assignFacultyName}>
                  <Ionicons name="person" size={12} color={COLORS.primary} /> {a.faculty_name} ({a.employee_id})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleDelete(a)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.assignFooter}>
              <Text style={styles.assignMeta}>
                Section {a.section} • {a.department_code} • {a.enrolled_students || 0} Scholars Enrolled
              </Text>
            </View>
          </Card>
        ))}
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
  formCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 14,
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
  chipRow: {
    gap: 6,
    paddingBottom: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  assignBtn: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  assignCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  assignTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  assignBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  assignInfo: {
    flex: 1,
  },
  assignCourseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  assignFacultyName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  assignFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 6,
  },
  assignMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

