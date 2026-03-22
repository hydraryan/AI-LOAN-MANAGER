import express from "express";
import { getCollateral } from "../controllers/collateralController";

const router = express.Router();

router.get("/", getCollateral);

export default router;