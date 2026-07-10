import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

const items = ["Nieuwe boeking", "Beschikbaarheid", "Geblokkeerde dagen", "Maandplanning", "Pakketten", "Klanten", "Wachtlijst", "Mini-shoots", "Cadeaubonnen", "Galerijen", "Instellingen"];

export default function MoreScreen() {
  const { signOut } = useAuth();
  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="Meer" subtitle="Adminmodules" />
      {items.map((item) => (
        <View key={item} style={styles.card}>
          <Text style={styles.cardTitle}>{item}</Text>
          <Text style={styles.muted}>Wordt verder uitgewerkt in de volgende fases.</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
        <Text style={styles.secondaryButtonText}>Uitloggen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
