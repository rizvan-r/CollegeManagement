import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAdminRequests, useProcessAdminRequest } from '../../../src/hooks/useAdminData';
import { Card, LoadingSpinner, ErrorView, EmptyState, Button } from '../../../src/components';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminRequestsScreen() {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [pendingAction, setPendingAction] = useState('APPROVED');
  const [remarks, setRemarks] = useState('');

  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useAdminRequests({
    status: selectedStatus,
  });

  const processMutation = useProcessAdminRequest();

  const handleOpenModal = (req, action) => {
    setActiveModalRequest(req);
    setPendingAction(action);
    setRemarks(action === 'APPROVED' ? 'Approved by Academic Affairs.' : 'Declined due to policy guidelines.');
  };

  const handleConfirmAction = async () => {
    if (!activeModalRequest) return;

    try {
      await processMutation.mutateAsync({
        requestId: activeModalRequest.id,
        action: pendingAction,
        remarks: remarks.trim(),
      });

      setActiveModalRequest(null);
      Alert.alert('Request Updated', `Request marked as ${pendingAction}. Action logged to audit trail.`);
    } catch (err) {
      Alert.alert('Processing Failed', err?.response?.data?.message || err.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading Institutional Requests..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error?.message || 'Failed to load requests'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Institutional Approvals</Text>
        <Text style={styles.headerSubtitle}>
          Condonation, On-Duty, and Dean Escalations
        </Text>

        {/* Filter Chips */}
        <View style={styles.chipRow}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, selectedStatus === s && styles.chipActive]}
              onPress={() => setSelectedStatus(s)}
            >
              <Text style={[styles.chipText, selectedStatus === s && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
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
        {requests?.length === 0 ? (
          <EmptyState
            title="No Requests in Queue"
            message="No institutional applications pending under this filter."
          />
        ) : (
          requests.map((r) => {
            const isPending = r.status === 'PENDING';
            const isApproved = r.status === 'APPROVED';
            return (
              <Card key={r.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{r.type.replace(/_/g, ' ')}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isApproved
                        ? styles.statusApproved
                        : isPending
                        ? styles.statusPending
                        : styles.statusRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isApproved
                          ? styles.statusApprovedText
                          : isPending
                          ? styles.statusPendingText
                          : styles.statusRejectedText,
                      ]}
                    >
                      {r.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.studentName}>{r.studentName}</Text>
                <Text style={styles.studentMeta}>
                  {r.admissionNumber} • {r.departmentCode || r.department}
                </Text>

                <Text style={styles.reasonText}>{r.reason}</Text>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.dateText}>
                    Coverage: {r.startDate} to {r.endDate}
                  </Text>
                </View>

                {r.adminRemarks ? (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksLabel}>Administrator Remarks:</Text>
                    <Text style={styles.remarksText}>{r.adminRemarks}</Text>
                  </View>
                ) : null}

                {/* Actions if Pending */}
                {isPending && (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleOpenModal(r, 'REJECTED')}
                    >
                      <Ionicons name="close" size={16} color={COLORS.danger} />
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleOpenModal(r, 'APPROVED')}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.approveText}>Authorize</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Decision Remarks Modal */}
      {activeModalRequest ? (
        <Modal
          visible={!!activeModalRequest}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModalRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {pendingAction === 'APPROVED' ? 'Authorize Request' : 'Decline Application'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Candidate: {activeModalRequest.studentName} ({activeModalRequest.admissionNumber})
              </Text>

              <Text style={styles.label}>Official Decision Remarks *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                placeholder="Enter remarks recorded in institutional audit log..."
                placeholderTextColor={COLORS.textMuted}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setActiveModalRequest(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    {
                      backgroundColor:
                        pendingAction === 'APPROVED' ? COLORS.primary : COLORS.danger,
                    },
                  ]}
                  onPress={handleConfirmAction}
                >
                  <Text style={styles.modalSubmitText}>
                    {pendingAction === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
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
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  requestCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusRejectedText: {
    color: '#B91C1C',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginVertical: 8,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  remarksBox: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 4,
  },
  rejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    gap: 4,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginBottom: 14,
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
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

