import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBudgetAlert(userEmail: string, spent: number, budget: number) {
  // Check if user has email notifications enabled and is verified
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      emailVerified: true,
      notifications: {
        where: { type: 'EMAIL' }
      }
    }
  });

  if (!user?.emailVerified || !user?.notifications?.[0]?.enabled) {
    return; // Exit if email notifications are disabled or user is not verified
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: userEmail,
    subject: 'Budget Alert - CurioPay',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Budget Alert</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px; text-align: center; background-color: #dc2626; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">Budget Alert</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <div style="margin-bottom: 24px;">
                        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Monthly Budget Exceeded</h2>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          Your monthly spending has exceeded your budget limit.
                        </p>
                      </div>
                      
                      <!-- Stats Grid -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                        <tr>
                          <td style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; width: 50%;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">Monthly Budget</p>
                            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #047857;">
                              $${budget.toFixed(2)}
                            </p>
                          </td>
                          <td style="width: 16px;"></td>
                          <td style="padding: 16px; background-color: #fef2f2; border-radius: 8px; width: 50%;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">Current Spending</p>
                            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #dc2626;">
                              $${spent.toFixed(2)}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Over Budget Amount -->
                      <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">Amount Over Budget</p>
                        <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #dc2626;">
                          $${(spent - budget).toFixed(2)}
                        </p>
                      </div>
                      
                      <div style="margin: 32px 0; text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                          View Dashboard
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        © 2024 CurioPay. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: userEmail,
    subject: 'Reset Your Password - CurioPay',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px; text-align: center; background-color: #2563eb; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">Reset Your Password</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <div style="margin-bottom: 24px;">
                        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Create New Password</h2>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          You requested to reset your password. Click the button below to create a new password.
                        </p>
                      </div>
                      
                      <div style="margin: 32px 0; text-align: center;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                          Reset Password
                        </a>
                      </div>

                      <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        © 2024 CurioPay. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendDataExport(userEmail: string, zipBuffer: Buffer) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: userEmail,
    subject: 'Your CurioPay Data Export',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Data Export</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px; text-align: center; background-color: #2563eb; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">Your Data Export</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <div style="margin-bottom: 24px;">
                        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Data Export Ready</h2>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          Your requested data export is attached to this email. For security reasons, please keep this data confidential.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        © 2024 CurioPay. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    attachments: [{
      filename: `curiopay-export-${new Date().toISOString().split('T')[0]}.zip`,
      content: zipBuffer
    }]
  });
}

export async function sendVerificationEmail(userEmail: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}?type=email`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: userEmail,
    subject: 'Verify Your Email - CurioPay',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px; text-align: center; background-color: #2563eb; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">Verify Your Email</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <div style="margin-bottom: 24px;">
                        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Welcome to CurioPay</h2>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          Please verify your email address to complete your registration and access all features.
                        </p>
                      </div>
                      
                      <div style="margin: 32px 0; text-align: center;">
                        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                          Verify Email
                        </a>
                      </div>

                      <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                        This link will expire in 1 hour. If you didn't create an account, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        © 2024 CurioPay. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}