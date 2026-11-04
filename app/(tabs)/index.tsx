import { useRouter } from "expo-router";
import { useState } from "react";
import ScooterIllustration from "../../components/ScooterIllustration";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  // Data sementara untuk tampilan awal
  const [loading] = useState(false);
  const [kendaraan] = useState<any[]>([
    {
      nama: "Honda Vario 160",
      nomor: "G 1234 AB",
      odometer: "5.250 km",
    },
  ]);

  
  const komponen = [
    {
      nama: "Oli Mesin",
      keterangan: "Penggantian oli mesin",
      targetKm: 6000,
      sisaKm: 750,
      status: "Aman",
      warna: "#16A34A",
      background: "#DCFCE7",
      icon: "water-outline" as const,
    },
    {
      nama: "Kampas Rem",
      keterangan: "Pemeriksaan kampas rem",
      targetKm: 8000,
      sisaKm: 1200,
      status: "Aman",
      warna: "#16A34A",
      background: "#DCFCE7",
      icon: "construct-outline" as const,
    },
    {
      nama: "Filter Udara",
      keterangan: "Pembersihan filter udara",
      targetKm: 9000,
      sisaKm: 1800,
      status: "Aman",
      warna: "#16A34A",
      background: "#DCFCE7",
      icon: "filter-outline" as const,
    },
    {
      nama: "Busi",
      keterangan: "Pemeriksaan busi",
      targetKm: 10000,
      sisaKm: 2500,
      status: "Aman",
      warna: "#16A34A",
      background: "#DCFCE7",
      icon: "flash-outline" as const,
    },
    {
      nama: "Aki",
      keterangan: "Pemeriksaan kondisi aki",
      targetKm: 11000,
      sisaKm: 3500,
      status: "Aman",
      warna: "#16A34A",
      background: "#DCFCE7",
      icon: "battery-half-outline" as const,
    },
  ];

  // Menghitung jumlah komponen berdasarkan status
  const jumlahAman = komponen.filter(
    (item) => item.status === "Aman"
  ).length;

  const jumlahSegera = komponen.filter(
    (item) => item.status === "Segera"
  ).length;

  const jumlahTerlambat = komponen.filter(
    (item) => item.status === "Terlambat"
  ).length;

  // Menentukan status keseluruhan kendaraan
  const statusKeseluruhan =
    jumlahTerlambat > 0
      ? "Terlambat"
      : jumlahSegera > 0
      ? "Segera"
      : "Aman";

  const warnaStatus =
    statusKeseluruhan === "Terlambat"
      ? "#DC2626"
      : statusKeseluruhan === "Segera"
      ? "#D97706"
      : "#16A34A";

  const backgroundStatus = "#E0F2FE";

  // Mengambil dua jadwal dengan sisa kilometer paling sedikit
  const jadwalTerdekat = [...komponen]
    .sort((a, b) => a.sisaKm - b.sisaKm)
    .slice(0, 2);


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
            <Text style={styles.greetingTitle}>Halo, Pengendara! 👋</Text>

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
        ) : kendaraan.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bicycle-outline" size={38} color="#0284C7" />
            <Text style={styles.cardTitle}>Belum Ada Kendaraan</Text>
            <Text style={styles.mutedText}>
              Tambahkan kendaraan untuk mulai mengatur perawatan.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/kendaraan")}
            >
              <Ionicons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Tambah Kendaraan</Text>
            </Pressable>
          </View>
        ) : (
          kendaraan.map((item, index) => (
            <View key={index} style={styles.vehicleCard}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="bicycle-outline" size={35} color="#0F766E" />
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{item.nama}</Text>
                <Text style={styles.vehiclePlate}>{item.nomor}</Text>
                <Text style={styles.vehicleDistance}>
                  <Ionicons name="speedometer-outline" size={13} />{" "}
                  {item.odometer}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
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
            color="#64748B"
          />
        </View>

        <View
          style={[
            styles.statusSummaryCard,
            { backgroundColor: backgroundStatus },
          ]}
        >
          <View style={styles.statusSummaryTop}>
            <View style={styles.statusSummaryIcon}>
              <Ionicons
                name={
                  statusKeseluruhan === "Aman"
                    ? "checkmark-circle"
                    : statusKeseluruhan === "Segera"
                    ? "alert-circle"
                    : "close-circle"
                }
                size={25}
                color={warnaStatus}
              />
            </View>

            <View style={styles.statusSummaryInfo}>
              <Text style={styles.statusSummaryLabel}>
                Kondisi kendaraanmu
              </Text>
              <Text
                style={[
                  styles.statusSummaryTitle,
                  { color: warnaStatus },
                ]}
              >
                {statusKeseluruhan}
              </Text>
            </View>
          </View>

          <Text style={styles.statusSummaryDescription}>
            {statusKeseluruhan === "Aman"
              ? "Semua komponen masih dalam jadwal perawatan."
              : statusKeseluruhan === "Segera"
              ? "Ada komponen yang perlu segera diperhatikan."
              : "Ada komponen yang sudah melewati jadwal perawatan."}
          </Text>

          <View style={styles.statusCountContainer}>
            <View style={styles.statusCountItem}>
              <Text style={[styles.statusCountNumber, { color: "#15803D" }]}>
                {jumlahAman}
              </Text>
              <Text style={styles.statusCountLabel}>Aman</Text>
            </View>

            <View style={styles.statusCountDivider} />

            <View style={styles.statusCountItem}>
              <Text style={[styles.statusCountNumber, { color: "#D97706" }]}>
                {jumlahSegera}
              </Text>
              <Text style={styles.statusCountLabel}>Segera</Text>
            </View>

            <View style={styles.statusCountDivider} />

            <View style={styles.statusCountItem}>
              <Text style={[styles.statusCountNumber, { color: "#DC2626" }]}>
                {jumlahTerlambat}
              </Text>
              <Text style={styles.statusCountLabel}>Terlambat</Text>
            </View>
          </View>
        </View>
      </View>


      
      {/* JADWAL SERVIS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Jadwal Servis Berikutnya
          </Text>

          <Pressable
            onPress={() => router.push("/(tabs)/riwayat")}
          >
            <Text style={styles.link}>Lihat Semua</Text>
          </Pressable>
        </View>

        {jadwalTerdekat.map((item, index) => (
          <View key={index} style={styles.scheduleCard}>
            <View style={styles.scheduleIcon}>
              <Ionicons
                name={item.icon}
                size={22}
                color="#0284C7"
              />
            </View>

            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>
                {item.nama}
              </Text>
              <Text style={styles.mutedText}>
                {item.keterangan}
              </Text>
              <Text style={styles.scheduleTarget}>
                Target: {item.targetKm.toLocaleString("id-ID")} km
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.background },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.warna },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        ))}
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
    backgroundColor: "#E0F2FE",
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
    fontSize: 23,
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
    borderColor: "#E2E8F0",
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
    borderColor: "#E2E8F0",
    gap: 12,
  },
  scheduleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E0F2FE",
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
    backgroundColor: "#E0F2FE",
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
  width: 125,
  height: 130,
  justifyContent: "center",
  alignItems: "center",
  transform: [{ translateX: -60 }],
},

statusSummaryCard: {
  backgroundColor: "#E0F2FE",
  borderRadius: 17,
  padding: 16,
  borderWidth: 1,
  borderColor: "#BAE6FD",
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
