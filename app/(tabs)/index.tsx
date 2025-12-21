import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";

export default function HomeScreen() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Welcome to E-Learning</ThemedText>
        <ThemedText type="default" style={styles.description}>
          Please log in to access your courses
        </ThemedText>
        <Link href="/oauth/callback" asChild>
          <Pressable style={styles.loginButton}>
            <ThemedText style={styles.loginText}>Login</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Welcome, {user.name || user.email}</ThemedText>
        <ThemedText type="default">Continue your learning journey</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Quick Access</ThemedText>
        <Card>
          <ThemedText type="defaultSemiBold">Today's Lesson</ThemedText>
          <ThemedText type="default">Mathematics - Chapter 5</ThemedText>
          <Button title="Start" size="small" onPress={() => {}} />
        </Card>
        <Card>
          <ThemedText type="defaultSemiBold">Today's Quiz</ThemedText>
          <ThemedText type="default">Physics - Daily Quiz</ThemedText>
          <Button title="Take Quiz" size="small" onPress={() => {}} />
        </Card>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Your Progress</ThemedText>
        <Card>
          <ThemedText type="default">Lessons Completed: 15/30</ThemedText>
          <ThemedText type="default" style={styles.progressBar}>
            Progress: 50%
          </ThemedText>
        </Card>
      </ThemedView>

      <ThemedView style={styles.section}>
        <Button
          title="Logout"
          variant="danger"
          onPress={logout}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  description: {
    marginVertical: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  progressBar: {
    marginTop: 8,
    color: "#10B981",
    fontWeight: "600",
  },
});
