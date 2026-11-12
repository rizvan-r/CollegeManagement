import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAuth } from '../../../src/hooks/useAuth';
import { Card } from '../../../src/components';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your administrator session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const navItems = [
    {
      group: 'Academic Directories',
      items: [
        {
          title: 'Student Directory',
          desc: 'Search, enroll, and manage scholar academic records',
          icon: 'school-outline',
          route: '/(admin)/students',
          color: COLORS.primaryLight,
        },
        {
          title: 'Faculty Directory',
          desc: 'Roster, designation allocations, and credentials',
          icon: 'briefcase-outline',
          route: '/(admin)/faculty',
          color: '#D97706',
        },
        {
          title: 'Course Catalog',
          desc: 'Subject syllabi, credit weighting, and departments',
          icon: 'book-outline',
          route: '/(admin)/courses',
          color: '#7C3AED',
        },
        {
          title: 'Faculty Course Allocations',
          desc: 'Assign professors to course sections and semesters',
          icon: 'git-branch-outline',
          route: '/(admin)/courses/assign',
          color: '#059669',
        },
      ],
    },
    {
      group: 'Governance & Communications',
      items: [
        {
          title: 'Notice Board & Bulletins',
          desc: 'Review, edit, and archive published announcements',
          icon: 'newspaper-outline',
          route: '/(admin)/notices',
          color: '#DB2777',
        },
        {
          title: 'Publish Institutional Notice',
          desc: 'Broadcast emergency alerts and official college memos',
          icon: 'megaphone-outline',
          route: '/(admin)/notices/create',
          color: '#EA580C',
        },
        {
          title: 'Institutional Requests',
          desc: 'Review condonation and duty leave applications',
          icon: 'clipboard-outline',
          route: '/(admin)/requests',
          color: '#0D9488',
        },
        {
          title: 'System Audit Logs',
          desc: 'Inspect sensitive administrative operations and logs',
          icon: 'shield-outline',
          route: '/(admin)/audit-logs',
          color: COLORS.primaryDark,
        },
      ],
    },
    {
      group: 'Account & Security',
      items: [
        {
          title: 'Administrator Profile',
          desc: 'Institutional identity and password security',
          icon: 'person-circle-outline',
          route: '/(admin)/profile',
          color: COLORS.primary,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Administration Hub</Text>
        <Text style={styles.headerSubtitle}>Governance &amp; Academic Tools</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Administrator Console</Text>
              <Text style={styles.userEmail}>{user?.email || 'admin@college.edu'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>CHIEF REGISTRAR</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Navigation Groups */}
        {navItems.map((group, gIdx) => (
          <View key={gIdx} style={styles.groupContainer}>
            <Text style={styles.groupHeading}>{group.group}</Text>
            <Card style={styles.groupCard}>
              {group.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.itemRow,
                    iIdx < group.items.length - 1 && styles.itemRowBorder,
                  ]}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>End Administrator Session</Text>
        </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextGroup: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

