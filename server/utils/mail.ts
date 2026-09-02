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

function creditsLabel(credits: number) {
  return credits === 1 ? '1 credit' : `${credits} credits`
}

function transactionalEmailHtml(options: {
  title: string
  paragraphs: string[]
  buttonLabel?: string
  buttonUrl?: string
  detailsHtml?: string
}) {
  const paragraphs = options.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#57534e;">${text}</p>`,
    )
    .join('')
  const details = options.detailsHtml
    ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1c1917;">${options.detailsHtml}</p>`
    : ''
  const button =
    options.buttonLabel && options.buttonUrl
      ? `<p style="margin:0 0 8px;">
                  <a href="${escapeHtml(options.buttonUrl)}" style="display:inline-block;background:#044db4;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:12px 22px;border-radius:8px;">
                    ${escapeHtml(options.buttonLabel)}
                  </a>
                </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f4ef;font-family:Inter,Arial,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e8e0d6;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#044db4;font-weight:600;">GoGoSpace</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${escapeHtml(options.title)}</h1>
                ${paragraphs}
                ${details}
                ${button}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

async function sendResendEmail(options: {
  to: string
  subject: string
  text: string
  html: string
  logLabel: string
}) {
  const apiKey = String(useRuntimeConfig().resendApiKey || '')
  if (!apiKey) {
    console.error(`NUXT_RESEND_API_KEY is not set; skipping ${options.logLabel}`)
    return false
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    if (error) {
      console.error(`Resend failed to send ${options.logLabel}`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Resend failed to send ${options.logLabel}`, error)
    return false
  }
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

export async function sendPaymentSuccessCustomerEmail(details: {
  to: string
  planTitle: string
  credits: number
  amountLabel: string
  accountExists: boolean
  claimUrl: string
  loginUrl: string
}) {
  const credits = creditsLabel(details.credits)
  const planTitle = escapeHtml(details.planTitle)
  const email = escapeHtml(details.to)
  const amountLabel = escapeHtml(details.amountLabel)
  const detailsHtml = `<strong>Plan:</strong> ${planTitle}<br /><strong>Credits:</strong> ${credits}<br /><strong>Amount:</strong> ${amountLabel}`

  if (details.accountExists) {
    return sendResendEmail({
      to: details.to,
      subject: 'Your GoGoSpace credits are ready',
      logLabel: 'payment success email',
      text: [
        'Payment successful',
        '',
        `${credits} from ${details.planTitle} were added to your GoGoSpace account (${details.to}).`,
        `Amount: ${details.amountLabel}`,
        '',
        'Log in to start generating designs:',
        details.loginUrl,
      ].join('\n'),
      html: transactionalEmailHtml({
        title: 'Payment successful',
        paragraphs: [
          `${credits} from ${planTitle} were added to your GoGoSpace account (${email}). Log in to start generating designs.`,
        ],
        detailsHtml,
        buttonLabel: 'Log in',
        buttonUrl: details.loginUrl,
      }),
    })
  }

  return sendResendEmail({
    to: details.to,
    subject: 'Payment successful — create your GoGoSpace account',
    logLabel: 'payment success email',
    text: [
      'Payment successful',
      '',
      `Thanks for buying ${details.planTitle} (${credits}).`,
      `Amount: ${details.amountLabel}`,
      '',
      `Create a GoGoSpace account with ${details.to} to claim your credits:`,
      details.claimUrl,
    ].join('\n'),
    html: transactionalEmailHtml({
      title: 'Payment successful',
      paragraphs: [
        `Thanks for buying ${planTitle} (${credits}). Create a GoGoSpace account with ${email} to claim your credits and start generating designs.`,
      ],
      detailsHtml,
      buttonLabel: 'Create account',
      buttonUrl: details.claimUrl,
    }),
  })
}

export async function sendPaymentSuccessAdminEmail(details: {
  payerEmail: string
  planTitle: string
  credits: number
  amountLabel: string
}) {
  const to = String(useRuntimeConfig().adminEmail || '').trim() || 'hello@gogospace.com'
  const payerEmail = escapeHtml(details.payerEmail)
  const planTitle = escapeHtml(details.planTitle)
  const amountLabel = escapeHtml(details.amountLabel)
  const credits = creditsLabel(details.credits)

  return sendResendEmail({
    to,
    subject: `GoGoSpace payment received — ${details.amountLabel}`,
    logLabel: 'payment admin email',
    text: [
      'GoGoSpace payment received',
      '',
      `Payer: ${details.payerEmail}`,
      `Plan: ${details.planTitle}`,
      `Credits: ${details.credits}`,
      `Amount: ${details.amountLabel}`,
    ].join('\n'),
    html: transactionalEmailHtml({
      title: 'Payment received',
      paragraphs: ['A checkout payment completed successfully.'],
      detailsHtml: `<strong>Payer:</strong> ${payerEmail}<br /><strong>Plan:</strong> ${planTitle}<br /><strong>Credits:</strong> ${credits}<br /><strong>Amount:</strong> ${amountLabel}`,
    }),
  })
}
