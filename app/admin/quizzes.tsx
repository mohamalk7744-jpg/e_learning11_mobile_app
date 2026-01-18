import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, View, Modal, FlatList } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface Question {
  question: string;
  questionType: "multiple_choice" | "short_answer" | "essay";
  correctAnswerText?: string;
  correctAnswerImageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
}

export default function QuizzesScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showQuestionTypePicker, setShowQuestionTypePicker] = useState<{show: boolean, qIndex: number} | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"daily" | "monthly" | "semester">("daily");
  const [dayNumber, setDayNumber] = useState("");
  
  // الأسئلة
  const [questions, setQuestions] = useState<Question[]>([]);

  // جلب المواد
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  // جلب الاختبارات بناءً على المادة
  const { data: quizzes, isLoading, refetch } = trpc.quizzes.listBySubject.useQuery(
    { subjectId: selectedSubjectId || 0 },
    { enabled: !!selectedSubjectId }
  );

  const createQuiz = trpc.quizzes.create.useMutation({
    onSuccess: () => {
      Alert.alert("تم بنجاح", "تم إضافة الاختبار مع الأسئلة بنجاح");
      setIsAdding(false);
      setTitle("");
      setDescription("");
      setDayNumber("");
      setQuestions([]);
      refetch();
    },
    onError: (error) => Alert.alert("خطأ", error.message)
  });

  const handleAddQuiz = () => {
    if (!selectedSubjectId || !title) {
      Alert.alert("تنبيه", "يرجى اختيار مادة وإدخال عنوان للاختبار");
      return;
    }
    if (questions.length === 0) {
      Alert.alert("تنبيه", "يرجى إضافة سؤال واحد على الأقل");
      return;
    }

    // التحقق من صحة الأسئلة
    for (const q of questions) {
      if (!q.question) {
        Alert.alert("تنبيه", "يرجى كتابة نص السؤال");
        return;
      }
      if (q.questionType === "multiple_choice") {
        if (q.options.length < 2) {
          Alert.alert("تنبيه", "يجب إضافة خيارين على الأقل لكل سؤال خيارات");
          return;
        }
        if (!q.options.some(o => o.isCorrect)) {
          Alert.alert("تنبيه", "يرجى تحديد إجابة صحيحة واحدة على الأقل لكل سؤال خيارات");
          return;
        }
      }
    }

    createQuiz.mutate({
      subjectId: selectedSubjectId,
      title,
      description,
      type,
      dayNumber: dayNumber ? parseInt(dayNumber) : undefined,
      questions: questions
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      question: "", 
      questionType: "multiple_choice",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] 
    }]);
  };

  const removeQuestion = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQs = [...questions];
    newQs[index].question = text;
    setQuestions(newQs);
  };

  const updateQuestionAnswerText = (index: number, text: string) => {
    const newQs = [...questions];
    newQs[index].correctAnswerText = text;
    setQuestions(newQs);
  };

  const updateQuestionAnswerImage = (index: number, url: string) => {
    const newQs = [...questions];
    newQs[index].correctAnswerImageUrl = url;
    setQuestions(newQs);
  };

  const setQuestionType = (index: number, qType: "multiple_choice" | "short_answer" | "essay") => {
    const newQs = [...questions];
    newQs[index].questionType = qType;
    if (qType !== "multiple_choice") {
      newQs[index].options = [];
    } else if (newQs[index].options.length === 0) {
      newQs[index].options = [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
    }
    setQuestions(newQs);
    setShowQuestionTypePicker(null);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQs);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options = newQs[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oIndex
    }));
    setQuestions(newQs);
  };

  const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);
  const typeLabels = {
    daily: "اختبار يومي",
    monthly: "اختبار شهري",
    semester: "اختبار فصلي"
  };

  const qTypeLabels = {
    multiple_choice: "خيارات من متعدد",
    short_answer: "إجابة قصيرة",
    essay: "سؤال مقالي / مباشر"
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <ThemedText type="title">إدارة الاختبارات</ThemedText>
          <Pressable style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
            <ThemedText style={styles.addButtonText}>{isAdding ? "إلغاء" : "+ إضافة اختبار"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.label}>اختر المادة الدراسية:</ThemedText>
          <Pressable 
            style={styles.selector} 
            onPress={() => setShowSubjectPicker(true)}
          >
            <ThemedText style={selectedSubject ? styles.selectorText : styles.placeholderText}>
              {selectedSubject ? selectedSubject.name : "اضغط هنا لاختيار المادة..."}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {isAdding && (
          <ThemedView style={styles.form}>
            <ThemedText style={styles.formTitle}>بيانات الاختبار</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="عنوان الاختبار"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="وصف الاختبار"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#666"
            />
            
            <ThemedText style={styles.label}>نوع الاختبار:</ThemedText>
            <Pressable style={styles.selector} onPress={() => setShowTypePicker(true)}>
              <ThemedText style={styles.selectorText}>{typeLabels[type]}</ThemedText>
            </Pressable>

            {type === "daily" && (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="مرتبط باليوم رقم"
                value={dayNumber}
                onChangeText={setDayNumber}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            )}

            <View style={styles.divider} />
            <ThemedText style={styles.formTitle}>الأسئلة ({questions.length})</ThemedText>

            {questions.map((q, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Pressable onPress={() => removeQuestion(qIndex)}>
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </Pressable>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Pressable 
                      style={styles.qTypeBadge} 
                      onPress={() => setShowQuestionTypePicker({show: true, qIndex})}
                    >
                      <ThemedText style={styles.qTypeBadgeText}>{qTypeLabels[q.questionType]}</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.questionNumber}>سؤال {qIndex + 1}</ThemedText>
                  </View>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="نص السؤال"
                  value={q.question}
                  onChangeText={(text) => updateQuestionText(qIndex, text)}
                  placeholderTextColor="#666"
                  multiline
                />

                {q.questionType === "multiple_choice" ? (
                  <>
                    <ThemedText style={[styles.label, { marginTop: 10 }]}>الخيارات:</ThemedText>
                    {q.options.map((opt, oIndex) => (
                      <View key={oIndex} style={styles.optionRow}>
                        <Pressable 
                          style={[styles.radio, opt.isCorrect && styles.radioActive]} 
                          onPress={() => setCorrectOption(qIndex, oIndex)}
                        >
                          {opt.isCorrect && <View style={styles.radioInner} />}
                        </Pressable>
                        <TextInput
                          style={[styles.input, { flex: 1, marginRight: 10 }]}
                          placeholder={`خيار ${oIndex + 1}`}
                          value={opt.text}
                          onChangeText={(text) => updateOptionText(qIndex, oIndex, text)}
                          placeholderTextColor="#666"
                        />
                      </View>
                    ))}
                    <Pressable style={styles.addOptionBtn} onPress={() => addOption(qIndex)}>
                      <ThemedText style={styles.addOptionBtnText}>+ إضافة خيار</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <View style={{marginTop: 10}}>
                    <ThemedText style={styles.label}>الإجابة النموذجية (اختياري):</ThemedText>
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      placeholder="أدخل نص الإجابة الصحيحة لتظهر للطالب لاحقاً"
                      value={q.correctAnswerText}
                      onChangeText={(text) => updateQuestionAnswerText(qIndex, text)}
                      placeholderTextColor="#666"
                      multiline
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      placeholder="رابط صورة الإجابة الصحيحة (إن وجد)"
                      value={q.correctAnswerImageUrl}
                      onChangeText={(text) => updateQuestionAnswerImage(qIndex, text)}
                      placeholderTextColor="#666"
                    />
                  </View>
                )}
              </View>
            ))}

            <Pressable style={styles.addQuestionBtn} onPress={addQuestion}>
              <ThemedText style={styles.addQuestionBtnText}>+ إضافة سؤال جديد</ThemedText>
            </Pressable>

            <Pressable style={styles.submitButton} onPress={handleAddQuiz}>
              {createQuiz.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitButtonText}>حفظ الاختبار والأسئلة</ThemedText>}
            </Pressable>
          </ThemedView>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.list}>
            {quizzes?.map((quiz) => (
              <ThemedView key={quiz.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.typeBadge}>
                    {quiz.type === "daily" ? `يومي (يوم ${quiz.dayNumber})` : quiz.type === "monthly" ? "شهري" : "فصلي"}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{quiz.title}</ThemedText>
                </View>
                <ThemedText style={styles.cardDesc}>{quiz.description || "لا يوجد وصف"}</ThemedText>
              </ThemedView>
            ))}
            {selectedSubjectId && quizzes?.length === 0 && (
              <ThemedText style={styles.emptyText}>لا توجد اختبارات لهذه المادة بعد</ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      {/* مودال اختيار المادة */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>اختر المادة</ThemedText>
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

      {/* مودال اختيار نوع الاختبار */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>نوع الاختبار</ThemedText>
            {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
              <Pressable 
                key={t}
                style={styles.modalItem} 
                onPress={() => {
                  setType(t);
                  setShowTypePicker(false);
                }}
              >
                <ThemedText>{typeLabels[t]}</ThemedText>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowTypePicker(false)}>
              <ThemedText style={styles.closeButtonText}>إلغاء</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* مودال اختيار نوع السؤال */}
      <Modal visible={!!showQuestionTypePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>نوع السؤال</ThemedText>
            {(Object.keys(qTypeLabels) as Array<keyof typeof qTypeLabels>).map((t) => (
              <Pressable 
                key={t}
                style={styles.modalItem} 
                onPress={() => {
                  if (showQuestionTypePicker) {
                    setQuestionType(showQuestionTypePicker.qIndex, t);
                  }
                }}
              >
                <ThemedText>{qTypeLabels[t]}</ThemedText>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setShowQuestionTypePicker(null)}>
              <ThemedText style={styles.closeButtonText}>إلغاء</ThemedText>
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
  formTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  questionCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNumber: { fontWeight: 'bold', color: '#007AFF' },
  qTypeBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  qTypeBadgeText: { color: '#0369A1', fontSize: 12, fontWeight: '600' },
  optionRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  radioActive: { backgroundColor: '#fff' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  addOptionBtn: { alignSelf: 'flex-end', marginTop: 5 },
  addOptionBtnText: { color: '#10B981', fontSize: 13, fontWeight: 'bold' },
  addQuestionBtn: { backgroundColor: '#E0F2FE', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  addQuestionBtnText: { color: '#0369A1', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 1, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  typeBadge: { backgroundColor: '#FDF2F2', color: '#B91C1C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 11, overflow: 'hidden' },
  cardDesc: { color: '#666', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  closeButton: { marginTop: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold', color: '#ff4444' }
});
