"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

interface DayData {
  date: {
    readable: string;           // "01 June 2025"
    timestamp: string;         // "1746034800"
    hijri: Record<string, any>; // detail tanggal hijriyah
    gregorian: {
      date: string;            // "01 June 2025"
      weekday: { en: string }; // "Sunday"
      month: { en: string };   // "June"
      year: string;            // "2025"
    };
  };
  timings: Timings;
  meta: Record<string, any>;
}

export default function Home() {
  // State untuk jadwal 1 hari (untuk Next Prayer)
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  // State untuk jadwal 1 bulan penuh
  const [monthSchedule, setMonthSchedule] = useState<DayData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<Date | null>(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const excludedKeys = ["Midnight", "Firstthird", "Lastthird", "Sunrise", "Sunset"];

  // -- 1) Pastikan kita sudah di client side
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // -- 2) Fetch jadwal harian (untuk Next Prayer)
  useEffect(() => {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=8`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.timings) {
          setJadwal(data.data.timings);
          findNextPrayer(data.data.timings);
        } else {
          setError("Data jadwal harian tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat harian. Coba lagi nanti."));
  }, []);

  // -- 3) Fetch jadwal bulanan (untuk tabel sebulan penuh)
  useEffect(() => {
    const monthUrl = `https://api.aladhan.com/v1/calendarByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=8&month=6&year=2025`;

    fetch(monthUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          // data.data akan berisi array dayData untuk setiap hari di bulan Mei
          setMonthSchedule(data.data);
        } else {
          setError("Data jadwal bulanan tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat bulanan. Coba lagi nanti."));
  }, []);

  // -- 4) Update waktu setiap detik, cari Next Prayer lagi
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);

    return () => clearInterval(interval);
  }, [jadwal, isClient]);

  // Fungsi untuk me-translate nama key API ke bahasa Indonesia
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

  // -- 5) Mencari Next Prayer (jadwal harian)
  const findNextPrayer = (timings: Timings) => {
    const now = new Date();
    const prayerTimes = Object.entries(timings)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([name, time]) => {
        const [hoursStr, minutesStr] = time.split(":");
        const prayerTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          parseInt(hoursStr),
          parseInt(minutesStr),
          0
        );
        return { name: formatKey(name), time: prayerTime };
      })
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    const next =
      prayerTimes.find((p) => p.time > now) || {
        ...prayerTimes[0],
        time: new Date(prayerTimes[0].time.getTime() + 24 * 60 * 60 * 1000),
      };
    setNextPrayer(next);
  };

  // -- 6) Hitung countdown ke next prayer
  const getCountdown = () => {
    if (!nextPrayer || !currentTime) {
      return { hours: 0, minutes: 0, seconds: 0, progress: 0, color: "bg-green-500" };
    }
    const now = new Date();
    const diff = Math.max(0, nextPrayer.time.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let color = "bg-green-500"; // Default: hijau
    if (minutes < 60) color = "bg-yellow-500"; // Jika < 60 menit, kuning
    if (minutes < 10) color = "bg-red-500"; // Jika < 10 menit, merah

    const dayStart = new Date(nextPrayer.time);
    dayStart.setHours(0, 0, 0, 0);
    const totalDayMs = 24 * 60 * 60 * 1000;
    const passedMs = now.getTime() - dayStart.getTime();
    const progress = (passedMs / totalDayMs) * 100;

    return { hours, minutes, seconds, progress, color };
  };

  // Jika belum siap di client
  if (!isClient || !currentTime) {
    return <div className="text-center p-6">Loading...</div>;
  }

  /*INI DINONAKTIFKAN SELAIN DIBULAN RAMADHA HIJRIYAH */
  /* // -- 7) Perhitungan info Ramadan
  const ramadanStart = new Date("2025-03-01");
  let ramadanDayText = "";
  let ramadanDateText = "";
  if (currentTime >= ramadanStart) {
    const diffDays = Math.floor((currentTime.getTime() - ramadanStart.getTime()) / (1000 * 60 * 60 * 24));
    const ramadanDay = diffDays + 1; // Hari pertama = 1
    ramadanDayText = `Ramadhan Hari ke-${ramadanDay}`;
    ramadanDateText = currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else {
    ramadanDayText = "Ramadhan belum dimulai";
  } */

  const { hours, minutes, seconds, progress, color } = getCountdown();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#FFD700] text-glow">
          Jadwal Sholat 1446H / 2025M 🌙
        </h1>
        <h2 className="text-2xl font-bold text-gray-800">Kabupaten Subang</h2>
        <h3 className="text-xl font-bold text-gray-800">
          🕌✨🕌✨🕌
        </h3>
        
        <p className="text-gray-600 mt-2">📅 1 Juni - 30 Juni 2025</p>

        
      </header>

      <main className="flex-grow p-2.5">
        {/* Waktu Sekarang */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-xl font-bold text-gray-700">🕥 Waktu Sekarang:</span>
          <div className="text-4xl font-mono bg-gradient-to-l from-green-500 via-black to-black text-white px-8 py-3 rounded-md shadow-md">
            {currentTime.toLocaleTimeString("id-ID")}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className={`${color} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Jadwal Sholat Hari Ini */}
        <div className="max-w-md mx-auto bg-gradient-to-r from-[#1B263B] to-[#2C3E50] text-white rounded-lg shadow-lg p-8">
          {error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : jadwal ? (
            <ul className="space-y-4">
              {Object.entries(jadwal)
                .filter(([key]) => !excludedKeys.includes(key))
                .map(([sholat, waktu]) => (
                  <li
                    key={sholat}
                    className="flex justify-between border-b pb-4.5 last:border-0"
                  >
                    <span className="font-bold text-black-700">{formatKey(sholat)}</span>
                    <span className="font-bold text-gray-900">{waktu}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">Loading...</p>
          )}
        </div>

        {/* Countdown Next Prayer */}
        {nextPrayer && (
          <div className="max-w-md mx-auto bg-gradient-to-r from-green-500 via-black to-black text-white p-3.5 rounded-md shadow-md text-center mb-6">
            <p className="text-lg font-semibold">Berikutnya Waktu: {nextPrayer.name}</p>
            <p className="text-2xl font-mono">
              {nextPrayer.time.toLocaleTimeString("id-ID")}
            </p>
            <p className="mt-1">
              Waktu tersisa: {hours} jam {minutes} menit {seconds} detik
            </p>
          </div>
        )}
      
        {/* === TABEL JADWAL BULANAN (JUNI 2025) === */}
        <section className="max-w-5xl mx-auto mt-8 bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
            Tabel Jadwal Sholat (JUNI 2025)
          </h2>
          {monthSchedule.length === 0 && !error && (
            <p className="text-center">Memuat jadwal bulanan...</p>
          )}
          {monthSchedule.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white text-gray-800 shadow-md rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="border-gray-300 p-3">Tanggal</th>
                    <th className="border-gray-300 p-3">Subuh 🌅</th>
                    <th className="border-gray-300 p-3">Dzuhur ☀️</th>
                    <th className="border-gray-300 p-3">Ashar 🌇</th>
                    <th className="border-gray-300 p-3">Maghrib 🌆</th>
                    <th className="border-gray-300 p-3">Isya 🌙</th>
                  </tr>
                </thead>
                <tbody>
                  {monthSchedule.map((dayData, idx) => {
                    // dayData: { date: {...}, timings: {...}, meta: {...} }
                    const { date, timings } = dayData;
                    // Contoh: date.gregorian.date = "01 June 2025"
                    const {
                      Imsak,
                      Fajr,
                      Dhuhr,
                      Asr,
                      Maghrib,
                      Isha
                    } = timings;

                    return (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                        <td className="border-gray-300 p-3">
                          {date.gregorian.date} ({date.gregorian.weekday.en})
                        </td>
                        <td className="border-gray-300 p-3">{Fajr}</td>
                        <td className="border-gray-300 p-3">{Dhuhr}</td>
                        <td className="border-gray-300 p-3">{Asr}</td>
                        <td className="border-gray-300 p-3">{Maghrib}</td>
                        <td className="border-gray-300 p-3">{Isha}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {error && (
            <p className="text-center text-red-500 mt-4">
              {error}
            </p>
          )}
        </section>
      </main>

      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© 2025 Jadwal Sholat Kabupaten Subang 🌍</p>
        <p>Data diambil dari Aladhan API</p>
        <p>Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi setempat ✅.</p>
        <p>🚀Build With❤️.</p>
      </footer>
    </div>
  );
}
