//app/tambah-kendaraan.tsx
import React, { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import ScooterIllustration from "../components/ScooterIllustration";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

type JenisMotor = "Matic" | "Manual" | "Semi otomatis";

type KomponenPerawatan = {
  nama_komponen: string;
  interval_km: number;
  interval_bulan: number;
};

const DAFTAR_KOMPONEN: KomponenPerawatan[] = [
  { nama_komponen: "Oli Mesin", interval_km: 2000, interval_bulan: 2 },
  { nama_komponen: "Filter Udara", interval_km: 6000, interval_bulan: 6 },
  { nama_komponen: "Kampas Rem", interval_km: 10000, interval_bulan: 12 },
  { nama_komponen: "Rantai", interval_km: 4000, interval_bulan: 3 },
];

export default function TambahKendaraanScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const namaMotorRef = useRef<TextInput>(null);
  const merekRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const nomorPolisiRef = useRef<TextInput>(null);
  const tahunRef = useRef<TextInput>(null);
  const odometerRef = useRef<TextInput>(null);
  const tanggalServisRef = useRef<TextInput>(null);

  // Data kendaraan
  const [namaMotor, setNamaMotor] = useState("");
  const [merek, setMerek] = useState("");
  const [model, setModel] = useState("");
  const [nomorPolisi, setNomorPolisi] = useState("");
  const [jenisMotor, setJenisMotor] = useState<JenisMotor | "">("");
  const [tahun, setTahun] = useState("");
  const [odometer, setOdometer] = useState("");
  const [tanggalServis, setTanggalServis] = useState("");
  const [komponenTerpilih, setKomponenTerpilih] = useState<string[]>([]);

  // Status form
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validasi
  const [errors, setErrors] = useState({
    namaMotor: "",
    merek: "",
    model: "",
    nomorPolisi: "",
    tahun: "",
    odometer: "",
    tanggalServis: "",
  });

  // Modal notifikasi
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "error",
  );
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  const showAlert = (
    title: string,
    message: string,
    onOk?: () => void,
    type: "success" | "error" | "info" = "error",
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => onOk ?? null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);

    if (modalAction) {
      modalAction();
    }

    setModalAction(null);
  };

  const toggleKomponen = (namaKomponen: string) => {
    setKomponenTerpilih((selected) =>
      selected.includes(namaKomponen)
        ? selected.filter((nama) => nama !== namaKomponen)
        : [...selected, namaKomponen],
    );
  };

  // Validasi tanggal YYYY-MM-DD
  const validateTanggal = (value: string) => {
    if (!value.trim()) {
      return "";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return "Gunakan format tanggal YYYY-MM-DD.";
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "Tanggal tidak valid.";
    }

    return "";
  };

  // Validasi seluruh form
  const validateForm = () => {
    const newErrors = {
      namaMotor: "",
      merek: "",
      model: "",
      nomorPolisi: "",
      tahun: "",
      odometer: "",
      tanggalServis: "",
    };

    if (!namaMotor.trim()) {
      newErrors.namaMotor = "Nama kendaraan wajib diisi.";
    }

    if (!merek.trim()) {
      newErrors.merek = "Merek motor wajib diisi.";
    }

    if (!model.trim()) {
      newErrors.model = "Model motor wajib diisi.";
    }

    if (!nomorPolisi.trim()) {
      newErrors.nomorPolisi = "Nomor polisi wajib diisi.";
    }

    if (tahun.trim()) {
      const tahunAngka = Number(tahun);

      if (
        !Number.isInteger(tahunAngka) ||
        tahunAngka < 1900 ||
        tahunAngka > 2100
      ) {
        newErrors.tahun = "Masukkan tahun kendaraan yang valid.";
      }
    }

    if (!odometer.trim()) {
      newErrors.odometer = "Odometer terbaru wajib diisi.";
    } else if (!Number.isInteger(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = "Odometer harus berupa angka yang valid.";
    }

    newErrors.tanggalServis = validateTanggal(tanggalServis);

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  // Simpan kendaraan ke Supabase
  const handleSimpan = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Ambil pengguna yang sedang login
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        showAlert(
          "Sesi Berakhir",
          "Silakan masuk kembali untuk menambahkan kendaraan.",
          () => router.replace("/(auth)/login"),
          "info",
        );
        return;
      }

      const komponenUntukDisimpan = DAFTAR_KOMPONEN.filter((komponen) =>
        komponenTerpilih.includes(komponen.nama_komponen),
      );

      const { error } = await supabase.rpc("tambah_kendaraan_lengkap", {
        p_nama_motor: namaMotor.trim(),
        p_model: model.trim(),
        p_odometer_awal: Number(odometer),
        p_merek: merek.trim(),
        p_nomor_polisi: nomorPolisi.trim().toUpperCase(),
        p_jenis_motor: jenisMotor || null,
        p_tahun: tahun.trim() ? Number(tahun) : null,
        p_tanggal_servis_terakhir: tanggalServis.trim() || null,
        p_komponen: komponenUntukDisimpan,
      });

      if (error) {
        console.error("Gagal menyimpan kendaraan:", error);

        showAlert(
          "Gagal Menambahkan Kendaraan",
          "Data kendaraan belum berhasil disimpan. Silakan coba lagi.",
        );
        return;
      }

      showAlert(
        "Berhasil!",
        "Kendaraan berhasil ditambahkan.",
        () => router.replace("/(tabs)"),
        "success",
      );
    } catch (error) {
      console.error("Kesalahan:", error);

      showAlert(
        "Terjadi Kesalahan",
        "Tidak dapat menyimpan kendaraan. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Komponen input
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    field: string,
    error: string,
    options: {
      keyboardType?: "default" | "numeric";
      optional?: boolean;
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      inputRef?: React.RefObject<TextInput | null>;
      nextRef?: React.RefObject<TextInput | null>;
      isLast?: boolean;
    } = {},
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {options.optional && <Text style={styles.optionalText}>Opsional</Text>}
      </View>

      <TextInput
        style={[
          styles.input,
          focusedInput === field && styles.inputFocused,
          error !== "" && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        ref={options.inputRef}
        returnKeyType={options.isLast ? "done" : "next"}
        blurOnSubmit={options.isLast ?? false}
        onSubmitEditing={() => {
          if (options.nextRef) {
            options.nextRef.current?.focus();
          } else if (options.isLast) {
            handleSimpan();
          }
        }}
        onChangeText={onChangeText}
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.autoCapitalize || "sentences"}
        onFocus={() => setFocusedInput(field)}
        onBlur={() => setFocusedInput(null)}
      />

      {error !== "" && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

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
            {/* Bagian ilustrasi desktop */}
            {isDesktop && (
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeLogo}>ServisKu.</Text>

                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeTitle}>
                    Kenali motormu,
                    {"\n"}
                    rawat dengan mudah.
                  </Text>

                  <Text style={styles.welcomeSubtitle}>
                    Tambahkan kendaraan pribadimu untuk mulai mencatat dan
                    memantau jadwal perawatannya.
                  </Text>

                  <View style={styles.illustrationContainer}>
                    <ScooterIllustration width={230} height={140} />

                    <View style={styles.illustrationText}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#0f6176"
                      />
                      <Text style={styles.illustrationLabel}>
                        Satu tempat untuk perawatan motormu.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Panel form */}
            <View
              style={[styles.formPanel, isDesktop && styles.formPanelDesktop]}
            >
              <View style={styles.header}>
                {!isDesktop && (
                  <View style={styles.mobileHeader}>
                    <Pressable
                      onPress={() => router.back()}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={21} color="#0f766e" />
                    </Pressable>

                    <Text style={styles.logo}>ServisKu</Text>
                  </View>
                )}

                <Text style={styles.title}>Tambah Kendaraan</Text>

                <Text style={styles.subtitle}>
                  Lengkapi informasi motor yang ingin kamu rawat.
                </Text>
              </View>

              <View style={styles.form}>
                {/* Nama kendaraan */}
                {renderInput(
                  "Nama kendaraan",
                  namaMotor,
                  (text) => {
                    setNamaMotor(text);
                    setErrors((prev) => ({ ...prev, namaMotor: "" }));
                  },
                  "Contoh: Motor Kampus",
                  "namaMotor",
                  errors.namaMotor,
                  { inputRef: namaMotorRef, nextRef: merekRef },
                )}

                {/* Merek */}
                {renderInput(
                  "Merek motor",
                  merek,
                  (text) => {
                    setMerek(text);
                    setErrors((prev) => ({ ...prev, merek: "" }));
                  },
                  "Contoh: Honda",
                  "merek",
                  errors.merek,
                  {
                    autoCapitalize: "words",
                    inputRef: merekRef,
                    nextRef: modelRef,
                  },
                )}

                {/* Model */}
                {renderInput(
                  "Model motor",
                  model,
                  (text) => {
                    setModel(text);
                    setErrors((prev) => ({ ...prev, model: "" }));
                  },
                  "Contoh: Vario 160",
                  "model",
                  errors.model,
                  { inputRef: modelRef, nextRef: nomorPolisiRef },
                )}

                {/* Nomor polisi */}
                {renderInput(
                  "Nomor polisi",
                  nomorPolisi,
                  (text) => {
                    setNomorPolisi(text.toUpperCase());
                    setErrors((prev) => ({ ...prev, nomorPolisi: "" }));
                  },
                  "Contoh: G 1234 AB",
                  "nomorPolisi",
                  errors.nomorPolisi,
                  { autoCapitalize: "characters", inputRef: nomorPolisiRef },
                )}

                {/* Jenis motor */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Jenis motor</Text>
                    <Text style={styles.optionalText}>Opsional</Text>
                  </View>

                  <View style={styles.optionContainer}>
                    {(["Matic", "Manual", "Semi otomatis"] as JenisMotor[]).map(
                      (jenis) => (
                        <Pressable
                          key={jenis}
                          style={[
                            styles.optionButton,
                            jenisMotor === jenis && styles.optionButtonActive,
                          ]}
                          onPress={() =>
                            setJenisMotor(jenisMotor === jenis ? "" : jenis)
                          }
                        >
                          <Text
                            style={[
                              styles.optionText,
                              jenisMotor === jenis && styles.optionTextActive,
                            ]}
                          >
                            {jenis}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>

                {/* Tahun */}
                {renderInput(
                  "Tahun kendaraan",
                  tahun,
                  (text) => {
                    setTahun(text.replace(/[^0-9]/g, ""));
                    setErrors((prev) => ({ ...prev, tahun: "" }));
                  },
                  "Contoh: 2022",
                  "tahun",
                  errors.tahun,
                  {
                    keyboardType: "numeric",
                    optional: true,
                    inputRef: tahunRef,
                    nextRef: odometerRef,
                  },
                )}

                {/* Odometer */}
                {renderInput(
                  "Odometer terbaru",
                  odometer,
                  (text) => {
                    setOdometer(text.replace(/[^0-9]/g, ""));
                    setErrors((prev) => ({ ...prev, odometer: "" }));
                  },
                  "Contoh: 12500",
                  "odometer",
                  errors.odometer,
                  {
                    keyboardType: "numeric",
                    inputRef: odometerRef,
                    nextRef: tanggalServisRef,
                  },
                )}

                <Text style={styles.helperText}>
                  Masukkan jarak tempuh motor saat ini dalam kilometer.
                </Text>

                {/* Tanggal servis terakhir */}
                {renderInput(
                  "Tanggal servis terakhir",
                  tanggalServis,
                  (text) => {
                    setTanggalServis(text);
                    setErrors((prev) => ({ ...prev, tanggalServis: "" }));
                  },
                  "YYYY-MM-DD, contoh: 2026-10-15",
                  "tanggalServis",
                  errors.tanggalServis,
                  { optional: true, inputRef: tanggalServisRef },
                )}

                <Text style={styles.helperText}>
                  Kosongkan jika belum pernah mencatat tanggal servis terakhir.
                </Text>

                {/* Komponen perawatan opsional */}
                <View style={styles.componentSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Komponen Perawatan</Text>
                    <Text style={styles.optionalText}>Opsional</Text>
                  </View>

                  <View style={styles.componentOptions}>
                    {DAFTAR_KOMPONEN.map((komponen) => {
                      const selected = komponenTerpilih.includes(
                        komponen.nama_komponen,
                      );

                      return (
                        <Pressable
                          key={komponen.nama_komponen}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          onPress={() => toggleKomponen(komponen.nama_komponen)}
                          style={({ pressed }) => [
                            styles.componentOption,
                            selected && styles.componentOptionSelected,
                            pressed && styles.componentOptionPressed,
                          ]}
                        >
                          <Ionicons
                            name={
                              selected
                                ? "checkmark-circle"
                                : "ellipse-outline"
                            }
                            size={19}
                            color={selected ? "#0F766E" : "#94A3B8"}
                          />
                          <Text
                            style={[
                              styles.componentOptionText,
                              selected && styles.componentOptionTextSelected,
                            ]}
                          >
                            {komponen.nama_komponen}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.helperText}>
                    Bagian ini boleh dilewati. Interval dapat disesuaikan setelah
                    kendaraan ditambahkan.
                  </Text>
                </View>

                {/* Tombol simpan */}
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSimpan}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Simpan Kendaraan</Text>
                  )}
                </Pressable>

                {/* Tombol batal */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.cancelButtonPressed,
                  ]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal notifikasi */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            <View
              style={[
                styles.alertIcon,
                modalType === "success" && styles.successIcon,
                modalType === "info" && styles.infoIcon,
              ]}
            >
              <Ionicons
                name={
                  modalType === "success"
                    ? "checkmark-circle"
                    : modalType === "info"
                      ? "information-circle"
                      : "alert-circle"
                }
                size={36}
                color={
                  modalType === "success"
                    ? "#16A34A"
                    : modalType === "info"
                      ? "#0284C7"
                      : "#DC2626"
                }
              />
            </View>

            <Text style={styles.alertTitle}>{modalTitle}</Text>
            <Text style={styles.alertMessage}>{modalMessage}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.alertButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={closeModal}
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
    backgroundColor: "#E0F2F2",
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

  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 22,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#0f766e",
  },

  header: {
    marginBottom: 25,
  },

  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
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
    gap: 16,
  },

  inputGroup: {
    gap: 8,
  },

  componentSection: {
    gap: 10,
  },

  componentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  componentOption: {
    flexGrow: 1,
    flexBasis: "42%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  componentOptionSelected: {
    borderColor: "#0F766E",
    backgroundColor: "#E0F2F2",
  },

  componentOptionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  componentOptionText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#64748B",
  },

  componentOptionTextSelected: {
    fontFamily: "Inter_700Bold",
    color: "#0F766E",
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#334155",
  },

  optionalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#94a3b8",
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
    marginTop: 2,
    marginLeft: 4,
  },

  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: "#94a3b8",
    marginTop: -10,
  },

  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: "#ffffff",
  },

  optionButtonActive: {
    borderColor: "#0f766e",
    backgroundColor: "#E0F2F2",
  },

  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#64748b",
  },

  optionTextActive: {
    color: "#0f766e",
    fontFamily: "Inter_700Bold",
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

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    backgroundColor: "#FFFFFF",
  },

  cancelButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0F766E",
  },

  cancelButtonPressed: {
    backgroundColor: "#F1F5F9",
    borderColor: "#94A3B8",
    transform: [{ scale: 0.97 }],
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

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

  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  successIcon: {
    backgroundColor: "#DCFCE7",
  },

  infoIcon: {
    backgroundColor: "#E0F2FE",
  },

  alertTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },

  alertMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 22,
  },

  alertButton: {
    width: "100%",
    backgroundColor: "#0f766e",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },

  alertButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#ffffff",
  },
});
