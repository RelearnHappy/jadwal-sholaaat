"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

export default function Home() {
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const excludedKeys = ["Midnight", "Firstthird", "Lastthird", "Sunrise", "Sunset"];

  // Tanggal mulai Ramadan: 1 Maret 2025
  const ramadanStart = new Date("2025-03-01");

  // Hitung informasi Ramadan secara dinamis
  let ramadanDayText = "";
  let ramadanDateText = "";
  if (currentTime >= ramadanStart) {
    const diffDays = Math.floor((currentTime.getTime() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24));
    const ramadanDay = diffDays + 1; // Hari pertama adalah 1
    ramadanDayText = `Ramadhan Hari ke-${ramadanDay}`;
    ramadanDateText = currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else {
    ramadanDayText = "Ramadhan belum dimulai";
  }

  useEffect(() => {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=8`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.timings) {
          setJadwal(data.data.timings);
          findNextPrayer(data.data.timings);
        } else {
          setError("Data jadwal tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat. Coba lagi nanti."));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);
    return () => clearInterval(interval);
  }, [jadwal]);

  const formatKey = (key: string): string => {
    switch (key) {
      case "Fajr":
        return "Subuh";
      case "Dhuhr":
        return "Dzuhur";
      case "Asr":
        return "Ashar";
      case "Maghrib":
        return "Maghrib";
      case "Isha":
        return "Isya";
      case "Imsak":
        return "Imsak";
      default:
        return key;
    }
  };

  const findNextPrayer = (timings: Timings) => {
    const now = new Date();
    const prayerTimes = Object.entries(timings)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([name, time]) => ({
        name: formatKey(name),
        time: new Date(now.toDateString() + " " + time),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    // Jika semua waktu hari ini sudah lewat, ambil jadwal pertama besok
    const next =
      prayerTimes.find((p) => p.time > now) || {
        ...prayerTimes[0],
        time: new Date(prayerTimes[0].time.getTime() + 24 * 60 * 60 * 1000),
      };
    setNextPrayer(next);
  };

  const getCountdown = () => {
    if (!nextPrayer) return { hours: 0, minutes: 0, seconds: 0, progress: 0 };
    const now = new Date();
    const diff = Math.max(0, nextPrayer.time.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Contoh progress bar: persentase hari berjalan (0:00 - 24:00)
    const dayStart = new Date(nextPrayer.time);
    dayStart.setHours(0, 0, 0, 0);
    const totalDayMs = 24 * 60 * 60 * 1000;
    const passedMs = now.getTime() - dayStart.getTime();
    const progress = (passedMs / totalDayMs) * 100;

    return { hours, minutes, seconds, progress };
  };

  const { hours, minutes, seconds, progress } = getCountdown();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* MAIN CONTENT */}
      <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Jadwal Imsakiyah Kabupaten Subang
          </h1>
          <p className="text-gray-600 mt-2">
            Selamat Menjalankan Puasa Ramadhan 1446H / 2025M
          </p>
        </header>
      <main className="flex-grow p-6">
        {/* Ramadan Info */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-semibold text-gray-700">{ramadanDayText}</h1>
          {ramadanDateText && <p className="text-gray-600">{ramadanDateText}</p>}
        </div>

        {/* Waktu Sekarang dengan background hijau */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            </svg>
            <span className="font-medium">Waktu Sekarang:</span>
          </div>
          <div className="text-4xl font-mono bg-green-500 text-white px-8 py-3 rounded-md shadow-md">
            {currentTime.toLocaleTimeString("id-ID")}
          </div>
        </div>

        {/* Countdown Sholat Berikutnya dengan background hijau */}
        {nextPrayer && (
          <div className="bg-gradient-to-r from-green-400 via-black to-black text-white p-4 rounded-md shadow-md text-center mb-6">
            <p className="text-lg font-semibold">
              Sholat Berikutnya: {nextPrayer.name}
            </p>
            <p className="text-2xl font-mono">
              {nextPrayer.time.toLocaleTimeString("id-ID")}
            </p>
            <p className="mt-1">
              Waktu tersisa: {hours} jam {minutes} menit {seconds} detik
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Jadwal Sholat */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          {error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : jadwal ? (
            <ul className="space-y-4">
              {Object.entries(jadwal)
                .filter(([key]) => !excludedKeys.includes(key))
                .map(([sholat, waktu]) => (
                  <li key={sholat} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-medium text-gray-700">{formatKey(sholat)}</span>
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
      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© 2025 Jadwal Imsakiyah Kabupaten Subang</p>
        <p>Data diambil dari Aladhan API</p>
        <p>Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi setempat.</p>
      </footer>
    </div>
  );
}
