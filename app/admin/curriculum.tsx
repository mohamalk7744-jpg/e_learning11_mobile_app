import { useState } from "react";
import { StyleSheet, ScrollView, View, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";

export default function CurriculumScreen() {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: subjects, isLoading: loadingSubjects } = trpc.subjects.list.useQuery();
  const updateCurriculum = trpc.subjects.update.useMutation();

  const handleSubjectSelect = (subject: any) => {
    setSelectedSubject(subject.id);
    setCurriculum(subject.curriculum || "");
  };

  const handleSave = async () => {
    if (!selectedSubject) {
      Alert.alert("خطأ", "يرجى اختيار مادة أولاً");
      return;
    }

    setIsSaving(true);
    try {
      await updateCurriculum.mutateAsync({
        id: selectedSubject,
        curriculum: curriculum,
      });
      Alert.alert("نجاح", "تم حفظ المنهاج بنجاح");
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "فشل حفظ المنهاج");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">إدارة المناهج (البوت الذكي)</ThemedText>
        <ThemedText style={styles.subtitle}>أدخل محتوى المنهاج لكل مادة لتدريب البوت</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedText style={styles.label}>1. اختر المادة الدراسية:</ThemedText>
        {loadingSubjects ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <View style={styles.subjectsGrid}>
            {subjects?.map((subject) => (
              <Pressable
                key={subject.id}
                style={[
                  styles.subjectCard,
                  selectedSubject === subject.id && styles.selectedCard
                ]}
                onPress={() => handleSubjectSelect(subject)}
              >
                <ThemedText style={[
                  styles.subjectName,
                  selectedSubject === subject.id && styles.selectedText
                ]}>
                  {subject.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {selectedSubject && (
          <View style={styles.inputArea}>
            <ThemedText style={styles.label}>2. محتوى المنهاج (سيستخدمه البوت للرد):</ThemedText>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="اكتب هنا تفاصيل المنهاج، القوانين، الشروحات..."
              value={curriculum}
              onChangeText={setCurriculum}
              textAlignVertical="top"
            />
            
            <Pressable 
              style={[styles.saveButton, isSaving && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <ThemedText style={styles.saveButtonText}>حفظ المنهاج</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "right",
  },
  subjectsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  subjectCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedCard: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  subjectName: {
    fontSize: 14,
    color: "#4B5563",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputArea: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    height: 300,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    textAlign: "right",
    fontSize: 14,
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: "#10B981",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
