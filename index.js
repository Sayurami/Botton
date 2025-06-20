// gojo-index-buttonui.js

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  Browsers,
  delay,
  proto,
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const moment = require('moment-timezone');
const qrcode = require('qrcode-terminal');
const NodeCache = require('node-cache');
const util = require('util');
const path = require('path');

const config = require('./settings');
const { smsg, getBuffer, sleep } = require('./lib/functions');
const { sms } = require('./lib/msg');
const events = require('./lib/command'); // Your commands loader
const axios = require('axios');
const FileType = require('file-type');

const msgRetryCounterCache = new NodeCache();
const prefix = config.PREFIX === 'false' || config.PREFIX === 'null' ? '^' : new RegExp('^[' + config.PREFIX + ']');
const ownerNumber = config.OWNER_NUMBER;

let conn; // global connection

async function connectToWA() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'lib/session'));
  conn = makeWASocket({
    logger: P({ level: 'fatal' }).child({ level: 'fatal' }),
    printQRInTerminal: true,
    auth: state,
    defaultQueryTimeoutMs: undefined,
    msgRetryCounterCache,
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log('Connection closed, reconnecting...');
        connectToWA();
      } else {
        console.log('Connection logged out, please delete session and re-run.');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected');
      // Load plugins
      fs.readdirSync('./plugins').forEach((plugin) => {
        if (plugin.endsWith('.js')) {
          require(`./plugins/${plugin}`);
        }
      });
      // Notify owner
      conn.sendMessage(ownerNumber + '@s.whatsapp.net', {
        text: '*GOJO MD Connected Successfully!*',
      });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async (messageUpdate) => {
    try {
      const mek = messageUpdate.messages[0];
      if (!mek.message) return;

      mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

      const m = sms(conn, mek);
      const from = mek.key.remoteJid;
      const type = getContentType(mek.message);
      let body = '';

      if (type === 'conversation') body = mek.message.conversation;
      else if (type === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
      else if (type === 'imageMessage' && mek.message.imageMessage.caption) body = mek.message.imageMessage.caption;
      else if (type === 'videoMessage' && mek.message.videoMessage.caption) body = mek.message.videoMessage.caption;
      else if (type === 'templateButtonReplyMessage') body = mek.message.templateButtonReplyMessage.selectedId;
      else if (type === 'interactiveResponseMessage') {
        try {
          body = JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id;
        } catch { }
      }

      const isCmd = prefix.test(body);
      const command = isCmd ? body.slice(config.PREFIX.length).split(' ')[0].toLowerCase() : null;
      const args = body.trim().split(/ +/).slice(1);

      // Run command if exists
      if (isCmd) {
        const cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
        if (cmd) {
          if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
          try {
            await cmd.function(conn, mek, m, { from, body, command, args, isCmd, prefix, isOwner: mek.key.participant === ownerNumber + '@s.whatsapp.net' });
          } catch (err) {
            console.error('[PLUGIN ERROR]', err);
            await conn.sendMessage(from, { text: 'Error: ' + err.message }, { quoted: mek });
          }
        }
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });

  // Helper: send button message
  conn.sendButtonMessage = async (jid, buttons, quoted, opts = {}) => {
    let header = {};
    if (opts.video) {
      const video = await prepareWAMessageMedia({ video: { url: opts.video } }, { upload: conn.waUploadToServer });
      header = { title: opts.header || '', hasMediaAttachment: true, videoMessage: video.videoMessage };
    } else if (opts.image) {
      const image = await prepareWAMessageMedia({ image: { url: opts.image } }, { upload: conn.waUploadToServer });
      header = { title: opts.header || '', hasMediaAttachment: true, imageMessage: image.imageMessage };
    } else {
      header = { title: opts.header || '', hasMediaAttachment: false };
    }

    const message = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            body: { text: opts.body || '' },
            footer: { text: opts.footer || '' },
            header,
            nativeFlowMessage: { buttons },
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              externalAdReply: {
                title: config.T_LINE,
                body: config.B_LINE,
                mediaType: 1,
                sourceUrl: config.GOJO,
                thumbnailUrl: config.LOGO2,
                renderLargerThumbnail: false,
              },
            },
          },
        },
      },
    }, { quoted });

    await conn.sendPresenceUpdate('composing', jid);
    await sleep(1000);
    await conn.relayMessage(jid, message.message, { messageId: message.key.id });
    return message;
  };

  // Expose connection for plugins if needed
  global.conn = conn;
}

connectToWA();

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

// Express server for uptime (optional)
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
app.get('/', (req, res) => res.send('Gojo-MD Bot Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));
