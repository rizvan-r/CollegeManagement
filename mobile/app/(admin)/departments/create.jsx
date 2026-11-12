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
import { useCreateDepartment } from '../../../src/hooks/useAdminData';
import { Card, Button } from '../../../src/components';

export default function CreateDepartmentScreen() {
  const router = useRouter();
  const createDeptMutation = useCreateDepartment();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [establishedYear, setEstablishedYear] = useState('2025');

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert('Required Fields', 'Department Code and Name are mandatory.');
      return;
    }

    try {
      await createDeptMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        building: building.trim() || 'Academic Block',
        establishedYear: parseInt(establishedYear, 10) || 2025,
      });

      Alert.alert('Success', `Department ${code.toUpperCase()} created successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Creation Failed', err?.response?.data?.message || err.message);
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
          <Text style={styles.title}>Create Academic Department</Text>
          <Text style={styles.subtitle}>
            Register a new faculty or department in the college catalog.
          </Text>

          {/* Department Code */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Department Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CSE, ECE, MECH"
              placeholderTextColor={COLORS.textMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          {/* Department Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Department Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science and Engineering"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Building / Campus Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Building / Campus Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Turing Block, South Wing"
              placeholderTextColor={COLORS.textMuted}
              value={building}
              onChangeText={setBuilding}
            />
          </View>

          {/* Established Year */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Established Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025"
              placeholderTextColor={COLORS.textMuted}
              value={establishedYear}
              onChangeText={setEstablishedYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <Button
            title="Create Department"
            onPress={handleSubmit}
            loading={createDeptMutation.isPending}
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
    marginBottom: 18,
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
  submitBtn: {
    marginTop: 8,
  },
});

