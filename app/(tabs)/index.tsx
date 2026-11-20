import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import ScooterIllustration from "../../components/ScooterIllustration";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMotorcycle } from "@fortawesome/free-solid-svg-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  mintaIzinNotifikasi,
  periksaPengingatKilometer,
} from "../../lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import PetaBengkel from "../../components/PetaBengkel";

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

type StatusPerawatan = {
  id: string;
  kendaraanId: string;
  namaKendaraan: string;
  namaKomponen: string;
  status:
    | "Terlambat"
    | "Segera"
    | "Aman"
    | "Belum Ada Riwayat"
    | "Interval Belum Diatur";
  keterangan: string;
  target: string;
  sisaHari: number | null;
  sisaKm: number | null;
};

// Mengubah tanggal menjadi tanggal lokal.
const buatTanggal = (tanggal: string) => {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Date(tahun, bulan - 1, hari);
};

// Format tanggal untuk ditampilkan.
const formatTanggal = (tanggal: Date) =>
  tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Menghitung tanggal servis berikutnya berdasarkan interval bulan.
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

// Menghitung selisih hari tanpa masalah perubahan jam.
const hitungSelisihHari = (tanggal: Date) => {
  const sekarang = new Date();

  const tanggalTarget = Date.UTC(
    tanggal.getFullYear(),
    tanggal.getMonth(),
    tanggal.getDate(),
  );

  const tanggalSekarang = Date.UTC(
    sekarang.getFullYear(),
    sekarang.getMonth(),
    sekarang.getDate(),
  );

  return Math.round((tanggalTarget - tanggalSekarang) / (1000 * 60 * 60 * 24));
};

const warnaStatus = (status: StatusPerawatan["status"]) => {
  switch (status) {
    case "Terlambat":
      return {
        background: "#FEE2E2",
        text: "#DC2626",
        icon: "#DC2626",
      };
    case "Segera":
      return {
        background: "#FEF3C7",
        text: "#D97706",
        icon: "#D97706",
      };
    case "Aman":
      return {
        background: "#CCFBF1",
        text: "#0F766E",
        icon: "#0F766E",
      };
    case "Belum Ada Riwayat":
      return {
        background: "#E2E8F0",
        text: "#475569",
        icon: "#64748B",
      };
    default:
      return {
        background: "#EDE9FE",
        text: "#7C3AED",
        icon: "#7C3AED",
      };
  }
};

export default function HomeScreen() {
  const [username, setUsername] = useState("Pengendara");
  const router = useRouter();
  const [modalInfoVisible, setModalInfoVisible] = useState(false);

  const [kendaraan, setKendaraan] = useState<Kendaraan[]>([]);
  const [daftarStatus, setDaftarStatus] = useState<StatusPerawatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [lokasiPeta, setLokasiPeta] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [statusDiperluas, setStatusDiperluas] = useState(false);
  const [jadwalDiperluas, setJadwalDiperluas] = useState(false);

  useEffect(() => {
    const ambilNamaPengguna = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }

      const nama = user?.user_metadata?.nama;

      setUsername(
        typeof nama === "string" && nama.trim() ? nama.trim() : "Pengendara",
      );
    };

    mintaIzinNotifikasi();
    ambilNamaPengguna();
  }, []);

  const fetchDashboard = useCallback(
    async (isActive: () => boolean = () => true) => {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (isActive()) {
            setKendaraan([]);
            setDaftarStatus([]);
          }
          return;
        }

        // 1. Mengambil data kendaraan milik pengguna.
        const { data: dataKendaraan, error: kendaraanError } = await supabase
          .from("kendaraan")
          .select("id, nama_motor, nomor_polisi, odometer_terbaru")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (kendaraanError) throw kendaraanError;

        const daftarKendaraan = (dataKendaraan ?? []) as Kendaraan[];

        if (!isActive()) return;

        setKendaraan(daftarKendaraan);

        if (daftarKendaraan.length === 0) {
          setDaftarStatus([]);
          return;
        }

        const daftarIdKendaraan = daftarKendaraan.map((item) => item.id);

        // 2. Mengambil semua komponen perawatan kendaraan.
        const { data: dataKomponen, error: komponenError } = await supabase
          .from("komponen_perawatan")
          .select(
            "id, kendaraan_id, nama_komponen, interval_km, interval_bulan",
          )
          .in("kendaraan_id", daftarIdKendaraan);

        if (komponenError) throw komponenError;

        const daftarKomponen = (dataKomponen ?? []) as Komponen[];

        if (!isActive()) return;

        if (daftarKomponen.length === 0) {
          setDaftarStatus([]);
          return;
        }

        const daftarIdKomponen = daftarKomponen.map((item) => item.id);

        // 3. Mengambil catatan servis seluruh komponen.
        const { data: dataServis, error: servisError } = await supabase
          .from("catatan_servis")
          .select("komponen_id, tanggal_servis, odometer")
          .in("komponen_id", daftarIdKomponen)
          .order("tanggal_servis", { ascending: false });

        if (servisError) throw servisError;

        if (!isActive()) return;

        const daftarServis = (dataServis ?? []) as CatatanServis[];

        // 4. Menyimpan catatan servis terbaru untuk setiap komponen.
        const servisTerakhir = new Map<string, CatatanServis>();

        daftarServis.forEach((item) => {
          if (!servisTerakhir.has(item.komponen_id)) {
            servisTerakhir.set(item.komponen_id, item);
          }
        });

        // 5. Menghitung status setiap komponen.
        const hasilStatus: StatusPerawatan[] = [];
        const daftarPengingatKilometer: {
          componentId: string;
          namaKomponen: string;
          namaMotor: string;
          status: "aman" | "segera" | "terlambat" | "belum";
        }[] = [];

        daftarKomponen.forEach((komponen) => {
          const kendaraanItem = daftarKendaraan.find(
            (item) => item.id === komponen.kendaraan_id,
          );

          if (!kendaraanItem) return;

          const servis = servisTerakhir.get(komponen.id);

          // Komponen belum pernah dicatat servis.
          if (!servis) {
            daftarPengingatKilometer.push({
              componentId: komponen.id,
              namaKomponen: komponen.nama_komponen,
              namaMotor: kendaraanItem.nama_motor,
              status: "belum",
            });

            hasilStatus.push({
              id: komponen.id,
              kendaraanId: kendaraanItem.id,
              namaKendaraan: kendaraanItem.nama_motor,
              namaKomponen: komponen.nama_komponen,
              status: "Belum Ada Riwayat",
              keterangan: "Belum ada catatan servis untuk komponen ini.",
              target: "Catat servis pertama",
              sisaHari: null,
              sisaKm: null,
            });
            return;
          }

          const intervalKm =
            komponen.interval_km && komponen.interval_km > 0
              ? komponen.interval_km
              : null;

          const intervalBulan =
            komponen.interval_bulan && komponen.interval_bulan > 0
              ? komponen.interval_bulan
              : null;

          // Riwayat ada, tetapi interval belum diatur.
          if (!intervalKm && !intervalBulan) {
            daftarPengingatKilometer.push({
              componentId: komponen.id,
              namaKomponen: komponen.nama_komponen,
              namaMotor: kendaraanItem.nama_motor,
              status: "belum",
            });

            hasilStatus.push({
              id: komponen.id,
              kendaraanId: kendaraanItem.id,
              namaKendaraan: kendaraanItem.nama_motor,
              namaKomponen: komponen.nama_komponen,
              status: "Interval Belum Diatur",
              keterangan: "Atur interval perawatan untuk memantau komponen.",
              target: "Interval belum tersedia",
              sisaHari: null,
              sisaKm: null,
            });
            return;
          }

          let sisaKm: number | null = null;
          let sisaHari: number | null = null;

          const target: string[] = [];
          const keterangan: string[] = [];

          // Perhitungan berdasarkan kilometer.
          if (intervalKm !== null) {
            const targetKm = servis.odometer + intervalKm;

            sisaKm = targetKm - kendaraanItem.odometer_terbaru;

            target.push(`Target ${targetKm.toLocaleString("id-ID")} km`);

            if (sisaKm < 0) {
              keterangan.push(
                `Lewat ${Math.abs(sisaKm).toLocaleString("id-ID")} km`,
              );
            } else if (sisaKm === 0) {
              keterangan.push("Batas kilometer tercapai");
            } else {
              keterangan.push(`Sisa ${sisaKm.toLocaleString("id-ID")} km`);
            }
          }

          // Perhitungan berdasarkan bulan.
          if (intervalBulan !== null) {
            const tanggalTarget = tambahBulan(
              servis.tanggal_servis,
              intervalBulan,
            );

            sisaHari = hitungSelisihHari(tanggalTarget);

            target.push(`Perkiraan ${formatTanggal(tanggalTarget)}`);

            if (sisaHari < 0) {
              keterangan.push(`Lewat ${Math.abs(sisaHari)} hari`);
            } else if (sisaHari === 0) {
              keterangan.push("Batas waktu tercapai");
            } else {
              keterangan.push(`Sisa ${sisaHari} hari`);
            }
          }

          // Menentukan status berdasarkan batas kilometer atau waktu.
          const terlambat =
            (sisaKm !== null && sisaKm <= 0) ||
            (sisaHari !== null && sisaHari <= 0);

          const segera =
            (sisaKm !== null &&
              intervalKm !== null &&
              sisaKm > 0 &&
              sisaKm <= intervalKm * 0.15) ||
            (sisaHari !== null && sisaHari > 0 && sisaHari <= 14);

          const status: StatusPerawatan["status"] = terlambat
            ? "Terlambat"
            : segera
              ? "Segera"
              : "Aman";

          // Status kilometer diperiksa terpisah dari status tanggal.
          const statusPengingat: "aman" | "segera" | "terlambat" =
            status === "Terlambat"
              ? "terlambat"
              : status === "Segera"
                ? "segera"
                : "aman";

          daftarPengingatKilometer.push({
            componentId: komponen.id,
            namaKomponen: komponen.nama_komponen,
            namaMotor: kendaraanItem.nama_motor,
            status: statusPengingat,
          });

          hasilStatus.push({
            id: komponen.id,
            kendaraanId: kendaraanItem.id,
            namaKendaraan: kendaraanItem.nama_motor,
            namaKomponen: komponen.nama_komponen,
            status,
            keterangan: keterangan.join(" • "),
            target: target.join(" • "),
            sisaHari,
            sisaKm,
          });
        });

        if (isActive()) {
          setDaftarStatus(hasilStatus);

          // Memeriksa pengingat satu per satu agar permintaan izin tidak bentrok.
          try {
            for (const item of daftarPengingatKilometer) {
              await periksaPengingatKilometer(item);
            }
          } catch (error) {
            console.error("Gagal memperbarui pengingat kilometer:", error);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil status perawatan:", error);

        if (isActive()) {
          setErrorMessage("Gagal memuat data. Periksa koneksi dan coba lagi.");
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [],
  );

  // Memuat ulang data setiap kali Beranda dibuka kembali.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      fetchDashboard(() => isActive);

      const ambilLokasi = async () => {
        try {
          const izinSaatIni = await Location.getForegroundPermissionsAsync();

          let statusIzin = izinSaatIni.status;

          if (statusIzin !== "granted" && izinSaatIni.canAskAgain) {
            const hasilIzin =
              await Location.requestForegroundPermissionsAsync();

            statusIzin = hasilIzin.status;
          }

          if (statusIzin !== "granted") return;

          const posisi = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (isActive) {
            setLokasiPeta({
              latitude: posisi.coords.latitude,
              longitude: posisi.coords.longitude,
            });
          }
        } catch (error) {
          console.error("Gagal mengambil lokasi Beranda:", error);
        }
      };

      ambilLokasi();

      return () => {
        isActive = false;
      };
    }, [fetchDashboard]),
  );

  const formatOdometer = (angka: number) =>
    `${angka.toLocaleString("id-ID")} km`;

  const jumlahTerlambat = daftarStatus.filter(
    (item) => item.status === "Terlambat",
  ).length;

  const jumlahSegera = daftarStatus.filter(
    (item) => item.status === "Segera",
  ).length;

  const jumlahNotifikasi = jumlahTerlambat + jumlahSegera;

  const jumlahAman = daftarStatus.filter(
    (item) => item.status === "Aman",
  ).length;

  // Komponen yang sudah memiliki riwayat dan interval perawatan.
  const jadwalBerikutnya = [...daftarStatus]
    .filter(
      (item) =>
        item.status !== "Belum Ada Riwayat" &&
        item.status !== "Interval Belum Diatur",
    )
    .sort((a, b) => {
      const urutan = {
        Terlambat: 0,
        Segera: 1,
        Aman: 2,
        "Belum Ada Riwayat": 3,
        "Interval Belum Diatur": 4,
      };

      return urutan[a.status] - urutan[b.status];
    });

  // Maksimal 10 card untuk masing-masing bagian.
  const statusUtama = daftarStatus.slice(0, 3);
  const statusTambahan = daftarStatus.slice(3, 10);

  const jadwalUtama = jadwalBerikutnya.slice(0, 3);
  const jadwalTambahan = jadwalBerikutnya.slice(3, 10);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER TETAP DI ATAS */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ServisKu</Text>
            <Text style={styles.headerSubtitle}>
              Pengingat perawatan motormu
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push("/notifikasi")}
          >
            <Ionicons name="notifications-outline" size={22} color="#0F766E" />

            {jumlahNotifikasi > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {jumlahNotifikasi > 99 ? "99+" : jumlahNotifikasi}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* BAGIAN YANG BISA DI-SCROLL */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SAPAAN DAN ILUSTRASI */}
        <View style={styles.hero}>
          <View style={styles.greetingRow}>
            <View style={styles.greeting}>
              <Text style={styles.greetingTitle}>Halo, {username}!</Text>

              <Text style={styles.greetingDescription}>
                Yuk, pastikan motormu selalu dalam kondisi prima dengan
                melakukan perawatan rutin.
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <ScooterIllustration width={150} height={100} />
            </View>
          </View>
        </View>

        {/* KENDARAAN SAYA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kendaraan Saya</Text>
            <Pressable onPress={() => router.push("/(tabs)/kendaraan")}>
              <Text style={styles.link}>Lihat Semua</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.mutedText}>Memuat kendaraan...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />
              <Text style={styles.mutedText}>{errorMessage}</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => fetchDashboard()}
              >
                <Text style={styles.primaryButtonText}>Coba Lagi</Text>
              </Pressable>
            </View>
          ) : kendaraan.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIllustrationCircle}>
                <ScooterIllustration width={76} height={52} />
              </View>
              <Text style={styles.emptyVehicleTitle}>Belum ada kendaraan</Text>
              <Text style={styles.emptyVehicleDescription}>
                Tambahkan kendaraan untuk mulai memantau perawatan motormu.
              </Text>
              <Pressable
                style={styles.addVehicleButton}
                onPress={() => router.push("/tambah-kendaraan")}
              >
                <Ionicons name="add" size={21} color="#FFFFFF" />
                <Text style={styles.addVehicleButtonText}>
                  Tambah Kendaraan
                </Text>
              </Pressable>
            </View>
          ) : (
            kendaraan.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.vehicleCard,
                  pressed && styles.vehicleCardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/detail-kendaraan/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.vehicleIcon}>
                  <FontAwesomeIcon
                    icon={faMotorcycle}
                    size={35}
                    color="#0F766E"
                  />
                </View>

                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{item.nama_motor}</Text>
                  <Text style={styles.vehiclePlate}>{item.nomor_polisi}</Text>
                  <Text style={styles.vehicleDistance}>
                    <Ionicons name="speedometer-outline" size={13} />{" "}
                    {formatOdometer(item.odometer_terbaru)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </Pressable>
            ))
          )}
        </View>

        {/* STATUS PERAWATAN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Status Perawatan</Text>
            <Pressable
              onPress={() => setModalInfoVisible(true)}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#0F766E"
              />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.mutedText}>Memuat status perawatan...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
              <Text style={styles.mutedText}>{errorMessage}</Text>
            </View>
          ) : kendaraan.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="information-circle-outline"
                size={30}
                color="#0F766E"
              />
              <Text style={styles.cardTitle}>Belum ada kendaraan</Text>
              <Text style={styles.mutedText}>
                Tambahkan kendaraan untuk mulai memantau status perawatan.
              </Text>
            </View>
          ) : daftarStatus.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="construct-outline" size={30} color="#0F766E" />
              <Text style={styles.cardTitle}>Belum ada komponen perawatan</Text>
              <Text style={styles.mutedText}>
                Komponen perawatan belum tersedia pada kendaraanmu.
              </Text>
            </View>
          ) : (
            <>
              {/* RINGKASAN STATUS */}
              <View style={styles.statusSummaryCard}>
                <View style={styles.statusSummaryTop}>
                  <View style={styles.statusSummaryIcon}>
                    <Ionicons
                      name="analytics-outline"
                      size={25}
                      color="#0F766E"
                    />
                  </View>

                  <View style={styles.statusSummaryInfo}>
                    <Text style={styles.statusSummaryLabel}>
                      Ringkasan kondisi komponen
                    </Text>
                    <Text style={styles.statusSummaryTitle}>
                      {jumlahTerlambat > 0
                        ? "Ada perawatan yang terlambat"
                        : jumlahSegera > 0
                          ? "Ada perawatan yang perlu diperhatikan"
                          : "Kondisi perawatan terpantau"}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusCountContainer}>
                  <View style={styles.statusCountItem}>
                    <Text
                      style={[styles.statusCountNumber, { color: "#DC2626" }]}
                    >
                      {jumlahTerlambat}
                    </Text>
                    <Text style={styles.statusCountLabel}>Terlambat</Text>
                  </View>

                  <View style={styles.statusCountDivider} />

                  <View style={styles.statusCountItem}>
                    <Text
                      style={[styles.statusCountNumber, { color: "#D97706" }]}
                    >
                      {jumlahSegera}
                    </Text>
                    <Text style={styles.statusCountLabel}>Segera</Text>
                  </View>

                  <View style={styles.statusCountDivider} />

                  <View style={styles.statusCountItem}>
                    <Text
                      style={[styles.statusCountNumber, { color: "#0F766E" }]}
                    >
                      {jumlahAman}
                    </Text>
                    <Text style={styles.statusCountLabel}>Aman</Text>
                  </View>
                </View>
              </View>

              {/* CARD STATUS PERTAMA */}
              {statusUtama.map((item) => {
                const warna = warnaStatus(item.status);

                return (
                  <Pressable
                    key={item.id}
                    style={styles.maintenanceCard}
                    onPress={() =>
                      router.push({
                        pathname: "/detail-kendaraan/[id]",
                        params: { id: item.kendaraanId },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.maintenanceIcon,
                        { backgroundColor: warna.background },
                      ]}
                    >
                      <Ionicons
                        name="construct-outline"
                        size={21}
                        color={warna.icon}
                      />
                    </View>

                    <View style={styles.maintenanceInfo}>
                      <Text style={styles.maintenanceName}>
                        {item.namaKomponen}
                      </Text>
                      <Text style={styles.maintenanceDescription}>
                        {item.namaKendaraan}
                      </Text>
                      <Text style={styles.maintenanceDescription}>
                        {item.keterangan}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: warna.background },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: warna.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              {/* TOMBOL LIHAT LAINNYA */}
              {statusTambahan.length > 0 && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => setStatusDiperluas(!statusDiperluas)}
                >
                  <Text style={styles.seeMoreText}>
                    {statusDiperluas ? "Lihat lebih sedikit" : "Lihat lainnya"}
                  </Text>
                  <Ionicons
                    name={statusDiperluas ? "chevron-up" : "chevron-down"}
                    size={17}
                    color="#0F766E"
                  />
                </Pressable>
              )}

              {/* CARD STATUS TAMBAHAN, BISA DIGESER */}
              {statusDiperluas && statusTambahan.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardContainer}
                >
                  {statusTambahan.map((item) => {
                    const warna = warnaStatus(item.status);

                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.maintenanceCard,
                          styles.horizontalMaintenanceCard,
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
                            styles.maintenanceIcon,
                            { backgroundColor: warna.background },
                          ]}
                        >
                          <Ionicons
                            name="construct-outline"
                            size={21}
                            color={warna.icon}
                          />
                        </View>

                        <View style={styles.maintenanceInfo}>
                          <Text style={styles.maintenanceName}>
                            {item.namaKomponen}
                          </Text>
                          <Text style={styles.maintenanceDescription}>
                            {item.namaKendaraan}
                          </Text>
                          <Text style={styles.maintenanceDescription}>
                            {item.keterangan}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: warna.background },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: warna.text }]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* JADWAL SERVIS BERIKUTNYA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jadwal Servis Berikutnya</Text>

            <Pressable onPress={() => router.push("/(tabs)/riwayat")}>
              <Text style={styles.link}>Lihat Semua</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.mutedText}>Memuat jadwal servis...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyCard}>
              <Text style={styles.mutedText}>{errorMessage}</Text>
            </View>
          ) : jadwalBerikutnya.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={30} color="#0F766E" />
              <Text style={styles.cardTitle}>Belum ada jadwal servis</Text>
              <Text style={styles.mutedText}>
                Jadwal akan muncul setelah komponen memiliki catatan servis dan
                interval perawatan.
              </Text>
            </View>
          ) : (
            <>
              {/* CARD JADWAL PERTAMA */}
              {jadwalUtama.map((item) => {
                const warna = warnaStatus(item.status);

                return (
                  <Pressable
                    key={item.id}
                    style={styles.scheduleCard}
                    onPress={() =>
                      router.push({
                        pathname: "/detail-kendaraan/[id]",
                        params: { id: item.kendaraanId },
                      })
                    }
                  >
                    <View style={styles.scheduleIcon}>
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color="#0F766E"
                      />
                    </View>

                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleName}>
                        {item.namaKomponen} - {item.namaKendaraan}
                      </Text>

                      <Text style={styles.maintenanceDescription}>
                        {item.target}
                      </Text>

                      <Text
                        style={[styles.scheduleTarget, { color: warna.text }]}
                      >
                        {item.status}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={warna.text}
                    />
                  </Pressable>
                );
              })}

              {/* TOMBOL LIHAT LAINNYA */}
              {jadwalTambahan.length > 0 && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => setJadwalDiperluas(!jadwalDiperluas)}
                >
                  <Text style={styles.seeMoreText}>
                    {jadwalDiperluas ? "Lihat lebih sedikit" : "Lihat lainnya"}
                  </Text>
                  <Ionicons
                    name={jadwalDiperluas ? "chevron-up" : "chevron-down"}
                    size={17}
                    color="#0F766E"
                  />
                </Pressable>
              )}

              {/* CARD JADWAL TAMBAHAN, BISA DIGESER */}
              {jadwalDiperluas && jadwalTambahan.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardContainer}
                >
                  {jadwalTambahan.map((item) => {
                    const warna = warnaStatus(item.status);

                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.scheduleCard,
                          styles.horizontalScheduleCard,
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/detail-kendaraan/[id]",
                            params: { id: item.kendaraanId },
                          })
                        }
                      >
                        <View style={styles.scheduleIcon}>
                          <Ionicons
                            name="calendar-outline"
                            size={22}
                            color="#0F766E"
                          />
                        </View>

                        <View style={styles.scheduleInfo}>
                          <Text style={styles.scheduleName}>
                            {item.namaKomponen} - {item.namaKendaraan}
                          </Text>

                          <Text style={styles.maintenanceDescription}>
                            {item.target}
                          </Text>

                          <Text
                            style={[
                              styles.scheduleTarget,
                              { color: warna.text },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={warna.text}
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* CARI BENGKEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cari Bengkel</Text>

          <View style={styles.workshopCard}>
            <View style={styles.mapPreview}>
              {lokasiPeta ? (
                <PetaBengkel
                  latitude={lokasiPeta.latitude}
                  longitude={lokasiPeta.longitude}
                  bengkel={[]}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={40} color="#0F766E" />
                  <Text style={styles.mapText}>Peta belum tersedia</Text>
                  <Text style={styles.mutedText}>
                    Izinkan akses lokasi untuk menampilkan peta.
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.workshopTitle}>
              Temukan bengkel di sekitarmu
            </Text>
            <Text style={styles.mutedText}>
              Cari bengkel terdekat untuk melakukan perawatan kendaraan.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/bengkel")}
            >
              <Ionicons name="location-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Cari Bengkel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* MODAL INFO STATUS PERAWATAN */}
      <Modal
        visible={modalInfoVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Area gelap di luar sheet untuk menutup modal */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalInfoVisible(false)}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Keterangan Status Perawatan</Text>

            <Text style={styles.modalDescription}>
              Status dihitung otomatis dari odometer terbaru kendaraan dan
              catatan servis terakhir di tab{" "}
              <Text style={styles.modalBold}>Riwayat</Text>.
            </Text>

            <View style={styles.modalList}>
              {/* Terlambat */}
              <View style={styles.modalStatusItem}>
                <View
                  style={[
                    styles.modalStatusIcon,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                </View>
                <View style={styles.modalStatusTextWrap}>
                  <Text style={[styles.modalStatusTitle, { color: "#DC2626" }]}>
                    Terlambat
                  </Text>
                  <Text style={styles.modalText}>
                    Sudah mencapai atau melewati batas kilometer (≤ 0 km) maupun
                    tenggat waktu (≤ 0 hari).
                  </Text>
                </View>
              </View>

              {/* Segera */}
              <View style={styles.modalStatusItem}>
                <View
                  style={[
                    styles.modalStatusIcon,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons name="time" size={20} color="#D97706" />
                </View>
                <View style={styles.modalStatusTextWrap}>
                  <Text style={[styles.modalStatusTitle, { color: "#D97706" }]}>
                    Segera
                  </Text>
                  <Text style={styles.modalText}>
                    Mendekati jadwal servis, yaitu sisa jarak ≤ 15% dari
                    interval km atau sisa waktu ≤ 14 hari.
                  </Text>
                </View>
              </View>

              {/* Aman */}
              <View style={styles.modalStatusItem}>
                <View
                  style={[
                    styles.modalStatusIcon,
                    { backgroundColor: "#CCFBF1" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#0F766E" />
                </View>
                <View style={styles.modalStatusTextWrap}>
                  <Text style={[styles.modalStatusTitle, { color: "#0F766E" }]}>
                    Aman
                  </Text>
                  <Text style={styles.modalText}>
                    Kondisi komponen masih di atas 15% batas kilometer dan lebih
                    dari 14 hari sebelum servis berikutnya.
                  </Text>
                </View>
              </View>
            </View>

            {/* Catatan Status Tambahan */}
            <View style={styles.modalNoteBox}>
              <Ionicons
                name="information-circle"
                size={18}
                color="#0F766E"
                style={{ marginTop: 1 }}
              />
              <Text style={styles.modalNoteText}>
                Komponen tanpa catatan akan berstatus{" "}
                <Text style={styles.modalBold}>Belum Ada Riwayat</Text>, dan
                yang belum memiliki patokan jarak/waktu berstatus{" "}
                <Text style={styles.modalBold}>Interval Belum Diatur</Text>.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setModalInfoVisible(false)}
            >
              <Text style={styles.modalButtonText}>Mengerti</Text>
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
    backgroundColor: "#E0F2F2",
  },

  // Header yang tidak ikut bergulir.
  fixedHeader: {
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 14,
  },

  scrollArea: {
    flex: 1,
  },

  content: {
    paddingBottom: 35,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    backgroundColor: "#F8FAFC",
  },

  // Bagian sapaan tetap berada di area scroll.
  hero: {
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 27,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  header: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },

  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    color: "#0F766E",
  },

  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    borderWidth: 1.5,
    borderColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  notificationBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
    textAlign: "center",
  },

  greetingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#0F172A",
  },

  greetingDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
    maxWidth: 420,
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#0F172A",
  },

  link: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#0F766E",
  },

  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 13,
    marginBottom: 10,
  },

  vehicleCardPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.99 }],
  },

  vehicleIcon: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
  },

  vehicleInfo: {
    flex: 1,
    gap: 4,
  },

  vehicleName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0F172A",
  },

  vehiclePlate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
  },

  vehicleDistance: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#0F766E",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 25,
    alignItems: "center",
    gap: 10,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyIllustrationCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyVehicleTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 5,
  },

  emptyVehicleDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#94A3B8",
    textAlign: "center",
  },

  addVehicleButton: {
    width: "100%",
    maxWidth: 230,
    backgroundColor: "#0F766E",
    borderRadius: 30,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },

  addVehicleButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
    textAlign: "center",
  },

  mutedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 13,
    marginTop: 8,
  },

  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  maintenanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0F2F2",
    gap: 11,
  },

  maintenanceIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  maintenanceInfo: {
    flex: 1,
    gap: 4,
  },

  maintenanceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0F172A",
  },

  maintenanceDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textAlign: "center",
  },

  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0F2F2",
    gap: 12,
    marginBottom: 10,
  },

  scheduleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleInfo: {
    flex: 1,
    gap: 5,
  },

  scheduleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0F172A",
  },

  workshopCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  mapPlaceholder: {
    height: 130,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 15,
  },

  mapText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#0F766E",
  },

  workshopTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 5,
  },

  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  greeting: {
    flex: 1,
    gap: 7,
  },

  illustrationContainer: {
    width: 120,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: 0 }],
  },

  statusSummaryCard: {
    backgroundColor: "#E0F2F2",
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFE5E0",
    marginBottom: 12,
  },

  statusSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },

  statusSummaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  statusSummaryInfo: {
    flex: 1,
    gap: 3,
  },

  statusSummaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
  },

  statusSummaryTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0F172A",
  },

  statusCountContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
  },

  statusCountItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  statusCountNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
  },

  statusCountLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#64748B",
  },

  statusCountDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },

  scheduleTarget: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#0F766E",
    marginTop: 3,
  },

  seeMoreButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 5,
  },

  seeMoreText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#0F766E",
  },

  horizontalCardContainer: {
    paddingBottom: 5,
    paddingRight: 10,
  },

  horizontalMaintenanceCard: {
    width: 300,
    marginRight: 10,
  },

  horizontalScheduleCard: {
    width: 300,
    marginRight: 10,
  },

  mapPreview: {
    height: 180,
    borderRadius: 13,
    overflow: "hidden",
    marginBottom: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#0F172A",
    marginBottom: 8,
  },
  modalDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 19,
    marginBottom: 18,
  },
  modalBold: {
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
  },
  modalList: {
    gap: 14,
    marginBottom: 18,
  },
  modalStatusItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalStatusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  modalStatusTextWrap: {
    flex: 1,
    gap: 2,
  },
  modalStatusTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  modalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 18,
  },
  modalNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#E0F2F2",
    padding: 12,
    borderRadius: 13,
    marginBottom: 20,
  },
  modalNoteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#0F766E",
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    fontSize: 14,
  },
});
