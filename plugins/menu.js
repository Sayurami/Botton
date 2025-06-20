// plugins/menu.js  (CommonJS version)
const { cmd } = require('../lib/command');

cmd({
  pattern: 'menu',
  alias: ['help', 'start'],
  desc: 'Display main button menu',
  react: '📋',
  category: 'main',
  filename: __filename            // ✅ now works in CJS
}, async (conn, mek, m, { from, prefix }) => {

  const menuText = `📋 *GOJO BOT MENU*
━━━━━━━━━━━━━━━━━━

1. *Anime*
   • ${prefix}slanimeclub <name>
   • ${prefix}animexin <name>

2. *Movies*
   • ${prefix}cine <title>
   • ${prefix}film <title>

3. *Tools*
   • ${prefix}gdrive <link>
   • ${prefix}mediafire <link>

4. *News*
   • ${prefix}hirucheck
   • ${prefix}deranacheck

5. *Settings*
   • ${prefix}settings

━━━━━━━━━━━━━━━━━━
_© Thenux-AI | Powered by GOJO_`;

  const buttons = [
    { buttonId: `${prefix}settings`,    buttonText: { displayText: '⚙️ Settings' }, type: 1 },
    { buttonId: `${prefix}cine`,        buttonText: { displayText: '🎬 Movies' },   type: 1 },
    { buttonId: `${prefix}slanimeclub`, buttonText: { displayText: '🧧 Anime' },    type: 1 }
  ];

  await conn.sendMessage(from, {
    text: menuText,
    footer: 'Use .command <value> to run',
    buttons,
    headerType: 1
  }, { quoted: mek });
});
