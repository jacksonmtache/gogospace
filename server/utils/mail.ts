import type { H3Event } from 'h3'
import { Resend } from 'resend'

export function getSiteUrl(event: H3Event) {
  const configured = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
  if (configured) return configured
  return getRequestURL(event).origin
}

function getResendClient() {
  const apiKey = String(useRuntimeConfig().resendApiKey || '')
  if (!apiKey) {
    console.error('NUXT_RESEND_API_KEY is not set')
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to send reset email',
    })
  }
  return new Resend(apiKey)
}

function getFromAddress() {
  const from = String(useRuntimeConfig().resendFromEmail || '').trim()
  return from || 'GoGoSpace <noreply@gogospace.com>'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl)
  const { error } = await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject: 'Reset your GoGoSpace password',
    text: [
      'Reset your GoGoSpace password',
      '',
      'We received a request to reset the password for your GoGoSpace account.',
      'Open this link to choose a new password. It expires in 1 hour:',
      resetUrl,
      '',
      "If you didn't request this, you can ignore this email.",
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f4ef;font-family:Inter,Arial,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e8e0d6;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#044db4;font-weight:600;">GoGoSpace</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Reset your password</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#57534e;">
                  We received a request to reset the password for your GoGoSpace account. This link expires in 1 hour.
                </p>
                <p style="margin:0 0 28px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#044db4;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:12px 22px;border-radius:8px;">
                    Reset password
                  </a>
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#78716c;">
                  If you didn't request this, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  })

  if (error) {
    console.error('Resend failed to send password reset email', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to send reset email',
    })
  }
}
