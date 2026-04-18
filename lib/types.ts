export type Tier = "bronze" | "silver" | "gold" | "diamond";
export type TsDisplay = "inline" | "margin" | "hidden";
export type TsFormat = "short" | "long";

export interface User {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  tier: Tier;
  accuracy_score: number;
  jobs_completed: number;
  ts_display: TsDisplay;
  ts_format: TsFormat;
  show_on_leaderboard: boolean;
  created_at: string;
}

export type JobStatus =
  | "available"
  | "claimed"
  | "submitted"
  | "grading"
  | "approved"
  | "rejected"
  | "paid";

export type Platform = "youtube" | "tiktok" | "instagram" | "other";

export interface Job {
  id: string;
  title: string;
  video_url: string;
  platform: Platform;
  duration_secs: number;
  pay_jmd: number;
  reward_type: "cash" | "voucher" | "gift_code";
  reward_detail: string | null;
  addon_enabled: boolean;
  addon_type: "user_choice" | "choice_plus_random" | null;
  language_tags: string[];
  topic: string;
  priority: 1 | 2 | 3;
  status: JobStatus;
  created_at: string;
}

export interface Participant {
  name: string;
}

export interface EventMarker {
  label: string;
}

export interface TranscriptSegment {
  ts_start: string;
  ts_end: string;
  speaker: string | null;
  text: string;
  gaps: number[]; // timestamps (secs) where STT had no confident output
}

export interface Submission {
  id: string;
  claim_id: string;
  job_id: string;
  user_id: string;
  transcript: TranscriptSegment[];
  transcript_text: string;
  participants: Participant[];
  events: EventMarker[];
  submitted_at: string;
  quality_score: number | null;
  grader_notes: string | null;
  graded_at: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface Claim {
  id: string;
  job_id: string;
  user_id: string;
  claimed_at: string;
  expires_at: string;
  submitted_at: string | null;
  status: "active" | "submitted" | "expired" | "abandoned";
}

export interface LeaderboardEntry {
  display_name: string;
  tier: Tier;
  accuracy_score: number;
  jobs_completed: number;
}
