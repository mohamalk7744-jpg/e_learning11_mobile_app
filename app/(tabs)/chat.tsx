import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { StyleSheet, ScrollView, TextInput, FlatList } from "react-native";

interface ChatMessage {
  id: number;
  question: string;
  answer: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      // TODO: Call AI API to get answer
      const newMessage: ChatMessage = {
        id: messages.length + 1,
        question: question,
        answer: "This is a sample answer from the AI bot.",
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setQuestion("");
    } catch (error) {
      console.error("Error sending question:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">AI Chat Bot</ThemedText>
      <ThemedText type="default">Ask questions about your courses</ThemedText>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">Q: {item.question}</ThemedText>
            <ThemedText type="default" style={styles.answer}>
              A: {item.answer}
            </ThemedText>
          </Card>
        )}
        scrollEnabled={false}
        style={styles.messagesList}
      />

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={question}
          onChangeText={setQuestion}
          editable={!loading}
        />
        <Button
          title="Send"
          size="small"
          onPress={handleSendQuestion}
          disabled={loading}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  messagesList: {
    flex: 1,
    marginVertical: 16,
  },
  answer: {
    marginTop: 8,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
