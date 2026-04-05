import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const ACCESS_COOKIE_NAME = env.ACCESS_COOKIE_NAME;

export const authMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const bearerToken = req.headers.authorization?.split(" ")[1];
    const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = String(req.user?.role || "").trim();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};