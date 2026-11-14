const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const sharp = require('sharp'); // ഇമേജ് കംപ്രസ്സ് ചെയ്യാൻ

async function startBot() {
    // സെഷൻ സേവ് ചെയ്ത് വെക്കാൻ (QR കോഡ് വീണ്ടും സ്കാൻ ചെയ്യാതിരിക്കാൻ)
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true, // ടെർമിനലിൽ QR കോഡ് കാണിക്കും
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('കണക്ഷൻ കട്ട് ആയി, റീകണക്റ്റ് ചെയ്യുന്നു...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ വാട്സാപ്പ് ബോട്ട് വിജയകരമായി കണക്റ്റ് ആയി!');
        }
    });

    // വരുന്ന മെസ്സേജുകൾ ഹാൻഡിൽ ചെയ്യാൻ
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const senderID = msg.key.remoteJid;
        
        // ടെക്സ്റ്റ് മെസ്സേജാണോ എന്ന് നോക്കുക
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        // ഉപയോക്താവ് അയച്ച ഫോട്ടോയാണോ എന്ന് നോക്കാൻ
        const imageMessage = msg.message.imageMessage;

        // --- 1. ടെക്സ്റ്റ് കമാൻഡുകൾ ---
        if (textMessage) {
            const command = textMessage.toLowerCase().trim();
            console.log(`മെസ്സേജ് വന്നു (${senderID}): ${command}`);

            if (command === 'hi' || command === 'menu') {
                await sock.sendMessage(senderID, { 
                    text: `നമസ്കാരം! ഞങ്ങളുടെ ബിസിനസ്സ് സർവീസിലേക്ക് സ്വാഗതം. 🤝\n\nതാഴെ പറയുന്ന കമാൻഡുകൾ ഉപയോഗിക്കൂ:\n\n1️⃣ *price* - പ്രൈസ് ലിസ്റ്റ് അറിയാൻ\n2️⃣ *tools* - ഫയൽ കൺവെർട്ട്/കംപ്രസ്സ് ടൂളുകളെ കുറിച്ച് അറിയാൻ` 
                });
            }
            else if (command === 'price') {
                await sock.sendMessage(senderID, { 
                    text: `💰 ഞങ്ങളുടെ സർവീസ് പ്രൈസ് ലിസ്റ്റ്:\nhttps://example.com/pricing\n\nകൂടുതൽ വിവരങ്ങൾക്ക് ബന്ധപ്പെടുക.` 
                });
            }
            else if (command === 'tools') {
                await sock.sendMessage(senderID, { 
                    text: `🛠️ ഫയൽ ടൂളുകൾ:\n- ഇമേജ് കംപ്രസ്സ് ചെയ്യാൻ ഒരു ഫോട്ടോ ചാറ്റിലേക്ക് അയച്ചുതരിക.` 
                });
            }
        }

        // --- 2. യൂസർ ഫോട്ടോ അയക്കുമ്പോൾ അത് കംപ്രസ്സ് ചെയ്ത് തിരിച്ച് അയച്ചു കൊടുക്കുന്നത് ---
        else if (imageMessage) {
            await sock.sendMessage(senderID, { text: `🔄 നിങ്ങളുടെ ഫോട്ടോ ലഭിച്ചിട്ടുണ്ട്, അത് കംപ്രസ്സ് ചെയ്തു കൊണ്ടിരിക്കുന്നു...` });
            
            try {
                // ഫോട്ടോ ഡൗൺലോഡ് ചെയ്യുക
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    { logger: pino({ level: 'silent' }) }
                );

                // Sharp ഉപയോഗിച്ച് ഇമേജ് സൈസ് കുറയ്ക്കുക (Compress)
                const compressedBuffer = await sharp(buffer)
                    .jpeg({ quality: 60 }) // ക്വാളിറ്റി 60% ആയി കുറയ്ക്കുന്നു
                    .toBuffer();

                // തിരിച്ച് യൂസർക്ക് അയച്ചു കൊടുക്കുന്നു
                await sock.sendMessage(senderID, { 
                    image: compressedBuffer, 
                    caption: 'ഇതാ നിങ്ങളുടെ കംപ്രസ്സ് ചെയ്ത ചിത്രം! 👍 (chank!nd3 p4d4y41!)' 
                });

            } catch (error) {
                console.error('ചിത്രം കംപ്രസ്സ് ചെയ്യുന്നതിൽ തടസ്സം:', error);
                await sock.sendMessage(senderID, { text: `ക്ഷമിക്കണം, ഫോട്ടോ പ്രോസസ്സ് ചെയ്യുന്നതിൽ ചെറിയൊരു തടസ്സം നേരിട്ടു.` });
            }
        }
    });
}

startBot();
