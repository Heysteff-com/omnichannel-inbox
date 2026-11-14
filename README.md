# Bandeja omnicanal de heysteff

Una bandeja web para leer y contestar **WhatsApp, Instagram, Messenger, SMS y correo** desde un solo lugar, sobre la [API de heysteff](https://developers.heysteff.com/docs/). Solo necesitas una key de la API y una contraseña.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fheysteff-com%2Fomnichannel-inbox&env=HEYSTEFF_API_KEY,INBOX_PASSWORD&envDescription=Key%20de%20la%20API%20de%20heysteff%20y%20la%20contrase%C3%B1a%20de%20la%20bandeja&envLink=https%3A%2F%2Fdevelopers.heysteff.com%2Fconsole%2F&project-name=heysteff-inbox&repository-name=heysteff-inbox)

## Qué hace

- Lista las conversaciones de todos los canales, con su ícono, filtros por estado y por canal.
- Muestra el hilo de mensajes y carga los anteriores.
- Responde con texto, archivos (imágenes, audio, video, documentos) y botones de respuesta.
- En WhatsApp, cuando pasaron más de 24 horas desde el último mensaje del cliente, solo deja mandar una plantilla aprobada. En Instagram y Messenger, pasado ese plazo, bloquea el envío hasta que el cliente vuelva a escribir. En SMS solo texto.
- Marca como leído (tildes azules en WhatsApp, "visto" en Instagram y Messenger).
- Tomar la conversación (el bot deja de contestar) y devolverla al bot.
- Tiempo real con el stream de eventos de heysteff; si tu cuenta no lo tiene, consulta cada 5 segundos.
- Modo por cliente: con `HEYSTEFF_CUSTOMER_ID`, solo las conversaciones de los canales de ese cliente.
- Español e inglés (según el navegador, o fijo con `INBOX_LOCALE`).

La key vive solo en el servidor: el navegador habla con las rutas `/api` de esta app, que llaman a heysteff con [`@heysteff/sdk`](https://www.npmjs.com/package/@heysteff/sdk).

## Empezar

```bash
npm create heysteff@latest mi-bandeja -- --template inbox
cd mi-bandeja
npm run dev
```

O a mano: copia `.env.example` a `.env.local`, completa las variables, `npm install` y `npm run dev`. Abre http://localhost:3000 y entra con la contraseña.

| Variable | Para qué |
| --- | --- |
| `HEYSTEFF_API_KEY` | Key de la API (`sk_live_…` o `sk_test_…`). Permisos: `conversations:read`, `conversations:write`, `messages:write` y, para el tiempo real, `events:read`. |
| `INBOX_PASSWORD` | La contraseña para entrar. Quien la tenga lee y contesta tus conversaciones: usa una larga. |
| `HEYSTEFF_CUSTOMER_ID` | Opcional: bandeja de un solo cliente (ver abajo). |
| `INBOX_LOCALE` | Opcional: `es` o `en`. |
| `HEYSTEFF_BASE_URL` | Opcional: otro servidor de heysteff. |

La sesión es una cookie firmada que dura 7 días. Cambiar `INBOX_PASSWORD` o la key cierra todas las sesiones.

## Una bandeja por cliente

Si tus clientes conectan sus propios canales con un [link de conexión](https://developers.heysteff.com/docs/clientes), define `HEYSTEFF_CUSTOMER_ID` con el `id` que devuelve `POST /v1/customers`. La bandeja lista solo las conversaciones de sus canales (`GET /v1/conversations?customer_id=`) y responde 404 a cualquier otra. Despliega una copia por cliente, cada una con su contraseña.

## Desplegar

- **Vercel:** el botón de arriba, o importa tu repositorio y define `HEYSTEFF_API_KEY` e `INBOX_PASSWORD`. Vercel limita el cuerpo de una petición a 4,5 MB: los archivos más grandes no pasan.
- **Cualquier servidor con Node 20+:** `npm run build && npm start`.

## English

A web inbox for **WhatsApp, Instagram, Messenger, SMS and email** on top of the heysteff API. Set `HEYSTEFF_API_KEY` and `INBOX_PASSWORD`, then `npm run dev`. It lists conversations from every channel, shows threads, replies with text, files and buttons, enforces WhatsApp's 24-hour window (approved templates only after it closes), marks messages as read, and lets you take a conversation from the bot or hand it back. Real time comes from heysteff's event stream, with polling as a fallback. Set `HEYSTEFF_CUSTOMER_ID` to scope the inbox to one of your customers' channels. The UI is available in Spanish and English.

Licencia MIT.
