// Phase 17B: sending the verification and password-reset emails. Optional: with no provider configured there is no mailer, sign-up needs no
// verification and "forgot password" is not offered (the account page says so). Two providers, chosen by which variables are set:
//   1. Resend over its HTTPS API (RESEND_API_KEY + EMAIL_FROM). Note: without a domain you have verified, Resend delivers only to your own address.
//   2. Any SMTP server, for example a Gmail account with an app password (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM).
// Everything is read from the environment at request time. A message body is plain text and never contains more than the link.
import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}
export type Mailer = (mail: Mail) => Promise<void>;

type Env = Record<string, string | undefined>;

export function mailerKind(env: Env): "resend" | "smtp" | null {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return "resend";
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM) return "smtp";
  return null;
}

export function getMailer(env: Env): Mailer | null {
  const kind = mailerKind(env);
  if (kind === "resend") {
    return async (mail) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
      });
      if (!res.ok) throw new Error(`Resend answered ${res.status}`);
    };
  }
  if (kind === "smtp") {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: Number(env.SMTP_PORT || 587) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return async (mail) => void (await transport.sendMail({ from: env.EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text }));
  }
  return null;
}
