import { Request, Response } from "express";
import Investor from "../models/Investors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]{10,}$/;
const PINCODE_REGEX = /^[0-9]{6}$/;

const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  return PHONE_REGEX.test(phone);
};

const validatePincode = (pincode: string): boolean => {
  if (!pincode) return true;
  return PINCODE_REGEX.test(pincode);
};

const parsePageLimit = (query: any): { page: number; limit: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

export const createInvestor = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      investorType = "Individual",
      phone,
      address,
      city,
      state,
      pincode,
      accountNumber,
      accountHolderName,
      ifscCode,
      kycStatus = "Pending",
      status = "Active"
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "email format is invalid" });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ error: "phone format is invalid" });
    }

    if (pincode && !validatePincode(pincode)) {
      return res.status(400).json({ error: "pincode must be 6 digits" });
    }

    if (!["Individual", "Corporate", "Bank", "MutualFund"].includes(investorType)) {
      return res.status(400).json({ error: "invalid investorType" });
    }

    if (!["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({ error: "invalid status" });
    }

    const existingInvestor = await Investor.findOne({ email: email.toLowerCase() });
    if (existingInvestor) {
      return res.status(409).json({ error: "email already exists" });
    }

    const investor = await Investor.create({
      name: name.trim(),
      email: email.toLowerCase(),
      investorType,
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode,
      accountNumber: accountNumber?.trim(),
      accountHolderName: accountHolderName?.trim(),
      ifscCode: ifscCode?.trim(),
      kycStatus,
      status
    });

    res.status(201).json(investor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestors = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePageLimit(req.query);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.search) {
      const search = String(req.query.search).trim();
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (req.query.status && ["Active", "Inactive", "Suspended"].includes(String(req.query.status))) {
      filter.status = req.query.status;
    }

    if (req.query.type && ["Individual", "Corporate", "Bank", "MutualFund"].includes(String(req.query.type))) {
      filter.investorType = req.query.type;
    }

    const [investors, total] = await Promise.all([
      Investor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Investor.countDocuments(filter)
    ]);

    res.json({
      data: investors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestor = async (req: Request, res: Response) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }
    res.json(investor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvestor = async (req: Request, res: Response) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    const {
      investorType,
      phone,
      address,
      city,
      state,
      pincode,
      accountNumber,
      accountHolderName,
      ifscCode,
      kycStatus,
      status
    } = req.body;

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ error: "phone format is invalid" });
    }

    if (pincode && !validatePincode(pincode)) {
      return res.status(400).json({ error: "pincode must be 6 digits" });
    }

    if (investorType && !["Individual", "Corporate", "Bank", "MutualFund"].includes(investorType)) {
      return res.status(400).json({ error: "invalid investorType" });
    }

    if (status && !["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({ error: "invalid status" });
    }

    if (kycStatus && !["Pending", "Verified", "Rejected"].includes(kycStatus)) {
      return res.status(400).json({ error: "invalid kycStatus" });
    }

    if (investorType) investor.investorType = investorType;
    if (phone) investor.phone = phone.trim();
    if (address) investor.address = address.trim();
    if (city) investor.city = city.trim();
    if (state) investor.state = state.trim();
    if (pincode) investor.pincode = pincode;
    if (accountNumber) investor.accountNumber = accountNumber.trim();
    if (accountHolderName) investor.accountHolderName = accountHolderName.trim();
    if (ifscCode) investor.ifscCode = ifscCode.trim();
    if (kycStatus) investor.kycStatus = kycStatus;
    if (status) investor.status = status;

    await investor.save();
    res.json(investor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvestorStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({ error: "invalid status" });
    }

    const investor = await Investor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    res.json(investor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInvestor = async (req: Request, res: Response) => {
  try {
    const investor = await Investor.findByIdAndDelete(req.params.id);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }
    res.json({ message: "Investor deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};