import cors from "cors";
import "dotenv/config";
import express from "express";
import QRCode from "qrcode";
import { normalizePakistaniNumber } from "./phone";
import { getLatestQr, isWhatsAppReady, sendWhatsAppMessage } from "./whatsapp";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ?? 4000;
const CLINIC_NAME = process.env.CLINIC_NAME ?? "Our Clinic";
const REVIEW_LINK = process.env.REVIEW_LINK ?? "";

function buildReviewMessage(): string {
  return `Thank you for visiting ${CLINIC_NAME}! 🙏\nWe'd love your feedback. Please leave us a quick Google review:\n${REVIEW_LINK}`;
}

app.get("/health", (_req, res) => {
  res.json({ whatsappReady: isWhatsAppReady() });
});

app.get("/qr.png", async (_req, res) => {
  const qr = getLatestQr();
  if (!qr) {
    return res.status(404).send("No QR code available right now.");
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  const buffer = await QRCode.toBuffer(qr, { width: 320, margin: 2 });
  res.send(buffer);
});

app.get("/qr", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp pairing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: sans-serif; text-align: center; padding: 40px; }
    img { width: 320px; height: 320px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <h2>Scan with WhatsApp &rarr; Linked Devices &rarr; Link a Device</h2>
  <p id="status">checking status...</p>
  <img id="qr" src="/qr.png" alt="QR code" />
  <script>
    async function poll() {
      const res = await fetch('/health');
      const data = await res.json();
      const statusEl = document.getElementById('status');
      const qrEl = document.getElementById('qr');
      if (data.whatsappReady) {
        statusEl.textContent = 'Connected! You can close this tab.';
        qrEl.style.display = 'none';
      } else {
        statusEl.textContent = 'Waiting for scan... (QR refreshes automatically)';
        qrEl.src = '/qr.png?t=' + Date.now();
      }
    }
    setInterval(poll, 3000);
    poll();
  </script>
</body>
</html>`);
});

app.post("/send-review", async (req, res) => {
  const { name, number } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ status: "failed", error: "Patient name is required." });
  }
  if (typeof number !== "string" || !number.trim()) {
    return res.status(400).json({ status: "failed", error: "Patient WhatsApp number is required." });
  }

  const normalized = normalizePakistaniNumber(number);
  if (!normalized) {
    return res.status(400).json({
      status: "failed",
      error: "Invalid Pakistani WhatsApp number. Expected formats like 03011234567 or +923011234567.",
    });
  }

  try {
    const { messageId } = await sendWhatsAppMessage(normalized, buildReviewMessage());
    return res.json({ status: "sent", messageId });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to send message.";
    return res.status(502).json({ status: "failed", error });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
