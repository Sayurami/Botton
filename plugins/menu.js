const { cmd } = require('../lib/command');

cmd({
  pattern: 'menu',
  desc: 'Show main button menu',
  category: 'main',
  react: '📋',
  filename: __filename
}, async (conn, mek, m) => {
  const from = m.key.remoteJid;

  const buttons = [
    { buttonId: '!help', buttonText: { displayText: 'Help' }, type: 1 },
    { buttonId: '!pastpp', buttonText: { displayText: 'Past Papers' }, type: 1 },
    { buttonId: '!ping', buttonText: { displayText: 'Ping' }, type: 1 }
  ];

  const message = {
    text: '*🏠 Main Menu*\nChoose an option below:',
    footer: 'Powered by Gojo-MD',
    buttons,
    headerType: 1
  };

  await conn.sendMessage(from, message, { quoted: m });
});
