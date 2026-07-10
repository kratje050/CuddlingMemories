import { Tabs } from "expo-router";
import { adminPalette } from "@shared/constants";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: adminPalette.cocoa,
        tabBarInactiveTintColor: adminPalette.clay,
        tabBarStyle: { backgroundColor: adminPalette.card, borderTopColor: "#E9DCCF" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="calendar" options={{ title: "Kalender" }} />
      <Tabs.Screen name="bookings" options={{ title: "Boekingen" }} />
      <Tabs.Screen name="notifications" options={{ title: "Meldingen" }} />
      <Tabs.Screen name="more" options={{ title: "Meer" }} />
    </Tabs>
  );
}
