"use client";

import { useEffect, useState } from "react";

type Timings = {
  [key: string]: string;
};

export default function Home() {
  const [jadwal, setJadwal] = useState<Timings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const excludedKeys = ["Midnight", "Firstthird", "Lastthird", "Sunrise", "Sunset"];

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

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
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (jadwal) findNextPrayer(jadwal);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [jadwal, isClient]);

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
    if (!isClient) return;
    
    const now = new Date();
    const prayerTimes = Object.entries(timings)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([name, time]) => ({
        name: formatKey(name),
        time: new Date(now.toDateString() + " " + time),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    const next =
      prayerTimes.find((p) => p.time > now) || {
        ...prayerTimes[0],
        time: new Date(prayerTimes[0].time.getTime() + 24 * 60 * 60 * 1000),
      };
    setNextPrayer(next);
  };

  const getCountdown = () => {
    if (!nextPrayer || !currentTime) return { hours: 0, minutes: 0, seconds: 0, progress: 0 };
    const now = new Date();
    const diff = Math.max(0, nextPrayer.time.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const dayStart = new Date(nextPrayer.time);
    dayStart.setHours(0, 0, 0, 0);
    const totalDayMs = 24 * 60 * 60 * 1000;
    const passedMs = now.getTime() - dayStart.getTime();
    const progress = (passedMs / totalDayMs) * 100;

    return { hours, minutes, seconds, progress };
  };

  if (!isClient || !currentTime) {
    return <div className="text-center p-6">Loading...</div>;
  }

  const { hours, minutes, seconds, progress } = getCountdown();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Jadwal Imsakiyah Kabupaten Subang</h1>
        <p className="text-gray-600 mt-2">Selamat Menjalankan Puasa Ramadhan 1446H / 2025M</p>
        <p className="text-gray-600 mt-2">📅 1 Maret - 30 Maret 2025</p>
      </header>
      <main className="flex-grow p-6">
        {/* Waktu Sekarang */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-gray-600 font-medium">🕥 Waktu Sekarang:</span>
          <div className="text-4xl font-mono bg-green-500 text-white px-8 py-3 rounded-md shadow-md">
            {currentTime.toLocaleTimeString("id-ID")}
          </div>
        </div>

        {/* Countdown */}
        {nextPrayer && (
          <div className="max-w-md mx-auto bg-green-500 text-white p-4 rounded-md shadow-md text-center mb-6">
            <p className="text-lg font-semibold">Berikutnya: {nextPrayer.name}</p>
            <p className="text-2xl font-mono">{nextPrayer.time.toLocaleTimeString("id-ID")}</p>
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
      <footer className="bg-white text-center text-sm text-gray-600 p-4 border-t">
        <p>© 2025 Jadwal Imsakiyah Kabupaten Subang</p>
      </footer>
    </div>
  );
}
