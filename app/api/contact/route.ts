import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');
const TO_EMAIL = 'hello@emiday.africa';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@emidaybooks.com';

export async function POST(req: Request) {
  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    await resend.emails.send({
      from: `Emiday Contact Form <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New contact from ${name}${company ? ` (${company})` : ''}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6C3FE8, #8B5CF6); padding: 24px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; font-size: 20px; margin: 0;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 0 0 16px 16px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p style="background: #f9f9f9; padding: 16px; border-radius: 8px;">${message}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
