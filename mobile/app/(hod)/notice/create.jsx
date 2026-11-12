import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useCreateNotice } from '../../../src/hooks/useHodData';
import { Card, Button } from '../../../src/components';

export default function HodCreateNoticeScreen() {
  const router = useRouter();
  const createMutation = useCreateNotice();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL'); // 'NORMAL' | 'HIGH' | 'URGENT'
  const [audience, setAudience] = useState('DEPARTMENT_ONLY'); // 'DEPARTMENT_ONLY' | 'COLLEGE_WIDE'

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please provide both title and announcement directives.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        priority,
        audience,
      });

      Alert.alert('Notice Published', 'The announcement has been issued and broadcasted.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert('Publication Error', err.message || 'Unable to publish announcement.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Text style={styles.fieldLabel}>Announcement Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Schedule for Mid-Term Lab Examinations"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Target Audience</Text>
          <View style={styles.chipsRow}>
            {[
              { id: 'DEPARTMENT_ONLY', label: 'Department Only' },
              { id: 'COLLEGE_WIDE', label: 'College Wide' },
            ].map((aud) => (
              <TouchableOpacity
                key={aud.id}
                style={[styles.chip, audience === aud.id && styles.chipActive]}
                onPress={() => setAudience(aud.id)}
              >
                <Text style={[styles.chipText, audience === aud.id && styles.chipTextActive]}>
                  {aud.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Priority Level</Text>
          <View style={styles.chipsRow}>
            {[
              { id: 'NORMAL', label: 'Normal Priority' },
              { id: 'HIGH', label: 'High Priority' },
              { id: 'URGENT', label: 'Urgent Directive' },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.chip,
                  priority === p.id && [
                    styles.chipActive,
                    p.id === 'URGENT' && { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
                  ],
                ]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[styles.chipText, priority === p.id && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Announcement Directive *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Write the full directive and instructions for faculty and students..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={6}
          />

          <Button
            title={createMutation.isPending ? 'Publishing Directive...' : 'Issue Announcement'}
            variant="primary"
            onPress={handleSubmit}
            disabled={createMutation.isPending}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    padding: 18,
    borderRadius: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
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
  submitBtn: {
    marginTop: 20,
  },
});

