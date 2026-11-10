import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
    getWallets,
    getWalletByAsset
} from "./wallet.controller.js"


const router = Router()

//get all wallets belonging to authenticated user
router.get("/", authenticate, getWallets);

//get a specific asset wallet
router.get("/:assetSymbol", authenticate, getWalletByAsset);

export default router;