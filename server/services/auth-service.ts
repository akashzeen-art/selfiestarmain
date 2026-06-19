import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models/User";
import { HttpError } from "../utils/http";
import {
  isDemoMsisdn,
  normalizeMsisdn,
} from "../../shared/demo.ts";

/**
 * Authentication Service
 * Handles user registration, login, JWT token generation, and password hashing
 */

const DEMO_EMAIL = "demo@selfistar.app";
const DEMO_PASSWORD = "Demo123456";
const DEMO_USERNAME = "demouser";
const DEMO_PHONE_PASSWORD = "DemoPass123!";

type AuthTokenPayload = {
  sub: string;
  role: IUser["role"];
  email: string;
  phone?: string;
};

function normalizePhone(phone: string): string {
  return normalizeMsisdn(phone);
}

async function ensureDemoPhoneUser(phone: string): Promise<IUser | null> {
  if (!isDemoMsisdn(phone)) return null;

  const msisdn = normalizePhone(phone);
  let user = await User.findOne({
    phone: { $in: [msisdn, `+${msisdn}`] },
  });

  if (user) return user;

  const existingUsername = await User.findOne({ username: DEMO_USERNAME }).select("_id").lean();
  user = new User({
    name: "Demo User",
    username: existingUsername ? `${DEMO_USERNAME}1` : DEMO_USERNAME,
    phone: msisdn,
    password: DEMO_PHONE_PASSWORD,
    role: "user",
    totalSelfies: 0,
    totalVideos: 0,
    totalScore: 0,
    challengeWins: 0,
    badges: [],
    isBlocked: false,
    isVerified: true,
  });
  await user.save();
  return user;
}

/**
 * Register a new user
 */
export async function registerUser(input: {
  email?: string;
  phone?: string;
  username: string;
  password: string;
  name?: string;
}) {
  const email = input.email?.toLowerCase().trim();
  const phone = input.phone ? normalizePhone(input.phone.trim()) : undefined;
  const username = input.username.toLowerCase().trim();
  const name = input.name?.trim() || username;

  if (email) {
    const existingEmail = await User.findOne({ email }).select("_id").lean();
    if (existingEmail) throw new HttpError(409, "Email already registered");
  }

  if (phone) {
    const existingPhone = await User.findOne({
      phone: { $in: [phone, `+${phone}`] },
    }).select("_id").lean();
    if (existingPhone) throw new HttpError(409, "Phone number already registered");
  }

  const existingUsername = await User.findOne({ username }).select("_id").lean();
  if (existingUsername) throw new HttpError(409, "Username already taken");

  const user = new User({
    username, name,
    email: email || undefined,
    phone: phone || undefined,
    password: input.password,
    role: "user",
    totalSelfies: 0, totalVideos: 0, totalScore: 0,
    challengeWins: 0, badges: [], isBlocked: false, isVerified: false, failedLoginAttempts: 0,
  });

  try {
    await user.save();
  } catch (error: any) {
    if (error?.code === 11000) {
      if (error.keyPattern?.email) {
        throw new HttpError(409, "Email already registered");
      }
      if (error.keyPattern?.username) {
        throw new HttpError(409, "Username already taken");
      }
    }
    throw error;
  }

  return issueAuthToken(user);
}

export async function loginUser(input: { email?: string; phone?: string; password?: string }) {
  if (input.phone) {
    const phone = normalizePhone(input.phone.trim());
    if (!phone) {
      throw new HttpError(400, "Invalid mobile number");
    }

    let user = await User.findOne({
      phone: { $in: [phone, `+${phone}`] },
    }).select("+password");

    if (!user) {
      const demoUser = await ensureDemoPhoneUser(phone);
      if (!demoUser) {
        throw new HttpError(401, "No account found with this phone number.");
      }
      if (demoUser.isBlocked) {
        throw new HttpError(403, "Account is not active. Please contact support.");
      }
      return issueAuthToken(demoUser);
    }

    if (user.isBlocked) {
      throw new HttpError(403, "Account is not active. Please contact support.");
    }

    if (input.password && input.password.trim()) {
      const passwordMatch = await bcrypt.compare(input.password.trim(), user.password);
      if (!passwordMatch) {
        throw new HttpError(401, "Invalid credentials");
      }
    }

    return issueAuthToken(user);
  }

  const identifier = input.email?.toLowerCase().trim();
  const user = await User.findOne({ email: identifier }).select("+password");

  if (!user) {
    throw new HttpError(401, "No account found with this email.");
  }

  if (user.isBlocked) {
    throw new HttpError(403, "Account is not active. Please contact support.");
  }

  if (input.password && input.password.trim()) {
    const passwordMatch = await bcrypt.compare(input.password.trim(), user.password);
    if (!passwordMatch) {
      throw new HttpError(401, "Invalid credentials");
    }
  }

  return issueAuthToken(user);
}

/** One-click demo login — creates demo user if missing */
export async function demoLogin() {
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    const existingUsername = await User.findOne({ username: DEMO_USERNAME }).select("_id").lean();
    user = new User({
      name: "Demo User",
      email: DEMO_EMAIL,
      username: existingUsername ? `${DEMO_USERNAME}1` : DEMO_USERNAME,
      password: DEMO_PASSWORD,
      role: "user",
      totalSelfies: 0,
      totalVideos: 0,
      totalScore: 0,
      challengeWins: 0,
      badges: [],
      isBlocked: false,
      isVerified: true,
    });
    await user.save();
  }

  if (user.isBlocked) {
    throw new HttpError(403, "Demo account is not available");
  }

  return issueAuthToken(user);
}

function issueAuthToken(user: IUser) {
  const phone = user.phone ? normalizePhone(user.phone) : undefined;
  const payload: AuthTokenPayload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email || "",
    ...(phone ? { phone } : {}),
  };

  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });

  return {
    token,
    user: sanitizeUser(user),
  };
}

export async function verifyToken(token: string): Promise<IUser> {
  let decoded: AuthTokenPayload;

  try {
    decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, "Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, "Invalid token");
    }
    throw new HttpError(401, "Token verification failed");
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new HttpError(401, "User not found");
  }

  if (user.isBlocked) {
    throw new HttpError(403, "Account is blocked");
  }

  return user;
}

export function sanitizeUser(user: IUser | { _id: any; username?: string; name: string; email: string; role: string; createdAt: Date; isBlocked: boolean; phone?: string; totalSelfies?: number; totalVideos?: number; totalScore?: number; challengeWins?: number; badges?: string[]; profileImage?: string; isVerified?: boolean; lastLogin?: Date }) {
  const totalMedia = ("totalSelfies" in user ? user.totalSelfies || 0 : 0) + ("totalVideos" in user ? user.totalVideos || 0 : 0);
  const totalScore = "totalScore" in user ? user.totalScore || 0 : 0;

  return {
    id: user._id.toString(),
    username: "username" in user && user.username ? user.username : user.name,
    name: user.name,
    email: user.email,
    phone: "phone" in user && user.phone ? normalizePhone(String(user.phone)) || user.phone : undefined,
    role: user.role,
    profileImage: "profileImage" in user ? user.profileImage : undefined,
    totalSelfies: "totalSelfies" in user ? user.totalSelfies || 0 : 0,
    totalVideos: "totalVideos" in user ? user.totalVideos || 0 : 0,
    totalScore: totalScore,
    challengeWins: "challengeWins" in user ? user.challengeWins || 0 : 0,
    averageScore: totalMedia > 0
      ? Math.round((totalScore / totalMedia) * 10) / 10
      : 0,
    badges: "badges" in user ? user.badges || [] : [],
    isVerified: "isVerified" in user ? user.isVerified || false : false,
    lastLogin: "lastLogin" in user ? user.lastLogin : undefined,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    isBlocked: user.isBlocked,
  };
}
