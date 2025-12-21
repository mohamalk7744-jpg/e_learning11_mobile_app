import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { StyleSheet, FlatList, ActivityIndicator } from "react-native";

interface Discount {
  id: number;
  title: string;
  description: string;
  company: string;
  discountValue: number;
  discountType: string;
}

export default function DiscountsScreen() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Special Offers</ThemedText>
      <ThemedText type="default">Exclusive discounts for our students</ThemedText>

      <FlatList
        data={discounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="default">{item.description}</ThemedText>
            <ThemedText type="default" style={styles.company}>
              {item.company}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.discount}>
              {item.discountType === "percentage"
                ? `${item.discountValue}% OFF`
                : `${item.discountValue} OFF`}
            </ThemedText>
          </Card>
        )}
        scrollEnabled={false}
        ListEmptyComponent={
          <ThemedText type="default">No discounts available</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  company: {
    marginTop: 8,
    fontSize: 14,
  },
  discount: {
    marginTop: 8,
    color: "#10B981",
  },
});
