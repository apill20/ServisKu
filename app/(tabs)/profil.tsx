import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

export default function ProfilScreen() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [detailProfilVisible, setDetailProfilVisible] = useState(false);
  const [detailPasswordVisible, setDetailPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState("");

  const [editVisible, setEditVisible] = useState(false);
  const [namaBaru, setNamaBaru] = useState("");
  const [emailBaru, setEmailBaru] = useState("");
  const [savingProfil, setSavingProfil] = useState(false);
  const [errorProfil, setErrorProfil] = useState("");
  const [pesanProfil, setPesanProfil] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [pesanPassword, setPesanPassword] = useState("");

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const namaInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const [validasiNama, setValidasiNama] = useState("");
  const [validasiEmail, setValidasiEmail] = useState("");
  const [validasiPassword, setValidasiPassword] = useState("");
  const [validasiKonfirmasi, setValidasiKonfirmasi] = useState("");

  const webInputStyle =
    Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : undefined;

  const fetchProfil = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (data.user) {
        setNama(data.user.user_metadata?.nama || "Pengguna ServisKu");
        setEmail(data.user.email || "");
      }
    } catch (error: any) {
      console.log("Gagal mengambil profil:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfil();
    }, []),
  );

  const bukaDetailProfil = () => {
    setDetailProfilVisible(true);
  };

  const bukaEditProfil = () => {
    setNamaBaru(nama);
    setEmailBaru(email);
    setErrorProfil("");
    setPesanProfil("");
    setFocusedInput("");
    setDetailProfilVisible(false);
    setEditVisible(true);
  };

  const handleSimpanProfil = async () => {
    const namaBersih = namaBaru.trim();
    const emailBersih = emailBaru.trim();
    const emailBerubah = emailBersih.toLowerCase() !== email.toLowerCase();

    if (!namaBersih) {
      setErrorProfil("Nama tidak boleh kosong.");
      return;
    }

    if (!emailBersih || !emailBersih.includes("@")) {
      setErrorProfil("Masukkan alamat email yang valid.");
      return;
    }

    try {
      setSavingProfil(true);
      setErrorProfil("");
      setPesanProfil("");

      const { error } = await supabase.auth.updateUser({
        ...(emailBerubah ? { email: emailBersih } : {}),
        data: { nama: namaBersih },
      });

      if (error) throw error;

      setNama(namaBersih);

      if (emailBerubah) {
        setPesanProfil(
          "Nama berhasil diperbarui. Periksa email baru untuk konfirmasi perubahan alamat email.",
        );
      } else {
        setEmail(emailBersih);
        setPesanProfil("Profil berhasil diperbarui.");
      }

      setTimeout(() => {
        setEditVisible(false);
        setPesanProfil("");
      }, 1800);
    } catch (error: any) {
      setErrorProfil(error.message || "Gagal memperbarui profil.");
    } finally {
      setSavingProfil(false);
    }
  };

  const bukaDetailPassword = () => {
    setDetailPasswordVisible(true);
  };

  const bukaUbahPassword = () => {
    setPasswordBaru("");
    setKonfirmasiPassword("");
    setErrorPassword("");
    setPesanPassword("");
    setFocusedInput("");
    setDetailPasswordVisible(false);
    setPasswordVisible(true);
  };

  const handleSimpanPassword = async () => {
    if (!passwordBaru || !konfirmasiPassword) {
      setErrorPassword("Semua kolom password wajib diisi.");
      return;
    }

    if (passwordBaru.length < 6) {
      setErrorPassword("Password minimal terdiri dari 6 karakter.");
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setErrorPassword("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setSavingPassword(true);
      setErrorPassword("");
      setPesanPassword("");

      const { error } = await supabase.auth.updateUser({
        password: passwordBaru,
      });

      if (error) throw error;

      setPesanPassword("Password berhasil diperbarui.");

      setTimeout(() => {
        setPasswordVisible(false);
        setPesanPassword("");
      }, 1500);
    } catch (error: any) {
      setErrorPassword(error.message || "Gagal memperbarui password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setLogoutError("");

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setLogoutVisible(false);
      router.replace("/(auth)/login");
    } catch (error: any) {
      setLogoutError(error.message || "Gagal keluar dari akun.");
    } finally {
      setLoggingOut(false);
    }
  };

  const tutupSemuaModal = () => {
    setDetailProfilVisible(false);
    setDetailPasswordVisible(false);
    setEditVisible(false);
    setPasswordVisible(false);
    setLogoutVisible(false);
    setFocusedInput("");
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, danger && styles.dangerIcon]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#DC2626" : "#0F766E"}
        />
      </View>

      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );

  const ModalHeader = ({
    title,
    onClose,
  }: {
    title: string;
    onClose: () => void;
  }) => (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <Pressable onPress={onClose} hitSlop={10}>
        <Ionicons name="close" size={23} color="#64748B" />
      </Pressable>
    </View>
  );

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    focusKey,
    icon,
    inputRef,
    nextInputRef,
    secureTextEntry = false,
    showPasswordToggle = false,
    showPasswordValue = false,
    onTogglePassword,
    keyboardType = "default",
    autoCapitalize = "sentences",
    error = "",
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    focusKey: string;
    icon: keyof typeof Ionicons.glyphMap;
    inputRef?: React.RefObject<TextInput | null>;
    nextInputRef?: React.RefObject<TextInput | null>;
    secureTextEntry?: boolean;
    showPasswordToggle?: boolean;
    showPasswordValue?: boolean;
    onTogglePassword?: () => void;
    keyboardType?: any;
    autoCapitalize?: any;
    error?: string;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          focusedInput === focusKey && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <Ionicons name={icon} size={19} color="#64748B" />

        <TextInput
          ref={inputRef}
          style={[styles.input, webInputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry && !showPasswordValue}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={nextInputRef ? "next" : "done"}
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (nextInputRef) {
              nextInputRef.current?.focus();
            } else {
              setFocusedInput("");
            }
          }}
          onFocus={() => setFocusedInput(focusKey)}
          onBlur={() => setFocusedInput("")}
        />

        {showPasswordToggle && (
          <Pressable
            onPress={onTogglePassword}
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPasswordValue ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#64748B"
            />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profil</Text>
          <Text style={styles.pageSubtitle}>
            Kelola informasi akun ServisKu kamu.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color="#0F766E" />
          </View>

          <Text style={styles.profileName}>{nama}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          <View style={styles.accountBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#0F766E" />
            <Text style={styles.accountBadgeText}>Akun ServisKu</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pengaturan Akun</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="person-circle-outline"
            title="Informasi Akun"
            subtitle="Lihat dan ubah informasi akun"
            onPress={bukaDetailProfil}
          />

          <View style={styles.menuDivider} />

          <MenuItem
            icon="lock-closed-outline"
            title="Ubah Password"
            subtitle="Kelola keamanan akun kamu"
            onPress={bukaDetailPassword}
          />
        </View>

        <Text style={styles.sectionTitle}>Tentang</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="information-circle-outline"
            title="Tentang ServisKu"
            subtitle="Informasi mengenai aplikasi"
            onPress={() => router.push("/tentang" as any)}
          />
        </View>

        <Text style={styles.sectionTitle}>Lainnya</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            title="Keluar dari Akun"
            subtitle="Keluar dari akun ServisKu"
            danger
            onPress={() => {
              setLogoutError("");
              setLogoutVisible(true);
            }}
          />
        </View>

        <Text style={styles.versionText}>ServisKu • Versi 1.0.0</Text>
      </ScrollView>

      {/* MODAL DETAIL PROFIL */}
      <Modal
        visible={detailProfilVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setDetailProfilVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDetailProfilVisible(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <ModalHeader
              title="Informasi Akun"
              onClose={() => setDetailProfilVisible(false)}
            />

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="person-outline" size={20} color="#0F766E" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Nama Lengkap</Text>
                <Text style={styles.detailValue}>{nama}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="mail-outline" size={20} color="#0F766E" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Alamat Email</Text>
                <Text style={styles.detailValue}>{email}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { marginTop: 8 },
                pressed && styles.buttonPressed,
              ]}
              onPress={bukaEditProfil}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Edit Profil</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL EDIT PROFIL */}
      <Modal
        visible={editVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardWrapper}
          >
            <View style={styles.editProfileSheet}>
              <View style={styles.sheetHandle} />
              <ModalHeader
                title="Edit Profil"
                onClose={() => setEditVisible(false)}
              />

              {renderInput({
                label: "Nama Lengkap",
                value: namaBaru,
                onChangeText: (value) => {
                  setNamaBaru(value);
                  setValidasiNama(
                    value.trim() ? "" : "Nama tidak boleh kosong.",
                  );
                },
                placeholder: "Masukkan nama lengkap",
                focusKey: "nama",
                icon: "person-outline",
                inputRef: namaInputRef,
                nextInputRef: emailInputRef,
                error: validasiNama,
              })}

              {renderInput({
                label: "Alamat Email",
                value: emailBaru,
                onChangeText: (value) => {
                  setEmailBaru(value);
                  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
                  setValidasiEmail(
                    value.trim() && !valid ? "Format email belum valid." : "",
                  );
                },
                placeholder: "Masukkan alamat email",
                focusKey: "email",
                icon: "mail-outline",
                inputRef: emailInputRef,
                keyboardType: "email-address",
                autoCapitalize: "none",
                error: validasiEmail,
              })}

              {errorProfil ? (
                <Text style={styles.errorText}>{errorProfil}</Text>
              ) : null}

              {pesanProfil ? (
                <Text style={styles.successText}>{pesanProfil}</Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { marginTop: 8 },
                  pressed && styles.buttonPressed,
                  savingProfil && styles.buttonDisabled,
                ]}
                onPress={handleSimpanProfil}
                disabled={savingProfil}
              >
                {savingProfil ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Simpan Perubahan</Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL DETAIL PASSWORD */}
      <Modal
        visible={detailPasswordVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setDetailPasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDetailPasswordVisible(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <ModalHeader
              title="Keamanan Akun"
              onClose={() => setDetailPasswordVisible(false)}
            />

            <View style={styles.infoPanel}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={25}
                  color="#0F766E"
                />
              </View>
              <Text style={styles.infoTitle}>Jaga Keamanan Akunmu</Text>
              <Text style={styles.infoDescription}>
                Gunakan password yang kuat dan jangan membagikannya kepada orang
                lain. Kamu dapat mengganti password akun kapan saja.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={bukaUbahPassword}
            >
              <Ionicons name="key-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ubah Password</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL UBAH PASSWORD */}
      <Modal
        visible={passwordVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setPasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPasswordVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardWrapper}
          >
            <View style={styles.passwordSheet}>
              <View style={styles.sheetHandle} />
              <ModalHeader
                title="Ubah Password"
                onClose={() => setPasswordVisible(false)}
              />

              {renderInput({
                label: "Password Baru",
                value: passwordBaru,
                onChangeText: (value) => {
                  setPasswordBaru(value);

                  setValidasiPassword(
                    value.length > 0 && value.length < 6
                      ? "Password minimal 6 karakter."
                      : "",
                  );

                  if (konfirmasiPassword) {
                    setValidasiKonfirmasi(
                      value !== konfirmasiPassword
                        ? "Konfirmasi password tidak sama."
                        : "",
                    );
                  }
                },
                placeholder: "Masukkan password baru",
                focusKey: "password",
                icon: "lock-closed-outline",
                inputRef: passwordInputRef,
                nextInputRef: confirmPasswordInputRef,
                secureTextEntry: true,
                showPasswordToggle: true,
                showPasswordValue: showPassword,
                onTogglePassword: () => setShowPassword(!showPassword),
                autoCapitalize: "none",
                error: validasiPassword,
              })}

              {renderInput({
                label: "Konfirmasi Password",
                value: konfirmasiPassword,
                onChangeText: (value) => {
                  setKonfirmasiPassword(value);

                  setValidasiKonfirmasi(
                    value && value !== passwordBaru
                      ? "Konfirmasi password tidak sama."
                      : "",
                  );
                },
                placeholder: "Masukkan ulang password",
                focusKey: "konfirmasi",
                icon: "lock-closed-outline",
                inputRef: confirmPasswordInputRef,
                secureTextEntry: true,
                showPasswordToggle: true,
                showPasswordValue: showConfirmPassword,
                onTogglePassword: () =>
                  setShowConfirmPassword(!showConfirmPassword),
                autoCapitalize: "none",
                error: validasiKonfirmasi,
              })}

              <Text style={styles.helperText}>
                Password harus terdiri dari minimal 6 karakter.
              </Text>

              {errorPassword ? (
                <Text style={styles.errorText}>{errorPassword}</Text>
              ) : null}

              {pesanPassword ? (
                <Text style={styles.successText}>{pesanPassword}</Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { marginTop: 8 },
                  pressed && styles.buttonPressed,
                  savingPassword && styles.buttonDisabled,
                ]}
                onPress={handleSimpanPassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Simpan Password</Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL LOGOUT */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={28} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>Keluar dari Akun?</Text>
            <Text style={styles.confirmDescription}>
              Apakah kamu yakin ingin keluar dari akun ServisKu?
            </Text>

            {logoutError ? (
              <Text style={styles.errorText}>{logoutError}</Text>
            ) : null}

            <View style={styles.confirmActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setLogoutVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                  loggingOut && styles.buttonDisabled,
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.logoutButtonText}>Ya, Keluar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2F2",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  pageHeader: {
    backgroundColor: "#E0F2F2",
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 22,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#0F172A",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },
  profileCard: {
    backgroundColor: "#E0F2F2",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginTop: 13,
    gap: 5,
  },
  accountBadgeText: {
    color: "#0F766E",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 11,
    marginTop: 5,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 12,
  },
  menuItemPressed: {
    opacity: 0.65,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIcon: {
    backgroundColor: "#FEF2F2",
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  dangerText: {
    color: "#DC2626",
  },
  menuSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  keyboardWrapper: {
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 50,
    maxHeight: "90%",
  },
  editProfileSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 25,
  },
  passwordSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 25,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: "#0F766E",
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    color: "#0F172A",
    fontSize: 14,
    borderWidth: 0,
    backgroundColor: "transparent",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : {}),
  },
  helperText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: -5,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 48,
    backgroundColor: "#0F766E",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 17,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 8,
    lineHeight: 18,
  },
  successText: {
    fontSize: 12,
    color: "#0F766E",
    marginTop: 8,
    lineHeight: 18,
  },
  infoPanel: {
    backgroundColor: "#F0FDFA",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 19,
    textAlign: "center",
  },
  confirmCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 22,
    marginBottom: "auto",
    marginTop: "auto",
    borderRadius: 20,
    padding: 23,
    alignItems: "center",
  },
  logoutIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  confirmDescription: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  logoutButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputError: {
    borderColor: "#DC2626",
  },

  fieldError: {
    fontSize: 11,
    color: "#DC2626",
    marginTop: 5,
    marginLeft: 2,
  },

  eyeButton: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
