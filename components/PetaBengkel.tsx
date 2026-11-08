
import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export interface BengkelPeta {
  id: string;
  nama: string;
  alamat: string;
  kategori: string;
  latitude: number;
  longitude: number;
  jarak: number;
}

interface Props {
  latitude: number;
  longitude: number;
  bengkel: BengkelPeta[];
}

export default function PetaBengkel({
  latitude,
  longitude,
  bengkel,
}: Props) {
  // Mengamankan data sebelum dimasukkan ke HTML.
  const dataBengkel = JSON.stringify(bengkel).replace(/</g, "\\u003c");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #E0F2F2;
          }

          .leaflet-popup-content-wrapper {
            border-radius: 12px;
          }

          .leaflet-popup-content {
            font-family: Arial, sans-serif;
            font-size: 13px;
            line-height: 1.5;
          }

          .judul {
            font-weight: bold;
            color: #0F766E;
            font-size: 14px;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const latitude = ${latitude};
          const longitude = ${longitude};
          const bengkel = ${dataBengkel};

          const map = L.map("map", {
            zoomControl: true
          }).setView([latitude, longitude], 14);

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "&copy; OpenStreetMap contributors",
              maxZoom: 19
            }
          ).addTo(map);

          function aman(teks) {
            return String(teks || "").replace(/[&<>"']/g, function (huruf) {
              return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
              }[huruf];
            });
          }

          // Penanda lokasi pengguna.
          L.circleMarker([latitude, longitude], {
            radius: 9,
            color: "#FFFFFF",
            weight: 3,
            fillColor: "#2563EB",
            fillOpacity: 1
          })
          .addTo(map)
          .bindPopup("<b>Lokasi Kamu</b>");

          // Penanda setiap bengkel.
          bengkel.forEach(function (item) {
            if (
              typeof item.latitude !== "number" ||
              typeof item.longitude !== "number"
            ) return;

            const marker = L.marker([
              item.latitude,
              item.longitude
            ]).addTo(map);

            marker.bindPopup(
              '<div class="judul">' + aman(item.nama) + '</div>' +
              '<div>' + aman(item.alamat || "Alamat belum tersedia") + '</div>' +
              '<div>' + aman(item.kategori) + '</div>' +
              '<div>Jarak: ' + aman(item.jarak) + ' km</div>'
            );
          });

          // Sesuaikan tampilan peta dengan lokasi dan bengkel.
          if (bengkel.length > 0) {
            const semuaTitik = [
              [latitude, longitude],
              ...bengkel.map(function (item) {
                return [item.latitude, item.longitude];
              })
            ];

            map.fitBounds(semuaTitik, {
              padding: [30, 30],
              maxZoom: 15
            });
          }

          setTimeout(function () {
            map.invalidateSize();
          }, 300);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E0F2F2",
  },
  map: {
    flex: 1,
    backgroundColor: "#E0F2F2",
  },
});
