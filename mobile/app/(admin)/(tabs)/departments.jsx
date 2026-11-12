import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminDepartments, useDeleteDepartment } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminDepartmentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: departments, isLoading, isError, error, refetch, isRefetching } = useAdminDepartments();
  const deleteMutation = useDeleteDepartment();

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!search.trim()) return departments;
    const term = search.toLowerCase();
    return departments.filter(
      (d) =>
        d.name?.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.building?.toLowerCase().includes(term)
    );
  }, [departments, search]);

  const handleDelete = (dept) => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete ${dept.code} (${dept.name})? This action cannot be undone if there are enrolled students or faculty.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(dept.id);
              Alert.alert('Success', `Department ${dept.code} removed successfully.`);
            } catch (err) {
              Alert.alert('Deletion Blocked', err?.response?.data?.message || err.message || 'Unable to delete department.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Academic Departments..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load departments'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Departments</Text>
            <Text style={styles.headerSubtitle}>
              {departments?.length || 0} Academic Faculties Active
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(admin)/departments/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New Dept</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by department name, code, building..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

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
        {filteredDepartments.length === 0 ? (
          <EmptyState
            title="No Departments Found"
            message={search ? 'No departments match your search filter.' : 'No academic departments exist yet.'}
          />
        ) : (
          filteredDepartments.map((dept) => (
            <Card key={dept.id} style={styles.deptCard}>
              <View style={styles.cardTop}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{dept.code}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptBuilding}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />{' '}
                    {dept.building || 'Main Campus'} • Est. {dept.established_year || '2025'}
                  </Text>
                </View>
              </View>

              {/* HOD Status */}
              <View style={styles.hodRow}>
                <Ionicons name="shield-outline" size={14} color={dept.hod_name ? COLORS.primary : COLORS.textMuted} />
                <Text style={styles.hodLabel}>Head of Department:</Text>
                <Text style={[styles.hodValue, !dept.hod_name && styles.hodUnassigned]}>
                  {dept.hod_name || 'Unassigned'}
                </Text>
              </View>

              {/* Counts Grid */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Ionicons name="school-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metricText}>
                    <Text style={styles.metricBold}>{dept.student_count || 0}</Text> Scholars
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="briefcase-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metricText}>
                    <Text style={styles.metricBold}>{dept.faculty_count || 0}</Text> Faculty
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push(`/(admin)/departments/${dept.id}`)}
                >
                  <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.editBtnText}>Manage &amp; Assign HOD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(dept)}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  deptCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  codeBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deptBuilding: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  hodLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  hodValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hodUnassigned: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteBtn: {
    padding: 6,
  },
});

