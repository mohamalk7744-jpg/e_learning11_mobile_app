import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");

  const messages = [
    { id: 1, type: "bot", text: "مرحباً! أنا بوت التعليم الذكي. كيف يمكنني مساعدتك؟" },
    { id: 2, type: "user", text: "ما هي المعادلات الخطية؟" },
    { id: 3, type: "bot", text: "المعادلة الخطية هي معادلة من الدرجة الأولى تحتوي على متغير واحد أو أكثر. الصيغة العامة: ax + b = 0" },
  ];

  return (
    <ThemedView 
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }
      ]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">البوت الذكي</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>اسأل أي سؤال عن المنهاج</ThemedText>
      </ThemedView>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <View 
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.type === "user" ? styles.userMessageWrapper : styles.botMessageWrapper
            ]}
          >
            <View 
              style={[
                styles.messageBubble,
                msg.type === "user" ? styles.userMessage : styles.botMessage
              ]}
            >
              <ThemedText 
                type="default"
                style={[
                  styles.messageText,
                  msg.type === "user" && styles.userMessageText
                ]}
              >
                {msg.text}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب سؤالك هنا..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          maxHeight={100}
        />
        <Pressable 
          style={({ pressed }) => [
            styles.sendButton,
            pressed && styles.sendButtonPressed
          ]}
          onPress={() => {
            if (message.trim()) {
              setMessage("");
            }
          }}
        >
          <ThemedText style={styles.sendButtonText}>إرسال</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: "#007AFF",
  },
  botMessage: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
