import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || "lm_access";

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;

    next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};