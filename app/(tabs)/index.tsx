import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState({
    lessonsToday: 3,
    quizzesToday: 1,
    newDiscounts: 2,
    completedLessons: 12,
    totalLessons: 30,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const progressPercent = Math.round((stats.completedLessons / stats.totalLessons) * 100);

  return (
    <ScrollView style={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title">أهلاً، {user?.name || 'الطالب'}</ThemedText>
            <ThemedText style={styles.subtitle}>
              استمر في رحلتك التعليمية
            </ThemedText>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📊 إحصائيات اليوم
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: Colors[colorScheme ?? 'light'].tint }]}>
              <ThemedText style={styles.statNumber}>{stats.lessonsToday}</ThemedText>
              <ThemedText style={styles.statLabel}>دروس</ThemedText>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
              <ThemedText style={styles.statNumber}>{stats.quizzesToday}</ThemedText>
              <ThemedText style={styles.statLabel}>اختبار</ThemedText>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#34C759' }]}>
              <ThemedText style={styles.statNumber}>{stats.newDiscounts}</ThemedText>
              <ThemedText style={styles.statLabel}>عروض جديدة</ThemedText>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📈 تقدمك الدراسي
          </ThemedText>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {stats.completedLessons} من {stats.totalLessons} درس ({progressPercent}%)
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ⚡ إجراءات سريعة
          </ThemedText>
          
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <ThemedText style={styles.actionButtonText}>📚 درس اليوم</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <ThemedText style={styles.actionButtonText}>💬 اسأل البوت</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={() => router.push('/(tabs)/discounts')}
          >
            <ThemedText style={styles.actionButtonText}>🎉 عروض خاصة</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => router.push('/(tabs)/exams')}
          >
            <ThemedText style={styles.actionButtonText}>✏️ الاختبارات</ThemedText>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutButton}
          onPress={logout}
        >
          <ThemedText style={styles.logoutText}>تسجيل الخروج</ThemedText>
        </Pressable>

        <View style={styles.spacer} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
