import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/providers/AuthProvider";
import { styles } from "../src/styles";

export default function Index() {
  const { loading, session, isAdmin } = useAuth();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={session && isAdmin ? "/(tabs)/dashboard" : "/login"} />;
}
