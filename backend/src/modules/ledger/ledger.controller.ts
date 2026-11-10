import type {Response} from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    depositToWallet,
    LedgerError
} from "./ledger.service.js";

export const deposit = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        //1. Get authenticated user ID
        const userId = req.userId!
        const {assetSymbol, amount} = req.body;

        //Extract idempotency key
        const idempotencyKey = req.get("Idempotency-Key");

        //4. Execute deposit operation
        const result = await depositToWallet(
            userId,
            assetSymbol,
            amount,
            idempotencyKey
        );

        //5. Return appopriate status
        return res
               .status(result.alreadyProcessed ? 200 : 201)
               .json({
                  success: true,
                  message: result.alreadyProcessed ? "Deposit already processed" : "Deposit successful",
                  data: result
               })
    } catch (error) {
        
        if(error instanceof LedgerError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error("Deposit controller error", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
    }