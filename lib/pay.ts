// Pay rate calculator — next tier starts after 30 seconds past boundary

export interface PayResult {
  pay_jmd: number;
  addon_enabled: boolean;
  addon_type: "user_choice" | "choice_plus_random" | null;
  tier_label: string;
}

export function calculatePay(duration_secs: number): PayResult {
  const mins = duration_secs / 60;

  let pay_jmd: number;
  let tier_label: string;

  if (mins < 3.5) {
    pay_jmd = 200;
    tier_label = "Under 3 min";
  } else if (mins < 10.5) {
    pay_jmd = 500;
    tier_label = "3–10 min";
  } else if (mins < 20.5) {
    pay_jmd = 900;
    tier_label = "10–20 min";
  } else if (mins < 45.5) {
    pay_jmd = 1380;
    tier_label = "20–45 min";
  } else {
    pay_jmd = 3500;
    tier_label = "45–70 min";
  }

  const addon_enabled = mins > 40.5;
  const addon_type = mins > 60.5
    ? "choice_plus_random"
    : mins > 40.5
    ? "user_choice"
    : null;

  return { pay_jmd, addon_enabled, addon_type, tier_label };
}

// Speed score: how fast within the claim window (0–100)
export function calculateSpeedScore(
  claimed_at: Date,
  submitted_at: Date,
  expires_at: Date
): number {
  const window = expires_at.getTime() - claimed_at.getTime();
  const elapsed = submitted_at.getTime() - claimed_at.getTime();
  const ratio = elapsed / window; // 0 = instant, 1 = last second
  return Math.round((1 - ratio) * 100);
}

// Composite rating: 70% quality, 30% speed
export function compositeScore(quality: number, speed: number): number {
  return Math.round(quality * 0.7 + speed * 0.3);
}

// Daily cap for new/bronze users
export function getDailyCap(tier: string): number {
  return tier === "bronze" ? 2 : Infinity;
}
