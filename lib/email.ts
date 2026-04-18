import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "earn@mindwaveja.com";

export async function sendClaimConfirmed(
  to: string,
  jobTitle: string,
  expiresAt: Date
) {
  const deadline = expiresAt.toLocaleString("en-JM", { timeZone: "America/Jamaica" });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Job claimed — "${jobTitle}"`,
    text: `You claimed "${jobTitle}". Submit your transcription before ${deadline} (Jamaica time) to get paid.\n\nLogin at earn.mindwaveja.com/dashboard to submit.`,
  });
}

export async function sendSubmissionReceived(to: string, jobTitle: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Submission received — "${jobTitle}"`,
    text: `Your transcription for "${jobTitle}" is in the grading queue. Standard turnaround is 3 days. Trusted transcribers are graded same-day.\n\nWe'll email you when it's done.`,
  });
}

export async function sendGradeResult(
  to: string,
  jobTitle: string,
  approved: boolean,
  notes?: string
) {
  if (approved) {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Approved — payment incoming for "${jobTitle}"`,
      text: `Your transcription for "${jobTitle}" was approved. Payment will be sent within 1 business day.\n\n${notes ? `Grader notes: ${notes}` : ""}`,
    });
  } else {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Transcription needs improvement — "${jobTitle}"`,
      text: `Your transcription for "${jobTitle}" was not approved this time.\n\nReason: ${notes ?? "No notes provided."}\n\nKeep going — accuracy improves with practice.`,
    });
  }
}

export async function sendPaymentProof(
  to: string,
  jobTitle: string,
  amountJmd: number,
  rewardType: string,
  rewardDetail: string | null
) {
  const reward =
    rewardType === "cash"
      ? `J$${amountJmd.toLocaleString()} JMD`
      : rewardDetail ?? rewardType;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — "${jobTitle}"`,
    text: `Payment for "${jobTitle}" has been processed.\n\nReward: ${reward}\n\nThank you for contributing to Caribbean AI. You're part of something real.`,
  });
}
