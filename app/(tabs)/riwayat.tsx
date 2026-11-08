import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

type Kendaraan = {
  id: string;
  nama_motor: string;
  merek: string;
  model: string;
  nomor_polisi: string;
};

type Komponen = {
  id: string;
  nama_komponen: string;
  interval_km: number;
  interval_bulan: number;
};

type RiwayatServis = {
  id: string;
  tanggal_servis: string;
  odometer: number;
  biaya: number | null;
  bengkel: string | null;
  catatan: string | null;
};

type DropdownType = "kendaraan" | "komponen" | null;

export default function RiwayatScreen() {
  const [kendaraan, setKendaraan] = useState<Kendaraan[]>([]);
  const [komponen, setKomponen] = useState<Komponen[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatServis[]>([]);
  const [riwayatDipilih, setRiwayatDipilih] = useState<RiwayatServis | null>(
    null,
  );
  const bukaDetailRiwayat = (item: RiwayatServis) => {
    setRiwayatDipilih(item);
  };

  const [kendaraanTerpilih, setKendaraanTerpilih] = useState<Kendaraan | null>(
    null,
  );

  const [komponenTerpilih, setKomponenTerpilih] = useState<Komponen | null>(
    null,
  );

  const [dropdownTerbuka, setDropdownTerbuka] = useState<DropdownType>(null);

  const [loadingKendaraan, setLoadingKendaraan] = useState(true);
  const [loadingKomponen, setLoadingKomponen] = useState(false);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // Mengambil daftar kendaraan milik pengguna
  const fetchKendaraan = useCallback(async () => {
    setLoadingKendaraan(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setKendaraan([]);
        return;
      }

      const { data, error } = await supabase
        .from("kendaraan")
        .select("id, nama_motor, merek, model, nomor_polisi")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setKendaraan(data ?? []);
    } catch (error) {
      console.error("Gagal mengambil kendaraan:", error);
      setErrorMessage("Gagal memuat daftar kendaraan. Coba lagi.");
    } finally {
      setLoadingKendaraan(false);
    }
  }, []);

  // Mengambil daftar kendaraan setiap halaman dibuka
  useFocusEffect(
    useCallback(() => {
      setKendaraanTerpilih(null);
      setKomponenTerpilih(null);
      setKomponen([]);
      setRiwayat([]);

      fetchKendaraan();
    }, [fetchKendaraan]),
  );

  // Mengambil komponen berdasarkan kendaraan yang dipilih
  const fetchKomponen = async (kendaraanId: string) => {
    setLoadingKomponen(true);
    setErrorMessage("");
    setKomponen([]);
    setKomponenTerpilih(null);
    setRiwayat([]);

    try {
      const { data, error } = await supabase
        .from("komponen_perawatan")
        .select("id, nama_komponen, interval_km, interval_bulan")
        .eq("kendaraan_id", kendaraanId)
        .order("nama_komponen", { ascending: true });

      if (error) throw error;

      setKomponen(data ?? []);
    } catch (error) {
      console.error("Gagal mengambil komponen:", error);
      setErrorMessage("Gagal memuat daftar komponen. Coba lagi.");
    } finally {
      setLoadingKomponen(false);
    }
  };

  // Mengambil riwayat berdasarkan komponen yang dipilih
  const fetchRiwayat = async (komponenId: string) => {
    setLoadingRiwayat(true);
    setErrorMessage("");
    setRiwayat([]);

    try {
      const { data, error } = await supabase
        .from("catatan_servis")
        .select("id, tanggal_servis, odometer, biaya, bengkel, catatan")
        .eq("komponen_id", komponenId)
        .order("tanggal_servis", { ascending: false });

      if (error) throw error;

      setRiwayat(data ?? []);
    } catch (error) {
      console.error("Gagal mengambil riwayat servis:", error);
      setErrorMessage("Gagal memuat riwayat servis. Coba lagi.");
    } finally {
      setLoadingRiwayat(false);
    }
  };

  // Saat kendaraan dipilih
  const handlePilihKendaraan = (item: Kendaraan) => {
    setKendaraanTerpilih(item);
    setKomponenTerpilih(null);
    setRiwayat([]);
    setDropdownTerbuka(null);

    fetchKomponen(item.id);
  };

  // Saat komponen dipilih
  const handlePilihKomponen = (item: Komponen) => {
    setKomponenTerpilih(item);
    setDropdownTerbuka(null);

    fetchRiwayat(item.id);
  };

  // Format tanggal tanpa menggeser tanggal karena timezone
  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";

    const bagian = tanggal.split("-");
    if (bagian.length !== 3) return tanggal;

    const tahun = Number(bagian[0]);
    const bulan = Number(bagian[1]);
    const hari = Number(bagian[2]);

    const namaBulan = [
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

    if (!tahun || bulan < 1 || bulan > 12 || hari < 1 || hari > 31) {
      return tanggal;
    }

    return `${hari} ${namaBulan[bulan - 1]} ${tahun}`;
  };

  const formatOdometer = (angka: number) => {
    return angka.toLocaleString("id-ID") + " km";
  };

  const formatBiaya = (biaya: number | null) => {
    if (biaya === null || biaya === undefined) {
      return "Tidak diisi";
    }

    return "Rp" + Number(biaya).toLocaleString("id-ID");
  };

  // Tampilan dropdown
  const renderDropdown = (
    label: string,
    value: string,
    placeholder: string,
    type: "kendaraan" | "komponen",
    disabled: boolean,
  ) => (
    <View style={styles.dropdownGroup}>
      <Text style={styles.dropdownLabel}>{label}</Text>

      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.dropdownButton,
          disabled && styles.dropdownDisabled,
          pressed && !disabled && styles.dropdownPressed,
        ]}
        onPress={() => setDropdownTerbuka(type)}
      >
        <Text
          style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? "#CBD5E1" : "#64748B"}
        />
      </Pressable>
    </View>
  );

  const daftarDropdownKendaraan = () => (
    <Modal
      visible={dropdownTerbuka === "kendaraan"}
      transparent
      animationType="fade"
      onRequestClose={() => setDropdownTerbuka(null)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setDropdownTerbuka(null)}
      >
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Kendaraan</Text>

            <Pressable onPress={() => setDropdownTerbuka(null)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.modalList}
          >
            {kendaraan.map((item) => {
              const selected = kendaraanTerpilih?.id === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                  ]}
                  onPress={() => handlePilihKendaraan(item)}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons
                      name="bicycle-outline"
                      size={22}
                      color="#0F766E"
                    />
                  </View>

                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{item.nama_motor}</Text>
                    <Text style={styles.optionSubtitle}>
                      {item.merek} {item.model} · {item.nomor_polisi}
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color="#0F766E"
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const daftarDropdownKomponen = () => (
    <Modal
      visible={dropdownTerbuka === "komponen"}
      transparent
      animationType="fade"
      onRequestClose={() => setDropdownTerbuka(null)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setDropdownTerbuka(null)}
      >
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Komponen</Text>

            <Pressable onPress={() => setDropdownTerbuka(null)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.modalList}
          >
            {komponen.map((item) => {
              const selected = komponenTerpilih?.id === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                  ]}
                  onPress={() => handlePilihKomponen(item)}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons
                      name="construct-outline"
                      size={21}
                      color="#0F766E"
                    />
                  </View>

                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{item.nama_komponen}</Text>
                    <Text style={styles.optionSubtitle}>
                      Interval {item.interval_km.toLocaleString("id-ID")} km
                      {" · "}
                      {item.interval_bulan} bulan
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color="#0F766E"
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Riwayat Servis</Text>
          <Text style={styles.headerSubtitle}>
            Lihat catatan perawatan kendaraanmu.
          </Text>
        </View>

        <View style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={23} color="#0F766E" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter kendaraan dan komponen */}
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <View style={styles.filterIcon}>
              <Ionicons name="filter-outline" size={20} color="#0F766E" />
            </View>

            <View>
              <Text style={styles.filterTitle}>Filter Riwayat</Text>
              <Text style={styles.filterSubtitle}>
                Pilih kendaraan dan komponen
              </Text>
            </View>
          </View>

          {loadingKendaraan ? (
            <View style={styles.loadingFilter}>
              <ActivityIndicator size="small" color="#0F766E" />
              <Text style={styles.loadingText}>Memuat kendaraan...</Text>
            </View>
          ) : (
            <>
              {renderDropdown(
                "Kendaraan",
                kendaraanTerpilih
                  ? `${kendaraanTerpilih.nama_motor} (${kendaraanTerpilih.nomor_polisi})`
                  : "",
                "Pilih kendaraan",
                "kendaraan",
                kendaraan.length === 0,
              )}

              {renderDropdown(
                "Komponen",
                komponenTerpilih?.nama_komponen ?? "",
                loadingKomponen
                  ? "Memuat komponen..."
                  : kendaraanTerpilih
                    ? "Pilih komponen"
                    : "Pilih kendaraan terlebih dahulu",
                "komponen",
                !kendaraanTerpilih || loadingKomponen || komponen.length === 0,
              )}

              {loadingKomponen && (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator size="small" color="#0F766E" />
                  <Text style={styles.loadingText}>
                    Memuat daftar komponen...
                  </Text>
                </View>
              )}

              {kendaraan.length === 0 && !errorMessage && (
                <Text style={styles.helperText}>
                  Kamu belum memiliki kendaraan. Tambahkan kendaraan terlebih
                  dahulu.
                </Text>
              )}

              {kendaraanTerpilih &&
                !loadingKomponen &&
                komponen.length === 0 &&
                !errorMessage && (
                  <Text style={styles.helperText}>
                    Kendaraan ini belum memiliki komponen perawatan.
                  </Text>
                )}
            </>
          )}
        </View>

        {/* Pesan error */}
        {errorMessage !== "" && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={21} color="#DC2626" />

            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Hasil riwayat */}
        {komponenTerpilih && (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Riwayat {komponenTerpilih.nama_komponen}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {kendaraanTerpilih?.nama_motor}
                </Text>
              </View>

              <View style={styles.historyIcon}>
                <Ionicons name="time-outline" size={22} color="#0F766E" />
              </View>
            </View>

            {loadingRiwayat ? (
              <View style={styles.loadingHistory}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.loadingText}>Memuat riwayat servis...</Text>
              </View>
            ) : riwayat.length === 0 && errorMessage === "" ? (
              <View style={styles.emptyHistory}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color="#0F766E"
                  />
                </View>

                <Text style={styles.emptyTitle}>Belum ada riwayat servis</Text>

                <Text style={styles.emptyDescription}>
                  Catatan servis untuk komponen ini akan muncul di sini setelah
                  kamu menyimpan servis baru.
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                <Text style={styles.historyCount}>
                  {riwayat.length} catatan servis
                </Text>

                {riwayat.map((item, index) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.historyCard,
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.98 }],
                      },
                    ]}
                    onPress={() => bukaDetailRiwayat(item)}
                  >
                    <View style={styles.historyCardHeader}>
                      <View style={styles.historyDateIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={19}
                          color="#0F766E"
                        />
                      </View>

                      <View style={styles.historyDateInfo}>
                        <Text style={styles.historyDate}>
                          {formatTanggal(item.tanggal_servis)}
                        </Text>
                        <Text style={styles.historyOrder}>
                          Catatan servis #{riwayat.length - index}
                        </Text>
                      </View>

                      {index === 0 && (
                        <View style={styles.latestBadge}>
                          <Text style={styles.latestBadgeText}>Terbaru</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.historyDetailRow}>
                      <View style={styles.historyDetailItem}>
                        <Ionicons
                          name="speedometer-outline"
                          size={17}
                          color="#64748B"
                        />
                        <Text style={styles.historyDetailLabel}>Odometer</Text>
                      </View>

                      <Text style={styles.historyDetailValue}>
                        {formatOdometer(item.odometer)}
                      </Text>
                    </View>

                    <View style={styles.historyDetailRow}>
                      <View style={styles.historyDetailItem}>
                        <Ionicons
                          name="cash-outline"
                          size={17}
                          color="#64748B"
                        />
                        <Text style={styles.historyDetailLabel}>Biaya</Text>
                      </View>

                      <Text style={styles.historyDetailValue}>
                        {formatBiaya(item.biaya)}
                      </Text>
                    </View>

                    <View style={styles.historyDetailRow}>
                      <View style={styles.historyDetailItem}>
                        <Ionicons
                          name="construct-outline"
                          size={17}
                          color="#64748B"
                        />
                        <Text style={styles.historyDetailLabel}>Bengkel</Text>
                      </View>

                      <Text style={styles.historyDetailValue} numberOfLines={2}>
                        {item.bengkel || "Tidak diisi"}
                      </Text>
                    </View>

                    {item.catatan && (
                      <View style={styles.noteContainer}>
                        <Text style={styles.noteLabel}>Catatan</Text>
                        <Text style={styles.noteText}>{item.catatan}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Petunjuk sebelum memilih filter */}
        {!komponenTerpilih &&
          !loadingKendaraan &&
          kendaraan.length > 0 &&
          errorMessage === "" && (
            <View style={styles.initialInfo}>
              <View style={styles.initialIcon}>
                <Ionicons name="clipboard-outline" size={35} color="#0F766E" />
              </View>

              <Text style={styles.initialTitle}>
                Pilih kendaraan dan komponen
              </Text>

              <Text style={styles.initialDescription}>
                Pilih kendaraan terlebih dahulu, kemudian pilih komponen untuk
                melihat riwayat servisnya.
              </Text>
            </View>
          )}
      </ScrollView>

      {daftarDropdownKendaraan()}
      {daftarDropdownKomponen()}

      <Modal
        visible={riwayatDipilih !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRiwayatDipilih(null)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable
            style={styles.bottomSheetBackdrop}
            onPress={() => setRiwayatDipilih(null)}
          />

          {riwayatDipilih && (
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />

              <View style={styles.bottomSheetHeader}>
                <View>
                  <Text style={styles.bottomSheetTitle}>Detail Servis</Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    Informasi lengkap catatan perawatan
                  </Text>
                </View>

                <Pressable
                  onPress={() => setRiwayatDipilih(null)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.bottomSheetContent}
              >
                <View style={styles.sheetHero}>
                  <View style={styles.sheetHeroIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={30}
                      color="#0F766E"
                    />
                  </View>

                  <Text style={styles.sheetComponentName}>
                    {komponenTerpilih?.nama_komponen}
                  </Text>

                  <Text style={styles.sheetDate}>
                    {formatTanggal(riwayatDipilih.tanggal_servis)}
                  </Text>
                </View>

                <Text style={styles.sheetSectionTitle}>
                  Informasi Kendaraan
                </Text>

                <View style={styles.sheetInfoCard}>
                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Nama kendaraan</Text>
                    <Text style={styles.sheetValue}>
                      {kendaraanTerpilih?.nama_motor || "-"}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Merek dan model</Text>
                    <Text style={styles.sheetValue}>
                      {kendaraanTerpilih
                        ? `${kendaraanTerpilih.merek} ${kendaraanTerpilih.model}`
                        : "-"}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Nomor polisi</Text>
                    <Text style={styles.sheetValue}>
                      {kendaraanTerpilih?.nomor_polisi || "-"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sheetSectionTitle}>Informasi Servis</Text>

                <View style={styles.sheetInfoCard}>
                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Komponen</Text>
                    <Text style={styles.sheetValue}>
                      {komponenTerpilih?.nama_komponen || "-"}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Tanggal servis</Text>
                    <Text style={styles.sheetValue}>
                      {formatTanggal(riwayatDipilih.tanggal_servis)}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Odometer</Text>
                    <Text style={styles.sheetValue}>
                      {formatOdometer(riwayatDipilih.odometer)}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Biaya</Text>
                    <Text style={styles.sheetValue}>
                      {formatBiaya(riwayatDipilih.biaya)}
                    </Text>
                  </View>

                  <View style={styles.sheetInfoRow}>
                    <Text style={styles.sheetLabel}>Bengkel</Text>
                    <Text style={styles.sheetValue}>
                      {riwayatDipilih.bengkel || "Tidak diisi"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sheetSectionTitle}>Catatan Tambahan</Text>

                <View style={styles.sheetNote}>
                  <Text style={styles.sheetNoteText}>
                    {riwayatDipilih.catatan || "Tidak ada catatan tambahan."}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.sheetCloseButton,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => setRiwayatDipilih(null)}
                >
                  <Text style={styles.sheetCloseButtonText}>Tutup Detail</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#E0F2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#CDE5E2",
  },

  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#0F172A",
  },

  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },

  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 35,
    backgroundColor: "#FFFFFF",
  },

  filterCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 17,
    padding: 16,
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 11,
  },

  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  filterTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
  },

  filterSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  dropdownGroup: {
    marginBottom: 14,
  },

  dropdownLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#334155",
    marginBottom: 7,
  },

  dropdownButton: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },

  dropdownDisabled: {
    backgroundColor: "#F8FAFC",
  },

  dropdownPressed: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },

  dropdownValue: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#0F172A",
  },

  dropdownPlaceholder: {
    color: "#94A3B8",
    fontFamily: "Inter_400Regular",
  },

  loadingFilter: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -4,
    marginBottom: 10,
  },

  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },

  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: "#94A3B8",
    marginTop: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },

  modalContent: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "75%",
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
  },

  modalList: {
    flexGrow: 0,
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 11,
  },

  modalOptionSelected: {
    backgroundColor: "#E0F2F2",
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0F172A",
  },

  optionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    gap: 9,
  },

  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 18,
  },

  historySection: {
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingHistory: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 35,
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#1E293B",
    textAlign: "center",
  },

  emptyDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 7,
  },

  historyList: {
    gap: 12,
  },

  historyCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#64748B",
    marginBottom: 1,
  },

  historyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 17,
    padding: 15,
  },

  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  historyDateIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  historyDateInfo: {
    flex: 1,
  },

  historyDate: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0F172A",
  },

  historyOrder: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  latestBadge: {
    backgroundColor: "#E0F2F2",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  latestBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#0F766E",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 13,
  },

  historyDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },

  historyDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  historyDetailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
  },

  historyDetailValue: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#334155",
    textAlign: "right",
  },

  noteContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 11,
    marginTop: 2,
  },

  noteLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#64748B",
    marginBottom: 5,
  },

  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
  },

  initialInfo: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 55,
  },

  initialIcon: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  initialTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#1E293B",
    textAlign: "center",
  },

  initialDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 7,
  },

  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },

  bottomSheetBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 25,
  },

  bottomSheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 18,
  },

  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },

  bottomSheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    color: "#0F172A",
  },

  bottomSheetSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheetContent: {
    paddingBottom: 15,
  },

  sheetHero: {
    alignItems: "center",
    backgroundColor: "#E0F2F2",
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },

  sheetHeroIcon: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  sheetComponentName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
  },

  sheetDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  sheetSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 10,
  },

  sheetInfoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 14,
    paddingHorizontal: 13,
    marginBottom: 19,
  },

  sheetInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },

  sheetLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },

  sheetValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#334155",
    flex: 1,
    textAlign: "right",
  },

  sheetNote: {
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    padding: 14,
    marginBottom: 18,
  },

  sheetNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#334155",
  },

  sheetCloseButton: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },

  sheetCloseButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
