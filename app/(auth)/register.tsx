import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";
import ScooterIllustration from "../../components/ScooterIllustration";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function RegisterScreen() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [focusedInput, setFocusedInput] = useState<
    "nama" | "email" | "password" | "konfirmasi" | null
  >(null);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    nama: "",
    email: "",
    password: "",
    konfirmasiPassword: "",
  });

  const router = useRouter();

  // Mengukur lebar layar untuk tampilan responsif
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Validasi seluruh input
  const validateForm = () => {
    const newErrors = {
      nama: "",
      email: "",
      password: "",
      konfirmasiPassword: "",
    };

    if (!nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi.";
    } else if (nama.trim().length < 3) {
      newErrors.nama = "Nama minimal 3 karakter.";
    }

    if (!email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 8) {
      newErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (!konfirmasiPassword) {
      newErrors.konfirmasiPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (password !== konfirmasiPassword) {
      newErrors.konfirmasiPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  // Menampilkan pesan
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(
        title,
        message,
        onOk ? [{ text: "OK", onPress: onOk }] : undefined,
      );
    }
  };

  // Proses pendaftaran
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nama: nama.trim(),
          },
        },
      });

      if (error) {
        showAlert("Pendaftaran Gagal", error.message);
        return;
      }

      if (!data.user) {
        showAlert("Gagal", "Akun belum berhasil dibuat.");
        return;
      }

      // Simpan profil jika akun langsung memiliki sesi aktif
      if (data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          nama: nama.trim(),
        });

        if (profileError) {
          showAlert(
            "Peringatan",
            "Akun berhasil dibuat, tetapi profil gagal disimpan: " +
              profileError.message,
          );
          return;
        }

        showAlert("Berhasil", "Akun berhasil dibuat! Silakan masuk.", () =>
          router.replace("/(auth)/login"),
        );
      } else {
        showAlert(
          "Pendaftaran Berhasil",
          "Silakan periksa email untuk melakukan konfirmasi akun sebelum masuk.",
          () => router.replace("/(auth)/login"),
        );
      }
    } catch (error) {
      showAlert("Terjadi Kesalahan", "Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.container, isDesktop && styles.containerDesktop]}
          >
            {/* BAGIAN KIRI - KHUSUS LAPTOP */}
            {isDesktop && (
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeLogo}>ServisKu.</Text>

                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeTitle}>
                    Rawat motormu,
                    {"\n"}
                    mulai dari sini.
                  </Text>

                  <Text style={styles.welcomeSubtitle}>
                    Kelola jadwal perawatan kendaraan dengan lebih mudah dan
                    teratur. Jangan sampai lupa servis lagi!
                  </Text>

                  <View style={styles.illustrationContainer}>
                    <ScooterIllustration />

                    <View style={styles.illustrationText}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#0f6176"
                      />
                      <Text style={styles.illustrationLabel}>
                        Kendaraan terawat, perjalanan nyaman.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* BAGIAN KANAN - FORM REGISTER */}
            <View
              style={[styles.formPanel, isDesktop && styles.formPanelDesktop]}
            >
              <View style={styles.header}>
                {!isDesktop && <Text style={styles.logo}>ServisKu</Text>}

                <Text style={styles.title}>Buat Akun Baru</Text>

                <Text style={styles.subtitle}>
                  Daftar untuk mulai mengelola perawatan motormu.
                </Text>
              </View>

              <View style={styles.form}>
                {/* Nama Lengkap */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama lengkap</Text>

                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === "nama" && styles.inputFocused,
                      errors.nama !== "" && styles.inputError,
                    ]}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor="#94a3b8"
                    value={nama}
                    onChangeText={(text) => {
                      setNama(text);

                      setErrors((prev) => ({
                        ...prev,
                        nama: !text.trim()
                          ? ""
                          : text.trim().length < 3
                            ? "Nama minimal 3 karakter."
                            : "",
                      }));
                    }}
                    autoCapitalize="words"
                    onFocus={() => setFocusedInput("nama")}
                    onBlur={() => setFocusedInput(null)}
                  />

                  {errors.nama !== "" && (
                    <Text style={styles.errorText}>{errors.nama}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>

                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === "email" && styles.inputFocused,
                      errors.email !== "" && styles.inputError,
                    ]}
                    placeholder="nama@email.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                  />

                  {errors.email !== "" && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Kata Sandi */}
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
                      style={styles.passwordInput}
                      placeholder="Minimal 8 karakter"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      underlineColorAndroid="transparent"
                    />

                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
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

                {/* Konfirmasi Kata Sandi */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konfirmasi kata sandi</Text>

                  <View
                    style={[
                      styles.passwordContainer,
                      focusedInput === "konfirmasi" && styles.inputFocused,
                      errors.konfirmasiPassword !== "" && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Ulangi kata sandi"
                      placeholderTextColor="#94a3b8"
                      value={konfirmasiPassword}
                      onChangeText={setKonfirmasiPassword}
                      secureTextEntry={!showKonfirmasi}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput("konfirmasi")}
                      onBlur={() => setFocusedInput(null)}
                      underlineColorAndroid="transparent"
                    />

                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowKonfirmasi(!showKonfirmasi)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          showKonfirmasi ? "eye-off-outline" : "eye-outline"
                        }
                        size={21}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>

                  {errors.konfirmasiPassword !== "" && (
                    <Text style={styles.errorText}>
                      {errors.konfirmasiPassword}
                    </Text>
                  )}
                </View>

                {/* Tombol Daftar */}
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Buat Akun</Text>
                  )}
                </Pressable>
              </View>

              {/* Link Login */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Sudah punya akun?</Text>

                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text style={styles.linkText}>Masuk</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },

  // Container utama
  container: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  containerDesktop: {
    maxWidth: 1100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 64,
  },

  // Bagian kiri desktop
  welcomeSection: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 520,
    paddingVertical: 25,
  },

  welcomeLogo: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#0f766e",
  },

  welcomeContent: {
    gap: 20,
  },

  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    lineHeight: 54,
    color: "#0f172a",
  },

  welcomeSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: "#64748b",
    maxWidth: 430,
  },

  illustrationContainer: {
    backgroundColor: "#E0F2FE",
    borderRadius: 28,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 20,
  },

  illustrationText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
  },

  illustrationLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#135567",
  },

  welcomeFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#94a3b8",
  },

  // Bagian kanan desktop dan form HP
  formPanel: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  formPanelDesktop: {
    width: 460,
    maxWidth: 460,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 36,
  },

  header: {
    marginBottom: 28,
  },

  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0f766e",
    marginBottom: 22,
  },

  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    color: "#0f172a",
    marginBottom: 8,
  },

  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 21,
  },

  form: {
    gap: 17,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#334155",
  },

  input: {
    fontFamily: "Inter_400Regular",
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    ...(Platform.OS === "web" && {
      outlineWidth: 0,
      outlineStyle: "none",
    }),
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },

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

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  inputFocused: {
    borderColor: "#0f766e",
    borderWidth: 1.5,
  },

  inputError: {
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },

  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#DC2626",
    marginTop: 5,
    marginLeft: 4,
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

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    fontSize: 15,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 28,
  },

  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748b",
  },

  linkText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0f766e",
  },
});
