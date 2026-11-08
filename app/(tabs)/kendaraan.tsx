import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMotorcycle } from "@fortawesome/free-solid-svg-icons";
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
import ScooterIllustration from "../../components/ScooterIllustration";
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
};

export default function KendaraanScreen() {
  const router = useRouter();

  const [kendaraan, setKendaraan] = useState<Kendaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchKendaraan = useCallback(async () => {
    setLoading(true);
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
        .select(
          "id, nama_motor, merek, model, nomor_polisi, jenis_motor, tahun, odometer_terbaru",
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setKendaraan(data ?? []);
    } catch (error) {
      console.error("Gagal mengambil kendaraan:", error);
      setErrorMessage("Gagal memuat data kendaraan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Memuat ulang data setiap halaman Kendaraan dibuka
  useFocusEffect(
    useCallback(() => {
      fetchKendaraan();
    }, [fetchKendaraan]),
  );

  const formatOdometer = (angka: number) => {
    return angka.toLocaleString("id-ID") + " km";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kendaraan</Text>
          <Text style={styles.headerSubtitle}>Kelola kendaraan pribadimu.</Text>
        </View>

        <View style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={23} color="#0F766E" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Memuat kendaraan...</Text>
          </View>
        ) : errorMessage !== "" ? (
          <View style={styles.messageContainer}>
            <Ionicons name="alert-circle-outline" size={35} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>

            <Pressable style={styles.retryButton} onPress={fetchKendaraan}>
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : kendaraan.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.illustrationCircle}>
              <ScooterIllustration width={125} height={85} />
            </View>

            <Text style={styles.emptyTitle}>Belum ada kendaraan</Text>

            <Text style={styles.emptyDescription}>
              Tambahkan motor untuk mulai memantau
              {"\n"}
              jadwal perawatannya.
            </Text>
          </View>
        ) : (
          /* Daftar Kendaraan */
          <View style={styles.vehicleSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Kendaraan Saya</Text>
                <Text style={styles.sectionSubtitle}>
                  {kendaraan.length} kendaraan terdaftar
                </Text>
              </View>

              <FontAwesomeIcon icon={faMotorcycle} size={25} color="#0F766E" />
            </View>

            {kendaraan.map((item) => (
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
                <View style={styles.cardTop}>
                  <View style={styles.vehicleIcon}>
                    <FontAwesomeIcon
                      icon={faMotorcycle}
                      size={27}
                      color="#0F766E"
                    />
                  </View>

                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{item.nama_motor}</Text>

                    <Text style={styles.vehicleModel}>
                      {item.merek} {item.model}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="card-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{item.nomor_polisi}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color="#64748B"
                    />
                    <Text style={styles.detailText}>
                      {formatOdometer(item.odometer_terbaru)}
                    </Text>
                  </View>
                </View>

                {(item.jenis_motor || item.tahun) && (
                  <View style={styles.extraInfo}>
                    {item.jenis_motor && (
                      <Text style={styles.extraInfoText}>
                        {item.jenis_motor}
                      </Text>
                    )}

                    {item.tahun && (
                      <Text style={styles.extraInfoText}>
                        Tahun {item.tahun}
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Tombol Tambah Kendaraan */}
        {!loading && !errorMessage && (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/tambah-kendaraan")}
          >
            <Ionicons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Tambah Kendaraan</Text>
          </Pressable>
        )}
      </ScrollView>
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
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 20,
  paddingTop: 22,
  paddingBottom: 30,
},

  loadingContainer: {
    flex: 1,
    minHeight: 350,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    minHeight: 390,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingBottom: 30,
  },

  illustrationCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 5,
  },

  emptyDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#94A3B8",
    textAlign: "center",
  },

  vehicleSection: {
    width: "100%",
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

  vehicleCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  vehicleCardPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.99 }],
  },

  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },

  vehicleName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0F172A",
  },

  vehicleModel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 13,
  },

  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#475569",
  },

  extraInfo: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  extraInfoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#0F766E",
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  addButton: {
    width: "100%",
    maxWidth: 230,
    alignSelf: "center",
    backgroundColor: "#0F766E",
    borderRadius: 30,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 18,
  },

  addButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  buttonPressed: {
    backgroundColor: "#115E59",
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  messageContainer: {
    flex: 1,
    minHeight: 350,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#DC2626",
    marginTop: 10,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 15,
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#0F766E",
  },
});
