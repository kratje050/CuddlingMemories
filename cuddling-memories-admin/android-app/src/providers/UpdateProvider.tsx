import { useEffect } from "react";
import type { ReactNode } from "react";
import { Alert, AppState } from "react-native";
import * as Updates from "expo-updates";

let isChecking = false;

async function checkForOtaUpdate() {
  if (__DEV__) return;
  if (!Updates.isEnabled) return;
  if (isChecking) return;

  isChecking = true;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return;

    Alert.alert(
      "Nieuwe app-update beschikbaar",
      "Er staat een nieuwe Expo-update klaar. Werk alleen bij als je dit nu wilt doen.",
      [
        { text: "Later", style: "cancel" },
        {
          text: "Bijwerken",
          onPress: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            } catch {
              Alert.alert("Update mislukt", "De update kon niet worden geladen. De huidige versie blijft actief.");
            }
          },
        },
      ],
    );
  } catch {
    // Updates mogen de admin-app nooit blokkeren. Bij een fout opent de app
    // gewoon met de laatst bekende werkende versie.
  } finally {
    isChecking = false;
  }
}

export function UpdateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    checkForOtaUpdate();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkForOtaUpdate();
    });

    return () => subscription.remove();
  }, []);

  return children;
}
