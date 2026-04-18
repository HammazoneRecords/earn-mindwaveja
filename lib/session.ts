import { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
  tier?: string;
  isGrader?: boolean;
  isAdmin?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "earn_mw_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
