import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { AuthError } from "../auth/auth.service.js";

import {
    getUserWallets,
    getUserWalletByAsset
} from "../wallet/wallet.service.js"


//GET /api/wallets

export const getWallets = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId!;

        const wallets = await getUserWallets(userId);

        return res.status(200).json({
            success: true,
            data: wallets,
        })
    } catch(error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Wallet controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

}

export const getWalletByAsset = async(
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId!;
        const { assetSymbol } = req.params;

        if (typeof assetSymbol !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid asset symbol"
            });
        }

        const wallet = await getUserWalletByAsset(
            userId,
            assetSymbol
        );

        return res.status(200).json({
            success: true,
            data: wallet
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Wallet controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

}