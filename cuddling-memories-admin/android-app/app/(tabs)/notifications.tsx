import { ScrollView } from "react-native";
import { ScreenHeader, PlaceholderCard } from "../../src/ui";
import { styles } from "../../src/styles";

export default function NotificationsScreen() {
  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="Meldingen" subtitle="Fase 3: push en meldingen" />
      <PlaceholderCard text="Meldingenoverzicht en Expo pushmeldingen worden in Fase 3 aangesloten." />
    </ScrollView>
  );
}
