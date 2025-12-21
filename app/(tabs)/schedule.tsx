import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function ScheduleScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Study Schedule</ThemedText>
      <ThemedText type="default">Your daily lessons and quizzes will appear here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
