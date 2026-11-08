//app/(tabs)/bengkel.tsx
import React, { useEffect, useState } from "react";
import PetaBengkel from "../../components/PetaBengkel";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

type LokasiPilihan = {
  nama: string;
  latitude: number;
  longitude: number;
  sumber: "gps" | "manual";
};

type HasilLokasi = {
  id: string;
  nama: string;
  keterangan: string;
  latitude: number;
  longitude: number;
};

type HasilBengkel = {
  id: string;
  nama: string;
  alamat: string;
  kategori: string;
  latitude: number;
  longitude: number;
  jarak: number;
};

const RADIUS_PENCARIAN = 5000;
// Cache hasil pencarian bengkel selama 5 menit.
const cacheBengkel = new Map<
  string,
  {
    data: HasilBengkel[];
    waktu: number;
  }
>();

const MASA_CACHE = 5 * 60 * 1000;

const hitungJarak = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (nilai: number) => (nilai * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatJarak = (jarak: number) =>
  jarak < 1
    ? `${Math.round(jarak * 1000)} m`
    : `${jarak.toFixed(1).replace(".", ",")} km`;

// Rekomendasi awal sebelum pengguna mengetik.
const rekomendasiAwal: HasilLokasi[] = [
  {
    id: "awal-kajen",
    nama: "Kajen",
    keterangan: "Kabupaten Pekalongan, Jawa Tengah",
    latitude: -7.0252,
    longitude: 109.5784,
  },
  {
    id: "awal-pekalongan",
    nama: "Pekalongan",
    keterangan: "Kota Pekalongan, Jawa Tengah",
    latitude: -6.8898,
    longitude: 109.6753,
  },
  {
    id: "awal-pemalang",
    nama: "Pemalang",
    keterangan: "Kabupaten Pemalang, Jawa Tengah",
    latitude: -6.8919,
    longitude: 109.3797,
  },
  {
    id: "awal-batang",
    nama: "Batang",
    keterangan: "Kabupaten Batang, Jawa Tengah",
    latitude: -6.908,
    longitude: 109.73,
  },
];

export default function BengkelScreen() {
  const [lokasi, setLokasi] = useState<LokasiPilihan | null>(null);
  const [modalLokasi, setModalLokasi] = useState(false);

  const [kataKunci, setKataKunci] = useState("");
  const [hasilLokasi, setHasilLokasi] = useState<HasilLokasi[]>([]);
  const [daftarBengkel, setDaftarBengkel] = useState<HasilBengkel[]>([]);
  const [loadingBengkel, setLoadingBengkel] = useState(false);
  const [errorBengkel, setErrorBengkel] = useState("");

  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingCari, setLoadingCari] = useState(false);

  const [pesanError, setPesanError] = useState("");
  const [inputAktif, setInputAktif] = useState(false);

  // AUTOCOMPLETE LOKASI MENGGUNAKAN PHOTON
  useEffect(() => {
    if (!modalLokasi) return;

    const pencarian = kataKunci.trim();

    // Tampilkan rekomendasi jika kolom kosong
    // atau pengguna baru mengetik satu karakter.
    if (pencarian.length < 2) {
      setHasilLokasi(rekomendasiAwal);
      setLoadingCari(false);
      setPesanError("");
      return;
    }

    const controller = new AbortController();

    // Beri jeda 450 ms agar tidak mengirim permintaan
    // setiap kali pengguna menekan tombol keyboard.
    const timer = setTimeout(async () => {
      try {
        setLoadingCari(true);
        setPesanError("");

        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          kataKunci.trim(),
        )}&limit=6&countrycode=id`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Gagal menghubungi layanan pencarian lokasi.");
        }

        const data = await response.json();
        const features = Array.isArray(data.features) ? data.features : [];

        const daftarHasil: HasilLokasi[] = features
          .filter((feature: any) => {
            const coordinates = feature.geometry?.coordinates;

            return (
              Array.isArray(coordinates) &&
              Number.isFinite(Number(coordinates[0])) &&
              Number.isFinite(Number(coordinates[1]))
            );
          })
          .map((feature: any, index: number) => {
            const properties = feature.properties || {};

            const namaUtama =
              properties.name ||
              properties.city ||
              properties.county ||
              properties.district ||
              "Lokasi";

            const wilayah =
              properties.district || properties.county || properties.city || "";

            const provinsi = properties.state || "Indonesia";

            const keterangan = [
              wilayah && wilayah.toLowerCase() !== namaUtama.toLowerCase()
                ? wilayah
                : "",
              provinsi,
            ]
              .filter(Boolean)
              .join(", ");

            return {
              id: `photon-${index}-${namaUtama}-${feature.geometry.coordinates[0]}`,
              nama: namaUtama,
              keterangan,
              longitude: Number(feature.geometry.coordinates[0]),
              latitude: Number(feature.geometry.coordinates[1]),
            };
          });
        if (!controller.signal.aborted) {
          setHasilLokasi(daftarHasil);

          if (daftarHasil.length === 0) {
            setPesanError(
              "Lokasi tidak ditemukan. Coba nama kota atau kecamatan lain.",
            );
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Gagal mencari lokasi:", error);
          setHasilLokasi([]);
          setPesanError(
            "Pencarian lokasi gagal. Periksa koneksi internet dan coba lagi.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCari(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kataKunci, modalLokasi]);

  // MENCARI BENGKEL DI SEKITAR LOKASI DENGAN OVERPASS API
  useEffect(() => {
    if (!lokasi) {
      setDaftarBengkel([]);
      setLoadingBengkel(false);
      setErrorBengkel("");
      return;
    }

    const controller = new AbortController();

    const cariBengkel = async () => {
      try {
        setLoadingBengkel(true);
        setErrorBengkel("");
        setDaftarBengkel([]);

        const { latitude, longitude } = lokasi;

        const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const cacheTersimpan = cacheBengkel.get(cacheKey);

        // Gunakan cache jika masih berlaku.
        if (cacheTersimpan && Date.now() - cacheTersimpan.waktu < MASA_CACHE) {
          setDaftarBengkel(cacheTersimpan.data);
          return;
        }

        // Query dibuat lebih sederhana agar beban server lebih ringan.
        const query = `
[out:json][timeout:25];
(
  nwr(around:${RADIUS_PENCARIAN},${latitude},${longitude})["shop"="motorcycle"];
  nwr(around:${RADIUS_PENCARIAN},${latitude},${longitude})["craft"="mechanic"];
  nwr(around:${RADIUS_PENCARIAN},${latitude},${longitude})["shop"="car_repair"];
);
out center tags;
`;

        const endpoints = [
          "https://overpass.private.coffee/api/interpreter",
          "https://overpass-api.de/api/interpreter",
        ];

        let data: any = null;
        let errorTerakhir: unknown = null;

        // Coba endpoint satu per satu.
        for (const endpoint of endpoints) {
          // Maksimal dua percobaan pada setiap endpoint.
          for (let percobaan = 0; percobaan < 2; percobaan++) {
            if (controller.signal.aborted) return;

            console.log(
              "MENCOBA OVERPASS:",
              endpoint,
              "Percobaan:",
              percobaan + 1,
            );

            const endpointController = new AbortController();

            const batalkanPermintaan = () => {
              endpointController.abort();
            };

            controller.signal.addEventListener("abort", batalkanPermintaan);

            const timeout = setTimeout(() => {
              console.log("TIMEOUT OVERPASS:", endpoint);
              endpointController.abort();
            }, 25000);

            let statusCode = 0;

            try {
              const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Accept: "application/json",
                  "User-Agent": "ServisKu/1.0 (Motorcycle Maintenance App)",
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: endpointController.signal,
              });

              statusCode = response.status;

              if (!response.ok) {
                const detail = await response.text();

                console.log("STATUS OVERPASS:", response.status);
                console.log("RESPONS OVERPASS:", detail);

                throw new Error(`Layanan peta merespons ${response.status}.`);
              }

              const hasilJson = await response.json();

              if (!Array.isArray(hasilJson.elements)) {
                throw new Error("Format data bengkel tidak valid.");
              }

              data = hasilJson;

              console.log(
                "BERHASIL MENGAMBIL DATA OVERPASS:",
                data.elements.length,
              );

              break;
            } catch (error) {
              if (controller.signal.aborted) return;

              console.log("ENDPOINT GAGAL:", endpoint);
              console.log("DETAIL ERROR:", error);

              errorTerakhir = error;

              // Coba ulang hanya untuk error server yang sementara.
              const perluCobaUlang = [429, 502, 503, 504].includes(statusCode);

              if (perluCobaUlang && percobaan === 0) {
                console.log("MENUNGGU SEBELUM MENCOBA ULANG...");

                await new Promise<void>((resolve) => setTimeout(resolve, 3000));

                if (controller.signal.aborted) return;
              } else {
                break;
              }
            } finally {
              clearTimeout(timeout);

              controller.signal.removeEventListener(
                "abort",
                batalkanPermintaan,
              );
            }
          }

          if (data) break;

          // Beri jeda sebelum berpindah ke server cadangan.
          if (!controller.signal.aborted) {
            await new Promise<void>((resolve) => setTimeout(resolve, 1500));
          }
        }

        if (controller.signal.aborted) return;

        if (!data) {
          throw (
            errorTerakhir ||
            new Error("Layanan pencarian bengkel gagal dihubungi.")
          );
        }

        const hasil: HasilBengkel[] = data.elements
          .map((element: any) => {
            const tags = element.tags || {};

            const latitudeBengkel = element.lat ?? element.center?.lat;
            const longitudeBengkel = element.lon ?? element.center?.lon;

            if (
              !Number.isFinite(Number(latitudeBengkel)) ||
              !Number.isFinite(Number(longitudeBengkel))
            ) {
              return null;
            }

            const nama =
              tags.name || tags.brand || tags.operator || "Bengkel Kendaraan";

            const alamat =
              tags["addr:full"] ||
              [
                tags["addr:street"],
                tags["addr:suburb"],
                tags["addr:city"] || tags["addr:town"],
              ]
                .filter(Boolean)
                .join(", ") ||
              "Alamat belum tersedia di OpenStreetMap";

            const petunjukMotor = [
              tags.shop === "motorcycle",
              tags.shop === "motorcycle_repair",
              tags["service:vehicle"] === "motorcycle",
              /motor|roda dua|sepeda motor/i.test(nama),
            ].some(Boolean);

            const kategori = petunjukMotor
              ? "Bengkel Motor"
              : "Servis Kendaraan";

            const lat = Number(latitudeBengkel);
            const lon = Number(longitudeBengkel);

            const jarak = hitungJarak(latitude, longitude, lat, lon);

            return {
              id: `${element.type}-${element.id}`,
              nama,
              alamat,
              kategori,
              latitude: lat,
              longitude: lon,
              jarak,
            } as HasilBengkel;
          })
          .filter(
            (item: HasilBengkel | null): item is HasilBengkel => item !== null,
          )
          .sort((a: HasilBengkel, b: HasilBengkel) => a.jarak - b.jarak);

        if (!controller.signal.aborted) {
          // Cache hanya setelah server berhasil memberikan respons valid.
          cacheBengkel.set(cacheKey, {
            data: hasil,
            waktu: Date.now(),
          });

          setDaftarBengkel(hasil);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("GAGAL MENCARI BENGKEL:", error);

          setErrorBengkel(
            "Belum berhasil mengambil data bengkel. Server peta mungkin sedang sibuk. Coba lagi beberapa saat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBengkel(false);
        }
      }
    };

    cariBengkel();

    return () => controller.abort();
  }, [lokasi]);

  // MENGAMBIL LOKASI PERANGKAT
  const handleLokasiSaatIni = async () => {
    try {
      setLoadingGPS(true);
      setPesanError("");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPesanError(
          "Izin lokasi belum diberikan. Kamu tetap bisa mencari lokasi secara manual.",
        );
        return;
      }

      // Ambil lokasi dengan akurasi tinggi
      const posisi = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log("HASIL LOKASI GPS:", {
        latitude: posisi.coords.latitude,
        longitude: posisi.coords.longitude,
        accuracy: posisi.coords.accuracy,
      });

      setLokasi({
        nama: "Lokasi Saat Ini",
        latitude: posisi.coords.latitude,
        longitude: posisi.coords.longitude,
        sumber: "gps",
      });

      setModalLokasi(false);
      setPesanError("");
      setHasilLokasi([]);
    } catch (error) {
      console.error("Gagal mengambil lokasi:", error);
      setPesanError(
        "Lokasi gagal didapatkan. Pastikan layanan lokasi perangkat aktif dan coba lagi.",
      );
    } finally {
      setLoadingGPS(false);
    }
  };

  // MEMILIH HASIL PENCARIAN
  const handlePilihLokasi = (item: HasilLokasi) => {
    setLokasi({
      nama: `${item.nama}, ${item.keterangan}`,
      latitude: item.latitude,
      longitude: item.longitude,
      sumber: "manual",
    });

    setModalLokasi(false);
    setKataKunci("");
    setHasilLokasi([]);
    setPesanError("");
    setInputAktif(false);
  };

  // MEMBUKA MODAL LOKASI
  const bukaModalLokasi = () => {
    setPesanError("");
    setKataKunci("");
    setHasilLokasi(rekomendasiAwal);
    setModalLokasi(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Bengkel</Text>
          <Text style={styles.subtitle}>
            Temukan bengkel motor di sekitar lokasi pilihanmu.
          </Text>
        </View>

        {/* KARTU LOKASI + PETA */}
        <View style={styles.locationCard}>
          <Pressable
            style={({ pressed }) => [
              styles.locationHeader,
              pressed && styles.cardPressed,
            ]}
            onPress={bukaModalLokasi}
          >
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>LOKASI PENCARIAN</Text>

              <Text style={styles.locationName} numberOfLines={2}>
                {lokasi ? lokasi.nama : "Pilih lokasi kamu"}
              </Text>

              <Text style={styles.locationDescription}>
                {lokasi
                  ? lokasi.sumber === "gps"
                    ? "Menggunakan lokasi perangkat"
                    : "Menggunakan lokasi pilihan"
                  : "Tentukan lokasi untuk mencari bengkel"}
              </Text>
            </View>

            <Ionicons name="chevron-down" size={21} color="#64748B" />
          </Pressable>

          {lokasi && (
            <PetaBengkel
              latitude={lokasi.latitude}
              longitude={lokasi.longitude}
              bengkel={daftarBengkel}
            />
          )}
        </View>

        {/* DAFTAR BENGKEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bengkel Terdekat</Text>

          <Text style={styles.sectionDescription}>
            Temukan tempat servis motor di sekitar lokasi pencarianmu.
          </Text>

          {!lokasi ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="location-outline" size={34} color="#94A3B8" />
              </View>

              <Text style={styles.emptyTitle}>
                Pilih Lokasi Terlebih Dahulu
              </Text>

              <Text style={styles.emptyDescription}>
                Tentukan lokasi pencarian agar ServisKu bisa menemukan bengkel
                motor di sekitarmu.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.chooseButton,
                  pressed && styles.chooseButtonPressed,
                ]}
                onPress={bukaModalLokasi}
              >
                <Text style={styles.chooseButtonText}>Pilih Lokasi</Text>
              </Pressable>
            </View>
          ) : loadingBengkel ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color="#0F766E" />
              <Text style={styles.emptyTitle}>Mencari Bengkel...</Text>
              <Text style={styles.emptyDescription}>
                Sedang mencari tempat servis di sekitar lokasi pilihanmu.
              </Text>
            </View>
          ) : errorBengkel ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color="#DC2626"
                />
              </View>
              <Text style={styles.emptyTitle}>Pencarian Belum Berhasil</Text>
              <Text style={styles.emptyDescription}>{errorBengkel}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.chooseButton,
                  pressed && styles.chooseButtonPressed,
                ]}
                onPress={() => {
                  const cacheKey = `${lokasi.latitude.toFixed(4)},${lokasi.longitude.toFixed(4)}`;

                  cacheBengkel.delete(cacheKey);

                  setDaftarBengkel([]);
                  setLokasi({ ...lokasi });
                }}
              >
                <Text style={styles.chooseButtonText}>Coba Lagi</Text>
              </Pressable>
            </View>
          ) : daftarBengkel.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="storefront-outline" size={34} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Bengkel Belum Ditemukan</Text>
              <Text style={styles.emptyDescription}>
                Belum ada data bengkel yang tercatat di OpenStreetMap dalam
                radius {RADIUS_PENCARIAN / 1000} km dari lokasi ini. Kamu bisa
                mencoba lokasi lain.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.chooseButton,
                  pressed && styles.chooseButtonPressed,
                ]}
                onPress={bukaModalLokasi}
              >
                <Text style={styles.chooseButtonText}>Ganti Lokasi</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.workshopList}>
              <Text style={styles.resultCount}>
                {daftarBengkel.length} tempat ditemukan · radius{" "}
                {RADIUS_PENCARIAN / 1000} km
              </Text>

              {daftarBengkel.map((item) => (
                <View key={item.id} style={styles.workshopCard}>
                  <View style={styles.workshopIcon}>
                    <Ionicons
                      name="construct-outline"
                      size={23}
                      color="#0F766E"
                    />
                  </View>

                  <View style={styles.workshopInfo}>
                    <Text style={styles.workshopName}>{item.nama}</Text>
                    <Text style={styles.workshopCategory}>{item.kategori}</Text>
                    <View style={styles.workshopAddressRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#64748B"
                      />
                      <Text style={styles.workshopAddress}>{item.alamat}</Text>
                    </View>
                    <Text style={styles.workshopDistance}>
                      {formatJarak(item.jarak)} dari lokasi pencarian
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* INFORMASI */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#0F766E"
          />

          <Text style={styles.infoText}>
            Data bengkel diambil dari OpenStreetMap. Kelengkapan nama dan alamat
            bergantung pada data yang tersedia dan diperbarui oleh kontributor
            peta.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL PEMILIHAN LOKASI */}
      <Modal
        visible={modalLokasi}
        transparent
        animationType="slide"
        onRequestClose={() => setModalLokasi(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalLokasi(false)}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Pilih Lokasi Pencarian</Text>
                <Text style={styles.sheetSubtitle}>
                  Tentukan lokasi untuk menemukan bengkel motor.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setModalLokasi(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* LOKASI GPS */}
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionPressed,
              ]}
              onPress={handleLokasiSaatIni}
              disabled={loadingGPS}
            >
              <View style={styles.optionIcon}>
                {loadingGPS ? (
                  <ActivityIndicator color="#0F766E" />
                ) : (
                  <Ionicons name="navigate" size={22} color="#0F766E" />
                )}
              </View>

              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Gunakan Lokasi Saat Ini</Text>
                <Text style={styles.optionDescription}>
                  Tentukan lokasi otomatis melalui GPS perangkat.
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
            </Pressable>

            {/* PEMISAH */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ATAU</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* PENCARIAN MANUAL */}
            <Text style={styles.manualLabel}>Cari Lokasi Manual</Text>

            <View
              style={[
                styles.searchContainer,
                inputAktif && styles.searchContainerActive,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={inputAktif ? "#0F766E" : "#94A3B8"}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Contoh: Kajen atau Pekalongan"
                placeholderTextColor="#94A3B8"
                value={kataKunci}
                onChangeText={(value) => {
                  setKataKunci(value);
                  setPesanError("");
                }}
                onFocus={() => setInputAktif(true)}
                onBlur={() => setInputAktif(false)}
                returnKeyType="search"
              />

              {loadingCari && (
                <ActivityIndicator size="small" color="#0F766E" />
              )}

              {kataKunci.length > 0 && (
                <Pressable
                  onPress={() => {
                    setKataKunci("");
                    setHasilLokasi(rekomendasiAwal);
                    setPesanError("");
                  }}
                >
                  <Ionicons name="close-circle" size={19} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* PESAN ERROR */}
            {pesanError !== "" && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={17}
                  color="#DC2626"
                />
                <Text style={styles.errorText}>{pesanError}</Text>
              </View>
            )}

            {/* HASIL PENCARIAN */}
            {hasilLokasi.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultTitle}>
                  {kataKunci.trim().length >= 2
                    ? "Hasil pencarian"
                    : "Rekomendasi lokasi"}
                </Text>

                <ScrollView
                  style={styles.resultList}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {hasilLokasi.map((item) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.resultItem,
                        pressed && styles.resultItemPressed,
                      ]}
                      onPress={() => handlePilihLokasi(item)}
                    >
                      <View style={styles.resultIcon}>
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color="#0F766E"
                        />
                      </View>

                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{item.nama}</Text>
                        <Text style={styles.resultDescription}>
                          {item.keterangan}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94A3B8"
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sheetNote}>
              Pencarian lokasi oleh Photon · © OpenStreetMap contributors.
            </Text>
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
  content: {
    padding: 20,
    paddingBottom: 35,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#E0F2F2",
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 23,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 21,
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E2EC",
    overflow: "hidden",
  },
  cardPressed: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },
  locationIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F766E",
    letterSpacing: 0.7,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  locationDescription: {
    fontSize: 11,
    color: "#64748B",
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 19,
    marginTop: 5,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    padding: 25,
    marginTop: 15,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 13,
  },
  emptyDescription: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },
  chooseButton: {
    backgroundColor: "#E0F2F2",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 17,
  },
  chooseButtonPressed: {
    backgroundColor: "#CCFBF1",
    transform: [{ scale: 0.97 }],
  },
  chooseButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
  },
  workshopList: {
    marginTop: 15,
    gap: 11,
  },
  resultCount: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },
  workshopCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 12,
  },
  workshopIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  workshopInfo: {
    flex: 1,
    gap: 5,
  },
  workshopName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  workshopCategory: {
    fontSize: 10,
    color: "#0F766E",
    fontWeight: "600",
  },
  workshopAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  workshopAddress: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  workshopDistance: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "600",
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#E0F2F2",
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 25,
    maxHeight: "90%",
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 13,
    gap: 12,
  },
  optionPressed: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },
  optionIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  optionDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 17,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 19,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  separatorText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 9,
  },
  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D8E2EC",
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFF",
  },
  searchContainerActive: {
    borderColor: "#0F766E",
    borderWidth: 1.5,
    backgroundColor: "#F0FDFA",
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 13,
    color: "#0F172A",
    outlineStyle: "none",
    outlineWidth: 0,
  } as any,
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: "#DC2626",
    lineHeight: 17,
  },
  resultSection: {
    marginTop: 18,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 9,
  },
  resultList: {
    maxHeight: 210,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultItemPressed: {
    backgroundColor: "#F0FDFA",
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E0F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  resultDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  sheetNote: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 16,
  },

  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
});
