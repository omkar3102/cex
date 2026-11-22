import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createOrderController, getOrder, getOrderHistory
} from "./order.controller.js";

const router = Router();

router.post("/", authenticate, createOrderController);

router.get("/", authenticate, getOrderHistory);

router.get("/:orderId", authenticate, getOrder);

export default router;