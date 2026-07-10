import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { styles } from "../styles";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin app startfout", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.centerPadded}>
        <Text style={styles.title}>App kon niet starten</Text>
        <Text style={styles.body}>
          Er ging iets mis bij het laden van de admin-app. Sluit de app helemaal af en open hem opnieuw.
        </Text>
        <Text style={styles.error}>{this.state.error.message}</Text>
      </View>
    );
  }
}
