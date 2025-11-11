import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { watchFile } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import plugins
import jadwalPlugin from './plugins/jadwal.js';
import reminderPlugin from './plugins/reminder.js';
import jadwalSholatPlugin from './plugins/jadwalSholat.js';
import sleepPlugin from './plugins/sleep.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Watch for file changes
watchFile(join(__dirname, 'index.js'), () => {
  console.log('File changed, restarting...');
  process.exit();
});

// Initialize socket
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: [process.env.BOT_NAME || 'WhatsApp Bot', 'Chrome', '4.0.0'],
  });

  // Pairing code connection
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER;
    if (!phoneNumber) {
      throw new Error('Please add PHONE_NUMBER to .env file');
    }
    
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(`Your pairing code: ${code}`);
  }

  // Connection update handler
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('Bot connected successfully!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    
    const from = msg.key.remoteJid;
    const messageType = Object.keys(msg.message)[0];
    const text = msg.message.conversation || msg.message[extendedTextMessage]?.text || '';
    
    // Skip if message from bot itself
    if (msg.key.fromMe) return;

    // Check if message is a command (no prefix)
    const command = text.toLowerCase().trim();
    
    // Initialize plugins
    await jadwalPlugin(sock, msg, command);
    await reminderPlugin(sock, msg, command);
    await jadwalSholatPlugin(sock, msg, command);
    await sleepPlugin(sock, msg, command);
    
    // Menu command
    if (command === 'menu') {
      await sock.sendMessage(from, { react: { key: msg.key, text: '⏳' } });
      
      const menuText = `
📚 *${process.env.BOT_NAME || 'School Bot'} Menu*

📅 *Jadwal Sekolah*
• jadwal - Lihat jadwal hari ini
• jadwalfull - Lihat jadwal lengkap

📝 *Reminder Tugas*
• addre <tugas> - Tambah reminder
• listre - Lihat daftar reminder
• delre <nomor> - Hapus reminder

⏰ *Auto Reminder*
• addsubsre <nomor> - Subscribe reminder
• listsubsre - Lihat subscriber
• delsubsre <nomor> - Unsubscribe
• setsubsre <jam> - Atur waktu kirim
• remindernow - Kirim reminder sekarang

🕌 *Jadwal Sholat*
• jadwalsholat - Lihat jadwal sholat
• setautosholat - Aktifkan auto reminder
• setkotasholat <kota> - Atur kota
• addsubsholat <nomor> - Subscribe
• listsubsholat - Lihat subscriber
• delsubsholat <nomor> - Unsubscribe

😴 *Sleep Reminder*
• addsubsleep <nomor> - Subscribe
• listsubsleep - Lihat subscriber
• delsubsleep <nomor> - Unsubscribe
      `;
      
      await sock.sendMessage(from, { text: menuText });
      await sock.sendMessage(from, { react: { key: msg.key, text: '✅' } });
    }
  });

  // Schedule auto reminder at 18:45
  cron.schedule('45 18 * * *', async () => {
    console.log('Sending daily reminder...');
    await reminderPlugin.sendAutoReminder(sock);
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta'
  });

  // Schedule sleep messages between 21:00-21:35
  cron.schedule('0-35 21 * * *', async () => {
    console.log('Sending sleep messages...');
    await sleepPlugin.sendSleepMessages(sock);
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta'
  });

  // Schedule sholat reminders
  cron.schedule('0 * * * *', async () => {
    console.log('Checking sholat times...');
    await jadwalSholatPlugin.checkSholatTimes(sock);
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta'
  });

  // Schedule class change notifications
  cron.schedule('0,10,25,40,55 * * * *', async () => {
    console.log('Checking class changes...');
    await jadwalPlugin.checkClassChange(sock);
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta'
  });
}

startBot().catch(err => console.error(err));
