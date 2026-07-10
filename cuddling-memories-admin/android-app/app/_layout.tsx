import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ApkUpdateProvider } from "../src/providers/ApkUpdateProvider";
import { UpdateProvider } from "../src/providers/UpdateProvider";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <UpdateProvider>
        <ApkUpdateProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </ApkUpdateProvider>
      </UpdateProvider>
    </AppErrorBoundary>
  );
}
