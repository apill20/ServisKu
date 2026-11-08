
export interface BengkelPeta {
  id: string;
  nama: string;
  alamat: string;
  kategori: string;
  latitude: number;
  longitude: number;
  jarak: number;
}

export function buatHtmlPeta(
  latitude: number,
  longitude: number,
  bengkel: BengkelPeta[]
) {
  const dataBengkel = bengkel.map((item) => ({
    nama: item.nama,
    alamat: item.alamat,
    kategori: item.kategori,
    latitude: item.latitude,
    longitude: item.longitude,
    jarak: item.jarak,
  }));

  const dataAman = JSON.stringify(dataBengkel).replace(/</g, "\\u003c");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const latitude = ${latitude};
          const longitude = ${longitude};
          const bengkel = ${dataAman};

          const map = L.map("map").setView(
            [latitude, longitude],
            13
          );

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
          ).addTo(map);

          const titik = [];

          L.circleMarker([latitude, longitude], {
            radius: 9,
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 1
          })
          .addTo(map)
          .bindPopup("Lokasi pencarian");

          titik.push([latitude, longitude]);

          bengkel.forEach((item) => {
            if (!item.latitude || !item.longitude) return;

            const marker = L.circleMarker(
              [item.latitude, item.longitude],
              {
                radius: 7,
                color: "#0f766e",
                fillColor: "#14b8a6",
                fillOpacity: 1
              }
            ).addTo(map);

            const popup = document.createElement("div");
            const nama = document.createElement("strong");
            const alamat = document.createElement("p");

            nama.textContent = item.nama;
            alamat.textContent = item.alamat || item.kategori || "Alamat tidak tersedia";

            popup.appendChild(nama);
            popup.appendChild(alamat);

            marker.bindPopup(popup);
            titik.push([item.latitude, item.longitude]);
          });

          if (titik.length > 1) {
            map.fitBounds(titik, { padding: [30, 30] });
          }
        </script>
      </body>
    </html>
  `;
}
