import { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthSession, User } from "../models";
import { env } from "../config/env";

const ACCESS_COOKIE_NAME = env.ACCESS_COOKIE_NAME;
const REFRESH_COOKIE_NAME = env.REFRESH_COOKIE_NAME;
const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL;
const REFRESH_TTL_DAYS = env.REFRESH_TTL_DAYS;
const REFRESH_SECRET = env.REFRESH_SECRET;

const cookieBaseOptions: Pick<CookieOptions, "httpOnly" | "secure" | "sameSite" | "path" | "domain"> = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

const getCookieOptions = (maxAgeMs: number): CookieOptions => ({
  ...cookieBaseOptions,
  maxAge: maxAgeMs
});

const getClearCookieOptions = (): CookieOptions => ({
  ...cookieBaseOptions
});

const getClientMeta = (req: Request) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : undefined;
  const ip = forwardedIp || req.ip || req.socket.remoteAddress || "unknown";

  return {
    userAgentHash: crypto.createHash("sha256").update(String(userAgent)).digest("hex"),
    ipHash: crypto.createHash("sha256").update(String(ip)).digest("hex")
  };
};

const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(`${token}:${REFRESH_SECRET}`).digest("hex");
};

const issueAccessToken = (userId: string, role: string) => {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL as any }
  );
};

const issueRefreshToken = () => crypto.randomBytes(48).toString("hex");

const safeServerError = (res: Response) => {
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isStrongPassword = (value: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,128}$/.test(value);
};

const logAuthEvent = (event: {
  action: "signin" | "refresh" | "logout" | "logout-all" | "change-password";
  status: "success" | "failed";
  userId?: string;
  reason?: string;
  ipHash?: string;
  userAgentHash?: string;
}) => {
  console.info(
    JSON.stringify({
      type: "auth-event",
      at: new Date().toISOString(),
      ...event
    })
  );
};

const validateSigninPayload = (email: unknown, password: unknown) => {
  if (typeof email !== "string" || typeof password !== "string") {
    return "Email and password must be valid strings";
  }

  const emailValue = normalizeEmail(email);
  const passwordValue = password.trim();

  if (!emailValue || !passwordValue) {
    return "Email and password are required";
  }

  if (emailValue.length > 255 || !isValidEmail(emailValue)) {
    return "Please enter a valid email address";
  }

  if (passwordValue.length < 8 || passwordValue.length > 128) {
    return "Password length is invalid";
  }

  return null;
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { userAgentHash, ipHash } = getClientMeta(req);

  try {
    const validationError = validateSigninPayload(email, password);
    if (validationError) {
      logAuthEvent({ action: "signin", status: "failed", reason: "invalid-input", ipHash, userAgentHash });
      return res.status(400).json({ success: false, message: validationError });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      logAuthEvent({ action: "signin", status: "failed", reason: "invalid-credentials", ipHash, userAgentHash });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(String(password), user.passwordHash);

    if (!match) {
      logAuthEvent({
        action: "signin",
        status: "failed",
        userId: String(user._id),
        reason: "invalid-credentials",
        ipHash,
        userAgentHash
      });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = issueAccessToken(String(user._id), "admin");
    const refreshToken = issueRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    await AuthSession.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      userAgentHash,
      ipHash,
      expiresAt,
      lastSeenAt: now
    });

    res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000));

    logAuthEvent({ action: "signin", status: "success", userId: String(user._id), ipHash, userAgentHash });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err: any) {
    console.error("signin error", err);
    return safeServerError(res);
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  try {
    const { userAgentHash, ipHash } = getClientMeta(req);
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      logAuthEvent({ action: "refresh", status: "failed", reason: "missing-token", ipHash, userAgentHash });
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await AuthSession.findOne({ tokenHash: refreshTokenHash, revokedAt: { $exists: false } });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      await AuthSession.updateMany({ tokenHash: refreshTokenHash }, { $set: { revokedAt: new Date() } });
      logAuthEvent({ action: "refresh", status: "failed", reason: "invalid-or-expired", ipHash, userAgentHash });
      return res.status(401).json({ success: false, message: "Refresh token invalid or expired" });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      logAuthEvent({ action: "refresh", status: "failed", reason: "missing-user", ipHash, userAgentHash });
      return res.status(401).json({ success: false, message: "Session user not found" });
    }

    const newAccessToken = issueAccessToken(String(user._id), user.role);
    const newRefreshToken = issueRefreshToken();
    const newRefreshHash = hashRefreshToken(newRefreshToken);

    session.tokenHash = newRefreshHash;
    session.userAgentHash = userAgentHash;
    session.ipHash = ipHash;
    session.rotatedAt = new Date();
    session.lastSeenAt = new Date();
    session.expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await session.save();

    res.cookie(ACCESS_COOKIE_NAME, newAccessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getCookieOptions(REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000));

    logAuthEvent({ action: "refresh", status: "success", userId: String(user._id), ipHash, userAgentHash });

    res.json({ success: true, data: { refreshed: true } });
  } catch (err: any) {
    console.error("refreshSession error", err);
    return safeServerError(res);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { userAgentHash, ipHash } = getClientMeta(req);
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const clearCookieOptions = getClearCookieOptions();
    let userId: string | undefined;

    if (refreshToken) {
      const refreshTokenHash = hashRefreshToken(refreshToken);
      const session = await AuthSession.findOne({ tokenHash: refreshTokenHash, revokedAt: { $exists: false } });
      if (session) {
        userId = String(session.userId);
        session.revokedAt = new Date();
        await session.save();
      }
    }

    res.clearCookie(ACCESS_COOKIE_NAME, clearCookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

    logAuthEvent({
      action: "logout",
      status: "success",
      ...(userId ? { userId } : {}),
      ipHash,
      userAgentHash
    });

    res.json({ success: true, data: { loggedOut: true } });
  } catch (err: any) {
    console.error("logout error", err);
    return safeServerError(res);
  }
};

export const logoutAllSessions = async (req: any, res: Response) => {
  try {
    const { userAgentHash, ipHash } = getClientMeta(req);
    const clearCookieOptions = getClearCookieOptions();
    await AuthSession.updateMany(
      { userId: req.user?.id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );

    res.clearCookie(ACCESS_COOKIE_NAME, clearCookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

    logAuthEvent({ action: "logout-all", status: "success", userId: String(req.user?.id || ""), ipHash, userAgentHash });

    res.json({ success: true, data: { loggedOutAll: true } });
  } catch (err: any) {
    console.error("logoutAllSessions error", err);
    return safeServerError(res);
  }
};

export const getSession = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("name email role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err: any) {
    console.error("getSession error", err);
    return safeServerError(res);
  }
};

export const getActiveSessions = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const currentHash = refreshToken ? hashRefreshToken(refreshToken) : null;

    const sessions = await AuthSession.find({
      userId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    })
      .sort({ updatedAt: -1 })
      .select("_id createdAt updatedAt expiresAt lastSeenAt tokenHash");

    res.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          id: s._id,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          expiresAt: s.expiresAt,
          lastSeenAt: s.lastSeenAt,
          isCurrent: currentHash ? s.tokenHash === currentHash : false
        }))
      }
    });
  } catch (err: any) {
    console.error("getActiveSessions error", err);
    return safeServerError(res);
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { userAgentHash, ipHash } = getClientMeta(req);
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();

    if (!trimmedCurrent || !trimmedNew) {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }

    if (!isStrongPassword(trimmedNew)) {
      return res.status(400).json({
        success: false,
        message: "New password must be 10+ chars with upper, lower, number, and special character"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const valid = await bcrypt.compare(trimmedCurrent, user.passwordHash);
    if (!valid) {
      logAuthEvent({
        action: "change-password",
        status: "failed",
        userId: String(user._id),
        reason: "invalid-current-password",
        ipHash,
        userAgentHash
      });
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const sameAsCurrent = await bcrypt.compare(trimmedNew, user.passwordHash);
    if (sameAsCurrent) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    user.passwordHash = await bcrypt.hash(trimmedNew, 10);
    await user.save();

    logAuthEvent({ action: "change-password", status: "success", userId: String(user._id), ipHash, userAgentHash });

    res.json({ success: true, data: { changed: true } });
  } catch (err: any) {
    console.error("changePassword error", err);
    return safeServerError(res);
  }
};