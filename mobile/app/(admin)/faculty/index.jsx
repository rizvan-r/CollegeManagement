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
import { useAdminFaculty } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

export default function AdminFacultyScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const { data: faculty, isLoading, isError, error, refetch, isRefetching } = useAdminFaculty();

  const departments = useMemo(() => {
    if (!faculty) return [];
    const depts = new Set(faculty.map((f) => f.department_code).filter(Boolean));
    return ['ALL', ...Array.from(depts)];
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    if (!faculty) return [];
    return faculty.filter((f) => {
      const matchSearch =
        !search.trim() ||
        f.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
        f.designation?.toLowerCase().includes(search.toLowerCase()) ||
        f.email?.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === 'ALL' || f.department_code === selectedDept;

      return matchSearch && matchDept;
    });
  }, [faculty, search, selectedDept]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Faculty Directory..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load faculty'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Faculty Directory</Text>
            <Text style={styles.subtitle}>{faculty?.length || 0} Faculty Members</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(admin)/faculty/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Faculty</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by faculty name, designation, emp ID..."
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

        {/* Department Filters */}
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
        {filteredFaculty.length === 0 ? (
          <EmptyState
            title="No Faculty Found"
            message={search ? 'No faculty records match your query.' : 'No faculty found under this department.'}
          />
        ) : (
          filteredFaculty.map((f) => (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/faculty/${f.id}`)}
            >
              <Card style={styles.facultyCard}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.facultyName}>
                      {f.first_name} {f.last_name}
                    </Text>
                    <Text style={styles.facultyDesignation}>{f.designation}</Text>
                  </View>
                  <View style={styles.empBadge}>
                    <Text style={styles.empBadgeText}>{f.employee_id}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    <Ionicons name="business-outline" size={12} color={COLORS.textMuted} />{' '}
                    {f.department_name || f.department_code || 'General'}
                  </Text>
                  {f.qualification ? (
                    <Text style={styles.detailText}>
                      <Ionicons name="ribbon-outline" size={12} color={COLORS.textMuted} />{' '}
                      {f.qualification}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.emailText}>{f.email}</Text>
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
  facultyCard: {
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
  facultyName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  facultyDesignation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  empBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  empBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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

