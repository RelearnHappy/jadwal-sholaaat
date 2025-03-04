"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

export default function Home() {
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const excludedKeys = ["Midnight", "Firstthird", "Lastthird", "Sunrise", "Sunset"];

  useEffect(() => {
    const dateParam = "2025-03-01"; // Ubah atau kosongkan ("") untuk hari ini
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=8&timezonestring=Asia/Jakarta&date=${dateParam}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.timings) {
          console.log("Data dari API:", data.data.timings); // Logging data
          setJadwal(data.data.timings);
        } else {
          setError("Data jadwal tidak ditemukan.");
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Gagal memuat jadwal sholat. Coba lagi nanti.");
      });
  }, []);

  const formatKey = (key: string): string => {
    switch (key) {
      case "Fajr":
        return "Subuh";
      case "Dhuhr":
        return "Dzuhur";
      case "Asr":
        return "Ashar";
      case "Isha":
        return "Isya";
      case "Imsak":
        return "Imsak"; // Menambahkan Imsak untuk konsistensi
      default:
        return key;
    }
  };

  const filteredJadwal = jadwal
    ? Object.entries(jadwal).filter(([key]) => !excludedKeys.includes(key))
    : [];

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-between p-6">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Jadwal Imsakiyah Kabupaten Subang
          </h1>
          <p className="text-gray-600 mt-2">
            Selamat Menjalankan Puasa Ramadhan 1446H / 2025M
          </p>
        </header>
        <div className="bg-white rounded-lg shadow-md p-6">
          {error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : jadwal ? (
            <ul className="space-y-3">
              {filteredJadwal.map(([sholat, waktu]) => (
                <li
                  key={sholat}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                >
                  <span className="text-gray-700 font-medium">{formatKey(sholat)}</span>
                  <span className="text-gray-900 font-semibold">{waktu}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">Loading...</p>
          )}
        </div>
      </div>
      <footer className="text-center text-gray-600 py-4 w-full max-w-md">
        <p>© 2025 Jadwal Imsakiyah Kabupaten Subang</p>
        <p>Data diambil dari Aladhan API</p>
        <p>Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi setempat.</p>
      </footer>
    </main>
  );
}
