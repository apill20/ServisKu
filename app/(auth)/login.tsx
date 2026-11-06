//app/(auth)/login.tsx
import React, { useState, useRef } from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import ScooterIllustration from "../../components/ScooterIllustration";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const router = useRouter();

  // Validasi email
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email wajib diisi.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "Format email tidak valid.";
    }

    return "";
  };

  // Validasi password
  const validatePassword = (value: string) => {
    if (!value) {
      return "Kata sandi wajib diisi.";
    }

    return "";
  };

  // Periksa semua input
  const validateForm = () => {
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(newErrors);

    return !newErrors.email && !newErrors.password;
  };

  // Notifikasi untuk Web dan Android/iOS
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Proses login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showAlert(
          "Login Gagal",
          "Email atau kata sandi tidak sesuai, atau akun belum terdaftar. Periksa kembali data yang kamu masukkan. Jika belum memiliki akun, silakan daftar terlebih dahulu.",
        );
        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      showAlert("Terjadi Kesalahan", "Tidak dapat masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          {/* Header Area */}
          <View style={styles.headerContainer}>
            <View style={styles.illustrationWrapper}>
              <ScooterIllustration width={210} height={120} />
            </View>

            <Text style={styles.brandTitle}>ServisKu</Text>

            <Text style={styles.brandSubtitle}>
              Catat servis, pantau jadwal perawatan
            </Text>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Masuk</Text>

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                ref={emailInputRef}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                style={[
                  styles.input,
                  focusedInput === "email" && styles.inputFocused,
                  errors.email !== "" && styles.inputError,
                ]}
                placeholder="nama@email.com"
                placeholderTextColor="#a0aec0"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);

                  if (errors.email !== "") {
                    setErrors((prev) => ({
                      ...prev,
                      email: validateEmail(text),
                    }));
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput("email")}
                onBlur={() => {
                  setFocusedInput(null);
                  setErrors((prev) => ({
                    ...prev,
                    email: validateEmail(email),
                  }));
                }}
              />

              {errors.email !== "" && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata sandi</Text>

              <View
                style={[
                  styles.passwordContainer,
                  focusedInput === "password" && styles.inputFocused,
                  errors.password !== "" && styles.inputError,
                ]}
              >
                <TextInput
                  ref={passwordInputRef}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  style={styles.passwordInput}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor="#a0aec0"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);

                    if (errors.password !== "") {
                      setErrors((prev) => ({
                        ...prev,
                        password: validatePassword(text),
                      }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => {
                    setFocusedInput(null);
                    setErrors((prev) => ({
                      ...prev,
                      password: validatePassword(password),
                    }));
                  }}
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {errors.password !== "" && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Tombol Login */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Masuk</Text>
              )}
            </Pressable>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Belum punya akun?</Text>

              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.linkText}>Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={34} color="#DC2626" />
            </View>

            <Text style={styles.alertTitle}>{alertTitle}</Text>

            <Text style={styles.alertMessage}>{alertMessage}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.alertButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>Mengerti</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Input Email
  input: {
    fontFamily: "Inter_400Regular",
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    ...(Platform.OS === "web" && {
      outlineWidth: 0,
      outlineStyle: "none",
    }),
  },

  // Container Password
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  // TextInput Password
  passwordInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 0,
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : {}),
  },

  // Tombol ikon mata
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // Efek fokus
  inputFocused: {
    borderColor: "#0f766e",
  },

  // Efek error
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },

  // Teks error
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#DC2626",
    marginTop: 5,
    marginLeft: 4,
  },

  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  headerContainer: {
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
    paddingBottom: 24,
  },

  illustrationWrapper: {
    marginBottom: 8,
    alignItems: "center",
  },

  brandTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#0d6b65",
    textAlign: "center",
  },

  brandSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },

  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    backgroundColor: "#ffffff",
  },

  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    color: "#16324f",
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#334155",
    marginBottom: 6,
  },

  button: {
    backgroundColor: "#0f766e",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
  },

  buttonPressed: {
    backgroundColor: "#115E59",
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    fontSize: 15,
  },

  footer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },

  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },

  linkText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0f766e",
  },

  // Background notifikasi
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  // Kotak notifikasi
  alertContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  // Ikon
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  // Judul
  alertTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },

  // Pesan
  alertMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 22,
  },

  // Tombol
  alertButton: {
    width: "100%",
    backgroundColor: "#0f766e",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },

  alertButtonPressed: {
    backgroundColor: "#115E59",
    opacity: 0.85,
  },

  alertButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#ffffff",
  },
});
