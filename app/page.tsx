"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

interface DayData {
  date: {
    readable: string;
    timestamp: string;
    hijri: Record<string, any>;
    gregorian: {
      date: string;
      weekday: { en: string };
      month: { en: string };
      year: string;
    };
  };
  timings: Timings;
  meta: Record<string, any>;
}

export default function Home() {
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  const [monthSchedule, setMonthSchedule] = useState<DayData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<Date | null>(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const excludedKeys = ["Midnight", "Firstthird", "Lastthird", "Sunrise", "Sunset"];

  // -- 1) Pastikan client side aktif
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // -- 2) Fetch jadwal harian (method 20 = Kemenag Indonesia)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const url = `https://api.aladhan.com/v1/timingsByCity/${today}?city=Subang&state=Jawa%20Barat&country=Indonesia&method=20`;

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

  // -- 3) Fetch jadwal bulanan (method 20 + bulan & tahun otomatis)
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1; // Januari = 1
    const year = now.getFullYear();
    const monthUrl = `https://api.aladhan.com/v1/calendarByCity?city=Subang&state=Jawa%20Barat&country=Indonesia&method=20&month=${month}&year=${year}`;

    fetch(monthUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setMonthSchedule(data.data);
        } else {
          setError("Data jadwal bulanan tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat bulanan. Coba lagi nanti."));
  }, []);

  // -- 4) Update jam tiap detik & refresh next prayer
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);
    return () => clearInterval(interval);
  }, [jadwal, isClient]);

  // Format nama waktu salat → Bahasa Indonesia
  const formatKey = (key: string): string => {
    switch (key) {
      case "Fajr": return "Subuh";
      case "Dhuhr": return "Dzuhur";
      case "Asr": return "Ashar";
      case "Maghrib": return "Maghrib";
      case "Isha": return "Isya";
      case "Imsak": return "Imsak";
      default: return key;
    }
  };

  // -- 5) Cari salat berikutnya
  const findNextPrayer = (timings: Timings) => {
    const now = new Date();
    const prayerTimes = Object.entries(timings)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([name, time]) => {
        const [hours, minutes] = time.split(":").map(Number);
        const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        return { name: formatKey(name), time: prayerTime };
      })
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    const next =
      prayerTimes.find((p) => p.time > now) ||
      { ...prayerTimes[0], time: new Date(prayerTimes[0].time.getTime() + 24 * 60 * 60 * 1000) };

    setNextPrayer(next);
  };

  // -- 6) Hitung countdown
  const getCountdown = () => {
    if (!nextPrayer || !currentTime)
      return { hours: 0, minutes: 0, seconds: 0, progress: 0, color: "bg-green-500" };

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

  if (!isClient || !currentTime)
    return <div className="text-center p-6">Loading...</div>;

  const { hours, minutes, seconds, progress, color } = getCountdown();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#FFD700]">Jadwal Sholat 1447H / {new Date().getFullYear()}M 🌙</h1>
        <h2 className="text-2xl font-bold text-gray-800">Kabupaten Subang</h2>
        <p className="text-gray-600 mt-2">
          📅 {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
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
                  <li key={sholat} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-bold">{formatKey(sholat)}</span>
                    <span className="font-bold text-gray-100">{waktu}</span>
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
            <p className="text-lg font-semibold">Berikutnya: {nextPrayer.name}</p>
            <p className="text-2xl font-mono">{nextPrayer.time.toLocaleTimeString("id-ID")}</p>
            <p className="mt-1">
              ⏳ {hours} jam {minutes} menit {seconds} detik lagi
            </p>
          </div>
        )}

        {/* === TABEL JADWAL BULANAN === */}
        <section className="max-w-5xl mx-auto mt-8 bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
            Tabel Jadwal Sholat ({new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })})
          </h2>

          {monthSchedule.length === 0 && !error && <p className="text-center">Memuat jadwal bulanan...</p>}
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
                  {monthSchedule.map((day, i) => {
                    const { date, timings } = day;
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                        <td className="p-3">
                          {date.gregorian.date} ({date.gregorian.weekday.en})
                        </td>
                        <td className="p-3">{timings.Fajr}</td>
                        <td className="p-3">{timings.Dhuhr}</td>
                        <td className="p-3">{timings.Asr}</td>
                        <td className="p-3">{timings.Maghrib}</td>
                        <td className="p-3">{timings.Isha}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        </section>
      </main>

      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© {new Date().getFullYear()} Jadwal Sholat Kabupaten Subang 🌍</p>
        <p>Data dari AlAdhan API (method 20 — Kemenag RI)</p>
        <p>Waktu bersifat perkiraan, verifikasi dengan jadwal resmi setempat ✅</p>
        <p>🚀 Build with ❤️</p>
      </footer>
    </div>
  );
}
