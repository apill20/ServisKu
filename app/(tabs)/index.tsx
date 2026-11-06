import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import ScooterIllustration from "../../components/ScooterIllustration";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMotorcycle } from "@fortawesome/free-solid-svg-icons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Kendaraan = {
  id: string;
  nama_motor: string;
  nomor_polisi: string;
  odometer_terbaru: number;
};

export default function HomeScreen() {
  const [username, setUsername] = useState("Pengendara");
  const router = useRouter();

  const [kendaraan, setKendaraan] = useState<Kendaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

    ambilNamaPengguna();
  }, []);

  const fetchKendaraan = useCallback(
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
          if (isActive()) setKendaraan([]);
          return;
        }

        const { data, error } = await supabase
          .from("kendaraan")
          .select("id, nama_motor, nomor_polisi, odometer_terbaru")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isActive()) setKendaraan(data ?? []);
      } catch (error) {
        console.error("Gagal mengambil kendaraan:", error);
        if (isActive()) {
          setErrorMessage("Gagal memuat data kendaraan. Coba lagi.");
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchKendaraan(() => isActive);
      return () => {
        isActive = false;
      };
    }, [fetchKendaraan]),
  );

  const formatOdometer = (angka: number) =>
    `${angka.toLocaleString("id-ID")} km`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER DAN SAPAAN */}
      <View style={styles.hero}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ServisKu</Text>
            <Text style={styles.headerSubtitle}>
              Pengingat perawatan motormu
            </Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#0F766E" />
          </Pressable>
        </View>

        <View style={styles.greetingRow}>
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>Halo, {username}!</Text>

            <Text style={styles.greetingDescription}>
              Yuk, pastikan motormu selalu dalam kondisi prima dengan melakukan
              perawatan rutin.
            </Text>
          </View>

          <View style={styles.illustrationContainer}>
            <ScooterIllustration />
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
              onPress={() => fetchKendaraan()}
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
              <Text style={styles.addVehicleButtonText}>Tambah Kendaraan</Text>
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
                <FontAwesomeIcon icon={faMotorcycle} size={35} color="#0F766E" />
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
          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#E0F2F2"
          />
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#0F766E" />
            <Text style={styles.mutedText}>Memuat status perawatan...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyCard}>
            <Text style={styles.mutedText}>{errorMessage}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name="information-circle-outline"
              size={30}
              color="#0F766E"
            />
            <Text style={styles.cardTitle}>
              {kendaraan.length === 0
                ? "Belum ada kendaraan"
                : "Data perawatan belum tersedia"}
            </Text>
            <Text style={styles.mutedText}>
              {kendaraan.length === 0
                ? "Tambahkan kendaraan untuk mulai memantau status perawatan."
                : "Status perawatan akan muncul setelah kamu mencatat servis."}
            </Text>
          </View>
        )}
      </View>

      {/* JADWAL SERVIS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jadwal Servis Berikutnya</Text>

          <Pressable onPress={() => router.push("/(tabs)/riwayat")}>
            <Text style={styles.link}>Lihat Semua</Text>
          </Pressable>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={30} color="#0F766E" />
          <Text style={styles.cardTitle}>Belum ada jadwal servis</Text>
          <Text style={styles.mutedText}>
            Jadwal servis akan muncul setelah data perawatan tersedia.
          </Text>
        </View>
      </View>

      {/* CARI BENGKEL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cari Bengkel</Text>

        <View style={styles.workshopCard}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color="#0F766E" />
            <Text style={styles.mapText}>Peta lokasi bengkel</Text>
          </View>

          <Text style={styles.workshopTitle}>Temukan bengkel di sekitarmu</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 35,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  hero: {
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 27,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 29,
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
  },
  mutedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
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
    width: 100,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -5 }],
  },

  statusSummaryCard: {
    backgroundColor: "#E0F2F2",
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFE5E0",
  },
  statusSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    gap: 3,
  },
  statusSummaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#64748B",
  },
  statusSummaryTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
  },
  statusSummaryDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#475569",
    marginTop: 12,
    marginBottom: 15,
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
});
