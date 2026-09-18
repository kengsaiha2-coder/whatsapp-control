const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startBot() {
    // 1. ระบบจำการเข้าสู่ระบบ (Session)
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');

    // 2. เริ่มทำงานตัวบอทเชื่อมต่อ WhatsApp
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // สั่งให้โชว์ QR Code บน Console ของ Pterodactyl
    });

    // 3. ติดตามสถานะการเชื่อมต่อ และพิมพ์ QR Code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            // โชว์ QR Code บนแผงเว็บ Pterodactyl เพื่อให้เราเอา WhatsApp สแกนเข้าสู่ระบบ
            qrcode.generate(qr, { small: true });
        }
        if(connection === 'close') {
            console.log('การเชื่อมต่อถูกปิด กำลังเริ่มระบบใหม่...');
            startBot();
        } else if(connection === 'open') {
            console.log('✅ บอทเชื่อมต่อกับ WhatsApp สำเร็จ พร้อมทำงาน!');
        }
    });

    // 4. บันทึกค่าเซสชันเมื่อมีการเปลี่ยนแปลง
    sock.ev.on('creds.update', saveCreds);

    // 5. [เพิ่มฟังก์ชัน Gacor / Bug ตรงนี้]
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageType = Object.keys(msg.message)[0];
        const from = msg.key.remoteJid;
        
        // ตัวอย่างคำสั่งเรียกใช้เคสบัก (เมื่อพิมพ์คำว่า .bug ตามด้วยเบอร์)
        if (messageType === 'conversation' && msg.message.conversation.startsWith('.bug')) {
            console.log(`[!] กำลังเรียกใช้ฟังก์ชันบั๊กเพื่อส่งไปยังเป้าหมาย: ${from}`);
            
            // ฟังก์ชันบั๊กโค้ดไวรัสของคุณที่จะใส่ตรงนี้ (เช่น การส่ง Payload ยาวๆ)
            const bugPayload = "💥 [โค้ดไวรัสบั๊ก WhatsApp ของคุณ] 💥"; 
            
            await sock.sendMessage(from, { text: bugPayload });
        }
    });
}

startBot();
