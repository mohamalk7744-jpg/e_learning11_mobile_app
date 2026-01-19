import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator, Alert, TextInput, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const quizId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number, textAnswer?: string, imageUrl?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score?: number; totalQuestions?: number; percentage?: number, status: string } | null>(null);

  const { data: quiz, isLoading } = trpc.quizzes.getById.useQuery({ id: quizId });
  const uploadMutation = trpc.storage.upload.useMutation();
  const submitMutation = trpc.quizzes.submit.useMutation();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View style={styles.centered}>
        <ThemedText>هذا الاختبار غير متوفر حالياً أو لا يحتوي على أسئلة.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>رجوع</ThemedText>
        </Pressable>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: { ...prev[questionId], selectedOptionId: optionId } 
    }));
  };

  const handleUpdateText = (questionId: number, text: string) => {
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: { ...prev[questionId], textAnswer: text } 
    }));
  };

  const pickImage = async (questionId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setAnswers(prev => ({ 
        ...prev, 
        [questionId]: { ...prev[questionId], imageUrl: result.assets[0].uri } 
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBackPress = () => {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = quiz?.questions?.length || 0;

    if (answeredCount > 0 && answeredCount < totalQuestions) {
      Alert.alert(
        "تنبيه",
        `لقد أجبت على ${answeredCount} من أصل ${totalQuestions} أسئلة. إذا خرجت الآن، سيتم اعتماد إجاباتك الحالية فقط. هل أنت متأكد من الخروج؟`,
        [
          { text: "إلغاء", style: "cancel" },
          { text: "خروج على أي حال", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    const currentAns = answers[currentQuestion.id];
    if (currentQuestion.questionType === 'multiple_choice' && !currentAns?.selectedOptionId) {
      Alert.alert("تنبيه", "يرجى اختيار إجابة.");
      return;
    }
    if (currentQuestion.questionType !== 'multiple_choice' && !currentAns?.textAnswer && !currentAns?.imageUrl) {
      Alert.alert("تنبيه", "يرجى كتابة إجابة أو رفع صورة للحل.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = [];
      let uploadErrors: { questionId: number, error: string, hasTextAnswer: boolean }[] = [];
      
      for (const [qId, data] of Object.entries(answers)) {
        let uploadedUrl = data.imageUrl;
        
        if (data.imageUrl && (data.imageUrl.startsWith('file://') || data.imageUrl.startsWith('/'))) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(data.imageUrl);
            if (!fileInfo.exists) {
              throw new Error("الملف غير موجود");
            }
            
            // التحقق من حجم الملف (حد أقصى 5 ميجابايت)
            if (fileInfo.size > 5 * 1024 * 1024) {
              throw new Error("حجم الصورة يتجاوز الحد المسموح (5 ميجابايت)");
            }
            
            const base64 = await FileSystem.readAsStringAsync(data.imageUrl, { encoding: 'base64' });
            const fileExt = data.imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
            const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
            const fileName = `quiz_${quizId}_ans_${qId}_${Date.now()}.${fileExt}`;
            
            const uploadResult = await uploadMutation.mutateAsync({
              base64,
              fileName,
              contentType
            });
            uploadedUrl = uploadResult.url;
          } catch (err: any) {
            // تسجيل الخطأ لكن نستمر في الإرسال
            uploadErrors.push({
              questionId: Number(qId),
              error: err.message || "فشل في رفع الصورة",
              hasTextAnswer: !!data.textAnswer
            });
          }
        }

        formattedAnswers.push({
          questionId: Number(qId),
          selectedOptionId: data.selectedOptionId,
          textAnswer: data.textAnswer,
          imageUrl: uploadedUrl,
        });
      }

      // إرسال الإجابات إلى الخادم
      const result = await submitMutation.mutateAsync({
        quizId: quizId,
        answers: formattedAnswers,
      });

      // إذا كانت هناك أخطاء في رفع الصور، نعرض إشعار للطالب
      if (uploadErrors.length > 0) {
        let errorMessage = "تم إرسال إجابتك بنجاح مع بعض التحفظات:\n\n";
        uploadErrors.forEach(err => {
          errorMessage += `• السؤال ${err.questionId}: ${err.error}`;
          if (err.hasTextAnswer) {
            errorMessage += " (تم إرسال الإجابة النصية فقط)";
          }
          errorMessage += "\n";
        });
        
        Alert.alert("تم الإرسال", errorMessage);
      }

      setScoreResult(result);
      setShowResult(true);
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("خطأ", "فشل في إرسال الإجابات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfirmed && quiz) {
    return (
      <ThemedView style={[styles.container, styles.centered, { padding: 20 }]}>
        <Ionicons name="help-circle-outline" size={80} color="#007AFF" />
        <ThemedText type="title" style={{ marginTop: 20, textAlign: 'center' }}>{quiz.title}</ThemedText>
        <ThemedText style={{ marginTop: 10, textAlign: 'center', opacity: 0.7 }}>
          {quiz.description || "هل أنت مستعد لبدء الاختبار؟"}
        </ThemedText>
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>• عدد الأسئلة: {quiz.questions.length}</ThemedText>
          <ThemedText style={styles.infoText}>• نوع الاختبار: {quiz.type === 'daily' ? 'يومي (تصحيح فوري)' : 'رسمي (تصحيح يدوي)'}</ThemedText>
        </View>
        <Pressable style={styles.startButtonLarge} onPress={() => setIsConfirmed(true)}>
          <ThemedText style={styles.startButtonTextLarge}>أنا مستعد، ابدأ الآن</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: '#FF3B30' }}>رجوع</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (showResult && scoreResult) {
    const isDaily = quiz?.type === 'daily';
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultCard}>
            <View style={styles.successIconContainer}>
              <Ionicons 
                name={isDaily ? "trophy" : "checkmark-circle"} 
                size={100} 
                color={isDaily ? "#FFD700" : "#34C759"} 
              />
            </View>
            
            <ThemedText type="title" style={styles.successTitle}>
              {isDaily ? "اكتمل الاختبار!" : "تم إرسال إجابتك بنجاح!"}
            </ThemedText>
            
            {isDaily ? (
              <View style={styles.scoreBox}>
                <ThemedText style={styles.scoreLabel}>درجتك هي:</ThemedText>
                <ThemedText style={styles.scoreValue}>{scoreResult.percentage}%</ThemedText>
                <ThemedText style={styles.scoreDetail}>
                  أجبت بشكل صحيح على {scoreResult.score} من أصل {scoreResult.totalQuestions}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.successMessageBox}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <ThemedText style={styles.successMessage}>
                  شكراً لإكمال الاختبار. ستظهر درجاتك بعد تصحيح المعلم.
                </ThemedText>
              </View>
            )}

            <Pressable 
              style={styles.returnButton} 
              onPress={() => router.replace("/(tabs)/exams")}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <ThemedText style={styles.returnButtonText}>العودة للاختبارات</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.closeButton}>
          <ThemedText style={styles.closeIcon}>✕</ThemedText>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }]} />
        </View>
        <ThemedText style={styles.progressText}>
          {currentQuestionIndex + 1} / {quiz.questions.length}
        </ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionHeader}>
          {currentQuestion.questionType !== 'multiple_choice' && (
            <View style={styles.manualBadge}>
              <ThemedText style={styles.manualBadgeText}>تصحيح يدوي</ThemedText>
            </View>
          )}
          <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
        </View>
        
        {currentQuestion.questionType === 'multiple_choice' ? (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option: any) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionCard,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.optionSelected
                ]}
                onPress={() => handleSelectOption(currentQuestion.id, option.id)}
              >
                <View style={[
                  styles.radio,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.radioSelected
                ]} />
                <ThemedText style={[
                  styles.optionText,
                  answers[currentQuestion.id]?.selectedOptionId === option.id && styles.optionTextSelected
                ]}>
                  {option.text}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.manualAnswerContainer}>
            <TextInput
              style={styles.textAnswerInput}
              placeholder="اكتب إجابتك هنا..."
              multiline
              value={answers[currentQuestion.id]?.textAnswer}
              onChangeText={(text) => handleUpdateText(currentQuestion.id, text)}
              textAlign="right"
            />
            
            <ThemedText style={styles.orText}>أو</ThemedText>
            
            <Pressable style={styles.uploadButton} onPress={() => pickImage(currentQuestion.id)}>
              <Ionicons name="camera-outline" size={24} color="#007AFF" />
              <ThemedText style={styles.uploadButtonText}>رفع صورة للحل</ThemedText>
            </Pressable>
            
            {answers[currentQuestion.id]?.imageUrl && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: answers[currentQuestion.id].imageUrl }} style={styles.imagePreview} />
                <Pressable 
                  style={styles.removeImage} 
                  onPress={() => {
                     const newAns = { ...answers[currentQuestion.id] };
                     delete newAns.imageUrl;
                     setAnswers({ ...answers, [currentQuestion.id]: newAns });
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, isSubmitting && styles.disabledButton]} 
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.nextButtonText}>
              {currentQuestionIndex === quiz.questions.length - 1 ? "إنهاء وإرسال" : "السؤال التالي"}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', gap: 12 },
  closeButton: { padding: 8 },
  closeIcon: { fontSize: 20, color: '#999' },
  progressContainer: { flex: 1, height: 8, backgroundColor: '#E9ECEF', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#007AFF' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', minWidth: 40, textAlign: 'center' },
  content: { flex: 1, padding: 20 },
  questionHeader: { marginBottom: 24, alignItems: 'flex-end' },
  manualBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#FFEDD5' },
  manualBadgeText: { color: '#C2410C', fontSize: 12, fontWeight: 'bold' },
  questionText: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', color: '#212529', lineHeight: 32 },
  optionsContainer: { gap: 12 },
  optionCard: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E9ECEF', gap: 12 },
  optionSelected: { borderColor: '#007AFF', backgroundColor: 'rgba(0, 122, 255, 0.05)' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CED4DA' },
  radioSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF' },
  optionText: { flex: 1, fontSize: 16, textAlign: 'right', color: '#495057' },
  optionTextSelected: { color: '#007AFF', fontWeight: '600' },
  manualAnswerContainer: { gap: 15 },
  textAnswerInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, height: 150, borderWidth: 1, borderColor: '#E9ECEF', fontSize: 16 },
  orText: { textAlign: 'center', color: '#999', fontWeight: 'bold' },
  uploadButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed', gap: 10 },
  uploadButtonText: { color: '#007AFF', fontWeight: 'bold' },
  imagePreviewContainer: { marginTop: 10, position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 12 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  nextButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { opacity: 0.6 },
  
  // Result Screen Styles
  resultCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 25 },
  successIconContainer: { marginBottom: 10 },
  successTitle: { fontSize: 26, textAlign: 'center', color: '#1F2937' },
  successMessageBox: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#F0F7FF', 
    padding: 20, 
    borderRadius: 16, 
    gap: 12,
    width: '100%',
  },
  successMessage: { 
    flex: 1, 
    textAlign: 'right', 
    fontSize: 15, 
    color: '#4B5563',
    lineHeight: 24,
  },
  returnButton: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: '#34C759', 
    paddingVertical: 14, 
    paddingHorizontal: 30, 
    borderRadius: 12, 
    marginTop: 10,
  },
  returnButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  backButton: { marginTop: 20, padding: 12 },
  backButtonText: { color: '#007AFF', fontSize: 16 },
  infoBox: { backgroundColor: '#F0F7FF', padding: 15, borderRadius: 12, width: '100%', marginTop: 20, gap: 8 },
  infoText: { textAlign: 'right', color: '#4B5563' },
  startButtonLarge: { backgroundColor: '#007AFF', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginTop: 30, width: '100%', alignItems: 'center' },
  startButtonTextLarge: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scoreBox: { alignItems: 'center', backgroundColor: '#F0F7FF', padding: 20, borderRadius: 16, width: '100%', gap: 10 },
  scoreLabel: { fontSize: 16, color: '#4B5563' },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#007AFF' },
  scoreDetail: { fontSize: 14, color: '#6B7280' }
});
