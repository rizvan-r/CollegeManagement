import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAuth } from '../../../src/hooks/useAuth';
import { useHodDashboard } from '../../../src/hooks/useHodData';
import { Card } from '../../../src/components';

export default function HodMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: dashboard } = useHodDashboard();

  const pendingCount = dashboard?.pendingRequestsCount ?? 0;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const navItems = [
    {
      title: 'Student Requests & Approvals',
      subtitle: 'On-Duty sanctions, medical leave & approvals',
      icon: 'document-text-outline',
      color: '#7C3AED',
      badge: pendingCount > 0 ? `${pendingCount} Pending` : null,
      route: '/(hod)/requests',
    },
    {
      title: 'Department Courses Matrix',
      subtitle: 'Curriculum catalog, credits & assigned faculty',
      icon: 'library-outline',
      color: '#0284C7',
      route: '/(hod)/courses',
    },
    {
      title: 'Institutional Notices',
      subtitle: 'Review departmental and college-wide circulars',
      icon: 'notifications-outline',
      color: COLORS.primary,
      route: '/(hod)/notices',
    },
    {
      title: 'Publish New Announcement',
      subtitle: 'Issue advisories to department students and faculty',
      icon: 'megaphone-outline',
      color: '#E11D48',
      route: '/(hod)/notice/create',
    },
    {
      title: 'HOD Institutional Profile',
      subtitle: 'Credentials, department affiliation & security',
      icon: 'person-outline',
      color: COLORS.accent,
      route: '/(hod)/profile',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Department Administration</Text>
        <Text style={styles.screenSubtitle}>Governance Services & Directives</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {navItems.map((item, idx) => (
          <Card key={idx} style={styles.navCard}>
            <TouchableOpacity
              style={styles.navRow}
              activeOpacity={0.7}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.badge ? (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </Card>
        ))}

        {/* Sign Out Card */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of HOD Portal</Text>
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
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  navCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badgePill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

