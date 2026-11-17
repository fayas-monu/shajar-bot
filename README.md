# shajar-bot

Self-hosted **WhatsApp Business user bot** built with Node.js and `@whiskeysockets/baileys`.

## Features

1. **Authentication & session management**
   - Multi-file auth state (`auth_info_baileys`) via `@whiskeysockets/baileys`.
   - QR code scan once, persistent login across restarts.
   - Robust auto-reconnect on network disruptions, stops on explicit logout.

2. **Interactive UI & menu system**
   - Interactive WhatsApp list message menu (tappable rows).
   - Commands: `menu`, `start`, `hi`, `hello`, `help`.

3. **Advanced document & media processing**
   - PDF → Image conversion (multi page, high quality render).
   - Image → PDF conversion: send any number of images, then type `pdf` (auto-merges at `MAX_PENDING_IMAGES`).
   - PDF → Text extraction.
   - Image compression & auto-crop / resize via `sharp` (send the command as the image caption).

4. **AI support agent & smart auto-chat**
   - Built-in FAQ knowledge base.
   - Optional OpenAI compatible AI support agent.
   - Graceful fallback for unknown inputs.

5. **Branding, footer & assistant credits**
   - Every outgoing bot message ends with: `Powered by chank!nd3 p4d4y41! | Business Assistant AI`.

6. **Robust error handling & performance**
   - Comprehensive `try/catch` around media downloads / conversions / AI calls.
   - Structured logging with `pino`.

## Requirements

- Node.js `>= 20.0.0`
- A WhatsApp Business account / phone number linked as a WhatsApp device

## Setup

```bash
npm install
cp .env.example .env
npm start
```

On first start a QR code is printed in the terminal — scan it with WhatsApp →
Settings → Linked Devices → Link a Device. On subsequent starts the saved
session is reused automatically.

> **Windows PowerShell:** if `npm` is blocked by the execution policy, run
> `npm.cmd install` and `npm.cmd start` instead.

## Environment variables

See `.env.example`.

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port used by the bot (currently informational) | `3000` |
| `AUTH_FOLDER` | Multi-file auth state folder | `auth_info_baileys` |
| `BUSINESS_NAME` | Business name used in menus | `Shajar` |
| `ASSISTANT_NAME` | Assistant signature name | `chank!nd3 p4d4y41!` |
| `ASSISTANT_TAGLINE` | Assistant tagline | `Business Assistant AI` |
| `AI_ENABLED` | Enable AI support agent | `true` |
| `AI_API_KEY` | OpenAI compatible API key | - |
| `AI_MODEL` | AI model | `gpt-4o-mini` |
| `AI_BASE_URL` | AI endpoint base URL | `https://api.openai.com/v1` |
| `AI_SYSTEM_PROMPT` | System prompt for AI agent | - |
| `LOG_LEVEL` | pino log level | `info` |
| `MAX_IMAGE_DIMENSION` | Max image dimension after compression | `1280` |
| `COMPRESSION_QUALITY` | JPEG quality used by sharp | `70` |
| `MAX_PDF_PAGES` | Max PDF pages converted to images | `20` |
| `MAX_PENDING_IMAGES` | Max images collected before PDF merge | `10` |

## Commands

- `menu`, `start`, `hi`, `hello`, `help` → interactive menu list
- `price` → pricing
- `tools` → tools overview
- `ai` / `assistant` → AI assistant intro
- `pdf` / `merge` / `images` → merge queued images into a PDF (or PDF help)
- image caption `compress`, `resize 800x600`, `crop 300x300` → edit that image
- free text → FAQ auto-chat / AI agent / fallback

## Project structure

```
index.js                  entry point, graceful shutdown, global error handlers
lib/
  bot.js                  Baileys socket, QR, auto-reconnect, message routing
  authState.js            multi-file auth state (credentials + Signal keys)
  config.js               environment configuration + assistant footer
  logger.js               pino logger
  messages.js             branded text/image/document/list senders
  menu.js                 interactive main menu definition
  replies.js              canned reply texts
  aiAgent.js              FAQ knowledge base + optional AI agent + fallback
  mediaTools.js           sharp, pdf-lib and pdf.js pipelines
  handlers/
    index.js              content-type dispatcher (unwraps ephemeral/view-once)
    textHandler.js        menu, pricing, tools, FAQ, AI, fallback
    imageHandler.js       compress / resize / crop + image queue → PDF
    documentHandler.js    PDF → images + PDF → text
    interactiveHandler.js list row and button tap routing
```

## License

MIT
