"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = exports.logoutAllSessions = exports.logout = exports.refreshSession = exports.signin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || "lm_access";
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "lm_refresh";
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS || 7);
const REFRESH_SECRET = process.env.REFRESH_SECRET || process.env.JWT_SECRET || "fallback-secret";
const IS_PROD = process.env.NODE_ENV === "production";
const getCookieOptions = (maxAgeMs) => ({
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/"
});
const getClientMeta = (req) => {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return {
        userAgentHash: crypto_1.default.createHash("sha256").update(String(userAgent)).digest("hex"),
        ipHash: crypto_1.default.createHash("sha256").update(String(ip)).digest("hex")
    };
};
const hashRefreshToken = (token) => {
    return crypto_1.default.createHash("sha256").update(`${token}:${REFRESH_SECRET}`).digest("hex");
};
const issueAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};
const issueRefreshToken = () => crypto_1.default.randomBytes(48).toString("hex");
const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await models_1.User.findOne({ email });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const match = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!match)
            return res.status(400).json({ error: "Invalid credentials" });
        const accessToken = issueAccessToken(String(user._id), "admin");
        const refreshToken = issueRefreshToken();
        const refreshTokenHash = hashRefreshToken(refreshToken);
        const { userAgentHash, ipHash } = getClientMeta(req);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
        await models_1.AuthSession.create({
            userId: user._id,
            tokenHash: refreshTokenHash,
            userAgentHash,
            ipHash,
            expiresAt,
            lastSeenAt: now
        });
        res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000));
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.signin = signin;
const refreshSession = async (req, res) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }
        const refreshTokenHash = hashRefreshToken(refreshToken);
        const session = await models_1.AuthSession.findOne({ tokenHash: refreshTokenHash, revokedAt: { $exists: false } });
        if (!session || session.expiresAt.getTime() < Date.now()) {
            await models_1.AuthSession.updateMany({ tokenHash: refreshTokenHash }, { $set: { revokedAt: new Date() } });
            return res.status(401).json({ success: false, message: "Refresh token invalid or expired" });
        }
        const user = await models_1.User.findById(session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "Session user not found" });
        }
        const newAccessToken = issueAccessToken(String(user._id), user.role);
        const newRefreshToken = issueRefreshToken();
        const newRefreshHash = hashRefreshToken(newRefreshToken);
        const { userAgentHash, ipHash } = getClientMeta(req);
        session.tokenHash = newRefreshHash;
        session.userAgentHash = userAgentHash;
        session.ipHash = ipHash;
        session.rotatedAt = new Date();
        session.lastSeenAt = new Date();
        session.expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
        await session.save();
        res.cookie(ACCESS_COOKIE_NAME, newAccessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getCookieOptions(REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000));
        res.json({ success: true, data: { refreshed: true } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.refreshSession = refreshSession;
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (refreshToken) {
            const refreshTokenHash = hashRefreshToken(refreshToken);
            await models_1.AuthSession.updateOne({ tokenHash: refreshTokenHash }, { $set: { revokedAt: new Date() } });
        }
        res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
        res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
        res.json({ success: true, data: { loggedOut: true } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.logout = logout;
const logoutAllSessions = async (req, res) => {
    try {
        await models_1.AuthSession.updateMany({ userId: req.user?.id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
        res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
        res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
        res.json({ success: true, data: { loggedOutAll: true } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.logoutAllSessions = logoutAllSessions;
const getSession = async (req, res) => {
    try {
        const user = await models_1.User.findById(req.user?.id).select("name email role");
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSession = getSession;
//# sourceMappingURL=authController.js.map