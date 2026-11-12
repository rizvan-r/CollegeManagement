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
import { useAdminDepartments, useCreateAdminNotice } from '../../../src/hooks/useAdminData';
import { Card, Button } from '../../../src/components';

const PRIORITIES = ['NORMAL', 'HIGH', 'URGENT', 'LOW'];
const AUDIENCES = ['COLLEGE_WIDE', 'STUDENT_ONLY', 'FACULTY_ONLY', 'DEPARTMENT_ONLY'];

export default function CreateNoticeScreen() {
  const router = useRouter();
  const { data: departments } = useAdminDepartments();
  const createNoticeMutation = useCreateAdminNotice();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [audience, setAudience] = useState('COLLEGE_WIDE');
  const [targetDeptId, setTargetDeptId] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required Fields', 'Notice Title and Body Content are required.');
      return;
    }

    try {
      await createNoticeMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        priority,
        audience,
        targetDepartmentId: audience === 'DEPARTMENT_ONLY' ? targetDeptId || null : null,
      });

      Alert.alert('Notice Published', 'Official bulletin published to university boards.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Publish Failed', err?.response?.data?.message || err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.title}>Publish Official Bulletin</Text>
          <Text style={styles.subtitle}>
            Broadcast official circulars, exam advisories, or administrative orders.
          </Text>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notice Headline *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Schedule of Mid-Semester Assessments"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Content */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notice Announcement Body *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full text of the announcement..."
              placeholderTextColor={COLORS.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, priority === p && styles.chipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Audience */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Target Audience</Text>
            <View style={styles.chipRow}>
              {AUDIENCES.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, audience === a && styles.chipActive]}
                  onPress={() => setAudience(a)}
                >
                  <Text style={[styles.chipText, audience === a && styles.chipTextActive]}>
                    {a.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Department Selection (if DEPARTMENT_ONLY) */}
          {audience === 'DEPARTMENT_ONLY' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Select Target Department</Text>
              <View style={styles.deptOptions}>
                {departments?.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.deptChip,
                      targetDeptId === d.id && styles.deptChipActive,
                    ]}
                    onPress={() => setTargetDeptId(d.id)}
                  >
                    <Text
                      style={[
                        styles.deptChipText,
                        targetDeptId === d.id && styles.deptChipTextActive,
                      ]}
                    >
                      {d.code} - {d.name}
                    </Text>
                    {targetDeptId === d.id ? (
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Button
            title="Publish Bulletin"
            onPress={handleSubmit}
            loading={createNoticeMutation.isPending}
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
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 110,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
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
    fontWeight: '700',
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
  submitBtn: {
    marginTop: 10,
  },
});

