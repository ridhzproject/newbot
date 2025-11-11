import db from '../lib/db.js';

export default async function reminderPlugin(sock, msg, command) {
  const from = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  
  // Add reminder
  if (command.startsWith('addre ')) {
    const reminderText = text.slice(6).trim();
    if (!reminderText) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan teks reminder\nContoh: addre Mengerjakan PR Matematika' });
      return;
    }
    
    try {
      db.prepare('INSERT INTO reminders (text) VALUES (?)').run(reminderText);
      await sock.sendMessage(from, { text: '✅ Reminder berhasil ditambahkan!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal menambahkan reminder' });
    }
  }
  
  // List reminders
  if (command === 'listre') {
    const reminders = db.prepare('SELECT id, text FROM reminders').all();
    
    if (reminders.length === 0) {
      await sock.sendMessage(from, { text: '📝 Belum ada reminder' });
      return;
    }
    
    let response = '📝 *DAFTAR REMINDER*\n\n';
    reminders.forEach((rem, index) => {
      response += `${index + 1}. ${rem.text}\n`;
    });
    
    await sock.sendMessage(from, { text: response });
  }
  
  // Delete reminder
  if (command.startsWith('delre ')) {
    const index = parseInt(text.slice(6).trim()) - 1;
    
    if (isNaN(index) || index < 0) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor reminder yang valid\nContoh: delre 1' });
      return;
    }
    
    const reminders = db.prepare('SELECT id FROM reminders').all();
    if (index >= reminders.length) {
      await sock.sendMessage(from, { text: '❌ Nomor reminder tidak ditemukan' });
      return;
    }
    
    try {
      db.prepare('DELETE FROM reminders WHERE id = ?').run(reminders[index].id);
      await sock.sendMessage(from, { text: '✅ Reminder berhasil dihapus!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal menghapus reminder' });
    }
  }
  
  // Add subscriber
  if (command.startsWith('addsubsre ')) {
    const number = text.slice(10).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: addsubsre 628123456789' });
      return;
    }
    
    try {
      db.prepare('INSERT OR IGNORE INTO reminder_subs (number) VALUES (?)').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil subscribe reminder!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal subscribe reminder' });
    }
  }
  
  // List subscribers
  if (command === 'listsubsre') {
    const subs = db.prepare('SELECT number FROM reminder_subs').all();
    
    if (subs.length === 0) {
      await sock.sendMessage(from, { text: '📱 Belum ada subscriber reminder' });
      return;
    }
    
    let response = '📱 *DAFTAR SUBSCRIBER REMINDER*\n\n';
    subs.forEach((sub, index) => {
      response += `${index + 1}. ${sub.number}\n`;
    });
    
    await sock.sendMessage(from, { text: response });
  }
  
  // Delete subscriber
  if (command.startsWith('delsubsre ')) {
    const number = text.slice(10).trim().replace(/[^0-9]/g, '');
    if (!number) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan nomor yang valid\nContoh: delsubsre 628123456789' });
      return;
    }
    
    try {
      db.prepare('DELETE FROM reminder_subs WHERE number = ?').run(number);
      await sock.sendMessage(from, { text: '✅ Berhasil unsubscribe reminder!' });
    } catch (error) {
      await sock.sendMessage(from, { text: '❌ Gagal unsubscribe reminder' });
    }
  }
  
  // Set reminder time (placeholder)
  if (command.startsWith('setsubsre ')) {
    const time = text.slice(10).trim();
    if (!time) {
      await sock.sendMessage(from, { text: '❌ Mohon masukkan waktu yang valid\nContoh: setsubsre 18:45' });
      return;
    }
    
    // This would require additional database table to store custom time
    await sock.sendMessage(from, { text: '⚠️ Fitur ini memerlukan pengembangan lebih lanjut' });
  }
  
  // Send reminder now
  if (command === 'remindernow') {
    // Import and use the sendAutoReminder function
    const { sendAutoReminder } = await import('./jadwal.js');
    await sendAutoReminder(sock);
    await sock.sendMessage(from, { text: '✅ Reminder telah dikirim!' });
  }
}
