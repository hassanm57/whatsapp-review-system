// Normalizes Pakistani phone numbers into the digits-only "92XXXXXXXXXX"
// format WhatsApp's chat IDs expect (e.g. whatsapp-web.js wants `${number}@c.us`).
export function normalizePakistaniNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("92") && digits.length === 12) {
    national = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  } else {
    return null;
  }

  // Pakistani mobile numbers: 3xx xxxxxxx (10 digits, starts with 3)
  if (!/^3\d{9}$/.test(national)) {
    return null;
  }

  return `92${national}`;
}
