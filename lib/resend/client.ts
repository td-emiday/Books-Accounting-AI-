import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@emidaybooks.com';

export async function sendTaxDeadlineAlert(params: {
  to: string;
  businessName: string;
  taxType: string;
  daysUntil: number;
  dueDate: string;
  amount?: string;
}) {
  return resend.emails.send({
    from: `Emiday <${FROM_EMAIL}>`,
    to: params.to,
    subject: `⚡ Your ${params.taxType} return is due in ${params.daysUntil} days — Emiday`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B21B6, #8B5CF6); padding: 24px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; font-size: 20px; margin: 0;">Emiday</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1A1028; margin-top: 0;">Tax Deadline Alert</h2>
          <p style="color: #6B6280;">Hi ${params.businessName},</p>
          <p style="color: #6B6280;">Your <strong>${params.taxType}</strong> return is due in <strong>${params.daysUntil} days</strong> (${params.dueDate}).</p>
          ${params.amount ? `<p style="color: #6B6280;">Estimated liability: <strong>${params.amount}</strong></p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliance" style="display: inline-block; background: linear-gradient(135deg, #5B21B6, #8B5CF6); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px;">View in Emiday →</a>
          <p style="color: #A39BBE; font-size: 12px; margin-top: 24px;">This is an automated reminder from Emiday.</p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
}) {
  return resend.emails.send({
    from: `Emiday <${FROM_EMAIL}>`,
    to: params.to,
    subject: `Welcome to Emiday, ${params.firstName} 🎉`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B21B6, #8B5CF6); padding: 24px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; font-size: 20px; margin: 0;">Welcome to Emiday!</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 16px 16px;">
          <p style="color: #6B6280;">Hi ${params.firstName},</p>
          <p style="color: #6B6280;">Welcome aboard! Here's how to get started:</p>
          <ol style="color: #1A1028;">
            <li>Connect your payment account (Paystack / Flutterwave)</li>
            <li>Import your bank statement</li>
            <li>Add your first transaction</li>
            <li>Invite your accountant</li>
          </ol>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #5B21B6, #8B5CF6); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">Go to Dashboard →</a>
        </div>
      </div>
    `,
  });
}

export async function sendAccountantInvite(params: {
  to: string;
  senderName: string;
  businessName: string;
  inviteUrl: string;
}) {
  return resend.emails.send({
    from: `Emiday <${FROM_EMAIL}>`,
    to: params.to,
    subject: `${params.senderName} has invited you to manage ${params.businessName} on Emiday`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B21B6, #8B5CF6); padding: 24px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; font-size: 20px; margin: 0;">Emiday</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1A1028; margin-top: 0;">You've been invited!</h2>
          <p style="color: #6B6280;">${params.senderName} has invited you to manage <strong>${params.businessName}</strong> on Emiday.</p>
          <a href="${params.inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #5B21B6, #8B5CF6); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px;">Accept Invitation →</a>
        </div>
      </div>
    `,
  });
}

export async function sendWeeklySummary(params: {
  to: string;
  businessName: string;
  income: string;
  expenses: string;
  net: string;
  topCategory: string;
  nextDeadline?: string;
}) {
  return resend.emails.send({
    from: `Emiday <${FROM_EMAIL}>`,
    to: params.to,
    subject: `Your week in numbers — Emiday`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B21B6, #8B5CF6); padding: 24px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; font-size: 20px; margin: 0;">Weekly Summary</h1>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 16px 16px;">
          <p style="color: #6B6280;">Hi ${params.businessName},</p>
          <p style="color: #6B6280;">Here's your week in numbers:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6B6280;">Income</td><td style="text-align: right; font-weight: 600; color: #059669;">${params.income}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B6280;">Expenses</td><td style="text-align: right; font-weight: 600; color: #DC2626;">${params.expenses}</td></tr>
            <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; color: #1A1028; font-weight: 600;">Net</td><td style="text-align: right; font-weight: 600; color: #1A1028;">${params.net}</td></tr>
          </table>
          <p style="color: #6B6280; margin-top: 16px;">Top expense category: <strong>${params.topCategory}</strong></p>
          ${params.nextDeadline ? `<p style="color: #D97706;">⚡ Upcoming deadline: ${params.nextDeadline}</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #5B21B6, #8B5CF6); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px;">View Dashboard →</a>
        </div>
      </div>
    `,
  });
}
