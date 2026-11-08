import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScooterIllustration from "../components/ScooterIllustration";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMotorcycle } from "@fortawesome/free-solid-svg-icons";

export default function TentangScreen() {
  const router = useRouter();

  const fitur = [
    {
      icon: faMotorcycle,
      type: "fontawesome" as const,
      title: "Kelola Kendaraan",
      description:
        "Simpan informasi kendaraan motor dan pantau kondisi perawatannya.",
    },
    {
      icon: "notifications-outline" as const,
      title: "Pengingat Perawatan",
      description:
        "Pantau jadwal perawatan berdasarkan jarak tempuh dan waktu servis.",
    },
    {
      icon: "document-text-outline" as const,
      title: "Riwayat Servis",
      description:
        "Catat dan lihat kembali riwayat perawatan kendaraan dengan mudah.",
    },
    {
      icon: "speedometer-outline" as const,
      title: "Pantau Odometer",
      description:
        "Perbarui jarak tempuh kendaraan untuk membantu menentukan jadwal perawatan berikutnya.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>Tentang ServisKu</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={{ backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* IDENTITAS APLIKASI */}
        <View style={styles.hero}>
          <ScooterIllustration width={260} height={156} />

          <Text style={styles.appName}>ServisKu</Text>

          <Text style={styles.tagline}>
            Perawatan motor lebih mudah dan teratur.
          </Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versi 1.0.0</Text>
          </View>
        </View>

        {/* DESKRIPSI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apa itu ServisKu?</Text>

          <Text style={styles.description}>
            ServisKu merupakan aplikasi pengingat perawatan sepeda motor yang
            membantu pemilik kendaraan mengelola informasi kendaraan, memantau
            jadwal perawatan, dan mencatat riwayat servis.
          </Text>

          <Text style={styles.description}>
            Dengan ServisKu, pengguna dapat mengetahui kondisi perawatan
            komponen kendaraan berdasarkan jarak tempuh dan waktu servis,
            sehingga perawatan motor dapat dilakukan dengan lebih teratur.
          </Text>
        </View>

        {/* FITUR APLIKASI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitur Utama</Text>

          <View style={styles.featureCard}>
            {fitur.map((item, index) => (
              <React.Fragment key={item.title}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    {item.type === "fontawesome" ? (
                      <FontAwesomeIcon
                        icon={item.icon}
                        size={24}
                        color="#0F766E"
                      />
                    ) : (
                      <Ionicons name={item.icon} size={24} color="#0F766E" />
                    )}
                  </View>

                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{item.title}</Text>

                    <Text style={styles.featureDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>

                {index !== fitur.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* TUJUAN APLIKASI */}
        <View style={styles.purposeCard}>
          <View style={styles.purposeIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color="#0F766E"
            />
          </View>

          <Text style={styles.purposeTitle}>Tujuan ServisKu</Text>

          <Text style={styles.purposeDescription}>
            Membantu pemilik sepeda motor lebih peduli terhadap kondisi
            kendaraannya melalui pencatatan dan pengingat perawatan yang
            praktis.
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <FontAwesomeIcon icon={faMotorcycle} size={24} color="#0F766E" />
            <Text style={styles.footerName}>ServisKu</Text>
          </View>

          <Text style={styles.footerText}>Rawat motor, ingat servisnya.</Text>

          <Text style={styles.copyright}>
            © 2026 ServisKu. All rights reserved.
          </Text>
        </View>
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
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#E0F2F2",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 35,
    backgroundColor: "#F8FAFC",
  },
  hero: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: "#E0F2F2",
    borderRadius: 20,
    marginBottom: 27,
  },
  appName: {
    fontSize: 25,
    fontWeight: "700",
    color: "#0F172A",
  },
  tagline: {
    fontSize: 12,
    color: "#475569",
    marginTop: 7,
    textAlign: "center",
  },
  versionBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 13,
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    color: "#64748B",
    marginBottom: 10,
    textAlign: "justify",
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 13,
  },
  featureIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  purposeCard: {
    backgroundColor: "#F0FDFA",
    borderRadius: 16,
    padding: 19,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  purposeIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
  },
  purposeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  purposeDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 19,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingTop: 5,
  },
  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F766E",
  },
  footerText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 7,
  },
  copyright: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
