import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../src/providers/AuthProvider";
import { styles } from "../src/styles";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen is niet gelukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.loginCard}>
        <Text style={styles.script}>Cuddling Memories</Text>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.muted}>Log in met je admin-account.</Text>
        <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="E-mailadres" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} secureTextEntry placeholder="Wachtwoord" value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Inloggen..." : "Inloggen"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
