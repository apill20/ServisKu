import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

// Mengubah tanggal menjadi format YYYY-MM-DD berdasarkan waktu lokal.
const formatTanggal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function CatatServisScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
    kendaraanId?: string;
    odometer?: string;
  }>();

  const komponenId = params.id;
  const kendaraanId = params.kendaraanId;
  const odometerTerbaru = Number(params.odometer);

  const hariIni = new Date();
  const tanggalHariIni = formatTanggal(hariIni);

  const [tanggalServis, setTanggalServis] = useState(tanggalHariIni);
  const [tanggalDipilih, setTanggalDipilih] = useState(hariIni);
  const [bulanDitampilkan, setBulanDitampilkan] = useState(
    new Date(hariIni.getFullYear(), hariIni.getMonth(), 1),
  );
  const [kalenderTerbuka, setKalenderTerbuka] = useState(false);

  const [odometer, setOdometer] = useState(
    Number.isFinite(odometerTerbaru) ? String(odometerTerbaru) : "",
  );
  const [biaya, setBiaya] = useState("");
  const [bengkel, setBengkel] = useState("");
  const [catatan, setCatatan] = useState("");

  const [inputAktif, setInputAktif] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Membuat tanggal kalender dalam bentuk 6 baris x 7 kolom.
  const jumlahHari = new Date(
    bulanDitampilkan.getFullYear(),
    bulanDitampilkan.getMonth() + 1,
    0,
  ).getDate();

  // Kalender dimulai dari hari Senin.
  const hariPertama = new Date(
    bulanDitampilkan.getFullYear(),
    bulanDitampilkan.getMonth(),
    1,
  ).getDay();

  const offsetHari = (hariPertama + 6) % 7;

  const daftarHari = Array.from({ length: 42 }, (_, index) => {
    const nomorHari = index - offsetHari + 1;

    return nomorHari >= 1 && nomorHari <= jumlahHari ? nomorHari : null;
  });

  const mingguKalender = Array.from({ length: 6 }, (_, index) =>
    daftarHari.slice(index * 7, index * 7 + 7),
  );

  const bulanMaksimal = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1);

  const bulanBerikutnyaTersedia =
    bulanDitampilkan.getTime() < bulanMaksimal.getTime();

  const bukaKalender = () => {
    setInputAktif("Tanggal Servis");
    setBulanDitampilkan(
      new Date(tanggalDipilih.getFullYear(), tanggalDipilih.getMonth(), 1),
    );
    setKalenderTerbuka(true);
  };

  const pilihTanggal = (hari: number) => {
    const tanggalBaru = new Date(
      bulanDitampilkan.getFullYear(),
      bulanDitampilkan.getMonth(),
      hari,
    );

    if (formatTanggal(tanggalBaru) > tanggalHariIni) return;

    setTanggalDipilih(tanggalBaru);
    setTanggalServis(formatTanggal(tanggalBaru));
    setKalenderTerbuka(false);
  };

  const pilihHariIni = () => {
    setTanggalDipilih(hariIni);
    setTanggalServis(tanggalHariIni);
    setBulanDitampilkan(new Date(hariIni.getFullYear(), hariIni.getMonth(), 1));
    setKalenderTerbuka(false);
  };

  const validTanggal = (tanggal: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return false;

    const date = new Date(`${tanggal}T00:00:00`);

    return !Number.isNaN(date.getTime()) && formatTanggal(date) === tanggal;
  };

  const handleSimpan = async () => {
    setErrorMessage("");

    if (!komponenId || !kendaraanId) {
      setErrorMessage("Data komponen atau kendaraan tidak ditemukan.");
      return;
    }

    if (!validTanggal(tanggalServis)) {
      setErrorMessage("Tanggal servis tidak valid.");
      return;
    }

    if (tanggalServis > tanggalHariIni) {
      setErrorMessage("Tanggal servis tidak boleh di masa depan.");
      return;
    }

    const nilaiOdometer = Number(odometer);
    const nilaiBiaya = biaya.trim() === "" ? null : Number(biaya);

    if (
      odometer.trim() === "" ||
      !Number.isInteger(nilaiOdometer) ||
      nilaiOdometer < 0
    ) {
      setErrorMessage("Odometer harus berupa angka bulat yang valid.");
      return;
    }

    if (Number.isFinite(odometerTerbaru) && nilaiOdometer > odometerTerbaru) {
      setErrorMessage(
        "Odometer servis tidak boleh melebihi odometer kendaraan terbaru.",
      );
      return;
    }

    if (
      nilaiBiaya !== null &&
      (!Number.isFinite(nilaiBiaya) || nilaiBiaya < 0)
    ) {
      setErrorMessage("Biaya servis harus berupa angka yang valid.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Sesi login tidak ditemukan.");

      // Memastikan komponen termasuk kendaraan milik pengguna.
      const { data: komponenData, error: komponenError } = await supabase
        .from("komponen_perawatan")
        .select("id")
        .eq("id", komponenId)
        .eq("kendaraan_id", kendaraanId)
        .maybeSingle();

      if (komponenError) throw komponenError;

      if (!komponenData) {
        throw new Error("Komponen tidak ditemukan.");
      }

      const { error } = await supabase.from("catatan_servis").insert({
        komponen_id: komponenId,
        tanggal_servis: tanggalServis,
        odometer: nilaiOdometer,
        biaya: nilaiBiaya,
        bengkel: bengkel.trim() || null,
        catatan: catatan.trim() || null,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      console.error("Gagal menyimpan catatan servis:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan catatan servis.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Input dengan border yang dikendalikan oleh View pembungkus.
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "numeric";
      multiline?: boolean;
    },
  ) => {
    const isFocused = inputAktif === label;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>

        <View
          style={[
            styles.inputFrame,
            isFocused && styles.inputFocused,
            options?.multiline && styles.multilineFrame,
          ]}
        >
          <TextInput
            style={[styles.input, options?.multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={options?.keyboardType || "default"}
            multiline={options?.multiline}
            textAlignVertical={options?.multiline ? "top" : "center"}
            onFocus={() => setInputAktif(label)}
            onBlur={() => setInputAktif(null)}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.replace({
              pathname: "/detail-kendaraan/[id]",
              params: { id: kendaraanId! },
            })
          }
        >
          <Ionicons name="arrow-back" size={22} color="#0F766E" />
        </Pressable>

        <Text style={styles.headerTitle}>Catat Servis</Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons name="construct-outline" size={26} color="#0F766E" />
            </View>

            <Text style={styles.title}>Riwayat Servis Baru</Text>

            <Text style={styles.subtitle}>
              Lengkapi informasi perawatan kendaraan yang sudah dilakukan.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informasi Servis</Text>

            {/* TANGGAL SERVIS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tanggal Servis</Text>

              <Pressable
                style={[
                  styles.dateButton,
                  inputAktif === "Tanggal Servis" && styles.inputFocused,
                ]}
                onPress={bukaKalender}
              >
                <Text style={styles.dateButtonText}>
                  {tanggalDipilih.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                <Ionicons name="calendar-outline" size={20} color="#0F766E" />
              </Pressable>

              {/* KALENDER */}
              {kalenderTerbuka && (
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Pressable
                      style={styles.monthArrow}
                      onPress={() =>
                        setBulanDitampilkan(
                          new Date(
                            bulanDitampilkan.getFullYear(),
                            bulanDitampilkan.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      <Ionicons name="chevron-back" size={17} color="#0F766E" />
                    </Pressable>

                    <Text style={styles.monthTitle}>
                      {NAMA_BULAN[bulanDitampilkan.getMonth()]}{" "}
                      {bulanDitampilkan.getFullYear()}
                    </Text>

                    <Pressable
                      style={[
                        styles.monthArrow,
                        !bulanBerikutnyaTersedia && { opacity: 0.3 },
                      ]}
                      disabled={!bulanBerikutnyaTersedia}
                      onPress={() =>
                        setBulanDitampilkan(
                          new Date(
                            bulanDitampilkan.getFullYear(),
                            bulanDitampilkan.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#0F766E"
                      />
                    </Pressable>
                  </View>

                  <View style={styles.calendarGrid}>
                    {NAMA_HARI.map((hari) => (
                      <View key={hari} style={styles.calendarCell}>
                        <Text style={styles.weekdayText}>{hari}</Text>
                      </View>
                    ))}
                  </View>

                  {mingguKalender.map((minggu, index) => (
                    <View key={index} style={styles.calendarGrid}>
                      {minggu.map((hari, hariIndex) => {
                        if (hari === null) {
                          return (
                            <View
                              key={`kosong-${hariIndex}`}
                              style={styles.calendarCell}
                            />
                          );
                        }

                        const tanggalIni = new Date(
                          bulanDitampilkan.getFullYear(),
                          bulanDitampilkan.getMonth(),
                          hari,
                        );

                        const tanggalString = formatTanggal(tanggalIni);
                        const terpilih = tanggalString === tanggalServis;
                        const hariIniAktif = tanggalString === tanggalHariIni;
                        const tanggalMasaDepan = tanggalString > tanggalHariIni;

                        return (
                          <View
                            key={`${index}-${hari}`}
                            style={styles.calendarCell}
                          >
                            <Pressable
                              disabled={tanggalMasaDepan}
                              onPress={() => pilihTanggal(hari)}
                              style={[
                                styles.dayButton,
                                terpilih && styles.selectedDay,
                                hariIniAktif && !terpilih && styles.todayDay,
                                tanggalMasaDepan && styles.disabledDay,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  terpilih && styles.selectedDayText,
                                  tanggalMasaDepan && styles.disabledDayText,
                                ]}
                              >
                                {hari}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ))}

                  <View style={styles.calendarFooter}>
                    <Pressable onPress={() => setKalenderTerbuka(false)}>
                      <Text style={styles.calendarCloseText}>Tutup</Text>
                    </Pressable>

                    <Pressable onPress={pilihHariIni}>
                      <Text style={styles.calendarTodayText}>Hari Ini</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {renderInput(
              "Odometer Saat Servis (km)",
              odometer,
              setOdometer,
              "Contoh: 12500",
              { keyboardType: "numeric" },
            )}

            <Text style={styles.helperText}>
              Odometer terbaru kendaraan:{" "}
              {Number.isFinite(odometerTerbaru)
                ? `${odometerTerbaru.toLocaleString("id-ID")} km`
                : "Tidak tersedia"}
            </Text>

            <View style={styles.optionalDivider} />

            <Text style={styles.sectionTitle}>Informasi Tambahan</Text>

            {renderInput(
              "Biaya Servis (opsional)",
              biaya,
              setBiaya,
              "Contoh: 75000",
              { keyboardType: "numeric" },
            )}

            {renderInput(
              "Nama Bengkel (opsional)",
              bengkel,
              setBengkel,
              "Masukkan nama bengkel",
            )}

            {renderInput(
              "Catatan (opsional)",
              catatan,
              setCatatan,
              "Tambahkan keterangan servis...",
              { multiline: true },
            )}
          </View>

          {errorMessage !== "" && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSimpan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={19} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Simpan Catatan</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL BERHASIL */}
      <Modal
        visible={success}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccess(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#0F766E" />
            </View>

            <Text style={styles.modalTitle}>Servis Berhasil Dicatat!</Text>

            <Text style={styles.modalMessage}>
              Riwayat servis berhasil disimpan.
            </Text>

            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setSuccess(false);
                router.replace({
                  pathname: "/detail-kendaraan/[id]",
                  params: { id: kendaraanId! },
                });
              }}
            >
              <Text style={styles.modalButtonText}>Kembali ke Detail</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#E0F2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#CDE5E2",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: "#E0F2F2",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  introIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    color: "#115E59",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#476B68",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 17,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#334155",
    marginBottom: 8,
  },

  // Border luar input.
  inputFrame: {
    borderWidth: 1,
    borderColor: "#D8E2EC",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  input: {
    borderWidth: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#0F172A",
    minHeight: 44,
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
        } as any)
      : {}),
  },
  inputFocused: {
    borderColor: "#0F766E",
    borderWidth: 1.5,
  },
  multilineFrame: {
    minHeight: 95,
  },
  multilineInput: {
    minHeight: 95,
    paddingTop: 12,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#D8E2EC",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#0F172A",
  },

  // Kalender ringkas.
  calendarCard: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 9,
    marginTop: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthArrow: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0F172A",
  },
  calendarGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#64748B",
  },
  dayButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#334155",
  },
  selectedDay: {
    backgroundColor: "#0F766E",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  todayDay: {
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  disabledDay: {
    opacity: 0.35,
  },
  disabledDayText: {
    color: "#94A3B8",
  },
  calendarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
    paddingTop: 9,
    paddingHorizontal: 4,
  },
  calendarCloseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#64748B",
  },
  calendarTodayText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#0F766E",
  },
  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    marginTop: -9,
    marginBottom: 16,
  },
  optionalDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 13,
    marginTop: 15,
  },
  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#DC2626",
  },
  saveButton: {
    backgroundColor: "#0F766E",
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
  },
  saveButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 25,
    alignItems: "center",
  },
  successIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
    textAlign: "center",
  },
  modalMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#0F766E",
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
