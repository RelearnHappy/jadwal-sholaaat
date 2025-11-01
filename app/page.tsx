"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

interface DayData {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export default function Home() {
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  const [monthSchedule, setMonthSchedule] = useState<DayData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<Date | null>(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // ID kota Subang (dari MyQuran API)
  const cityId = 1208;
  const excludedKeys = ["terbit", "dhuha"];

  // -- 1) Pastikan client-side
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // -- 2) Fetch jadwal harian dari MyQuran
  useEffect(() => {
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/today`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.jadwal) {
          setJadwal(data.data.jadwal);
          findNextPrayer(data.data.jadwal);
        } else {
          setError("Data jadwal harian tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat harian. Coba lagi nanti."));
  }, []);

  // -- 3) Fetch jadwal bulanan dari MyQuran
  useEffect(() => {
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/2025/11`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.jadwal) {
          // data.data.jadwal adalah array dari tanggal 1–30
          setMonthSchedule(data.data.jadwal);
        } else {
          setError("Data jadwal bulanan tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat bulanan. Coba lagi nanti."));
  }, []);

  // -- 4) Update waktu & cari Next Prayer tiap detik
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);

    return () => clearInterval(interval);
  }, [jadwal, isClient]);

  // -- 5) Format nama jadwal
  const formatKey = (key: string): string => {
    switch (key.toLowerCase()) {
      case "imsak":
        return "Imsak";
      case "subuh":
        return "Subuh";
      case "dzuhur":
        return "Dzuhur";
      case "ashar":
        return "Ashar";
      case "maghrib":
        return "Maghrib";
      case "isya":
        return "Isya";
      default:
        return key;
    }
  };

  // -- 6) Cari Next Prayer
  const findNextPrayer = (timings: Timings) => {
    const now = new Date();
    const prayerTimes = Object.entries(timings)
      .filter(([key]) => !excludedKeys.includes(key.toLowerCase()))
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

  // -- 7) Hitung countdown
  const getCountdown = () => {
    if (!nextPrayer || !currentTime) {
      return { hours: 0, minutes: 0, seconds: 0, progress: 0, color: "bg-green-500" };
    }
    const now = new Date();
    const diff = Math.max(0, nextPrayer.time.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let color = "bg-green-500";
    if (minutes < 60) color = "bg-yellow-500";
    if (minutes < 10) color = "bg-red-500";

    const dayStart = new Date(nextPrayer.time);
    dayStart.setHours(0, 0, 0, 0);
    const totalDayMs = 24 * 60 * 60 * 1000;
    const passedMs = now.getTime() - dayStart.getTime();
    const progress = (passedMs / totalDayMs) * 100;

    return { hours, minutes, seconds, progress, color };
  };

  if (!isClient || !currentTime) {
    return <div className="text-center p-6">Loading...</div>;
  }

  const { hours, minutes, seconds, progress, color } = getCountdown();

  // --- UI utama ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#FFD700]">
          Jadwal Sholat 1447H / 2025M 🌙
        </h1>
        <h2 className="text-2xl font-bold text-gray-800">Kabupaten Subang</h2>
        <h3 className="text-xl font-bold text-gray-800">🕌✨🕌✨🕌</h3>
        <p className="text-gray-600 mt-2">📅 November 2025</p>
      </header>

      <main className="flex-grow p-2.5">
        {/* Waktu sekarang */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-xl font-bold text-gray-700">🕥 Waktu Sekarang:</span>
          <div className="text-4xl font-mono bg-gradient-to-l from-green-500 via-black to-black text-white px-8 py-3 rounded-md shadow-md">
            {currentTime.toLocaleTimeString("id-ID")}
          </div>
        </div>

        {/* Progress */}
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
                .filter(([key]) => !excludedKeys.includes(key.toLowerCase()))
                .map(([sholat, waktu]) => (
                  <li key={sholat} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-bold text-black-700">{formatKey(sholat)}</span>
                    <span className="font-bold text-gray-100">{waktu}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">Loading...</p>
          )}
        </div>

        {/* Countdown */}
        {nextPrayer && (
          <div className="max-w-md mx-auto bg-gradient-to-r from-green-500 via-black to-black text-white p-3.5 rounded-md shadow-md text-center mb-6">
            <p className="text-lg font-semibold">Berikutnya: {nextPrayer.name}</p>
            <p className="text-2xl font-mono">{nextPrayer.time.toLocaleTimeString("id-ID")}</p>
            <p className="mt-1">
              Waktu tersisa: {hours} jam {minutes} menit {seconds} detik
            </p>
          </div>
        )}

        {/* Tabel Bulanan */}
        <section className="max-w-5xl mx-auto mt-8 bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
            Tabel Jadwal Sholat (November 2025)
          </h2>
          {monthSchedule.length === 0 && !error && (
            <p className="text-center">Memuat jadwal bulanan...</p>
          )}
          {monthSchedule.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white text-gray-800 shadow-md rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Subuh 🌅</th>
                    <th className="p-3">Dzuhur ☀️</th>
                    <th className="p-3">Ashar 🌇</th>
                    <th className="p-3">Maghrib 🌆</th>
                    <th className="p-3">Isya 🌙</th>
                  </tr>
                </thead>
                <tbody>
                  {monthSchedule.map((dayData, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                      <td className="p-3">{dayData.tanggal}</td>
                      <td className="p-3">{dayData.subuh}</td>
                      <td className="p-3">{dayData.dzuhur}</td>
                      <td className="p-3">{dayData.ashar}</td>
                      <td className="p-3">{dayData.maghrib}</td>
                      <td className="p-3">{dayData.isya}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        </section>
      </main>

      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© 2025 Jadwal Sholat Kabupaten Subang 🌍</p>
        <p>Data diambil dari MyQuran API</p>
        <p>Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi setempat ✅.</p>
        <p>🚀 Build With ❤️.</p>
      </footer>
    </div>
  );
}
