// plugins/menu.js const { cmd } = require('../lib/command');

console.log('🔘 menu.js plugin loading...');

cmd({ pattern: 'menu', alias: ['help', 'start'], desc: 'Display main button menu', react: '📋', category: 'main', filename: __filename }, async (conn, mek, m, { from, prefix }) => { console.log('✅ .menu command triggered');

const menuText = ` 📋 GOJO BOT MENU ━━━━━━━━━━━━━━━━━━

1. Anime • ${prefix}slanimeclub <name> • ${prefix}animexin <name>


2. Movies • ${prefix}cine <title> • ${prefix}film <title>


3. Tools • ${prefix}gdrive <link> • ${prefix}mediafire <link>


4. News • ${prefix}hirucheck • ${prefix}deranacheck


5. Settings • ${prefix}settings



━━━━━━━━━━━━━━━━━━ © Thenux-AI | Powered by GOJO`;

return await conn.sendMessage(from, { text: menuText, footer: 'Use .command <value> to run', buttons: [ { buttonId: ${prefix}settings,      buttonText: { displayText: '⚙️ Settings' },   type: 1 }, { buttonId: ${prefix}cine,          buttonText: { displayText: '🎬 Movies' },     type: 1 }, { buttonId: ${prefix}slanimeclub,   buttonText: { displayText: '🧧 Anime' },      type: 1 } ], headerType: 1 }, { quoted: mek }); });

