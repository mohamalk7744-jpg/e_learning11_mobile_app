import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Admin Dashboard",
        }}
      />
      <Stack.Screen
        name="subjects"
        options={{
          title: "Manage Subjects",
        }}
      />
      <Stack.Screen
        name="lessons"
        options={{
          title: "Manage Lessons",
        }}
      />
      <Stack.Screen
        name="quizzes"
        options={{
          title: "Manage Quizzes",
        }}
      />
      <Stack.Screen
        name="discounts"
        options={{
          title: "Manage Discounts",
        }}
      />
    </Stack>
  );
}
