import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DiscountsScreen() {
  const insets = useSafeAreaInsets();

  const discounts = [
    { id: 1, company: "مدرسة النور", discount: "30%", description: "خصم على الدورات الصيفية", type: "percentage" },
    { id: 2, company: "معهد اللغات", discount: "500 ريال", description: "خصم على برامج اللغة الإنجليزية", type: "fixed" },
    { id: 3, company: "مركز الرياضيات", discount: "25%", description: "خصم على الحصص الخصوصية", type: "percentage" },
  ];

  const handleUseDiscount = (company: string, discount: string) => {
    Alert.alert(
      "استخدام الحسم",
      `هل تريد استخدام حسم ${discount} من ${company}؟`,
      [
        { text: "إلغاء", onPress: () => {}, style: "cancel" },
        { 
          text: "استخدم", 
          onPress: () => {
            Alert.alert("✅ تم", `تم استخدام حسم ${discount} بنجاح!\nسيتم تطبيقه على طلبك التالي.`);
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
        <ThemedText type="title">العروض والحسومات</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>استفد من عروضنا الخاصة</ThemedText>
      </ThemedView>

      <View style={styles.discountsContainer}>
        {discounts.map((discount) => (
          <Pressable 
            key={discount.id}
            style={({ pressed }) => [
              styles.discountCard,
              pressed && styles.discountCardPressed
            ]}
          >
            <View style={styles.discountHeader}>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.company}>
                  {discount.company}
                </ThemedText>
                <ThemedText type="default" style={styles.description}>
                  {discount.description}
                </ThemedText>
              </View>
              <View style={[
                styles.badgeContainer,
                discount.type === "percentage" ? styles.percentageBadge : styles.fixedBadge
              ]}>
                <ThemedText style={styles.badgeText}>
                  {discount.discount}
                </ThemedText>
              </View>
            </View>
            <Pressable 
              style={styles.useButton}
              onPress={() => handleUseDiscount(discount.company, discount.discount)}
            >
              <ThemedText style={styles.useButtonText}>استخدم الآن</ThemedText>
            </Pressable>
          </Pressable>
        ))}
      </View>

      {/* Info Section */}
      <ThemedView style={styles.infoSection}>
        <ThemedText type="subtitle" style={styles.infoTitle}>💡 معلومة</ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          جميع العروض المعروضة حصرية لطلابنا. يمكنك استخدام الحسومات مباشرة من خلال الضغط على "استخدم الآن".
        </ThemedText>
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
  discountsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  discountCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 149, 0, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
    gap: 12,
  },
  discountCardPressed: {
    opacity: 0.7,
  },
  discountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  company: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
  },
  badgeContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  percentageBadge: {
    backgroundColor: "#FF9500",
  },
  fixedBadge: {
    backgroundColor: "#34C759",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  useButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FF9500",
    alignItems: "center",
  },
  useButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(52, 199, 89, 0.08)",
  },
  infoTitle: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
