import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig } from '../../config/email';

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

let transporterInstance: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporterInstance) {
    if (!emailConfig.smtpHost || !emailConfig.smtpUser) {
      throw new Error(
        'Email Service error: SMTP_HOST and SMTP_USER are not configured in environment variables.'
      );
    }

    const isSecure = emailConfig.smtpPort === 465;

    transporterInstance = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: isSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
    });
  }

  return transporterInstance;
};

/**
 * Sends an email using Nodemailer.
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, subject, html, text, attachments } = options;
  const transporter = getTransporter();

  const fromAddress = emailConfig.smtpFrom || emailConfig.smtpUser;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments,
    });
  } catch (error) {
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Verifies SMTP server configuration connection.
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[Email Service] SMTP Transporter connection verified successfully.');
    return true;
  } catch (error) {
    console.error(
      '[Email Service] SMTP Transporter verification failed:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
};
