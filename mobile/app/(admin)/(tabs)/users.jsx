import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import {
  useAdminUsers,
  useUpdateUserStatus,
  useUpdateUserRole,
  useResetUserPassword,
} from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState } from '../../../src/components';

const ROLE_FILTERS = ['ALL', 'STUDENT', 'FACULTY', 'DEPARTMENT_STAFF', 'ADMIN'];

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  const { data: users, isLoading, isError, error, refetch, isRefetching } = useAdminUsers({
    role: selectedRole === 'ALL' ? undefined : selectedRole,
  });

  const updateStatusMutation = useUpdateUserStatus();
  const updateRoleMutation = useUpdateUserRole();
  const resetPasswordMutation = useResetUserPassword();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.identifier?.toLowerCase().includes(term) ||
        u.department_name?.toLowerCase().includes(term)
    );
  }, [users, search]);

  const handleToggleStatus = (user) => {
    const nextStatus = !user.is_active;
    Alert.alert(
      nextStatus ? 'Activate User' : 'Deactivate User',
      `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} account access for ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateStatusMutation.mutateAsync({ userId: user.id, isActive: nextStatus });
              Alert.alert('Success', `Account for ${user.email} is now ${nextStatus ? 'Active' : 'Deactivated'}.`);
            } catch (err) {
              Alert.alert('Action Failed', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
      setRoleModalUser(null);
      Alert.alert('Role Updated', `Role for ${user.email} changed to ${newRole}.`);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message);
    }
  };

  const handleResetPassword = (user) => {
    Alert.alert(
      'Reset User Password',
      `Generate a new temporary one-time password for ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Password',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await resetPasswordMutation.mutateAsync({ userId: user.id });
              const creds = res.credentials || {};
              setTempPasswordModal({
                email: creds.email || user.email,
                password: creds.temporaryPassword || 'Generated successfully',
              });
            } catch (err) {
              Alert.alert('Reset Failed', err?.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading System Users..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load user directory'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>User &amp; Role Management</Text>
        <Text style={styles.headerSubtitle}>
          {users?.length || 0} Registered Institutional Accounts
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, admission/employee ID..."
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

        {/* Role Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {ROLE_FILTERS.map((r) => {
            const active = selectedRole === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedRole(r)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {r === 'DEPARTMENT_STAFF' ? 'HOD / STAFF' : r}
                </Text>
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
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            message={search ? 'No users match your search criteria.' : 'No users registered under this role filter.'}
          />
        ) : (
          filteredUsers.map((u) => (
            <Card key={u.id} style={styles.userCard}>
              <View style={styles.userTop}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.full_name || u.email}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  {u.department_name ? (
                    <Text style={styles.userDept}>
                      <Ionicons name="business-outline" size={12} color={COLORS.textMuted} /> {u.department_name}
                    </Text>
                  ) : null}
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, u.is_active ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, u.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
                    {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                  </Text>
                </View>
              </View>

              <View style={styles.userMetaRow}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{u.role}</Text>
                </View>
                {u.identifier ? (
                  <Text style={styles.idText}>ID: {u.identifier}</Text>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStatus(u)}
                >
                  <Ionicons
                    name={u.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={16}
                    color={u.is_active ? COLORS.warning : COLORS.success}
                  />
                  <Text style={[styles.actionBtnText, { color: u.is_active ? COLORS.warning : COLORS.success }]}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setRoleModalUser(u)}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Role</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleResetPassword(u)}
                >
                  <Ionicons name="key-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>Reset PWD</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Role Change Modal */}
      {roleModalUser ? (
        <Modal
          visible={!!roleModalUser}
          transparent
          animationType="fade"
          onRequestClose={() => setRoleModalUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modify Role Assignment</Text>
              <Text style={styles.modalSubtitle}>
                Target Account: {roleModalUser.email}
              </Text>
              <Text style={styles.modalNotice}>
                Current Role: <Text style={{ fontWeight: '700' }}>{roleModalUser.role}</Text>
              </Text>

              <View style={styles.roleList}>
                {['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY', 'STUDENT'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      roleModalUser.role === r && styles.roleOptionActive,
                    ]}
                    onPress={() => handleRoleChange(roleModalUser, r)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        roleModalUser.role === r && styles.roleOptionTextActive,
                      ]}
                    >
                      {r === 'DEPARTMENT_STAFF' ? 'Department Staff / HOD' : r}
                    </Text>
                    {roleModalUser.role === r ? (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setRoleModalUser(null)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Temporary Password Display Modal */}
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
                New temporary credentials for {tempPasswordModal.email}:
              </Text>

              <View style={styles.credentialBox}>
                <Text style={styles.credentialLabel}>Temporary Password:</Text>
                <Text style={styles.credentialValue} selectable>
                  {tempPasswordModal.password}
                </Text>
              </View>

              <Text style={styles.credentialWarning}>
                Please safely share this temporary password with the user. They will be prompted to change it upon first login.
              </Text>

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
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
    marginBottom: 10,
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
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  chipScroll: {
    gap: 6,
    paddingBottom: 2,
  },
  chip: {
    paddingVertical: 5,
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
  userCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  userTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userDept: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#B91C1C',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  idText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  modalNotice: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  roleList: {
    gap: 8,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalCloseBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  keyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  credentialWarning: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 16,
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

