import { useEffect, useState } from 'react';
import axios from 'axios';

function PrayerTimes() {
  const [timings, setTimings] = useState(null);
  const [dateInfo, setDateInfo] = useState(null);
  const cityId = 1208; // ID Subang (sesuai data MyQuran)

  useEffect(() => {
    const fetchTimings = async () => {
      try {
        // API MyQuran — otomatis ambil jadwal hari ini
        const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/today`;
        const response = await axios.get(url);

        // Struktur data: response.data.data.jadwal
        const data = response.data.data;
        setTimings(data.jadwal);
        setDateInfo(data);
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      }
    };

    fetchTimings();
  }, []);

  if (!timings) return <div className="text-center mt-10">Loading jadwal salat...</div>;

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-900 text-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-3 text-center">🕌 Jadwal Salat — {dateInfo.lokasi}</h2>
      <p className="text-center text-gray-400 mb-4">
        {dateInfo.daerah} — {timings.tanggal}
      </p>
      <ul className="space-y-1 text-lg">
        <li>Imsak: {timings.imsak}</li>
        <li>Subuh: {timings.subuh}</li>
        <li>Terbit: {timings.terbit}</li>
        <li>Dzuhur: {timings.dzuhur}</li>
        <li>Ashar: {timings.ashar}</li>
        <li>Maghrib: {timings.maghrib}</li>
        <li>Isya: {timings.isya}</li>
      </ul>

      <div className="mt-4 text-center text-sm text-gray-400">
        Data by <a href="https://api.myquran.com/" className="underline">MyQuran API</a>
      </div>
    </div>
  );
}

export default PrayerTimes;
