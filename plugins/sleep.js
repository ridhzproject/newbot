import db from '../lib/db.js';

const sleepMessages = [
  "Waktunya istirahat, selamat malam 🌙",
  "Tidur yang nyenyak ya mimin 😴",
  "Jangan lupa doa sebelum tidur 🙏",
  "Besok harus lebih semangat lagi! 💪",
  "Mimpi indah ya, selamat tidur ✨",
  "Istirahat cukup untuk kesehatan 💤",
  "Selamat malam, charge energi untuk besok 🔋",
  "Tidur adalah ibadah, selamat beristirahat 😇"
];

const islamicSleepPrayer = "بِسْمِكَ اللَّهُمَّ أَحْيَا وَبِسْمِكَ أَمُوتُ\n(Bismika Allahumma ahya wa bismika amut)";

export default async function sleepPlugin(sock, msg, command) {
  const from = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  
  // Add subscriber
  if (command.startsWith('addsubsleep ')) {
    const number = text.slice(12).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: addsubsleep 628123456789' });
      return;
    }
    
    try {
      db.prepare('INSERT OR IGNORE INTO sleep_subs (number) VALUES (?)').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil subscribe sleep reminder!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal subscribe sleep reminder' });
    }
  }
  
  // List subscribers
  if (command === 'listsubsleep') {
    const subs = db.prepare('SELECT number FROM sleep_subs').all();
    
    if (subs.length === 0) {
      await sock.sendMessage(from, { text: '📱 Belum ada subscriber sleep reminder' });
      return;
    }
    
    let response = '📱 *DAFTAR SUBSCRIBER SLEEP*\n\n';
    subs.forEach((sub, index) => {
      response += `${index + 1}. ${sub.number}\n`;
    });
    
    await sock.sendMessage(from, { text: response });
  }
  
  // Delete subscriber
  if (command.startsWith('delsubsleep ')) {
    const number = text.slice(12).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: delsubsleep 628123456789' });
      return;
    }
    
    try {
      db.prepare('DELETE FROM sleep_subs WHERE number = ?').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil unsubscribe sleep reminder!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal unsubscribe sleep reminder' });
    }
  }
}

// Send sleep messages
export async function sendSleepMessages(sock) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Only send between 21:00-21:35
  if (hours !== 21 || minutes > 35) return;
  
  const message = sleepMessages[Math.floor(Math.random() * sleepMessages.length)];
  const fullMessage = `😴 *SLEEP REMINDER*\n\n${message}\n\n${islamicSleepPrayer}\n\nSelamat tidur 🌙`;
  
  const subs = db.prepare('SELECT number FROM sleep_subs').all();
  for (const sub of subs) {
    try {
      await sock.sendMessage(sub.number + '@s.whatsapp.net', { text: fullMessage });
    } catch (error) {
      console.error(`Error sending sleep message to ${sub.number}:`, error);
    }
  }
}
