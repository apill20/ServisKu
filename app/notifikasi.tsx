import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

type Kendaraan = {
  id: string;
  nama_motor: string;
  nomor_polisi: string;
  odometer_terbaru: number;
};

type Komponen = {
  id: string;
  kendaraan_id: string;
  nama_komponen: string;
  interval_km: number | null;
  interval_bulan: number | null;
};

type CatatanServis = {
  komponen_id: string;
  tanggal_servis: string;
  odometer: number;
};

type Notifikasi = {
  id: string;
  kendaraanId: string;
  namaKendaraan: string;
  nomorPolisi: string;
  namaKomponen: string;
  status: "Terlambat" | "Segera";
  keterangan: string;
  target: string;
};

const buatTanggal = (tanggal: string) => {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Date(tahun, bulan - 1, hari);
};

const tambahBulan = (tanggal: string, jumlahBulan: number) => {
  const awal = buatTanggal(tanggal);
  const hariAsli = awal.getDate();

  const hasil = new Date(awal.getFullYear(), awal.getMonth() + jumlahBulan, 1);

  const hariTerakhir = new Date(
    hasil.getFullYear(),
    hasil.getMonth() + 1,
    0,
  ).getDate();

  hasil.setDate(Math.min(hariAsli, hariTerakhir));
  return hasil;
};

const hitungSelisihHari = (tanggal: Date) => {
  const sekarang = new Date();

  const target = Date.UTC(
    tanggal.getFullYear(),
    tanggal.getMonth(),
    tanggal.getDate(),
  );

  const hariIni = Date.UTC(
    sekarang.getFullYear(),
    sekarang.getMonth(),
    sekarang.getDate(),
  );

  return Math.round((target - hariIni) / 86400000);
};

const formatTanggal = (tanggal: Date) =>
  tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function NotifikasiScreen() {
  const router = useRouter();

  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const ambilNotifikasi = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setNotifikasi([]);
        return;
      }

      // 1. Ambil kendaraan pengguna.
      const { data: dataKendaraan, error: kendaraanError } = await supabase
        .from("kendaraan")
        .select("id, nama_motor, nomor_polisi, odometer_terbaru")
        .eq("owner_id", user.id);

      if (kendaraanError) throw kendaraanError;

      const kendaraan = (dataKendaraan ?? []) as Kendaraan[];

      if (kendaraan.length === 0) {
        setNotifikasi([]);
        return;
      }

      // 2. Ambil komponen perawatan.
      const idsKendaraan = kendaraan.map((item) => item.id);

      const { data: dataKomponen, error: komponenError } = await supabase
        .from("komponen_perawatan")
        .select("id, kendaraan_id, nama_komponen, interval_km, interval_bulan")
        .in("kendaraan_id", idsKendaraan);

      if (komponenError) throw komponenError;

      const komponen = (dataKomponen ?? []) as Komponen[];

      if (komponen.length === 0) {
        setNotifikasi([]);
        return;
      }

      // 3. Ambil catatan servis.
      const idsKomponen = komponen.map((item) => item.id);

      const { data: dataServis, error: servisError } = await supabase
        .from("catatan_servis")
        .select("komponen_id, tanggal_servis, odometer")
        .in("komponen_id", idsKomponen)
        .order("tanggal_servis", { ascending: false });

      if (servisError) throw servisError;

      const servis = (dataServis ?? []) as CatatanServis[];

      // 4. Ambil catatan servis terbaru setiap komponen.
      const servisTerakhir = new Map<string, CatatanServis>();

      servis.forEach((item) => {
        if (!servisTerakhir.has(item.komponen_id)) {
          servisTerakhir.set(item.komponen_id, item);
        }
      });

      // 5. Hitung status dan buat daftar notifikasi.
      const hasil: Notifikasi[] = [];

      komponen.forEach((item) => {
        const motor = kendaraan.find(
          (kendaraanItem) => kendaraanItem.id === item.kendaraan_id,
        );

        if (!motor) return;

        const riwayat = servisTerakhir.get(item.id);

        // Belum ada riwayat servis, belum menjadi notifikasi.
        if (!riwayat) return;

        const intervalKm =
          item.interval_km && item.interval_km > 0 ? item.interval_km : null;

        const intervalBulan =
          item.interval_bulan && item.interval_bulan > 0
            ? item.interval_bulan
            : null;

        if (!intervalKm && !intervalBulan) return;

        let sisaKm: number | null = null;
        let sisaHari: number | null = null;

        const keterangan: string[] = [];
        const target: string[] = [];

        if (intervalKm !== null) {
          const targetKm = riwayat.odometer + intervalKm;
          sisaKm = targetKm - motor.odometer_terbaru;

          target.push(`Target ${targetKm.toLocaleString("id-ID")} km`);

          if (sisaKm < 0) {
            keterangan.push(
              `Terlambat ${Math.abs(sisaKm).toLocaleString("id-ID")} km`,
            );
          } else if (sisaKm === 0) {
            keterangan.push("Batas kilometer tercapai");
          } else {
            keterangan.push(`Sisa ${sisaKm.toLocaleString("id-ID")} km`);
          }
        }

        if (intervalBulan !== null) {
          const tanggalTarget = tambahBulan(
            riwayat.tanggal_servis,
            intervalBulan,
          );

          sisaHari = hitungSelisihHari(tanggalTarget);

          target.push(`Jadwal ${formatTanggal(tanggalTarget)}`);

          if (sisaHari < 0) {
            keterangan.push(`Terlambat ${Math.abs(sisaHari)} hari`);
          } else if (sisaHari === 0) {
            keterangan.push("Batas waktu tercapai");
          } else {
            keterangan.push(`Sisa ${sisaHari} hari`);
          }
        }

        const terlambat =
          (sisaKm !== null && sisaKm <= 0) ||
          (sisaHari !== null && sisaHari <= 0);

        const segera =
          (sisaKm !== null &&
            intervalKm !== null &&
            sisaKm > 0 &&
            sisaKm <= intervalKm * 0.15) ||
          (sisaHari !== null && sisaHari > 0 && sisaHari <= 14);

        if (!terlambat && !segera) return;

        hasil.push({
          id: item.id,
          kendaraanId: motor.id,
          namaKendaraan: motor.nama_motor,
          nomorPolisi: motor.nomor_polisi,
          namaKomponen: item.nama_komponen,
          status: terlambat ? "Terlambat" : "Segera",
          keterangan: keterangan.join(" • "),
          target: target.join(" • "),
        });
      });

      // Notifikasi terlambat ditampilkan lebih dahulu.
      hasil.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "Terlambat" ? -1 : 1;
      });

      setNotifikasi(hasil);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
      setErrorMessage(
        "Gagal memuat notifikasi. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      ambilNotifikasi();
    }, [ambilNotifikasi]),
  );

  const jumlahTerlambat = notifikasi.filter(
    (item) => item.status === "Terlambat",
  ).length;

  const jumlahSegera = notifikasi.filter(
    (item) => item.status === "Segera",
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#0F766E" />
          </Pressable>

          <Text style={styles.headerTitle}>Notifikasi</Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={ambilNotifikasi}>
          <Ionicons name="refresh-outline" size={21} color="#0F766E" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>Pengingat Perawatan</Text>
          <Text style={styles.subtitle}>
            Pantau komponen motor yang sudah waktunya atau hampir waktunya
            diservis.
          </Text>
        </View>

        {/* RINGKASAN */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconRed}>
              <Ionicons name="alert-circle-outline" size={21} color="#DC2626" />
            </View>
            <Text style={styles.summaryNumber}>{jumlahTerlambat}</Text>
            <Text style={styles.summaryLabel}>Terlambat</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconYellow}>
              <Ionicons name="time-outline" size={21} color="#D97706" />
            </View>
            <Text style={styles.summaryNumber}>{jumlahSegera}</Text>
            <Text style={styles.summaryLabel}>Segera</Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Daftar Pengingat</Text>
          <Text style={styles.totalText}>{notifikasi.length} pengingat</Text>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.emptyDescription}>Memuat notifikasi...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
            <Text style={styles.emptyTitle}>Gagal memuat data</Text>
            <Text style={styles.emptyDescription}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={ambilNotifikasi}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : notifikasi.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={38}
                color="#0F766E"
              />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
            <Text style={styles.emptyDescription}>
              Saat ada komponen yang terlambat atau mendekati jadwal perawatan,
              pengingatnya akan muncul di sini.
            </Text>
          </View>
        ) : (
          notifikasi.map((item) => {
            const terlambat = item.status === "Terlambat";

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.notificationCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/detail-kendaraan/[id]",
                    params: { id: item.kendaraanId },
                  })
                }
              >
                <View
                  style={[
                    styles.notificationIcon,
                    {
                      backgroundColor: terlambat ? "#FEE2E2" : "#FEF3C7",
                    },
                  ]}
                >
                  <Ionicons
                    name={terlambat ? "alert-circle-outline" : "time-outline"}
                    size={24}
                    color={terlambat ? "#DC2626" : "#D97706"}
                  />
                </View>

                <View style={styles.notificationInfo}>
                  <View style={styles.notificationTop}>
                    <Text style={styles.notificationName}>
                      {item.namaKomponen}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: terlambat ? "#FEE2E2" : "#FEF3C7",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: terlambat ? "#DC2626" : "#D97706",
                          },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.vehicleName}>
                    {item.namaKendaraan} • {item.nomorPolisi}
                  </Text>

                  <Text style={styles.description}>{item.keterangan}</Text>

                  <Text style={styles.target}>{item.target}</Text>
                </View>

                <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#E0F2F2",
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0F2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    color: "#0F766E",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    backgroundColor: "#F8FAFC",
  },
  intro: {
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    color: "#0F172A",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
  },
  summary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  summaryIconRed: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIconYellow: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#0F172A",
  },
  summaryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#64748B",
  },
  summaryDivider: {
    width: 1,
    height: 75,
    backgroundColor: "#E2E8F0",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  listTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
  },
  totalText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#64748B",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardPressed: {
    backgroundColor: "#F1F5F9",
    transform: [{ scale: 0.99 }],
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationInfo: {
    flex: 1,
    gap: 5,
  },
  notificationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  notificationName: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
  },
  vehicleName: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#475569",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
    lineHeight: 17,
  },
  target: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#0F766E",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 190,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
    textAlign: "center",
  },
  emptyDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0F766E",
    marginTop: 5,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
});
