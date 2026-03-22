import express from "express";
import { getInvestors } from "../controllers/investorController";

const router = express.Router();

router.get("/", getInvestors);

export default router;