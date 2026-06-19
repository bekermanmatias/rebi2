import nodemailer, { type Transporter } from 'nodemailer';

let cachedTransporter: Transporter | null = null;
let cachedTransportSignature = '';

function readSmtpConfig() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const from = (process.env.SMTP_FROM || (user ? `Rebi Construcciones <${user}>` : '')).trim();
  return { host, port, user, pass, secure, from };
}

function envelopeFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
}

export function isEmailConfigured(): boolean {
  const cfg = readSmtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass && cfg.from);
}

function getTransporter(): Transporter | null {
  const cfg = readSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from) return null;
  const signature = `${cfg.host}|${cfg.port}|${cfg.user}|${cfg.secure}`;
  if (cachedTransporter && cachedTransportSignature === signature) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  cachedTransportSignature = signature;

  return cachedTransporter;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvitationHtml(params: {
  email: string;
  actionLink: string;
  brandName: string;
  primaryColor: string;
  logoUrl?: string;
  supportEmail?: string;
}): string {
  const { email, actionLink, brandName, primaryColor, logoUrl, supportEmail } = params;
  const safeEmail = escapeHtml(email);
  const safeLink = escapeHtml(actionLink);
  const safeBrand = escapeHtml(brandName);
  const safeSupport = supportEmail ? escapeHtml(supportEmail) : '';
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${safeBrand}" style="height:48px;width:auto;display:block;margin:0 auto;" />`
    : `<div style="font-size:24px;font-weight:800;color:#111827;letter-spacing:0.5px;">${safeBrand}</div>`;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Activá tu cuenta en ${safeBrand}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:${primaryColor};padding:24px 32px;text-align:center;">
                ${logoBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 16px 32px;text-align:center;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#111827;font-weight:700;">
                  Activá tu cuenta en ${safeBrand}
                </h1>
                <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
                  Hola, recibimos una solicitud para crear una cuenta con
                  <strong style="color:#111827;">${safeEmail}</strong>.
                  Para terminar el proceso necesitamos que confirmes tu correo
                  y definas una contraseña segura.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 8px 32px;">
                <a href="${safeLink}"
                   style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;letter-spacing:0.2px;">
                  Crear mi contraseña
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </p>
                <p style="margin:8px 0 0 0;word-break:break-all;color:${primaryColor};font-size:13px;">
                  <a href="${safeLink}" style="color:${primaryColor};text-decoration:underline;">${safeLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                  Por motivos de seguridad, este enlace expira en 24 horas y solo puede usarse una vez.
                  Si no solicitaste esta cuenta, podés ignorar este correo: no se realizará ninguna acción.
                </p>
                ${safeSupport ? `<p style="margin:12px 0 0 0;color:#6b7280;font-size:12px;line-height:1.6;">¿Necesitás ayuda? Escribinos a <a href="mailto:${safeSupport}" style="color:${primaryColor};text-decoration:underline;">${safeSupport}</a>.</p>` : ''}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;text-align:center;">
            © ${new Date().getFullYear()} ${safeBrand}. Todos los derechos reservados.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildInvitationText(params: {
  email: string;
  actionLink: string;
  brandName: string;
}): string {
  const { email, actionLink, brandName } = params;
  return [
    `Hola,`,
    ``,
    `Recibimos una solicitud para crear una cuenta en ${brandName} con el correo ${email}.`,
    `Para terminar el proceso, abrí el siguiente enlace y definí tu contraseña:`,
    ``,
    actionLink,
    ``,
    `Por seguridad, este enlace expira en 24 horas y solo puede usarse una vez.`,
    `Si no solicitaste esta cuenta, podés ignorar este correo.`,
    ``,
    `— Equipo de ${brandName}`,
  ].join('\n');
}

export async function sendInvitationEmail(params: {
  to: string;
  actionLink: string;
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
  supportEmail?: string;
}): Promise<void> {
  const smtp = readSmtpConfig();
  const transporter = getTransporter();
  const brandName = params.brandName || process.env.BRAND_NAME || 'Rebi Construcciones';
  const primaryColor = params.primaryColor || process.env.BRAND_PRIMARY_COLOR || '#dc2626';
  const logoUrl = params.logoUrl || process.env.BRAND_LOGO_URL || undefined;
  const supportEmail = params.supportEmail || process.env.SUPPORT_EMAIL || undefined;

  if (!transporter) {
    console.warn(
      '[email] SMTP no está configurado. No se enviará el correo. Variables requeridas: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.'
    );
    console.warn(`[email] Link de activación para ${params.to}: ${params.actionLink}`);
    return;
  }

  const html = buildInvitationHtml({
    email: params.to,
    actionLink: params.actionLink,
    brandName,
    primaryColor,
    logoUrl,
    supportEmail,
  });
  const text = buildInvitationText({
    email: params.to,
    actionLink: params.actionLink,
    brandName,
  });

  await transporter.sendMail({
    from: smtp.from,
    envelope: {
      from: envelopeFromAddress(smtp.from),
      to: params.to,
    },
    to: params.to,
    subject: `Activá tu cuenta en ${brandName}`,
    html,
    text,
  });
}
