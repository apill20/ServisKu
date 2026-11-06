//app/edit-kendaraan/[id].tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

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
} from "react-native";

type JenisMotor = "Matic" | "Manual" | "Semi otomatis";

type Kendaraan = {
  nama_motor: string;
  merek: string;
  model: string;
  nomor_polisi: string;
  jenis_motor: JenisMotor | null;
  tahun: number | null;
  odometer_terbaru: number;
  tanggal_servis_terakhir: string | null;
};

type KomponenForm = {
  id: string | null;
  nama_komponen: string;
  interval_km: string;
  interval_bulan: string;
  selected: boolean;
  hasServiceHistory: boolean;
};

const KOMPONEN_BAWAAN = [
  { nama_komponen: "Oli Mesin", interval_km: 2000, interval_bulan: 2 },
  { nama_komponen: "Filter Udara", interval_km: 6000, interval_bulan: 6 },
  { nama_komponen: "Kampas Rem", interval_km: 10000, interval_bulan: 12 },
  { nama_komponen: "Rantai", interval_km: 4000, interval_bulan: 3 },
];

export default function EditKendaraanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const namaMotorRef = useRef<TextInput>(null);
  const merekRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const nomorPolisiRef = useRef<TextInput>(null);
  const tahunRef = useRef<TextInput>(null);
  const odometerRef = useRef<TextInput>(null);
  const tanggalServisRef = useRef<TextInput>(null);

  const [namaMotor, setNamaMotor] = useState("");
  const [merek, setMerek] = useState("");
  const [model, setModel] = useState("");
  const [nomorPolisi, setNomorPolisi] = useState("");
  const [jenisMotor, setJenisMotor] = useState<JenisMotor | "">("");
  const [tahun, setTahun] = useState("");
  const [odometer, setOdometer] = useState("");
  const [tanggalServis, setTanggalServis] = useState("");
  const [komponen, setKomponen] = useState<KomponenForm[]>([]);
  const [loadingKomponen, setLoadingKomponen] = useState(true);
  const [komponenLoadError, setKomponenLoadError] = useState("");
  const [komponenValidationError, setKomponenValidationError] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    namaMotor: "",
    merek: "",
    model: "",
    nomorPolisi: "",
    tahun: "",
    odometer: "",
    tanggalServis: "",
  });

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

  const fetchKomponen = useCallback(async () => {
    if (!id) return;

    setLoadingKomponen(true);
    setKomponenLoadError("");

    try {
      const { data, error } = await supabase
        .from("komponen_perawatan")
        .select("id, kendaraan_id, nama_komponen, interval_km, interval_bulan")
        .eq("kendaraan_id", id);

      if (error) throw error;

      const komponenTersimpan = data ?? [];
      let idsDenganRiwayat = new Set<string>();

      if (komponenTersimpan.length > 0) {
        const { data: catatan, error: catatanError } = await supabase
          .from("catatan_servis")
          .select("komponen_id")
          .in(
            "komponen_id",
            komponenTersimpan.map((item) => item.id),
          );

        if (catatanError) throw catatanError;
        idsDenganRiwayat = new Set(
          (catatan ?? []).map((item) => item.komponen_id),
        );
      }

      const komponenTersimpanForm: KomponenForm[] = komponenTersimpan.map(
        (item) => ({
          id: item.id,
          nama_komponen: item.nama_komponen,
          interval_km: String(item.interval_km),
          interval_bulan: String(item.interval_bulan),
          selected: true,
          hasServiceHistory: idsDenganRiwayat.has(item.id),
        }),
      );

      const namaTersimpan = new Set(
        komponenTersimpan.map((item) => item.nama_komponen),
      );
      const komponenBawaanBelumTersimpan: KomponenForm[] =
        KOMPONEN_BAWAAN.filter(
          (item) => !namaTersimpan.has(item.nama_komponen),
        ).map((item) => ({
          id: null,
          nama_komponen: item.nama_komponen,
          interval_km: String(item.interval_km),
          interval_bulan: String(item.interval_bulan),
          selected: false,
          hasServiceHistory: false,
        }));

      setKomponen([...komponenTersimpanForm, ...komponenBawaanBelumTersimpan]);
    } catch (error) {
      console.error("Gagal mengambil komponen perawatan:", error);
      setKomponen([]);
      setKomponenLoadError(
        "Data komponen perawatan gagal dimuat. Coba muat ulang sebelum menyimpan.",
      );
    } finally {
      setLoadingKomponen(false);
    }
  }, [id]);

  const updateKomponen = (
    keyKomponen: string,
    perubahan: Partial<
      Pick<KomponenForm, "interval_km" | "interval_bulan" | "selected">
    >,
  ) => {
    setKomponen((current) =>
      current.map((item) =>
        (item.id ?? `baru:${item.nama_komponen}`) === keyKomponen
          ? { ...item, ...perubahan }
          : item,
      ),
    );
    setKomponenValidationError("");
  };

  // Mengambil data kendaraan yang akan diedit
  useEffect(() => {
    const fetchKendaraan = async () => {
      setLoadingData(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Sesi login tidak ditemukan.");

        const { data, error } = await supabase
          .from("kendaraan")
          .select("*")
          .eq("id", id)
          .eq("owner_id", user.id)
          .single();

        if (error) throw error;

        setNamaMotor(data.nama_motor);
        setMerek(data.merek);
        setModel(data.model);
        setNomorPolisi(data.nomor_polisi);
        setJenisMotor(data.jenis_motor || "");
        setTahun(data.tahun ? String(data.tahun) : "");
        setOdometer(String(data.odometer_terbaru));
        setTanggalServis(data.tanggal_servis_terakhir || "");
        await fetchKomponen();
      } catch (error) {
        console.error("Gagal mengambil kendaraan:", error);
        showAlert(
          "Data Tidak Ditemukan",
          "Data kendaraan tidak dapat dimuat.",
          () => router.back(),
        );
      } finally {
        setLoadingData(false);
      }
    };

    if (id) fetchKendaraan();
  }, [fetchKomponen, id, router]);

  const validateTanggal = (value: string) => {
    if (!value.trim()) return "";

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

    if (!namaMotor.trim()) newErrors.namaMotor = "Nama kendaraan wajib diisi.";
    if (!merek.trim()) newErrors.merek = "Merek motor wajib diisi.";
    if (!model.trim()) newErrors.model = "Model motor wajib diisi.";
    if (!nomorPolisi.trim())
      newErrors.nomorPolisi = "Nomor polisi wajib diisi.";

    if (tahun.trim()) {
      const angka = Number(tahun);

      if (!Number.isInteger(angka) || angka < 1900 || angka > 2100) {
        newErrors.tahun = "Masukkan tahun kendaraan yang valid.";
      }
    }

    if (!odometer.trim()) {
      newErrors.odometer = "Odometer terbaru wajib diisi.";
    } else if (!Number.isInteger(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = "Odometer harus berupa angka yang valid.";
    }

    newErrors.tanggalServis = validateTanggal(tanggalServis);

    const intervalKomponenValid = komponen
      .filter((item) => item.selected)
      .every(
        (item) =>
          Number.isInteger(Number(item.interval_km)) &&
          Number(item.interval_km) > 0 &&
          Number.isInteger(Number(item.interval_bulan)) &&
          Number(item.interval_bulan) > 0,
      );

    setKomponenValidationError(
      intervalKomponenValid
        ? ""
        : "Interval km dan bulan untuk komponen terpilih harus berupa bilangan bulat positif.",
    );

    setErrors(newErrors);

    return (
      !komponenLoadError &&
      !loadingKomponen &&
      intervalKomponenValid &&
      !Object.values(newErrors).some((error) => error !== "")
    );
  };

  const handleSimpan = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        showAlert(
          "Sesi Berakhir",
          "Silakan masuk kembali.",
          () => router.replace("/(auth)/login"),
          "info",
        );
        return;
      }

      const dataKendaraan = {
        nama_motor: namaMotor.trim(),
        merek: merek.trim(),
        model: model.trim(),
        nomor_polisi: nomorPolisi.trim().toUpperCase(),
        jenis_motor: jenisMotor || null,
        tahun: tahun.trim() ? Number(tahun) : null,
        odometer_terbaru: Number(odometer),
        tanggal_servis_terakhir: tanggalServis.trim() || null,
      };

      const { error } = await supabase
        .from("kendaraan")
        .update(dataKendaraan)
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) throw error;

      const komponenDipilih = komponen
        .filter((item) => item.selected)
        .map((item) => ({
          id: item.id,
          nama_komponen: item.nama_komponen,
          interval_km: Number(item.interval_km),
          interval_bulan: Number(item.interval_bulan),
        }));

      try {
        const { error: komponenError } = await supabase.rpc(
          "perbarui_komponen_kendaraan",
          {
            p_kendaraan_id: id,
            p_komponen: komponenDipilih,
          },
        );

        if (komponenError) throw komponenError;
      } catch (komponenError) {
        console.error("Gagal memperbarui komponen perawatan:", komponenError);
        showAlert(
          "Komponen Belum Tersimpan",
          "Data kendaraan berhasil diperbarui, tetapi komponen perawatan gagal disimpan. Periksa kembali komponen lalu coba lagi.",
        );
        return;
      }

      showAlert(
        "Berhasil!",
        "Data kendaraan berhasil diperbarui.",
        () => router.back(),
        "success",
      );
    } catch (error) {
      console.error("Gagal memperbarui kendaraan:", error);

      showAlert(
        "Gagal Menyimpan",
        "Data kendaraan belum berhasil diperbarui. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        ref={options.inputRef}
        style={[
          styles.input,
          focusedInput === field && styles.inputFocused,
          error !== "" && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
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

  if (loadingData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Memuat data kendaraan...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.formPanel}>
            <View style={styles.header}>
              <View style={styles.mobileHeader}>
                <Pressable
                  onPress={() =>
                    router.replace({
                      pathname: "/detail-kendaraan/[id]",
                      params: { id },
                    })
                  }
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={21} color="#0F766E" />
                </Pressable>
                <Text style={styles.logo}>ServisKu</Text>
              </View>

              <Text style={styles.title}>Edit Kendaraan</Text>
              <Text style={styles.subtitle}>
                Perbarui informasi kendaraanmu.
              </Text>
            </View>

            <View style={styles.form}>
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
                {
                  autoCapitalize: "characters",
                  inputRef: nomorPolisiRef,
                  nextRef: tahunRef,
                },
              )}

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
                { optional: true, inputRef: tanggalServisRef, isLast: true },
              )}

              <Text style={styles.helperText}>
                Kosongkan jika belum pernah mencatat tanggal servis terakhir.
              </Text>

              <View style={styles.componentSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Komponen Perawatan</Text>
                  <Text style={styles.optionalText}>Opsional</Text>
                </View>

                <Text style={styles.componentHelperText}>
                  Pilih komponen yang ingin dipantau dan sesuaikan intervalnya.
                </Text>

                {loadingKomponen ? (
                  <View style={styles.componentMessageCard}>
                    <ActivityIndicator size="small" color="#0F766E" />
                    <Text style={styles.componentMessageText}>
                      Memuat komponen perawatan...
                    </Text>
                  </View>
                ) : komponenLoadError ? (
                  <View style={styles.componentMessageCard}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color="#DC2626"
                    />
                    <Text style={styles.componentLoadErrorText}>
                      {komponenLoadError}
                    </Text>
                    <Pressable
                      style={styles.retryComponentButton}
                      onPress={fetchKomponen}
                    >
                      <Text style={styles.retryComponentText}>Coba Lagi</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.componentList}>
                    {komponen.map((item) => (
                      <View
                        key={item.id ?? `baru:${item.nama_komponen}`}
                        style={[
                          styles.componentCard,
                          item.selected && styles.componentCardSelected,
                        ]}
                      >
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{
                            checked: item.selected,
                            disabled: item.hasServiceHistory,
                          }}
                          disabled={item.hasServiceHistory}
                          onPress={() =>
                            updateKomponen(
                              item.id ?? `baru:${item.nama_komponen}`,
                              {
                                selected: !item.selected,
                              },
                            )
                          }
                          style={({ pressed }) => [
                            styles.componentSelectRow,
                            pressed && styles.componentSelectRowPressed,
                          ]}
                        >
                          <Ionicons
                            name={
                              item.hasServiceHistory
                                ? "lock-closed"
                                : item.selected
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                            }
                            size={20}
                            color={
                              item.hasServiceHistory
                                ? "#64748B"
                                : item.selected
                                  ? "#0F766E"
                                  : "#94A3B8"
                            }
                          />
                          <Text style={styles.componentName}>
                            {item.nama_komponen}
                          </Text>
                          {item.hasServiceHistory && (
                            <Text style={styles.componentLockedText}>
                              Ada riwayat servis
                            </Text>
                          )}
                        </Pressable>

                        {item.selected && (
                          <View style={styles.componentIntervalRow}>
                            <View style={styles.componentIntervalField}>
                              <Text style={styles.componentIntervalLabel}>
                                Interval km
                              </Text>
                              <TextInput
                                style={styles.componentIntervalInput}
                                value={item.interval_km}
                                onChangeText={(value) =>
                                  updateKomponen(
                                    item.id ?? `baru:${item.nama_komponen}`,
                                    {
                                      interval_km: value.replace(/[^0-9]/g, ""),
                                    },
                                  )
                                }
                                keyboardType="numeric"
                                inputMode="numeric"
                                placeholder="2000"
                                placeholderTextColor="#94A3B8"
                              />
                            </View>

                            <View style={styles.componentIntervalField}>
                              <Text style={styles.componentIntervalLabel}>
                                Interval bulan
                              </Text>
                              <TextInput
                                style={styles.componentIntervalInput}
                                value={item.interval_bulan}
                                onChangeText={(value) =>
                                  updateKomponen(
                                    item.id ?? `baru:${item.nama_komponen}`,
                                    {
                                      interval_bulan: value.replace(
                                        /[^0-9]/g,
                                        "",
                                      ),
                                    },
                                  )
                                }
                                keyboardType="numeric"
                                inputMode="numeric"
                                placeholder="2"
                                placeholderTextColor="#94A3B8"
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                    {komponenValidationError !== "" && (
                      <Text style={styles.errorText}>
                        {komponenValidationError}
                      </Text>
                    )}
                  </View>
                )}
              </View>

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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Simpan Perubahan</Text>
                )}
              </Pressable>

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
        </ScrollView>
      </KeyboardAvoidingView>

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
    backgroundColor: "#F8FAFC",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  formPanel: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
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
    color: "#0F766E",
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    lineHeight: 21,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
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
    color: "#94A3B8",
  },
  input: {
    fontFamily: "Inter_400Regular",
    borderWidth: 1.5,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    ...(Platform.OS === "web" && {
      outlineWidth: 0,
      outlineStyle: "none",
    }),
  },
  inputFocused: {
    borderColor: "#0F766E",
  },
  inputError: {
    borderColor: "#DC2626",
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
    color: "#94A3B8",
    marginTop: -10,
  },
  componentSection: {
    gap: 9,
  },
  componentHelperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
  },
  componentList: {
    gap: 10,
  },
  componentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 16,
    padding: 13,
  },
  componentCardSelected: {
    borderColor: "#BFE5E0",
  },
  componentSelectRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  componentSelectRowPressed: {
    opacity: 0.75,
  },
  componentName: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0F172A",
  },
  componentLockedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#64748B",
  },
  componentIntervalRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  componentIntervalField: {
    flex: 1,
    gap: 6,
  },
  componentIntervalLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#64748B",
  },
  componentIntervalInput: {
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  componentMessageCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 16,
  },
  componentMessageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
  },
  componentLoadErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#DC2626",
    textAlign: "center",
  },
  retryComponentButton: {
    borderRadius: 20,
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryComponentText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#0F766E",
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
    backgroundColor: "#FFFFFF",
  },
  optionButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#E0F2F2",
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#64748B",
  },
  optionTextActive: {
    color: "#0F766E",
    fontFamily: "Inter_700Bold",
  },
  button: {
    backgroundColor: "#0F766E",
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
    color: "#FFFFFF",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
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
    backgroundColor: "#FFFFFF",
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
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 22,
  },
  alertButton: {
    width: "100%",
    backgroundColor: "#0F766E",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  alertButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
