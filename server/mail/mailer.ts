import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import type { ServerConfig } from "../config.js";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** The action link inside the mail, kept apart so dev tools and e2e can open it. */
  link: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Gmail SMTP with an App Password (QĐ-05). The transport is created once per function instance. */
export class SmtpMailer implements Mailer {
  private transport: Transporter | null = null;

  constructor(private readonly user: string, private readonly appPassword: string) {}

  async send(mail: Mail) {
    this.transport ??= nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: this.user, pass: this.appPassword },
    });
    await this.transport.sendMail({
      from: { name: "Mã Cuối Cùng", address: this.user },
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }
}

/**
 * Writes each mail to `<dir>/<time>-<to>.json`. This is the real delivery path
 * of a local environment (dev, e2e), not a test double.
 */
export class OutboxMailer implements Mailer {
  private seq = 0;

  constructor(private readonly dir: string) {}

  async send(mail: Mail) {
    mkdirSync(this.dir, { recursive: true });
    const stamp = `${Date.now()}-${String(this.seq++).padStart(4, "0")}`;
    const safeTo = mail.to.replace(/[^\w.@-]/g, "_");
    writeFileSync(join(this.dir, `${stamp}-${safeTo}.json`), JSON.stringify(mail, null, 2));
  }
}

export const createMailer = (config: ServerConfig["mail"]): Mailer =>
  config.transport === "smtp" ? new SmtpMailer(config.user, config.appPassword) : new OutboxMailer(config.dir);
