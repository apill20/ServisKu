import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CHANNEL_ID = "pengingat-servisku";
const JAM_NOTIFIKASI = 9;

type StatusKilometer = "aman" | "segera" | "terlambat" | "belum";

function buatTanggal(jumlahHari: number, tanggalDasar: Date) {
  const hasil = new Date(tanggalDasar);
  hasil.setDate(hasil.getDate() + jumlahHari);
  hasil.setHours(JAM_NOTIFIKASI, 0, 0, 0);
  return hasil;
}

function buatTanggalDariString(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  return new Date(tahun, bulan - 1, hari, JAM_NOTIFIKASI, 0, 0, 0);
}

function tanggalTanpaJam(tanggal: Date) {
  return new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
}

function buatTriggerInterval() {
  return {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL as const,
    seconds: 3 * 24 * 60 * 60,
    repeats: true,
    ...(Platform.OS === "android" && {
      channelId: CHANNEL_ID,
    }),
  };
}

// Meminta izin notifikasi dari pengguna
export async function mintaIzinNotifikasi() {
  const { status: statusAwal } = await Notifications.getPermissionsAsync();

  if (statusAwal === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  return status === "granted";
}

// Membatalkan pengingat tanggal dan menghapus status kilometer
export async function batalkanPengingatServis(componentId: string) {
  const storageKey = `@servisku/pengingat/${componentId}`;

  const dataLama = await AsyncStorage.getItem(storageKey);

  if (dataLama) {
    const daftarId: string[] = JSON.parse(dataLama);

    for (const id of daftarId) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }

  // Batalkan juga jadwal notifikasi berdasarkan kilometer.
const kmIdStorageKey = `@servisku/pengingat-km-id/${componentId}`;
const dataKmLama = await AsyncStorage.getItem(kmIdStorageKey);

if (dataKmLama) {
  const daftarKmId: string[] = JSON.parse(dataKmLama);

  for (const id of daftarKmId) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

await AsyncStorage.removeItem(kmIdStorageKey);

  await AsyncStorage.removeItem(storageKey);
  await AsyncStorage.removeItem(`@servisku/pengingat-km/${componentId}`);
}

// Membuat pengingat berdasarkan tanggal servis
export async function jadwalkanPengingatServis({
  componentId,
  namaKomponen,
  namaMotor,
  tanggalJadwal,
}: {
  componentId: string;
  namaKomponen: string;
  namaMotor: string;
  tanggalJadwal: string;
}) {
  // Pastikan izin tersedia sebelum menghapus jadwal lama
  const izin = await mintaIzinNotifikasi();

  if (!izin) {
    return false;
  }

  await batalkanPengingatServis(componentId);

  const sekarang = new Date();
  const hariIni = tanggalTanpaJam(sekarang);
  const tanggalServis = buatTanggalDariString(tanggalJadwal);
  const hariServis = tanggalTanpaJam(tanggalServis);

  const tanggalPengingat = buatTanggal(-3, tanggalServis);
  const daftarId: string[] = [];

  // Pengingat tiga hari sebelum servis
  if (tanggalPengingat > sekarang) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pengingat ServisKu",
        body: `${namaKomponen} pada ${namaMotor} akan memasuki jadwal servis dalam 3 hari.`,
        sound: "default",
        data: {
          componentId,
          jenis: "sebelum_servis",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: tanggalPengingat,
        ...(Platform.OS === "android" && {
          channelId: CHANNEL_ID,
        }),
      },
    });

    daftarId.push(id);
  }

  // Pengingat pada hari servis
  if (hariServis.getTime() === hariIni.getTime()) {
    if (tanggalServis > sekarang) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Jadwal Servis Tiba!",
          body: `Hari ini jadwal servis ${namaKomponen} pada ${namaMotor}. Jangan lupa, ya!`,
          sound: "default",
          data: {
            componentId,
            jenis: "jadwal_servis",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tanggalServis,
          ...(Platform.OS === "android" && {
            channelId: CHANNEL_ID,
          }),
        },
      });

      daftarId.push(id);
    }
  }

  // Pengingat berulang jika tanggal servis sudah lewat
  if (hariServis < hariIni) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Servis Motor Terlambat!",
        body: `${namaKomponen} pada ${namaMotor} sudah melewati jadwal servis. Yuk, segera lakukan servis!`,
        sound: "default",
        data: {
          componentId,
          jenis: "servis_terlambat",
        },
      },
      trigger: buatTriggerInterval(),
    });

    daftarId.push(id);
  }

  await AsyncStorage.setItem(
    `@servisku/pengingat/${componentId}`,
    JSON.stringify(daftarId),
  );

  return true;
}

// Memeriksa status pengingat berdasarkan kilometer
export async function periksaPengingatKilometer({
  componentId,
  namaKomponen,
  namaMotor,
  status,
}: {
  componentId: string;
  namaKomponen: string;
  namaMotor: string;
  status: StatusKilometer;
}) {
  const storageKey = `@servisku/pengingat-km/${componentId}`;
  const idStorageKey = `@servisku/pengingat-km-id/${componentId}`;

  const statusLama = await AsyncStorage.getItem(storageKey);
  const dataIdLama = await AsyncStorage.getItem(idStorageKey);
  const daftarIdLama: string[] = dataIdLama
    ? JSON.parse(dataIdLama)
    : [];

  // Membatalkan semua pengingat kilometer yang masih terjadwal.
  const batalkanJadwalKilometer = async () => {
    for (const id of daftarIdLama) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    await AsyncStorage.removeItem(idStorageKey);
  };

  // Jika aman atau belum ada riwayat, tidak perlu ada pengingat.
  if (status === "aman" || status === "belum") {
    await batalkanJadwalKilometer();
    await AsyncStorage.removeItem(storageKey);
    return false;
  }

  // Status tidak berubah, jadi jangan membuat jadwal baru.
  if (statusLama === status) {
    return false;
  }

  const izin = await mintaIzinNotifikasi();

  if (!izin) {
    return false;
  }

  // Batalkan jadwal dari status sebelumnya.
  await batalkanJadwalKilometer();

  const terlambat = status === "terlambat";
  const daftarIdBaru: string[] = [];

  const content = {
    title: terlambat ? "Servis Motor Terlambat!" : "Pengingat ServisKu",
    body: terlambat
      ? `${namaKomponen} pada ${namaMotor} sudah melewati batas kilometer servis. Yuk, segera lakukan servis!`
      : `${namaKomponen} pada ${namaMotor} sudah mendekati batas kilometer servis. Persiapkan servis, ya!`,
    sound: "default" as const,
    data: {
      componentId,
      jenis: terlambat ? "servis_terlambat_km" : "segera_servis_km",
    },
  };

  // Kirim notifikasi pertama setelah 1 detik.
  const idPertama = await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
      ...(Platform.OS === "android" && {
        channelId: CHANNEL_ID,
      }),
    },
  });

  daftarIdBaru.push(idPertama);

  // Jika terlambat, jadwalkan pengulangan setiap 3 hari.
  if (terlambat) {
    const idBerulang = await Notifications.scheduleNotificationAsync({
      content,
      trigger: buatTriggerInterval(),
    });

    daftarIdBaru.push(idBerulang);
  }

  await AsyncStorage.setItem(storageKey, status);
  await AsyncStorage.setItem(
    idStorageKey,
    JSON.stringify(daftarIdBaru),
  );

  return true;
}

// Fungsi khusus untuk mengetes notifikasi
export async function tesNotifikasi() {
  const izin = await mintaIzinNotifikasi();

  if (!izin) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tes Notifikasi ServisKu 🛵",
      body: "Yeay! Notifikasi ServisKu berhasil muncul di HP kamu.",
      sound: "default",
      data: {
        jenis: "tes",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
      ...(Platform.OS === "android" && {
        channelId: CHANNEL_ID,
      }),
    },
  });

  return true;
}
