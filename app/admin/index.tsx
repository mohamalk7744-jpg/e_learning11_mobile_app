import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Pressable } from "react-native";

export default function AdminDashboard() {
  const adminOptions = [
    { title: "Manage Subjects", href: "/admin/subjects" },
    { title: "Manage Lessons", href: "/admin/lessons" },
    { title: "Manage Quizzes", href: "/admin/quizzes" },
    { title: "Manage Discounts", href: "/admin/discounts" },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Admin Dashboard</ThemedText>
        <ThemedText type="default">Manage your courses and content</ThemedText>
      </ThemedView>

      <ThemedView style={styles.optionsContainer}>
        {adminOptions.map((option, index) => (
          <Link key={index} href={option.href as any} asChild>
            <Pressable style={styles.optionButton}>
              <ThemedText type="defaultSemiBold">{option.title}</ThemedText>
            </Pressable>
          </Link>
        ))}
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
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
});
