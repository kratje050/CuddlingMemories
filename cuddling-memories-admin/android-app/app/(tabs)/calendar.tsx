import { ScrollView, Text } from "react-native";
import { ScreenHeader, PlaceholderCard } from "../../src/ui";
import { styles } from "../../src/styles";

export default function CalendarScreen() {
  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="Kalender" subtitle="Fase 2: dag/week/maand planning" />
      <PlaceholderCard text="Kalenderweergaves komen in Fase 2. De basisnavigatie staat klaar." />
    </ScrollView>
  );
}
