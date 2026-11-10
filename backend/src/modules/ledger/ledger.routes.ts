import {Router} from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {deposit } from "./ledger.controller.js";

const router = Router()

router.post("/deposit", authenticate, deposit);


export default router;