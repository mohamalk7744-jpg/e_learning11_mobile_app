import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const todayLessons = [
    { id: 1, title: "الرياضيات", chapter: "الفصل 5", time: "09:00 AM", duration: "45 دقيقة" },
    { id: 2, title: "اللغة العربية", chapter: "النصوص الأدبية", time: "10:30 AM", duration: "40 دقيقة" },
    { id: 3, title: "العلوم", chapter: "الكيمياء العضوية", time: "02:00 PM", duration: "50 دقيقة" },
  ];

  const todayQuizzes = [
    { id: 1, title: "اختبار الرياضيات", time: "11:30 AM", duration: "30 دقيقة" },
  ];

  const handleStartLesson = (lessonTitle: string) => {
    Alert.alert(
      "بدء الدرس",
      `هل تريد بدء درس: ${lessonTitle}؟`,
      [
        { text: "إلغاء", onPress: () => {}, style: "cancel" },
        { 
          text: "ابدأ", 
          onPress: () => {
            Alert.alert("✅ تم", `تم بدء درس ${lessonTitle} بنجاح!`);
          }
        },
      ]
    );
  };

  const handleTakeQuiz = (quizTitle: string) => {
    Alert.alert(
      "بدء الاختبار",
      `هل تريد بدء: ${quizTitle}؟`,
      [
        { text: "إلغاء", onPress: () => {}, style: "cancel" },
        { 
          text: "ابدأ", 
          onPress: () => {
            Alert.alert("✅ تم", `تم بدء ${quizTitle} بنجاح!`);
          }
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">الخطة الدراسية</ThemedText>
        <ThemedText type="default" style={styles.date}>اليوم - 24 ديسمبر 2025</ThemedText>
      </ThemedView>

      {/* Lessons Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>📚 الدروس</ThemedText>
        {todayLessons.map((lesson) => (
          <Pressable 
            key={lesson.id}
            style={({ pressed }) => [
              styles.lessonItem,
              pressed && styles.lessonItemPressed
            ]}
          >
            <View style={styles.lessonItemContent}>
              <ThemedText type="defaultSemiBold" style={styles.lessonName}>
                {lesson.title}
              </ThemedText>
              <ThemedText type="default" style={styles.lessonChapter}>
                {lesson.chapter}
              </ThemedText>
              <View style={styles.lessonMeta}>
                <ThemedText type="default" style={styles.metaText}>
                  🕐 {lesson.time}
                </ThemedText>
                <ThemedText type="default" style={styles.metaText}>
                  ⏱️ {lesson.duration}
                </ThemedText>
              </View>
            </View>
            <Pressable 
              style={styles.startButton}
              onPress={() => handleStartLesson(lesson.title)}
            >
              <ThemedText style={styles.startButtonText}>ابدأ</ThemedText>
            </Pressable>
          </Pressable>
        ))}
      </ThemedView>

      {/* Quizzes Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>✏️ الاختبارات</ThemedText>
        {todayQuizzes.map((quiz) => (
          <Pressable 
            key={quiz.id}
            style={({ pressed }) => [
              styles.quizItem,
              pressed && styles.quizItemPressed
            ]}
          >
            <View style={styles.quizItemContent}>
              <ThemedText type="defaultSemiBold" style={styles.quizName}>
                {quiz.title}
              </ThemedText>
              <View style={styles.quizMeta}>
                <ThemedText type="default" style={styles.metaText}>
                  🕐 {quiz.time}
                </ThemedText>
                <ThemedText type="default" style={styles.metaText}>
                  ⏱️ {quiz.duration}
                </ThemedText>
              </View>
            </View>
            <Pressable 
              style={styles.takeButton}
              onPress={() => handleTakeQuiz(quiz.title)}
            >
              <ThemedText style={styles.takeButtonText}>اختبر</ThemedText>
            </Pressable>
          </Pressable>
        ))}
      </ThemedView>

      {/* Progress Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>📊 التقدم</ThemedText>
        <View style={styles.progressCard}>
          <View style={styles.progressItem}>
            <ThemedText type="default">الدروس المكتملة</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.progressNumber}>12 / 30</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "40%" }]} />
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  lessonItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lessonItemPressed: {
    opacity: 0.6,
  },
  lessonItemContent: {
    flex: 1,
    gap: 4,
  },
  lessonName: {
    fontSize: 15,
  },
  lessonChapter: {
    fontSize: 13,
    opacity: 0.7,
  },
  lessonMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  startButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  quizItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 149, 0, 0.08)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizItemPressed: {
    opacity: 0.6,
  },
  quizItemContent: {
    flex: 1,
    gap: 4,
  },
  quizName: {
    fontSize: 15,
  },
  quizMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  takeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FF9500",
    marginLeft: 8,
  },
  takeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressCard: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    gap: 12,
  },
  progressItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressNumber: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
});
