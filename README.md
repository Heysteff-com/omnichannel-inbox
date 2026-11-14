# Bandeja omnicanal de heysteff

Una bandeja web en Next.js para leer y contestar **WhatsApp, Instagram, Messenger, SMS y correo desde un solo lugar y con el mismo código**, sobre la [API de heysteff](https://developers.heysteff.com/docs/). Solo necesitas una API key y una contraseña.

[English](./README.en.md) · [Documentación](https://developers.heysteff.com/docs/#plantillas) · [GitHub](https://github.com/heysteff-com/omnichannel-inbox)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fheysteff-com%2Fomnichannel-inbox&env=HEYSTEFF_API_KEY,INBOX_PASSWORD&envDescription=Key%20de%20la%20API%20de%20heysteff%20y%20la%20contrase%C3%B1a%20de%20la%20bandeja&envLink=https%3A%2F%2Fdevelopers.heysteff.com%2Fconsole%2F&project-name=heysteff-inbox&repository-name=heysteff-inbox)

## Qué hace

- Lista las conversaciones de todos los canales, con su ícono, filtros por estado y por canal.
- Muestra el hilo de mensajes y carga los anteriores.
- Responde con texto, archivos (imágenes, audio, video, documentos) y botones de respuesta.
- En WhatsApp, pasadas 24 horas desde el último mensaje del cliente, solo deja mandar una plantilla aprobada. En Instagram y Messenger, pasado ese plazo, bloquea el envío hasta que el cliente vuelva a escribir. En SMS, solo texto.
- Marca como leído (tildes azules en WhatsApp, "visto" en Instagram y Messenger).
- Tomar la conversación (el bot deja de contestar) y devolverla al bot.
- Tiempo real con el stream de eventos de heysteff; si tu key no lo tiene, consulta cada 5 segundos.
- Modo por cliente: con `HEYSTEFF_CUSTOMER_ID`, solo las conversaciones de los canales de ese cliente.
- Español e inglés (según el navegador, o fijo con `INBOX_LOCALE`).

La key vive solo en el servidor: el navegador habla con las rutas `/api` de esta app, que llaman a heysteff con [`@heysteff/sdk`](https://www.npmjs.com/package/@heysteff/sdk).

## Requisitos

- Una cuenta en [developers.heysteff.com](https://developers.heysteff.com/console/register) (el plan Developer Free es gratis).
- Una API key creada en [la consola](https://developers.heysteff.com/console/) → API keys con `conversations:read`, `conversations:write`, `messages:write` y, para el tiempo real, `events:read`. Una key de prueba (`sk_test_…`) muestra solo las conversaciones del [sandbox](https://developers.heysteff.com/docs/sandbox).
- Node 20 o más nuevo.

## Inicio rápido

1. Crea el proyecto (copia la plantilla, escribe `.env.local` con tu key y una contraseña larga, e instala las dependencias):

   ```bash
   npm create heysteff@latest mi-bandeja -- --template inbox
   cd mi-bandeja
   ```

   O a mano: clona [este repo](https://github.com/heysteff-com/omnichannel-inbox), copia `.env.example` a `.env.local` y corre `npm install`.

2. Revisa las variables de `.env.local`:

   ```bash
   HEYSTEFF_API_KEY=<TU_API_KEY>
   INBOX_PASSWORD=<UNA_CONTRASEÑA_LARGA>
   ```

3. Une tu WhatsApp al sandbox: en la consola, en Developers, aparece un código (`DEV-…`) y un botón que abre WhatsApp con el mensaje escrito. Mándalo desde tu teléfono.

4. Corre la bandeja y entra con la contraseña en http://localhost:3000:

   ```bash
   npm run dev
   ```

   Con una key `sk_test_…` aparece la conversación de tu teléfono: contéstala desde la bandeja y te llega por WhatsApp.

5. Despliégala con el botón **Deploy with Vercel** (define `HEYSTEFF_API_KEY` e `INBOX_PASSWORD`) o en cualquier servidor con Node 20+: `npm run build && npm start`.

## Uso

| Variable | Para qué |
| --- | --- |
| `HEYSTEFF_API_KEY` | Key de la API (`sk_live_…` o `sk_test_…`). |
| `INBOX_PASSWORD` | La contraseña para entrar. Quien la tenga lee y contesta tus conversaciones: usa una larga. |
| `HEYSTEFF_CUSTOMER_ID` | Opcional: bandeja de un solo cliente (ver abajo). |
| `INBOX_LOCALE` | Opcional: `es` o `en`. |
| `HEYSTEFF_BASE_URL` | Opcional: otro servidor de heysteff. |

La sesión es una cookie firmada que dura 7 días. Cambiar `INBOX_PASSWORD` o la key cierra todas las sesiones.

### Una bandeja por cliente

Si tus clientes conectan sus propios canales con un [link de conexión](https://developers.heysteff.com/docs/clientes), define `HEYSTEFF_CUSTOMER_ID` con el `id` que devuelve `POST /v1/customers`. La bandeja lista solo las conversaciones de sus canales (`GET /v1/conversations?customer_id=`) y responde 404 a cualquier otra. Despliega una copia por cliente, cada una con su contraseña.

### Dónde cambiar cosas

- `components/inbox.tsx` y `components/composer.tsx`: la interfaz de la lista, el hilo y el compositor.
- `lib/channels.ts`: qué permite cada canal (archivos, botones, ventana de 24 h).
- `lib/i18n.ts`: los textos en español e inglés.
- `app/api/…`: las rutas del servidor que llaman a heysteff; `lib/heysteff.ts` crea el cliente del SDK.

### Desplegar

- **Vercel:** el botón de arriba, o importa tu repositorio y define `HEYSTEFF_API_KEY` e `INBOX_PASSWORD`. Vercel limita el cuerpo de una petición a 4,5 MB: los archivos más grandes no pasan.
- **Cualquier servidor con Node 20+:** `npm run build && npm start`.

## Configúralo con tu IA

Copia este texto y pégalo en Claude Code, Cursor, Codex o ChatGPT:

```text
Quiero levantar la bandeja omnicanal de heysteff (github.com/heysteff-com/omnichannel-inbox):
una app Next.js para leer y contestar WhatsApp, Instagram, Messenger, SMS y correo desde un
solo lugar con la API de heysteff.

Fuentes de verdad (léelas antes de tocar código; ganan sobre lo que recuerdes):
- https://developers.heysteff.com/AGENTS.md
- https://app.heysteff.com/api/v1/llms-full.txt
- El README.md de la plantilla

Pasos:
1. Revisa que haya Node 20+. Crea el proyecto con
   npm create heysteff@latest mi-bandeja -- --template inbox --yes
   (o clona el repo, copia .env.example a .env.local y corre npm install).
2. Confirma que .env.local esté en .gitignore. Yo pongo los valores de HEYSTEFF_API_KEY
   (una key de prueba sk_test_ para empezar) e INBOX_PASSWORD directamente en .env.local;
   si faltan, deja las líneas HEYSTEFF_API_KEY=<TU_API_KEY> e INBOX_PASSWORD=<UNA_CONTRASEÑA_LARGA>.
   No me pidas esos valores en el chat.
3. Corre npm run dev y dime que entre a http://localhost:3000 con la contraseña.
4. Verifica: yo escribo desde mi WhatsApp unido al sandbox; la conversación debe aparecer en la
   bandeja. Contestarla desde la interfaz la hago yo.
5. Si te pido cambios, edita components/inbox.tsx, components/composer.tsx, lib/channels.ts o
   lib/i18n.ts, y corre npm run typecheck antes de terminar.
6. Para desplegar, usa el botón Deploy with Vercel del README y define las variables en Vercel,
   nunca en el repo.

Reglas de seguridad:
- Nunca escribas la API key ni la contraseña en el código, en archivos versionados, en commits,
  en logs ni en este chat. La key solo vive en el servidor: no la expongas al navegador.
- Antes de mandar un mensaje a una persona real (también por una prueba automatizada), muéstrame
  el destinatario, el canal y el texto exactos y espera mi confirmación.
- No inventes endpoints ni métodos del SDK: si algo no está en las fuentes de verdad, pregúntame.
```

## Enlaces

- Documentación: [Plantillas](https://developers.heysteff.com/docs/#plantillas) · [Sandbox](https://developers.heysteff.com/docs/sandbox) · [Clientes y links de conexión](https://developers.heysteff.com/docs/clientes)
- npm: [create-heysteff](https://www.npmjs.com/package/create-heysteff) · [@heysteff/sdk](https://www.npmjs.com/package/@heysteff/sdk)
- GitHub: [heysteff-com/omnichannel-inbox](https://github.com/heysteff-com/omnichannel-inbox)
- Licencia: [MIT](./LICENSE)
