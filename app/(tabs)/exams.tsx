import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExamsScreen() {
  const insets = useSafeAreaInsets();

  const exams = [
    { 
      id: 1, 
      title: "اختبار الرياضيات الفصلي", 
      subject: "الرياضيات",
      date: "2025-12-30",
      status: "قادم",
      score: null
    },
    { 
      id: 2, 
      title: "اختبار اللغة العربية الشهري", 
      subject: "اللغة العربية",
      date: "2025-12-25",
      status: "مكتمل",
      score: 85
    },
    { 
      id: 3, 
      title: "اختبار العلوم الفصلي", 
      subject: "العلوم",
      date: "2026-01-10",
      status: "قادم",
      score: null
    },
  ];

  const handlePrepareExam = (examTitle: string) => {
    Alert.alert(
      "التحضير للاختبار",
      `هل تريد الانتقال لدروس التحضير لـ: ${examTitle}؟`,
      [
        { text: "إلغاء", onPress: () => {}, style: "cancel" },
        { 
          text: "ابدأ", 
          onPress: () => {
            Alert.alert("✅ تم", `تم فتح دروس التحضير لـ ${examTitle}`);
          }
        },
      ]
    );
  };

  const handleViewResults = (examTitle: string, score: number) => {
    Alert.alert(
      "نتائج الاختبار",
      `${examTitle}\n\nدرجتك: ${score}/100\n\nممتاز! استمر في الاجتهاد 🌟`,
      [
        { text: "حسناً", onPress: () => {} }
      ]
    );
  };

  const handleUploadSolution = () => {
    Alert.alert(
      "رفع حل الاختبار",
      "اختر طريقة الرفع:",
      [
        { 
          text: "التقط صورة", 
          onPress: () => {
            Alert.alert("✅ تم", "تم التقاط الصورة وتحميلها بنجاح!");
          }
        },
        { 
          text: "اختر من المعرض", 
          onPress: () => {
            Alert.alert("✅ تم", "تم اختيار الصورة وتحميلها بنجاح!");
          }
        },
        { text: "إلغاء", onPress: () => {}, style: "cancel" }
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
        <ThemedText type="title">الاختبارات</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>الاختبارات الفصلية والشهرية</ThemedText>
      </ThemedView>

      <View style={styles.examsContainer}>
        {exams.map((exam) => (
          <Pressable 
            key={exam.id}
            style={({ pressed }) => [
              styles.examCard,
              exam.status === "مكتمل" ? styles.completedCard : styles.upcomingCard,
              pressed && styles.examCardPressed
            ]}
          >
            <View style={styles.examHeader}>
              <View style={styles.examInfo}>
                <ThemedText type="defaultSemiBold" style={styles.examTitle}>
                  {exam.title}
                </ThemedText>
                <ThemedText type="default" style={styles.examSubject}>
                  {exam.subject}
                </ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                exam.status === "مكتمل" ? styles.completedBadge : styles.upcomingBadge
              ]}>
                <ThemedText style={styles.statusText}>
                  {exam.status === "مكتمل" ? "✓" : "⏱️"}
                </ThemedText>
              </View>
            </View>

            <View style={styles.examMeta}>
              <ThemedText type="default" style={styles.metaText}>
                📅 {exam.date}
              </ThemedText>
              {exam.score !== null && (
                <ThemedText type="defaultSemiBold" style={styles.score}>
                  الدرجة: {exam.score}/100
                </ThemedText>
              )}
            </View>

            {exam.status === "قادم" ? (
              <Pressable 
                style={styles.prepareButton}
                onPress={() => handlePrepareExam(exam.title)}
              >
                <ThemedText style={styles.prepareButtonText}>استعد للاختبار</ThemedText>
              </Pressable>
            ) : (
              <Pressable 
                style={styles.viewButton}
                onPress={() => handleViewResults(exam.title, exam.score!)}
              >
                <ThemedText style={styles.viewButtonText}>عرض النتائج</ThemedText>
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>

      {/* Upload Section */}
      <ThemedView style={styles.uploadSection}>
        <ThemedText type="subtitle" style={styles.uploadTitle}>📤 رفع حل الاختبار</ThemedText>
        <ThemedText type="default" style={styles.uploadDescription}>
          يمكنك رفع صورة حل الاختبار العام هنا ليتم تصحيحها من قبل المعلم
        </ThemedText>
        <Pressable 
          style={styles.uploadButton}
          onPress={handleUploadSolution}
        >
          <ThemedText style={styles.uploadButtonText}>+ رفع صورة</ThemedText>
        </Pressable>
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
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  examsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  examCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  completedCard: {
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  upcomingCard: {
    backgroundColor: "rgba(255, 149, 0, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  examCardPressed: {
    opacity: 0.7,
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  examInfo: {
    flex: 1,
    gap: 4,
  },
  examTitle: {
    fontSize: 16,
  },
  examSubject: {
    fontSize: 13,
    opacity: 0.7,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadge: {
    backgroundColor: "#34C759",
  },
  upcomingBadge: {
    backgroundColor: "#FF9500",
  },
  statusText: {
    fontSize: 18,
    color: "#fff",
  },
  examMeta: {
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    opacity: 0.7,
  },
  score: {
    fontSize: 14,
    color: "#34C759",
  },
  prepareButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FF9500",
    alignItems: "center",
  },
  prepareButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#34C759",
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    gap: 12,
  },
  uploadTitle: {
    marginBottom: 4,
  },
  uploadDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
  uploadButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    marginTop: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
