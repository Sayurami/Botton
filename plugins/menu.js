import { cmd } from '../lib/command.js';

cmd({
  pattern: "menu",
  alias: ["help", "panel", "commands"],
  desc: "Show main menu",
  category: "general",
  filename: __filename,
}, async (m, conn, { prefix, mek }) => {

  const menuText = `🧠 *Botton UI Menu*\n\n` +
                   `╭──❍ Commands\n` +
                   `│• ${prefix}cine – Movie Search\n` +
                   `│• ${prefix}slanimeclub – Anime Search\n` +
                   `│• ${prefix}settings – Bot Settings\n` +
                   `╰─────────────`;

  return await conn.sendMessage(m.chat, {
    text: menuText,
    footer: "Use .command <value> to run",
    buttons: [
      {
        buttonId: `${prefix}settings`,
        buttonText: { displayText: "⚙️ Settings" },
        type: 1
      },
      {
        buttonId: `${prefix}cine`,
        buttonText: { displayText: "🎬 Movies" },
        type: 1
      },
      {
        buttonId: `${prefix}slanimeclub`,
        buttonText: { displayText: "🧧 Anime" },
        type: 1
      }
    ],
    headerType: 1
  }, { quoted: mek });

});
