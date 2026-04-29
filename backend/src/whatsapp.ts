type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

function readTwilioConfig(): TwilioConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_WHATSAPP_FROM || '',
  };
}

export function isWhatsAppConfigured(): boolean {
  const cfg = readTwilioConfig();
  return Boolean(cfg.accountSid && cfg.authToken && cfg.fromNumber);
}

function normalizeWhatsAppNumber(raw: string): string {
  const clean = raw.replace(/[^\d+]/g, '').trim();
  if (!clean) return '';
  if (clean.startsWith('+')) return `whatsapp:${clean}`;
  return `whatsapp:+${clean}`;
}

export async function sendRegistrationWhatsApp(params: {
  to: string;
  email: string;
  actionLink: string;
}): Promise<void> {
  const cfg = readTwilioConfig();
  const to = normalizeWhatsAppNumber(params.to);
  const from = normalizeWhatsAppNumber(cfg.fromNumber);

  if (!cfg.accountSid || !cfg.authToken || !to || !from) {
    console.warn(
      '[whatsapp] Twilio WhatsApp no está configurado. Variables requeridas: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.'
    );
    console.warn(`[whatsapp] Link de activación para ${params.email} (${params.to}): ${params.actionLink}`);
    return;
  }

  const body = [
    'Hola! 👋',
    `Recibimos una solicitud para crear tu cuenta en Rebi con ${params.email}.`,
    'Para activarla y definir tu contraseña, abrí este enlace:',
    params.actionLink,
    '',
    'Si no solicitaste esta cuenta, ignorá este mensaje.',
  ].join('\n');

  const payload = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64');
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Twilio WhatsApp error ${res.status}: ${txt}`);
  }
}

