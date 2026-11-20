import { Router } from "express";
import {
    getTradingPairs,
    getTradingPairBySymbol,
} from "./trading-pair-controller.js"

const router = Router();

router.get("/", getTradingPairs)
router.get("/:symbol", getTradingPairBySymbol);


export default router;