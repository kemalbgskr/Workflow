import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.log('Email service not configured - missing SMTP environment variables');
      return;
    }

    const config: EmailConfig = {
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: parseInt(SMTP_PORT || '587') === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    };

    this.transporter = nodemailer.createTransport(config as any);
    this.isConfigured = true;
    console.log('Email service configured successfully');
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured, skipping email send');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || data.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Template methods for common email types
  async sendApprovalRequest(to: string, projectTitle: string, documentType: string, approvalUrl: string) {
    const subject = `Approval Required: ${documentType} for ${projectTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0F766E; color: white; padding: 20px; text-align: center;">
          <h1>BNI SDLC Approvals</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Approval Required</h2>
          <p>You have been assigned to approve a document in the BNI SDLC system.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Project:</strong> ${projectTitle}<br>
            <strong>Document Type:</strong> ${documentType}
          </div>
          
          <p>Please review and approve this document by clicking the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approvalUrl}" style="background-color: #0F766E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Document
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the BNI SDLC Approvals system.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendStatusChangeNotification(to: string, projectTitle: string, fromStatus: string, toStatus: string) {
    const subject = `Status Update: ${projectTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0F766E; color: white; padding: 20px; text-align: center;">
          <h1>BNI SDLC Approvals</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Project Status Updated</h2>
          <p>The status of your project has been updated.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Project:</strong> ${projectTitle}<br>
            <strong>Previous Status:</strong> ${fromStatus}<br>
            <strong>New Status:</strong> ${toStatus}
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the BNI SDLC Approvals system.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendDocumentSignedNotification(to: string, projectTitle: string, documentType: string) {
    const subject = `Document Signed: ${documentType} for ${projectTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0F766E; color: white; padding: 20px; text-align: center;">
          <h1>BNI SDLC Approvals</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Document Signed Successfully</h2>
          <p>A document has been successfully signed and completed.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Project:</strong> ${projectTitle}<br>
            <strong>Document Type:</strong> ${documentType}<br>
            <strong>Status:</strong> <span style="color: #059669;">Signed & Completed</span>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the BNI SDLC Approvals system.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();