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
    const dateParam = "2025-03-01"; // Kosongkan ("") untuk hari ini
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=8&date=2025-03-03${
      dateParam ? `&date=${dateParam}` : ""
    }`;

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

  // Ubah penamaan key sesuai keinginan
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
      default:
        return key;
    }
  };

  // Filter jadwal dari key yang tidak diinginkan
  const filteredJadwal = jadwal
    ? Object.entries(jadwal).filter(
        ([key]) => !excludedKeys.includes(key)
      )
    : [];

  return (
    <>
      {/* MAIN CONTENT */}
      <main className="min-h-screen bg-gray-100 p-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">
            Jadwal Imsakiyah Kabupaten Subang
          </h1>
          <p className="text-gray-600 mt-2">
            Selamat Menjalankan Puasa Ramadhan 1446H / 2025M
          </p>
        </header>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          {error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : jadwal ? (
            <ul className="space-y-4">
              {filteredJadwal.map(([sholat, waktu]) => (
                <li
                  key={sholat}
                  className="flex justify-between border-b pb-2 last:border-0"
                >
                  <span className="font-medium text-gray-700">
                    {formatKey(sholat)}
                  </span>
                  <span className="text-gray-900">{waktu}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">Loading...</p>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-sm text-gray-600">
        <p>© 2025 Jadwal Imsakiyah Kabupaten Subang</p>
        <p>Data diambil dari Aladhan API</p>
        <p>
          Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi
          setempat.
        </p>
      </footer>
    </>
  );
}

