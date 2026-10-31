import { listPendingNotifications, markMessageNotified } from "@/lib/analytics/repository";
import type { PendingNotification } from "@/lib/analytics/repository";
import { recordHeal } from "@/lib/heal";
import { sendEmail } from "@/lib/notify/email";

// Resend's free plan allows about 100 emails a day, shared with error alerts and the digest, so retries stay small.
const MAX_RESENDS_PER_RUN = 3;

/** Emails the owner about a contact message and, once it has gone out, marks it so it is not sent again. */
export async function notifyContactMessage(message: PendingNotification, origin: string, resent = false): Promise<boolean> {
  const result = await sendEmail({
    subject: `${resent ? "[Resent] " : ""}New portfolio message from ${message.name}`,
    text: `${message.name} <${message.email}> wrote:\n\n${message.message}\n\nReply to this email to answer them directly, or manage messages at ${origin}/admin/analytics`,
    replyTo: message.email,
  });
  if (result !== "sent") return false;

  await markMessageNotified(message.id).catch((error) => console.error("could not mark message as notified", error));
  return true;
}

/**
 * Sends the notifications that failed earlier (the email provider was down). Messages themselves are always saved
 * first, so nothing is lost either way; this only makes sure the owner eventually hears about them.
 */
export async function resendPendingNotifications(origin: string, limit = MAX_RESENDS_PER_RUN): Promise<number> {
  try {
    let sent = 0;
    for (const message of await listPendingNotifications(limit)) {
      if (!(await notifyContactMessage(message, origin, true))) break;
      sent++;
      void recordHeal("email", "email-resent");
    }
    return sent;
  } catch (error) {
    console.error("resending pending notifications failed", error);
    return 0;
  }
}
