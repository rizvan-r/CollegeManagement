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
  useAdminDepartmentDetail,
  useUpdateDepartment,
  useAdminFaculty,
} from '../../../src/hooks/useAdminData';
import { Card, Button, LoadingSpinner, ErrorView } from '../../../src/components';

export default function DepartmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: dept, isLoading, isError, error, refetch } = useAdminDepartmentDetail(id);
  const { data: facultyList } = useAdminFaculty();
  const updateMutation = useUpdateDepartment();

  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [selectedHodId, setSelectedHodId] = useState('');

  useEffect(() => {
    if (dept) {
      setName(dept.name || '');
      setBuilding(dept.building || '');
      setEstablishedYear(dept.established_year ? String(dept.established_year) : '2025');
      setSelectedHodId(dept.hod_faculty_id || '');
    }
  }, [dept]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Department Name cannot be blank.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        name: name.trim(),
        building: building.trim(),
        establishedYear: parseInt(establishedYear, 10) || 2025,
        hodFacultyId: selectedHodId || null,
      });

      Alert.alert('Success', 'Department details and HOD allocation updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Department Details..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Department not found'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  // Filter faculty members who belong to this department
  const deptFaculty = facultyList?.filter((f) => f.department_id === id) || facultyList || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{dept?.code}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{dept?.name}</Text>
              <Text style={styles.subtitle}>Institutional Code: {dept?.code}</Text>
            </View>
          </View>

          {/* Department Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Department Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Department Name"
            />
          </View>

          {/* Building */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Building / Block</Text>
            <TextInput
              style={styles.input}
              value={building}
              onChangeText={setBuilding}
              placeholder="e.g. Turing Block"
            />
          </View>

          {/* Established Year */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Established Year</Text>
            <TextInput
              style={styles.input}
              value={establishedYear}
              onChangeText={setEstablishedYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* HOD Assignment Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Assign Head of Department (HOD)</Text>
            <Text style={styles.fieldHint}>
              Select a qualified faculty member to hold departmental administrative authority:
            </Text>

            <View style={styles.hodSelector}>
              <TouchableOpacity
                style={[
                  styles.hodOption,
                  selectedHodId === '' && styles.hodOptionActive,
                ]}
                onPress={() => setSelectedHodId('')}
              >
                <Text style={[styles.hodOptionText, selectedHodId === '' && styles.hodOptionTextActive]}>
                  No HOD Assigned (Vacant)
                </Text>
                {selectedHodId === '' ? (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                ) : null}
              </TouchableOpacity>

              {deptFaculty.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.hodOption,
                    selectedHodId === f.id && styles.hodOptionActive,
                  ]}
                  onPress={() => setSelectedHodId(f.id)}
                >
                  <View>
                    <Text
                      style={[
                        styles.hodOptionText,
                        selectedHodId === f.id && styles.hodOptionTextActive,
                      ]}
                    >
                      {f.first_name} {f.last_name}
                    </Text>
                    <Text style={styles.hodOptionSub}>
                      {f.employee_id} • {f.designation}
                    </Text>
                  </View>
                  {selectedHodId === f.id ? (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateMutation.isPending}
            style={styles.saveBtn}
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
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
  hodSelector: {
    gap: 6,
  },
  hodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  hodOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  hodOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hodOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  hodOptionSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 10,
  },
});

