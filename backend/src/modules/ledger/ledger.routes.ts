import {Router} from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {deposit, getLedgerHistory, withdraw} from "./ledger.controller.js";

const router = Router()

router.post("/deposit", authenticate, deposit);
router.get("/history", authenticate, getLedgerHistory);
router.post("/withdraw", authenticate, withdraw);


export default router;