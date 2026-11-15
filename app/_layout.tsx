
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

// Mengatur tampilan notifikasi ketika aplikasi sedang terbuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Membuat kanal khusus notifikasi Android
  useEffect(() => {
    const buatKanalNotifikasi = async () => {
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync(
            "pengingat-servisku",
            {
              name: "Pengingat ServisKu",
              description: "Notifikasi pengingat perawatan kendaraan",
              importance: Notifications.AndroidImportance.HIGH,
              sound: "default",
              vibrationPattern: [0, 250, 250, 250],
              enableVibrate: true,
              lightColor: "#0F766E",
            },
          );
        } catch (error) {
          console.error("Gagal membuat kanal notifikasi:", error);
        }
      }
    };

    buatKanalNotifikasi();
  }, []);

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: true,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
