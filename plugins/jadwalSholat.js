import db from '../lib/db.js';
import axios from 'axios';

const motivationalQuotes = [
  "Jangan lupa sholat, itu kunci surga 🕌",
  "Sholat itu tiang agama, teguhkanlah 🌟",
  "Sholat tepat waktu, hidup lebih berkah 💫",
  "Allah menyukai hamba yang sholat tepat waktu ❤️"
];

async function getCityId(cityName) {
  try {
    const response = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${cityName}`);
    if (response.data.status && response.data.data.length > 0) {
      return response.data.data[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting city ID:', error);
    return null;
  }
}

async function getPrayerSchedule(cityId, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  try {
    const response = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${dateStr}`);
    if (response.data.status) {
      return response.data.data.jadwal;
    }
    return null;
  } catch (error) {
    console.error('Error getting prayer schedule:', error);
    return null;
  }
}

export default async function jadwalSholatPlugin(sock, msg, command) {
  const from = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  
  // Get prayer schedule
  if (command === 'jadwalsholat') {
    await sock.sendMessage(from, { react: { key: msg.key, text: '⏳' } });
    
    // Get city from settings
    const settings = db.prepare('SELECT city_id FROM sholat_settings WHERE id = 1').get();
    const cityId = settings?.city_id || '1609'; // Default Tuban
    
    const schedule = await getPrayerSchedule(cityId);
    if (!schedule) {
      await sock.sendMessage(from, { text: '❌ Gagal mendapatkan jadwal sholat' });
      return;
    }
    
    let response = `🕌 *JADWAL SHOLAT*\n\n`;
    response += `📍 Lokasi: ${schedule.lokasi}\n`;
    response += `📅 Tanggal: ${schedule.tanggal}\n\n`;
    response += `⏰ Imsak: ${schedule.imsak}\n`;
    response += `🌅 Subuh: ${schedule.subuh}\n`;
    response += `☀️ Terbit: ${schedule.terbit}\n`;
    response += `🌤️ Dhuha: ${schedule.dhuha}\n`;
    response += `🌞 Dzuhur: ${schedule.dzuhur}\n`;
    response += `🌇 Ashar: ${schedule.ashar}\n`;
    response += `🌆 Maghrib: ${schedule.maghrib}\n`;
    response += `🌌 Isya: ${schedule.isya}\n`;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await sock.sendMessage(from, { text: response });
    await sock.sendMessage(from, { react: { key: msg.key, text: '✅' } });
  }
  
  // Set auto sholat
  if (command === 'setautosholat') {
    const enabled = db.prepare('SELECT auto_enabled FROM sholat_settings WHERE id = 1').get()?.auto_enabled || 0;
    const newState = enabled ? 0 : 1;
    
    db.prepare('UPDATE sholat_settings SET auto_enabled = ? WHERE id = 1').run(newState);
    
    if (newState) {
      await sock.sendMessage(from, { text: '✅ Auto reminder sholat diaktifkan' });
    } else {
      await sock.sendMessage(from, { text: '❌ Auto reminder sholat dinonaktifkan' });
    }
  }
  
  // Set city for sholat
  if (command.startsWith('setkotasholat ')) {
    const cityName = text.slice(13).trim();
    if (!cityName) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nama kota\nContoh: setkotasholat kediri' });
      return;
    }
    
    const cityId = await getCityId(cityName);
    if (!cityId) {
      await sock.sendMessage(from, { text: '❌ Kota tidak ditemukan' });
      return;
    }
    
    db.prepare('UPDATE sholat_settings SET city_id = ? WHERE id = 1').run(cityId);
    await sock.sendMessage(from, { text: `✅ Kota sholat diubah ke ${cityName}` });
  }
  
  // Add subscriber
  if (command.startsWith('addsubsholat ')) {
    const number = text.slice(13).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: addsubsholat 628123456789' });
      return;
    }
    
    try {
      db.prepare('INSERT OR IGNORE INTO sholat_subs (number) VALUES (?)').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil subscribe reminder sholat!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal subscribe reminder sholat' });
    }
  }
  
  // List subscribers
  if (command === 'listsubsholat') {
    const subs = db.prepare('SELECT number FROM sholat_subs').all();
    
    if (subs.length === 0) {
      await sock.sendMessage(from, { text: '📱 Belum ada subscriber reminder sholat' });
      return;
    }
    
    let response = '📱 *DAFTAR SUBSCRIBER SHOLAT*\n\n';
    subs.forEach((sub, index) => {
      response += `${index + 1}. ${sub.number}\n`;
    });
    
    await sock.sendMessage(from, { text: response });
  }
  
  // Delete subscriber
  if (command.startsWith('delsubsholat ')) {
    const number = text.slice(13).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: delsubsholat 628123456789' });
      return;
    }
    
    try {
      db.prepare('DELETE FROM sholat_subs WHERE number = ?').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil unsubscribe reminder sholat!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal unsubscribe reminder sholat' });
    }
  }
}

// Check sholat times and send reminders
export async function checkSholatTimes(sock) {
  const settings = db.prepare('SELECT city_id, auto_enabled FROM sholat_settings WHERE id = 1').get();
  
  if (!settings?.auto_enabled) return;
  
  const cityId = settings.city_id;
  const schedule = await getPrayerSchedule(cityId);
  if (!schedule) return;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const prayerTimes = [
    { name: 'Subuh', time: schedule.subuh },
    { name: 'Dzuhur', time: schedule.dzuhur },
    { name: 'Ashar', time: schedule.ashar },
    { name: 'Maghrib', time: schedule.maghrib },
    { name: 'Isya', time: schedule.isya }
  ];
  
  for (const prayer of prayerTimes) {
    if (currentTime === prayer.time) {
      const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      const message = `🕌 *WAKTU SHOLAT ${prayer.name.toUpperCase()}*\n\n${quote}\n\nJangan lupa sholat tepat waktu!`;
      
      const subs = db.prepare('SELECT number FROM sholat_subs').all();
      for (const sub of subs) {
        try {
          await sock.sendMessage(sub.number + '@s.whatsapp.net', { text: message });
        } catch (error) {
          console.error(`Error sending sholat reminder to ${sub.number}:`, error);
        }
      }
    }
  }
}
