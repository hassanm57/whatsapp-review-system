import qrcodeTerminal from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";

let ready = false;
let latestQr: string | null = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: true },
});

client.on("qr", (qr) => {
  latestQr = qr;
  console.log("\nScan this QR code with WhatsApp (Linked Devices) to pair:\n");
  qrcodeTerminal.generate(qr, { small: true });
});

client.on("ready", () => {
  ready = true;
  latestQr = null;
  console.log("WhatsApp client ready.");
});

client.on("disconnected", (reason) => {
  ready = false;
  console.warn("WhatsApp client disconnected:", reason);
});

client.initialize();

export function isWhatsAppReady(): boolean {
  return ready;
}

export function getLatestQr(): string | null {
  return latestQr;
}

export async function sendWhatsAppMessage(
  phone92: string,
  message: string,
): Promise<{ messageId: string }> {
  if (!ready) {
    throw new Error("WhatsApp client is not ready yet (scan the QR code first).");
  }

  const chatId = `${phone92}@c.us`;
  const isRegistered = await client.isRegisteredUser(chatId);
  if (!isRegistered) {
    throw new Error("This number is not on WhatsApp.");
  }

  const sent = await client.sendMessage(chatId, message);
  return { messageId: sent?.id?.id ?? sent?.id?._serialized ?? "unknown" };
}
