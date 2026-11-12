import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useHodRequests, useProcessRequest } from '../../src/hooks/useHodData';
import { Card, Button, LoadingSpinner, ErrorView, EmptyState } from '../../src/components';

export default function HodRequestsScreen() {
  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useHodRequests();
  const processMutation = useProcessRequest();

  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [activeRequest, setActiveRequest] = useState(null);
  const [modalAction, setModalAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [remarks, setRemarks] = useState('');
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message="Retrieving student requests..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView
          title="Could Not Load Requests"
          message={error?.message || 'Unable to retrieve department requests.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const requestList = requests || [];
  const filteredRequests = requestList.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const handleOpenAction = (req, action) => {
    setActiveRequest(req);
    setModalAction(action);
    setRemarks(
      action === 'APPROVED'
        ? 'Sanctioned by Department HOD'
        : 'Disapproved due to insufficient documented justification'
    );
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!activeRequest) return;
    try {
      await processMutation.mutateAsync({
        id: activeRequest.id,
        status: modalAction,
        remarks: remarks.trim(),
      });
      setShowModal(false);
      Alert.alert(
        'Request Processed',
        `Request for ${activeRequest.studentName} has been ${modalAction.toLowerCase()} successfully.`
      );
    } catch (err) {
      Alert.alert('Processing Failed', err.message || 'Unable to update request status.');
    }
  };

  const renderRequestItem = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const isApproved = item.status === 'APPROVED';
    const isRejected = item.status === 'REJECTED';

    return (
      <Card style={styles.requestCard}>
        <View style={styles.cardTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type.replace('_', ' ')}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              isApproved && styles.statusApproved,
              isRejected && styles.statusRejected,
              isPending && styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isApproved && { color: COLORS.accent },
                isRejected && { color: COLORS.danger },
                isPending && { color: '#D97706' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.studentName}>
          {item.studentName} ({item.admissionNumber})
        </Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Official Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Date: {item.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{item.sessionsAffected}</Text>
          </View>
        </View>

        {item.remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>HOD Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        ) : null}

        {isPending ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleOpenAction(item, 'APPROVED')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleOpenAction(item, 'REJECTED')}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} style={{ marginRight: 4 }} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
            onPress={() => setFilterStatus(st)}
          >
            <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
              {st.charAt(0) + st.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No Requests"
            message={`No ${filterStatus.toLowerCase()} student requests found.`}
            actionLabel="Refresh List"
            onAction={refetch}
          />
        }
      />

      {/* Action Dialog Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalAction === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Confirm action for <Text style={{ fontWeight: '700' }}>{activeRequest?.studentName}</Text> (
              {activeRequest?.admissionNumber}).
            </Text>

            <Text style={styles.inputLabel}>HOD Remarks / Justification</Text>
            <TextInput
              style={styles.modalInput}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter official remarks..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={processMutation.isPending ? 'Processing...' : `Confirm ${modalAction}`}
                variant={modalAction === 'APPROVED' ? 'primary' : 'danger'}
                onPress={handleConfirmAction}
                disabled={processMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusRejected: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  remarksBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  remarksText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: COLORS.danger,
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

