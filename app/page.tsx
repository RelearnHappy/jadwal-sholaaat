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

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const excludedKeys = ["terbit", "dhuha"]; // di MyQuran tidak ada Midnight/Lastthird dsb

  // -- 1) Pastikan di client side
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // -- 2) Fetch jadwal harian MyQuran
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    // Subang ID = 1208 (MyQuran)
    const url = `https://api.myquran.com/v2/sholat/jadwal/1208/${year}/${month}/${day}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.jadwal) {
          const j = data.data.jadwal;
          const formatted: Timings = {
            Imsak: j.imsak,
            Fajr: j.subuh,
            Dhuhr: j.dzuhur,
            Asr: j.ashar,
            Maghrib: j.maghrib,
            Isha: j.isya,
          };
          setJadwal(formatted);
          findNextPrayer(formatted);
        } else {
          setError("Data jadwal harian tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat harian. Coba lagi nanti."));
  }, []);

  // -- 3) Fetch jadwal bulanan
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const url = `https://api.myquran.com/v2/sholat/jadwal/1208/${year}/${month}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.jadwal) {
          setMonthSchedule(data.data.jadwal);
        } else {
          setError("Data jadwal bulanan tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat jadwal sholat bulanan. Coba lagi nanti."));
  }, []);

  // -- 4) Update waktu per detik
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);
    return () => clearInterval(interval);
  }, [jadwal, isClient]);

  // -- Format nama
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

  // -- 5) Tentukan Next Prayer
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

  // -- 6) Hitung countdown
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

    const progress = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    return { hours, minutes, seconds, progress, color };
  };

  const { hours, minutes, seconds, progress, color } = getCountdown();

  if (!isClient) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
          Jadwal Sholat 1447H / 2025M 🌙
        </h1>
        <h2 className="text-2xl font-bold text-gray-800">Kabupaten Subang</h2>
        <h3 className="text-xl font-bold text-gray-800">🕌✨🕌✨🕌</h3>
      </header>

      <main className="flex-grow p-2.5">
        <div className="flex flex-col items-center mb-6">
          <span className="text-xl font-bold text-gray-700">🕥 Waktu Sekarang:</span>
          <div className="text-4xl font-mono bg-gradient-to-l from-green-500 via-black to-black text-white px-8 py-3 rounded-md shadow-md">
            {currentTime.toLocaleTimeString("id-ID")}
          </div>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className={`${color} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Jadwal Harian */}
        <div className="max-w-md mx-auto bg-gradient-to-r from-[#1B263B] to-[#2C3E50] text-white rounded-lg shadow-lg p-8">
          {error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : jadwal ? (
            <ul className="space-y-4">
              {Object.entries(jadwal)
                .map(([sholat, waktu]) => (
                  <li key={sholat} className="flex justify-between border-b pb-4 last:border-0">
                    <span className="font-bold text-gray-200">{formatKey(sholat)}</span>
                    <span className="font-bold text-white">{waktu}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400">Memuat jadwal harian...</p>
          )}
        </div>

        {/* Next Prayer */}
        {nextPrayer && (
          <div className="max-w-md mx-auto bg-gradient-to-r from-green-500 via-black to-black text-white p-3.5 rounded-md shadow-md text-center mt-6">
            <p className="text-lg font-semibold">Berikutnya Waktu: {nextPrayer.name}</p>
            <p className="text-2xl font-mono">{nextPrayer.time.toLocaleTimeString("id-ID")}</p>
            <p className="mt-1">
              Waktu tersisa: {hours} jam {minutes} menit {seconds} detik
            </p>
          </div>
        )}

        {/* Jadwal Bulanan */}
        <section className="max-w-5xl mx-auto mt-10 bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
            Tabel Jadwal Sholat Bulan Ini
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
                  {monthSchedule.map((day, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                      <td className="p-3">{day.tanggal}</td>
                      <td className="p-3">{day.subuh}</td>
                      <td className="p-3">{day.dzuhur}</td>
                      <td className="p-3">{day.ashar}</td>
                      <td className="p-3">{day.maghrib}</td>
                      <td className="p-3">{day.isya}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© 2025 Jadwal Sholat Kabupaten Subang 🌍</p>
        <p>Data diambil dari MyQuran API</p>
        <p>Waktu shalat bersifat perkiraan. Silakan verifikasi dengan jadwal resmi setempat ✅</p>
        <p>🚀Build With❤️.</p>
      </footer>
    </div>
  );
}
