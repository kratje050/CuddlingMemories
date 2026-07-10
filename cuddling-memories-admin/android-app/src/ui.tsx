import { Text, View } from "react-native";
import { styles } from "./styles";

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function PlaceholderCard({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}
