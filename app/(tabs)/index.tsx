import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Pressable, ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <View style={styles.welcomeContent}>
          <ThemedText type="title" style={styles.welcomeTitle}>
            مرحباً بك في التعلم عن بعد
          </ThemedText>
          <ThemedText type="default" style={styles.welcomeDescription}>
            الرجاء تسجيل الدخول للوصول إلى مقرراتك الدراسية
          </ThemedText>
          <Pressable 
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={() => router.push("/")}
          >
            <ThemedText style={styles.loginText}>تسجيل الدخول</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.greeting}>
          أهلاً، {user.name || user.email}
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          استمر في رحلتك التعليمية
        </ThemedText>
      </ThemedView>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statNumber}>3</ThemedText>
          <ThemedText type="default" style={styles.statLabel}>دروس اليوم</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statNumber}>1</ThemedText>
          <ThemedText type="default" style={styles.statLabel}>اختبار</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statNumber}>2</ThemedText>
          <ThemedText type="default" style={styles.statLabel}>عروض جديدة</ThemedText>
        </View>
      </View>

      {/* Today's Lesson */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>درس اليوم</ThemedText>
        <Pressable 
          style={({ pressed }) => [
            styles.lessonCard,
            pressed && styles.lessonCardPressed
          ]}
          onPress={() => router.push("/(tabs)/schedule")}
        >
          <View style={styles.lessonContent}>
            <ThemedText type="defaultSemiBold" style={styles.lessonTitle}>
              الرياضيات - الفصل 5
            </ThemedText>
            <ThemedText type="default" style={styles.lessonDescription}>
              المعادلات الخطية والتطبيقات
            </ThemedText>
            <View style={styles.lessonMeta}>
              <ThemedText type="default" style={styles.lessonTime}>
                ⏱️ 45 دقيقة
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>الوصول السريع</ThemedText>
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={() => router.push("/(tabs)/chat")}
        >
          <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
            💬 اسأل البوت
          </ThemedText>
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={() => router.push("/(tabs)/discounts")}
        >
          <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
            🎉 عروض خاصة
          </ThemedText>
        </Pressable>
      </ThemedView>

      {/* Logout Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed
        ]}
        onPress={logout}
      >
        <ThemedText style={styles.logoutText}>تسجيل الخروج</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeContent: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  welcomeTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeDescription: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  greeting: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  lessonCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  lessonCardPressed: {
    opacity: 0.7,
  },
  lessonContent: {
    gap: 8,
  },
  lessonTitle: {
    fontSize: 16,
  },
  lessonDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  lessonMeta: {
    marginTop: 4,
  },
  lessonTime: {
    fontSize: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  loginButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    alignItems: "center",
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
});
