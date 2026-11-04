import "server-only"

import { env } from "@/lib/env"
import { getLeadMagnetFileBase64 } from "@/lib/lead-magnet-pdf"
import { parseTeamRecipients } from "@/lib/team-recipients"
import { renderBriefHtml, renderBriefText } from "@/lib/onboarding-brief-format"
import { summarizeOrderAddOns } from "@/lib/addon-reconcile"
import { entitlementsFromOrderAddOns } from "@/lib/addon-entitlements"
import { formatMinor } from "@/lib/money"
import type { OnboardingSubmissionInput } from "@/lib/onboarding-schema"
import type { PlanKey } from "@/lib/onboarding-questions"

// Mailchimp Transactional (Mandrill) initialisation — kept for reference; sending is via Resend.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mailchimpInit = {
  apiKey: () => env.MAILCHIMP_TRANSACTIONAL_API_KEY,
  fromEmail: () => env.MAILCHIMP_TRANSACTIONAL_FROM_EMAIL,
  fromName: () => env.MAILCHIMP_TRANSACTIONAL_FROM_NAME,
}

type SendThankYouEmailParams = {
  toEmail: string
  toName?: string | null
  plan: string
  formUrl: string
}

type ResendResponse = { id: string }

const ONBOARDING_EMAIL_SUBJECT = "Thank you for your purchase"

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  pulse: "Pulse",
  core: "Core",
  "core+": "Core+",
  expert: "Expert",
}

function planDisplayName(plan: string): string {
  return PLAN_DISPLAY_NAMES[plan.trim().toLowerCase()] ?? plan
}

function resendFrom(): string {
  return `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`
}

async function resendSend(body: Record<string, unknown>): Promise<ResendResponse> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ reply_to: env.RESEND_REPLY_TO_EMAIL, ...body }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Resend request failed: ${response.status} — ${text}`)
  }

  return (await response.json()) as ResendResponse
}

export async function sendPurchaseThankYouEmail({
  toEmail,
  toName,
  plan,
  formUrl,
}: SendThankYouEmailParams) {
  const message = buildOnboardingEmailMessage({ toName, plan, formUrl })

  return resendSend({
    from: resendFrom(),
    to: [toEmail],
    subject: ONBOARDING_EMAIL_SUBJECT,
    text: message.text,
    html: message.html,
  })
}

function buildOnboardingEmailMessage({
  toName,
  plan,
  formUrl,
}: Pick<SendThankYouEmailParams, "toName" | "plan" | "formUrl">) {
  const greeting = `Thank you for your purchase${toName ? `, ${toName}` : ""}.`
  const planName = planDisplayName(plan)

  return {
    text: [
      greeting,
      `Your purchase of the ${planName} Plan is active.`,
      "Please complete your onboarding form so we can prepare your report:",
      formUrl,
      "You are receiving this because this address was used to complete an Altilos purchase.",
    ].join("\n\n"),
    html: [
      '<div style="margin:0;padding:0;background:#f6f5f2;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">',
      '<tr><td align="center" style="padding:32px 16px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e2dc;">',
      '<tr><td style="padding:32px;">',
      '<p style="margin:0 0 16px;font-size:16px;line-height:24px;">',
      `Thank you for your purchase${toName ? `, ${escapeHtml(toName)}` : ""}.`,
      "</p>",
      '<p style="margin:0 0 16px;font-size:16px;line-height:24px;">',
      `Your purchase of the <strong>${escapeHtml(planName)}</strong> Plan is active.`,
      "</p>",
      '<p style="margin:0 0 24px;font-size:16px;line-height:24px;">Please complete your onboarding form so we can prepare your report.</p>',
      `<p style="margin:0 0 24px;"><a href="${escapeHtml(formUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-size:15px;line-height:20px;font-weight:700;">Complete onboarding form</a></p>`,
      `<p style="margin:0;color:#4b5563;font-size:13px;line-height:20px;">If the button does not work, paste this link into your browser:<br><a href="${escapeHtml(formUrl)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(formUrl)}</a></p>`,
      "</td></tr>",
      '<tr><td style="padding:20px 32px;border-top:1px solid #e5e2dc;color:#6b7280;font-size:12px;line-height:18px;">You are receiving this because this address was used to complete an Altilos purchase.</td></tr>',
      "</table>",
      "</td></tr>",
      "</table>",
      "</div>",
    ].join(""),
  }
}

type SendLeadMagnetEmailParams = {
  toEmail: string
  toName?: string | null
}

export async function sendLeadMagnetEmail({
  toEmail,
  toName,
}: SendLeadMagnetEmailParams) {
  const fileBase64 = await getLeadMagnetFileBase64()

  const greeting = `Hello${toName ? ` ${toName}` : ""},`

  return resendSend({
    from: resendFrom(),
    to: [toEmail],
    subject: "Your India Jewellery Consumer Landscape Study is here",
    text: [
      greeting,
      "Thank you for your interest in Altilos, the India Jewellery Consumer Landscape Study 2026 is attached.",
      "Inside is first-hand evidence from 2,625 verified jewellery buyers in 180 cities and towns, shared directly by them.",
      "The national picture is yours to keep; and if you would like to see the version built around your own brand, your cities, and your consumers, we're here to assist.",
      "Any questions, or want to go deeper?",
      "Just hit reply, a member of our team will get in touch.",
      "Best,\nThe Altilos team",
    ].join("\n\n"),
    html: [
      `<p>Hello${toName ? ` ${escapeHtml(toName)}` : ""},</p>`,
      `<p>Thank you for your interest in Altilos, the India Jewellery Consumer Landscape Study 2026 is attached.</p>`,
      `<p>Inside is first-hand evidence from 2,625 verified jewellery buyers in 180 cities and towns, shared directly by them.</p>`,
      `<p>The national picture is yours to keep; and if you would like to see the version built around your own brand, your cities, and your consumers, we're here to assist.</p>`,
      `<p>Any questions, or want to go deeper?<br>Just hit reply, a member of our team will get in touch.</p>`,
      `<p>Best,<br>The Altilos team</p>`,
    ].join(""),
    attachments: [
      {
        filename: env.LEAD_MAGNET_FILE_NAME,
        content: fileBase64,
      },
    ],
  })
}

export async function sendTeamBriefNotificationEmail({
  submission,
  plan,
  order,
}: {
  submission: OnboardingSubmissionInput
  plan: PlanKey
  order: { plan: string; amountCents: number; currency: string; addOns?: unknown }
}) {
  const recipients = parseTeamRecipients(env.RESEND_TEAM_NOTIFICATION_EMAILS)
  if (recipients.length === 0) return { skipped: true as const }

  const amount = formatMinor(order.amountCents, order.currency)
  // Add-ons are only ever visible inside Stripe checkout, so without this the
  // team has no way to know what was actually bought.
  const addOns = summarizeOrderAddOns(order.addOns)
  const entitlements = entitlementsFromOrderAddOns(order.addOns)
  const addOnSummary = addOns.length
    ? addOns
        .map(
          (addOn) =>
            `${addOn.label}${addOn.quantity > 1 ? ` ×${addOn.quantity}` : ""} — ${formatMinor(
              addOn.amountMinor,
              order.currency
            )}`
        )
        .join(", ")
    : null

  const contactRows = [
    ["Full name", submission.fullName],
    ["Email", submission.workEmail],
    ["Designation", submission.jobTitle],
    ["Company", submission.companyName],
    ["Website", submission.companyWebsite || "—"],
    ["Phone", submission.phoneNumber || "—"],
    ["Plan", order.plan],
    ...(addOnSummary ? [["Add-ons", addOnSummary]] : []),
    ["Purchase value", amount],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">${escapeHtml(
          k
        )}</td><td style="padding:4px 0;font-size:14px;color:#111827;">${escapeHtml(
          String(v)
        )}</td></tr>`
    )
    .join("")

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;">',
    `<h2 style="font-size:18px;">New research brief — ${escapeHtml(submission.companyName)} (${escapeHtml(order.plan)})</h2>`,
    '<table style="border-collapse:collapse;margin-bottom:20px;">',
    contactRows,
    "</table>",
    '<table style="width:100%;border-collapse:collapse;">',
    renderBriefHtml(submission.researchBrief, plan, entitlements),
    "</table>",
    "</div>",
  ].join("")

  const text = [
    `New research brief — ${submission.companyName} (${order.plan})`,
    `Full name: ${submission.fullName}`,
    `Email: ${submission.workEmail}`,
    `Designation: ${submission.jobTitle}`,
    `Company: ${submission.companyName}`,
    `Website: ${submission.companyWebsite || "—"}`,
    `Phone: ${submission.phoneNumber || "—"}`,
    `Plan: ${order.plan}`,
    ...(addOnSummary ? [`Add-ons: ${addOnSummary}`] : []),
    `Purchase value: ${amount}`,
    "",
    renderBriefText(submission.researchBrief, plan, entitlements),
  ].join("\n")

  await resendSend({
    from: resendFrom(),
    to: recipients,
    subject: `New research brief — ${submission.companyName} (${order.plan})`,
    text,
    html,
  })

  return { skipped: false as const }
}

export async function sendBriefReceivedUserEmail({
  toEmail,
  toName,
}: {
  toEmail: string
  toName?: string | null
}) {
  const greeting = `Thank you${toName ? `, ${toName}` : ""}.`

  return resendSend({
    from: resendFrom(),
    to: [toEmail],
    subject: "We've received your research brief",
    text: [
      greeting,
      "Your engagement brief is in, and we are already reviewing it. Your analyst will confirm the details shortly, and from there your study moves into configuration and collection.",
      "You will have your report within 3 to 7 days. If anything changes on your end before then, just reply here.",
      "The Altilos team",
    ].join("\n\n"),
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      "<p>Your engagement brief is in, and we are already reviewing it. Your analyst will confirm the details shortly, and from there your study moves into configuration and collection.</p>",
      "<p>You will have your report within 3 to 7 days. If anything changes on your end before then, just reply here.</p>",
      "<p>The Altilos team</p>",
    ].join(""),
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
