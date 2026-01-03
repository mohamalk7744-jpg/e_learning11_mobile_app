import { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trpc } from '@/lib/trpc';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'مرحباً! أنا بوت التعليم الذكي. يمكنك أن تسأل أي سؤال عن المناهج الدراسية وسأساعدك بإجابة شاملة.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatMutation = trpc.chat.ask.useMutation();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        question: inputText,
        curriculum: 'المنهاج السوري',
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: result.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.');
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        text: 'عذراً، حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">💬 البوت الذكي</ThemedText>
          <ThemedText style={styles.subtitle}>
            اسأل أي سؤال عن المناهج الدراسية
          </ThemedText>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.type === 'user'
                  ? styles.userMessageWrapper
                  : styles.botMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user'
                    ? [
                        styles.userBubble,
                        { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                      ]
                    : [
                        styles.botBubble,
                        {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        },
                      ],
                ]}
              >
                <ThemedText
                  style={[
                    styles.messageText,
                    message.type === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </ThemedText>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator
                color={Colors[colorScheme ?? 'light'].tint}
                size="small"
              />
              <ThemedText style={styles.loadingText}>
                جاري الرد...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: Colors[colorScheme ?? 'light'].tint,
                color: Colors[colorScheme ?? 'light'].text,
              },
            ]}
            placeholder="اكتب سؤالك هنا..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              },
              (loading || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
          >
            <ThemedText style={styles.sendButtonText}>
              {loading ? '...' : '📤'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
  },
});
