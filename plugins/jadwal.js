import db from '../lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Jadwal pelajaran
const jadwalPelajaran = {
  senin: [
    { waktu: '06.45-07.30', pelajaran: 'Upacara' },
    { waktu: '07.30-08.15', pelajaran: 'PKWU' },
    { waktu: '08.15-09.00', pelajaran: 'PKWU' },
    { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
    { waktu: '09.25-10.10', pelajaran: 'Matematika' },
    { waktu: '10.10-10.55', pelajaran: 'Matematika' },
    { waktu: '10.55-11.40', pelajaran: 'Matematika(TL)' },
    { waktu: '11.40-12.25', pelajaran: 'Matematika(TL)' },
    { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
    { waktu: '12.50-13.35', pelajaran: 'Biologi(TL)' },
    { waktu: '13.35-14.20', pelajaran: 'Biologi(TL)' },
    { waktu: '14.20-15.05', pelajaran: 'Bahasa Indonesia' },
    { waktu: '15.05-15.50', pelajaran: 'Bahasa Indonesia' }
  ],
  selasa: [
    { waktu: '06.45-07.30', pelajaran: 'PPKn' },
    { waktu: '07.30-08.15', pelajaran: 'PPkn' },
    { waktu: '08.15-09.00', pelajaran: 'Matematika' },
    { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
    { waktu: '09.25-10.10', pelajaran: 'Matematika' },
    { waktu: '10.10-10.55', pelajaran: 'Biologi(TL)' },
    { waktu: '10.55-11.40', pelajaran: 'Biologi(TL)' },
    { waktu: '11.40-12.25', pelajaran: 'Biologi(TL)' },
    { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
    { waktu: '12.50-13.35', pelajaran: 'Bahasa Indonesia' },
    { waktu: '13.35-14.20', pelajaran: 'Bahasa Indonesia' },
    { waktu: '14.20-15.05', pelajaran: 'Matematika(TL)' },
    { waktu: '15.05-15.50', pelajaran: 'Matematika(TL)' }
  ],
  rabu: [
    { waktu: '06.45-07.30', pelajaran: 'Fisika(TL)' },
    { waktu: '07.30-08.15', pelajaran: 'Fisika(TL)' },
    { waktu: '08.15-09.00', pelajaran: 'Fisika(TL)' },
    { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
    { waktu: '09.25-10.10', pelajaran: 'PAI' },
    { waktu: '10.10-10.55', pelajaran: 'PAI' },
    { waktu: '10.55-11.40', pelajaran: 'PAI' },
    { waktu: '11.40-12.25', pelajaran: 'Matematika(TL)' },
    { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
    { waktu: '12.50-13.35', pelajaran: 'Kimia(TL)' },
    { waktu: '13.35-14.20', pelajaran: 'Kimia(TL)' },
    { waktu: '14.20-15.05', pelajaran: 'Sejarah' },
    { waktu: '15.05-15.50', pelajaran: 'Sejarah' }
  ],
  kamis: [
    { waktu: '06.45-07.30', pelajaran: 'Kimia(TL)' },
    { waktu: '07.30-08.15', pelajaran: 'Kimia(TL)' },
    { waktu: '08.15-09.00', pelajaran: 'Kimia(TL)' },
    { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
    { waktu: '09.25-10.10', pelajaran: 'PJOK' },
    { waktu: '10.10-10.55', pelajaran: 'PJOK' },
    { waktu: '10.55-11.40', pelajaran: 'Bahasa Inggris' },
    { waktu: '11.40-12.25', pelajaran: 'Bahasa Inggris' },
    { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
    { waktu: '12.50-13.35', pelajaran: 'Bahasa Inggris' },
    { waktu: '13.35-14.20', pelajaran: 'PJOK' },
    { waktu: '14.20-15.05', pelajaran: 'Seni Budaya' },
    { waktu: '15.05-15.50', pelajaran: 'Seni Budaya' }
  ],
  jumat: [
    { waktu: '06.45-07.30', pelajaran: 'Bahasa Jawa' },
    { waktu: '07.30-08.15', pelajaran: 'Bahasa Jawa' },
    { waktu: '08.15-09.00', pelajaran: 'Bimbingan Konseling' },
    { waktu: '09.00-09.30', pelajaran: 'Istirahat/Sholat Dhuha' },
    { waktu: '09.30-10.15', pelajaran: 'Fisika(TL)' },
    { waktu: '10.15-11.00', pelajaran: 'Fisika(TL)' }
  ]
};

const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

function getHariIni() {
  return days[new Date().getDay()];
}

function getBesok() {
  const today = new Date().getDay();
  return days[(today + 1) % 7];
}

function formatJadwal(hari) {
  if (hari === 'sabtu' || hari === 'minggu') {
    return `🎉 ${hari.toUpperCase()} - LIBUR`;
  }
  
  const jadwal = jadwalPelajaran[hari];
  if (!jadwal) return 'Jadwal tidak ditemukan';
  
  let text = `📅 *JADWAL ${hari.toUpperCase()}*\n\n`;
  jadwal.forEach((item, index) => {
    text += `${index + 1}. ${item.waktu} = ${item.pelajaran}\n`;
  });
  
  return text;
}

export default async function jadwalPlugin(sock, msg, command) {
  const from = msg.key.remoteJid;
  
  if (command === 'jadwal') {
    await sock.sendMessage(from, { react: { key: msg.key, text: '⏳' } });
    const hariIni = getHariIni();
    const jadwalHariIni = formatJadwal(hariIni);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await sock.sendMessage(from, { text: jadwalHariIni });
    await sock.sendMessage(from, { react: { key: msg.key, text: '✅' } });
  }
  
  if (command === 'jadwalfull') {
    await sock.sendMessage(from, { react: { key: msg.key, text: '⏳' } });
    
    try {
      const imagePath = path.join(__dirname, '../lib/jadwalxia.jpg');
      if (fs.existsSync(imagePath)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await sock.sendMessage(from, { 
          image: { url: imagePath },
          caption: '📚 Jadwal Pelajaran Lengkap'
        });
      } else {
        await sock.sendMessage(from, { text: 'Gambar jadwal tidak ditemukan' });
      }
    } catch (error) {
      console.error('Error sending image:', error);
      await sock.sendMessage(from, { text: 'Terjadi kesalahan saat mengirim gambar' });
    }
    
    await sock.sendMessage(from, { react: { key: msg.key, text: '✅' } });
  }
}

// Auto reminder function
export async function sendAutoReminder(sock) {
  const besok = getBesok();
  const jadwalBesok = formatJadwal(besok);
  
  // Get all subscribers
  const subs = db.prepare('SELECT number FROM reminder_subs').all();
  
  // Get all reminders
  const reminders = db.prepare('SELECT text FROM reminders').all();
  
  let reminderText = `⏰ *REMINDER OTOMATIS*\n\n`;
  reminderText += `📅 *Jadwal Besok (${besok.toUpperCase()})*\n${jadwalBesok}\n\n`;
  
  if (reminders.length > 0) {
    reminderText += `📝 *Daftar Reminder:*\n`;
    reminders.forEach((rem, index) => {
      reminderText += `${index + 1}. ${rem.text}\n`;
    });
  }
  
  // Send to all subscribers
  for (const sub of subs) {
    try {
      await sock.sendMessage(sub.number + '@s.whatsapp.net', { text: reminderText });
    } catch (error) {
      console.error(`Error sending to ${sub.number}:`, error);
    }
  }
}

// Check class change
export async function checkClassChange(sock) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}.${minutes}`;
  
  const hariIni = getHariIni();
  if (hariIni === 'sabtu' || hariIni === 'minggu') return;
  
  const jadwal = jadwalPelajaran[hariIni];
  if (!jadwal) return;
  
  // Find current and next class
  let currentClass = null;
  let nextClass = null;
  
  for (let i = 0; i < jadwal.length; i++) {
    const [start, end] = jadwal[i].waktu.split('-');
    if (currentTime >= start && currentTime <= end) {
      currentClass = jadwal[i];
      if (i < jadwal.length - 1) {
        nextClass = jadwal[i + 1];
      }
      break;
    }
  }
  
  if (currentClass && nextClass && !currentClass.pelajaran.includes('Istirahat')) {
    const motivationalQuotes = [
      "Teruslah bersemangat! 💪",
      "Percaya diri, kamu bisa! 🌟",
      "Jangan menyerah, terus maju! 🚀",
      "Belajar hari ini untuk sukses besok! 📚"
    ];
    
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    
    const notification = `🔔 *PERGANTIAN PELAJARAN*\n\n` +
      `⏰ Jam sekarang: ${currentTime}\n` +
      `📚 Pelajaran saat ini: ${currentClass.pelajaran}\n` +
      `➡️ Pelajaran selanjutnya: ${nextClass.pelajaran}\n\n` +
      `${randomQuote}`;
    
    // Send to all subscribers
    const subs = db.prepare('SELECT number FROM reminder_subs').all();
    for (const sub of subs) {
      try {
        await sock.sendMessage(sub.number + '@s.whatsapp.net', { text: notification });
      } catch (error) {
        console.error(`Error sending notification to ${sub.number}:`, error);
      }
    }
  }
}
