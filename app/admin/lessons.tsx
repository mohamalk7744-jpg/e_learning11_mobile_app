import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function LessonsScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dayNumber, setDayNumber] = useState("1");

  // جلب المواد لاختيار واحدة منها
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  // جلب الدروس بناءً على المادة المختارة
  const { data: lessons, isLoading, refetch } = trpc.lessons.listBySubject.useQuery(
    { subjectId: selectedSubjectId || 0 },
    { enabled: !!selectedSubjectId }
  );

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة الدرس بنجاح");
      setIsAdding(false);
      setTitle("");
      setContent("");
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const handleAddLesson = () => {
    if (!selectedSubjectId || !title || !content) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول واختيار مادة");
      return;
    }
    createLesson.mutate({
      subjectId: selectedSubjectId,
      title,
      content,
      dayNumber: parseInt(dayNumber),
      order: 1
    });
  };

  const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);

  return (
    <View style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">إدارة الدروس</ThemedText>
          <Pressable style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
            <ThemedText style={styles.addButtonText}>{isAdding ? "إلغاء" : "+ إضافة درس"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.label}>المادة الدراسية:</ThemedText>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowSubjectPicker(true)}
          >
            <ThemedText style={selectedSubject ? styles.selectorText : styles.placeholderText}>
              {selectedSubject ? selectedSubject.name : "اختر مادة من هنا..."}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {isAdding && (
          <ThemedView style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="عنوان الدرس"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#666"
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="محتوى الدرس (شرح)"
              value={content}
              onChangeText={setContent}
              multiline
              placeholderTextColor="#666"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="رقم اليوم (مثلاً: 1)"
                value={dayNumber}
                onChangeText={setDayNumber}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              <ThemedText style={{ marginLeft: 8 }}>اليوم رقم:</ThemedText>
            </View>
            <Pressable style={styles.submitButton} onPress={handleAddLesson}>
              {createLesson.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitButtonText}>حفظ الدرس</ThemedText>}
            </Pressable>
          </ThemedView>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.list}>
            {lessons?.map((lesson) => (
              <ThemedView key={lesson.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.dayBadge}>اليوم {lesson.dayNumber}</ThemedText>
                  <ThemedText type="defaultSemiBold">{lesson.title}</ThemedText>
                </View>
                <ThemedText numberOfLines={2} style={styles.cardContent}>{lesson.content}</ThemedText>
              </ThemedView>
            ))}
            {selectedSubjectId && lessons?.length === 0 && (
              <ThemedText style={styles.emptyText}>لا توجد دروس لهذه المادة بعد</ThemedText>
            )}
            {!selectedSubjectId && (
              <ThemedText style={styles.emptyText}>الرجاء اختيار مادة لعرض الدروس</ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {/* مودال اختيار المادة */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>اختر مادة</ThemedText>
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.modalItem} 
                  onPress={() => {
                    setSelectedSubjectId(item.id);
                    setShowSubjectPicker(false);
                  }}
                >
                  <ThemedText>{item.name}</ThemedText>
                </Pressable>
              )}
            />
            <Pressable style={styles.closeButton} onPress={() => setShowSubjectPicker(false)}>
              <ThemedText style={styles.closeButtonText}>إغلاق</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, marginBottom: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: 'transparent' },
  addButton: { backgroundColor: "#10B981", padding: 8, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "600" },
  section: { padding: 16, backgroundColor: 'transparent' },
  label: { marginBottom: 8, fontWeight: 'bold', textAlign: 'right' },
  selector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  selectorText: { textAlign: 'right', color: '#000' },
  placeholderText: { textAlign: 'right', color: '#999' },
  form: { margin: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12, gap: 12, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 1, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  dayBadge: { backgroundColor: '#EEF2FF', color: '#4F46E5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
  cardContent: { color: '#666', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  closeButton: { marginTop: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold', color: '#ff4444' }
});
