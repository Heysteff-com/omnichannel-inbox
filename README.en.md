# heysteff omnichannel inbox

A Next.js web inbox to read and answer **WhatsApp, Instagram, Messenger, SMS and email from one place and with the same code**, on top of the [heysteff API](https://developers.heysteff.com/en/docs/). All you need is an API key and a password.

[Español](./README.md) · [Docs](https://developers.heysteff.com/en/docs/#templates) · [GitHub](https://github.com/heysteff-com/omnichannel-inbox)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fheysteff-com%2Fomnichannel-inbox&env=HEYSTEFF_API_KEY,INBOX_PASSWORD&envDescription=heysteff%20API%20key%20and%20the%20inbox%20password&envLink=https%3A%2F%2Fdevelopers.heysteff.com%2Fconsole%2F&project-name=heysteff-inbox&repository-name=heysteff-inbox)

## What it does

- Lists conversations from every channel, with their icon and filters by status and channel.
- Shows the message thread and loads older messages.
- Replies with text, files (images, audio, video, documents) and reply buttons.
- On WhatsApp, 24 hours after the customer's last message, it only lets you send an approved template. On Instagram and Messenger, after that window, it blocks sending until the customer writes again. On SMS, text only.
- Marks messages as read (blue ticks on WhatsApp, "seen" on Instagram and Messenger).
- Take the conversation (the bot stops answering) and hand it back to the bot.
- Real time with heysteff's event stream; if your key does not have it, it polls every 5 seconds.
- Per-customer mode: with `HEYSTEFF_CUSTOMER_ID`, only the conversations on that customer's channels.
- Spanish and English (from the browser, or fixed with `INBOX_LOCALE`).

The key lives only on the server: the browser talks to this app's `/api` routes, which call heysteff with [`@heysteff/sdk`](https://www.npmjs.com/package/@heysteff/sdk).

## Requirements

- An account at [developers.heysteff.com](https://developers.heysteff.com/console/register?lang=en) (Developer Free costs nothing).
- An API key created in [the console](https://developers.heysteff.com/console/) → API keys with `conversations:read`, `conversations:write`, `messages:write` and, for real time, `events:read`. A test key (`sk_test_…`) only shows [sandbox](https://developers.heysteff.com/en/docs/sandbox) conversations.
- Node 20 or newer.

## Quickstart

1. Create the project (it copies the template, writes `.env.local` with your key and a long password, and installs dependencies):

   ```bash
   npm create heysteff@latest my-inbox -- --template inbox
   cd my-inbox
   ```

   Or by hand: clone [this repo](https://github.com/heysteff-com/omnichannel-inbox), copy `.env.example` to `.env.local` and run `npm install`.

2. Check the variables in `.env.local`:

   ```bash
   HEYSTEFF_API_KEY=<YOUR_API_KEY>
   INBOX_PASSWORD=<A_LONG_PASSWORD>
   ```

3. Join the sandbox with your WhatsApp: in the console, under Developers, there is a code (`DEV-…`) and a button that opens WhatsApp with the message ready. Send it from your phone.

4. Run the inbox and sign in with the password at http://localhost:3000:

   ```bash
   npm run dev
   ```

   With an `sk_test_…` key your phone's conversation shows up: reply from the inbox and it reaches you on WhatsApp.

5. Deploy it with the **Deploy with Vercel** button (set `HEYSTEFF_API_KEY` and `INBOX_PASSWORD`) or on any server with Node 20+: `npm run build && npm start`.

## Usage

| Variable | What for |
| --- | --- |
| `HEYSTEFF_API_KEY` | API key (`sk_live_…` or `sk_test_…`). |
| `INBOX_PASSWORD` | The password to sign in. Whoever has it reads and answers your conversations: use a long one. |
| `HEYSTEFF_CUSTOMER_ID` | Optional: a single customer's inbox (see below). |
| `INBOX_LOCALE` | Optional: `es` or `en`. |
| `HEYSTEFF_BASE_URL` | Optional: another heysteff server. |

The session is a signed cookie that lasts 7 days. Changing `INBOX_PASSWORD` or the key signs everyone out.

### One inbox per customer

If your customers connect their own channels with a [setup link](https://developers.heysteff.com/en/docs/customers), set `HEYSTEFF_CUSTOMER_ID` to the `id` returned by `POST /v1/customers`. The inbox lists only the conversations on their channels (`GET /v1/conversations?customer_id=`) and answers 404 to any other. Deploy one copy per customer, each with its own password.

### Where to change things

- `components/inbox.tsx` and `components/composer.tsx`: the list, thread and composer UI.
- `lib/channels.ts`: what each channel allows (files, buttons, 24-hour window).
- `lib/i18n.ts`: the Spanish and English strings.
- `app/api/…`: the server routes that call heysteff; `lib/heysteff.ts` creates the SDK client.

### Deploy

- **Vercel:** the button above, or import your repository and set `HEYSTEFF_API_KEY` and `INBOX_PASSWORD`. Vercel caps a request body at 4.5 MB: larger files do not go through.
- **Any server with Node 20+:** `npm run build && npm start`.

## Set it up with your AI

Copy this text and paste it into Claude Code, Cursor, Codex or ChatGPT:

```text
I want to run the heysteff omnichannel inbox (github.com/heysteff-com/omnichannel-inbox):
a Next.js app to read and answer WhatsApp, Instagram, Messenger, SMS and email from one
place with the heysteff API.

Sources of truth (read them before touching code; they win over what you remember):
- https://developers.heysteff.com/AGENTS.md
- https://app.heysteff.com/api/v1/llms-full.txt
- The template's README.en.md

Steps:
1. Check Node 20+. Create the project with
   npm create heysteff@latest my-inbox -- --template inbox --yes
   (or clone the repo, copy .env.example to .env.local and run npm install).
2. Make sure .env.local is in .gitignore. I put the values of HEYSTEFF_API_KEY (a test key
   sk_test_ to start) and INBOX_PASSWORD directly in .env.local; if they are missing, leave the
   lines HEYSTEFF_API_KEY=<YOUR_API_KEY> and INBOX_PASSWORD=<A_LONG_PASSWORD>.
   Do not ask me for those values in the chat.
3. Run npm run dev and tell me to open http://localhost:3000 with the password.
4. Verify: I write from my WhatsApp joined to the sandbox; the conversation must show up in
   the inbox. I reply from the UI myself.
5. If I ask for changes, edit components/inbox.tsx, components/composer.tsx, lib/channels.ts or
   lib/i18n.ts, and run npm run typecheck before finishing.
6. To deploy, use the Deploy with Vercel button in the README and set the variables in Vercel,
   never in the repo.

Safety rules:
- Never write the API key or the password in code, in tracked files, in commits, in logs or
  in this chat. The key lives only on the server: do not expose it to the browser.
- Before sending a message to a real person (including from an automated test), show me the
  exact recipient, channel and text and wait for my confirmation.
- Do not invent endpoints or SDK methods: if something is not in the sources of truth, ask me.
```

## Links

- Docs: [Templates](https://developers.heysteff.com/en/docs/#templates) · [Sandbox](https://developers.heysteff.com/en/docs/sandbox) · [Customers and setup links](https://developers.heysteff.com/en/docs/customers)
- npm: [create-heysteff](https://www.npmjs.com/package/create-heysteff) · [@heysteff/sdk](https://www.npmjs.com/package/@heysteff/sdk)
- GitHub: [heysteff-com/omnichannel-inbox](https://github.com/heysteff-com/omnichannel-inbox)
- License: [MIT](./LICENSE)
