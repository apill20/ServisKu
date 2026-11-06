//app/detail-kendaraan/[id].tsx
import React, { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

type Kendaraan = {
  id: string;
  nama_motor: string;
  merek: string;
  model: string;
  nomor_polisi: string;
  jenis_motor: string | null;
  tahun: number | null;
  odometer_terbaru: number;
  tanggal_servis_terakhir: string | null;
};

type KomponenPerawatan = {
  id: string;
  nama_komponen: string;
  interval_km: number | null;
  interval_bulan: number | null;
};

export default function DetailKendaraanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [kendaraan, setKendaraan] = useState<Kendaraan | null>(null);
  const [komponen, setKomponen] = useState<KomponenPerawatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKomponen, setLoadingKomponen] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [komponenError, setKomponenError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tanggalServisTerakhir, setTanggalServisTerakhir] = useState<
    string | null
  >(null);

  const fetchKomponen = useCallback(async () => {
    if (!id) return;

    setLoadingKomponen(true);
    setKomponenError("");

    try {
      const { data, error } = await supabase
        .from("komponen_perawatan")
        .select("id, nama_komponen, interval_km, interval_bulan")
        .eq("kendaraan_id", id);

      if (error) throw error;

      const daftarKomponen = data ?? [];
      setKomponen(daftarKomponen);

      // Ambil ID seluruh komponen kendaraan.
      const daftarIdKomponen = daftarKomponen.map((item) => item.id);

      if (daftarIdKomponen.length === 0) {
        setTanggalServisTerakhir(null);
        return;
      }

      // Cari catatan servis terbaru dari seluruh komponen.
      const { data: dataServis, error: errorServis } = await supabase
        .from("catatan_servis")
        .select("tanggal_servis")
        .in("komponen_id", daftarIdKomponen)
        .order("tanggal_servis", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorServis) throw errorServis;

      setTanggalServisTerakhir(dataServis?.tanggal_servis ?? null);
    } catch (error) {
      console.error("Gagal mengambil komponen atau riwayat servis:", error);
      setKomponen([]);
      setTanggalServisTerakhir(null);
      setKomponenError("Data perawatan gagal dimuat. Coba lagi.");
    } finally {
      setLoadingKomponen(false);
    }
  }, [id]);

  const handleHapusKendaraan = async () => {
    if (!id) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Sesi login tidak ditemukan.");

      const { data, error } = await supabase
        .from("kendaraan")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Kendaraan tidak ditemukan atau tidak dapat dihapus.");
      }

      setConfirmDelete(false);

      router.replace("/(tabs)/kendaraan");
    } catch (error) {
      console.error("Gagal menghapus kendaraan:", error);

      setConfirmDelete(false);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus kendaraan.",
      );
    } finally {
      setDeleting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchDetail = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) throw userError;
          if (!user) throw new Error("Sesi login tidak ditemukan.");

          const { data, error } = await supabase
            .from("kendaraan")
            .select(
              "id, nama_motor, merek, model, nomor_polisi, jenis_motor, tahun, odometer_terbaru, tanggal_servis_terakhir",
            )
            .eq("id", id)
            .eq("owner_id", user.id)
            .single();

          if (error) throw error;

          setKendaraan(data);
          await fetchKomponen();
        } catch (error) {
          console.error("Gagal mengambil detail kendaraan:", error);
          setErrorMessage("Data kendaraan tidak dapat ditemukan.");
        } finally {
          setLoading(false);
        }
      };

      if (id) {
        fetchDetail();
      }

      return () => {};
    }, [id, fetchKomponen]),
  );

  const formatOdometer = (angka: number) => {
    return angka.toLocaleString("id-ID") + " km";
  };

  const formatTanggal = (tanggal: string | null) => {
    if (!tanggal) return "Belum diisi";

    const date = new Date(tanggal + "T00:00:00");

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderDetail = (label: string, value: string) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#0F766E" />
        </Pressable>

        <Text style={styles.headerTitle}>Detail Kendaraan</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.messageText}>Memuat detail kendaraan...</Text>
        </View>
      ) : errorMessage !== "" ? (
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={38} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>

          <Pressable
            style={styles.backToListButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToListText}>Kembali</Text>
          </Pressable>
        </View>
      ) : kendaraan ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Identitas Kendaraan */}
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="bicycle-outline" size={38} color="#0F766E" />
            </View>

            <Text style={styles.vehicleName}>{kendaraan.nama_motor}</Text>

            <Text style={styles.vehicleModel}>
              {kendaraan.merek} {kendaraan.model}
            </Text>

            <View style={styles.plateBadge}>
              <Ionicons name="card-outline" size={16} color="#0F766E" />
              <Text style={styles.plateText}>{kendaraan.nomor_polisi}</Text>
            </View>
          </View>

          {/* Informasi Kendaraan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Kendaraan</Text>

            <View style={styles.detailCard}>
              {renderDetail("Nama Kendaraan", kendaraan.nama_motor)}

              <View style={styles.divider} />

              {renderDetail("Merek", kendaraan.merek)}

              <View style={styles.divider} />

              {renderDetail("Model", kendaraan.model)}

              <View style={styles.divider} />

              {renderDetail("Nomor Polisi", kendaraan.nomor_polisi)}

              <View style={styles.divider} />

              {renderDetail(
                "Jenis Motor",
                kendaraan.jenis_motor || "Belum diisi",
              )}

              <View style={styles.divider} />

              {renderDetail(
                "Tahun Kendaraan",
                kendaraan.tahun ? String(kendaraan.tahun) : "Belum diisi",
              )}
            </View>
          </View>

          {/* Informasi Perawatan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Perawatan</Text>

            <View style={styles.detailCard}>
              <View style={styles.odometerContainer}>
                <View style={styles.odometerIcon}>
                  <Ionicons
                    name="speedometer-outline"
                    size={23}
                    color="#0F766E"
                  />
                </View>

                <View style={styles.odometerInfo}>
                  <Text style={styles.detailLabel}>Odometer Terbaru</Text>
                  <Text style={styles.odometerValue}>
                    {formatOdometer(kendaraan.odometer_terbaru)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {renderDetail(
                "Terakhir Servis",
                formatTanggal(
                  tanggalServisTerakhir ?? kendaraan.tanggal_servis_terakhir,
                ),
              )}
            </View>
          </View>

          {/* Komponen Perawatan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Komponen Perawatan</Text>

            {loadingKomponen ? (
              <View style={styles.componentMessageCard}>
                <ActivityIndicator size="small" color="#0F766E" />
                <Text style={styles.componentMessageText}>
                  Memuat komponen perawatan...
                </Text>
              </View>
            ) : komponenError ? (
              <View style={styles.componentMessageCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#DC2626"
                />
                <Text style={styles.componentErrorText}>{komponenError}</Text>
                <Pressable
                  style={styles.retryComponentButton}
                  onPress={fetchKomponen}
                >
                  <Text style={styles.retryComponentText}>Coba Lagi</Text>
                </Pressable>
              </View>
            ) : komponen.length === 0 ? (
              <View style={styles.componentMessageCard}>
                <Ionicons name="construct-outline" size={25} color="#0F766E" />
                <Text style={styles.componentMessageText}>
                  Belum ada komponen perawatan yang ditambahkan.
                </Text>
              </View>
            ) : (
              komponen.map((item) => (
                <View key={item.id} style={styles.componentCard}>
                  <Text style={styles.componentName}>{item.nama_komponen}</Text>

                  <View style={styles.componentIntervals}>
                    <View style={styles.componentInterval}>
                      <Ionicons
                        name="speedometer-outline"
                        size={16}
                        color="#0F766E"
                      />
                      <Text style={styles.componentIntervalText}>
                        {item.interval_km != null
                          ? `${item.interval_km.toLocaleString("id-ID")} km`
                          : "Interval km belum diatur"}
                      </Text>
                    </View>

                    <View style={styles.componentInterval}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#0F766E"
                      />
                      <Text style={styles.componentIntervalText}>
                        {item.interval_bulan != null
                          ? `${item.interval_bulan} bulan`
                          : "Interval bulan belum diatur"}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.recordServiceButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/catat-servis/[id]",
                        params: {
                          id: item.id,
                          kendaraanId: kendaraan.id,
                          odometer: String(kendaraan.odometer_terbaru),
                        },
                      })
                    }
                  >
                    <Ionicons name="build-outline" size={17} color="#FFFFFF" />
                    <Text style={styles.recordServiceButtonText}>
                      Catat Servis
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() =>
              router.push({
                pathname: "/edit-kendaraan/[id]",
                params: { id: id as string },
              })
            }
          >
            <Ionicons name="create-outline" size={19} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Kendaraan</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setConfirmDelete(true)}
          >
            <Ionicons name="trash-outline" size={19} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Hapus Kendaraan</Text>
          </Pressable>
        </ScrollView>
      ) : null}
      {/* Modal Konfirmasi Hapus */}
      <Modal
        visible={confirmDelete || deleteError !== ""}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setConfirmDelete(false);
            setDeleteError("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {deleteError !== "" ? (
              <>
                <View style={styles.modalIconError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={30}
                    color="#DC2626"
                  />
                </View>

                <Text style={styles.modalTitle}>Gagal Menghapus</Text>

                <Text style={styles.modalMessage}>{deleteError}</Text>

                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setDeleteError("")}
                >
                  <Text style={styles.modalCloseText}>Mengerti</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.modalIconDelete}>
                  <Ionicons name="trash-outline" size={30} color="#DC2626" />
                </View>

                <Text style={styles.modalTitle}>Hapus Kendaraan?</Text>

                <Text style={styles.modalMessage}>
                  Apakah kamu yakin ingin menghapus{" "}
                  <Text style={styles.modalBold}>{kendaraan?.nama_motor}</Text>?
                  {"\n\n"}
                  Seluruh data kendaraan, catatan odometer, komponen perawatan,
                  dan riwayat servis juga akan dihapus secara permanen.
                </Text>

                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.confirmDeleteButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleHapusKendaraan}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmDeleteText}>Ya, Hapus</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
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
    justifyContent: "center",
    alignItems: "center",
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
    paddingBottom: 35,
  },

  vehicleHeader: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginBottom: 25,
  },

  vehicleIcon: {
    width: 75,
    height: 75,
    borderRadius: 23,
    backgroundColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  vehicleName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#0F172A",
    textAlign: "center",
  },

  vehicleModel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },

  plateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },

  plateText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0F766E",
  },

  section: {
    marginBottom: 23,
  },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 12,
  },

  detailCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },

  componentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  componentName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 12,
  },

  componentIntervals: {
    gap: 9,
  },

  componentInterval: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F2F2",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  componentIntervalText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#334155",
  },

  componentMessageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  componentMessageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
  },

  componentErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#DC2626",
    textAlign: "center",
  },

  retryComponentButton: {
    backgroundColor: "#E0F2F2",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },

  retryComponentText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#0F766E",
  },

  detailItem: {
    paddingVertical: 13,
  },

  detailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },

  detailValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1E293B",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  odometerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },

  odometerIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  odometerInfo: {
    flex: 1,
  },

  odometerValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F766E",
  },

  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  messageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
  },

  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 12,
  },

  backToListButton: {
    marginTop: 18,
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 25,
    paddingVertical: 11,
    borderRadius: 25,
  },

  backToListText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0F766E",
  },
  editButton: {
    backgroundColor: "#0F766E",
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 5,
  },

  editButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },

  deleteButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },

  deleteButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#DC2626",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },

  modalIconDelete: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  modalIconError: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },

  modalMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 22,
  },

  modalBold: {
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },

  modalButtonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#475569",
  },

  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },

  confirmDeleteText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  modalCloseButton: {
    width: "100%",
    backgroundColor: "#0F766E",
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: "center",
  },

  modalCloseText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  recordServiceButton: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 14,
  },

  recordServiceButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
