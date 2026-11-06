
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          if (session) {
            router.replace("/(tabs)");
          } else {
            router.replace("/(auth)/login");
          }
        }
      } catch (error) {
        console.error("Gagal memeriksa sesi:", error);

        if (isMounted) {
          router.replace("/(auth)/login");
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <ActivityIndicator size="large" color="#0f766e" />
    </View>
  );
}
