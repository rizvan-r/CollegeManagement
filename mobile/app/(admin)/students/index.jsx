import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminStudents } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminStudentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const { data: students, isLoading, isError, error, refetch, isRefetching } = useAdminStudents();

  const departments = useMemo(() => {
    if (!students) return [];
    const depts = new Set(students.map((s) => s.department_code).filter(Boolean));
    return ['ALL', ...Array.from(depts)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === 'ALL' || s.department_code === selectedDept;

      return matchSearch && matchDept;
    });
  }, [students, search, selectedDept]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Student Roster..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load students'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Student Directory</Text>
            <Text style={styles.subtitle}>{students?.length || 0} Scholars Enrolled</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(admin)/students/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Enroll Student</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by scholar name, reg no, email..."
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

        {/* Dept Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {departments.map((d) => {
            const active = selectedDept === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedDept(d)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        {filteredStudents.length === 0 ? (
          <EmptyState
            title="No Scholars Found"
            message={search ? 'No student records match your query.' : 'No students found in this department.'}
          />
        ) : (
          filteredStudents.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/students/${s.id}`)}
            >
              <Card style={styles.studentCard}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.studentName}>
                      {s.first_name} {s.last_name}
                    </Text>
                    <Text style={styles.studentAdm}>{s.admission_number}</Text>
                  </View>
                  <View style={[styles.statusBadge, s.status === 'ACTIVE' ? styles.statusActive : styles.statusOther]}>
                    <Text
                      style={[
                        styles.statusText,
                        s.status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextOther,
                      ]}
                    >
                      {s.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    <Ionicons name="business-outline" size={12} color={COLORS.textMuted} />{' '}
                    {s.department_name || s.department_code || 'General'}
                  </Text>
                  <Text style={styles.detailText}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} /> Semester{' '}
                    {s.current_semester || 1}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.emailText}>{s.email}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </Card>
            </TouchableOpacity>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
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
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  chipRow: {
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  studentCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentAdm: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusOther: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextOther: {
    color: '#B45309',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginVertical: 6,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  emailText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

