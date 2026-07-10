import { useEffect } from "react";
import type { ReactNode } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

type ApkUpdateManifest = {
  latestVersion: string;
  apkUrl: string;
  title?: string;
  message?: string;
  releaseNotes?: string[];
};

const DEFAULT_MANIFEST_URL =
  "https://cuddling-memories-fotografie.netlify.app/admin-app/android-version.json";

const manifestUrl =
  Constants.expoConfig?.extra?.apkUpdateManifestUrl ?? DEFAULT_MANIFEST_URL;

let isChecking = false;

function normalizeVersion(version: string) {
  return version
    .split(".")
    .map((part) => Number.parseInt(part.replace(/\D/g, ""), 10) || 0);
}

function isNewerVersion(latestVersion: string, currentVersion: string) {
  const latest = normalizeVersion(latestVersion);
  const current = normalizeVersion(currentVersion);
  const length = Math.max(latest.length, current.length);

  for (let index = 0; index < length; index += 1) {
    const latestPart = latest[index] ?? 0;
    const currentPart = current[index] ?? 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

async function checkForApkUpdate() {
  if (__DEV__) return;
  if (Platform.OS !== "android") return;
  if (isChecking) return;

  isChecking = true;

  try {
    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
    const response = await fetch(`${manifestUrl}?t=${Date.now()}`);
    if (!response.ok) return;

    const manifest = (await response.json()) as ApkUpdateManifest;
    if (!manifest.latestVersion || !manifest.apkUrl) return;
    if (!isNewerVersion(manifest.latestVersion, currentVersion)) return;

    const dismissedKey = `apk-update-dismissed:${manifest.latestVersion}`;
    const dismissed = await AsyncStorage.getItem(dismissedKey);
    if (dismissed === "true") return;

    const notes = manifest.releaseNotes?.length
      ? `\n\nNieuw:\n${manifest.releaseNotes.map((note) => `- ${note}`).join("\n")}`
      : "";

    Alert.alert(
      manifest.title ?? "Nieuwe app-versie beschikbaar",
      manifest.message ??
        `Er is een nieuwe APK-versie beschikbaar. Download de update en druk daarna in Android op Installeren of Bijwerken.${notes}`,
      [
        {
          text: "Later",
          style: "cancel",
          onPress: () => {
            AsyncStorage.setItem(dismissedKey, "true").catch(() => {});
          },
        },
        {
          text: "Download update",
          onPress: () => {
            Linking.openURL(manifest.apkUrl).catch(() => {});
          },
        },
      ],
    );
  } catch {
    // Een mislukte versiecheck mag de admin-app nooit blokkeren.
  } finally {
    isChecking = false;
  }
}

export function ApkUpdateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    checkForApkUpdate();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkForApkUpdate();
    });

    return () => subscription.remove();
  }, []);

  return children;
}
