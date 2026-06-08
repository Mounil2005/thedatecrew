import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mounilkankhara05@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { customer, profile, score, label, strengths, intro, toEmail } = await req.json()

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E0D8;">

        <tr><td style="background:#7A3E3E;padding:28px 32px;">
          <p style="margin:0;color:#FFFFFF;font-size:11px;letter-spacing:2px;text-transform:uppercase;">The Date Crew</p>
          <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:22px;font-weight:normal;">Match Introduction</h1>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#6B7280;font-size:13px;">A new match introduction has been sent by your matchmaking team.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:12px;overflow:hidden;border:1px solid #E5E0D8;margin-bottom:24px;">
            <tr>
              <td width="50%" style="padding:20px 24px;border-right:1px solid #E5E0D8;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Client</p>
                <p style="margin:0 0 2px;font-size:16px;color:#1E1E1E;font-weight:bold;">${customer.firstName} ${customer.lastName}</p>
                <p style="margin:0;font-size:12px;color:#6B7280;">${customer.age} yrs · ${customer.city}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${customer.profession || ''}</p>
              </td>
              <td width="50%" style="padding:20px 24px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Introduced To</p>
                <p style="margin:0 0 2px;font-size:16px;color:#1E1E1E;font-weight:bold;">${profile.firstName} ${profile.lastName}</p>
                <p style="margin:0;font-size:12px;color:#6B7280;">${profile.age} yrs · ${profile.city}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${profile.profession || ''}</p>
              </td>
            </tr>
            <tr><td colspan="2" style="padding:14px 24px;border-top:1px solid #E5E0D8;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><p style="margin:0;font-size:12px;color:#6B7280;">Compatibility Score</p></td>
                  <td align="right"><p style="margin:0;font-size:18px;color:#7A3E3E;font-weight:bold;">${score}% <span style="font-size:12px;color:#C9A66B;">${label}</span></p></td>
                </tr>
              </table>
            </td></tr>
          </table>

          ${strengths && strengths.length > 0 ? `
          <div style="background:#F0FDF4;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #BBF7D0;">
            <p style="margin:0 0 10px;font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:1px;">Key Compatibility Strengths</p>
            ${strengths.slice(0, 3).map((s: string) => `<p style="margin:0 0 6px;font-size:13px;color:#166534;">✓ &nbsp;${s}</p>`).join('')}
          </div>` : ''}

          ${intro ? `
          <div style="background:#F5F3FF;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #DDD6FE;">
            <p style="margin:0 0 10px;font-size:11px;color:#5B21B6;text-transform:uppercase;letter-spacing:1px;">Matchmaker's Introduction</p>
            <p style="margin:0;font-size:14px;color:#4C1D95;line-height:1.7;">${intro}</p>
          </div>` : ''}

          <p style="margin:32px 0 0;font-size:11px;color:#9CA3AF;text-align:center;">The Date Crew · Matchmaker Operating System</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    await transporter.sendMail({
      from: 'The Date Crew <mounilkankhara05@gmail.com>',
      to: toEmail || 'mounilkankhara05@gmail.com',
      subject: `Match Introduction: ${customer.firstName} × ${profile.firstName} — ${score}% ${label}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
