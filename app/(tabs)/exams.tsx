import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { StyleSheet, FlatList, ActivityIndicator } from "react-native";

interface Exam {
  id: number;
  title: string;
  type: string;
  description: string;
  scheduledDate?: string;
}

export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Exams</ThemedText>
      <ThemedText type="default">Monthly and semester exams</ThemedText>

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="default">{item.description}</ThemedText>
            <ThemedText type="default" style={styles.type}>
              Type: {item.type}
            </ThemedText>
            {item.scheduledDate && (
              <ThemedText type="default" style={styles.date}>
                Scheduled: {item.scheduledDate}
              </ThemedText>
            )}
            <Button title="Take Exam" size="small" onPress={() => {}} />
          </Card>
        )}
        scrollEnabled={false}
        ListEmptyComponent={
          <ThemedText type="default">No exams available</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  type: {
    marginTop: 8,
    fontSize: 14,
  },
  date: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
