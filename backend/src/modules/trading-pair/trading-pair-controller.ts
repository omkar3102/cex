import type {Request, Response } from "express";
import {
    getActiveTradingPairs,
    getActiveTradingPairBySymbol
} from "./trading-pair-service.js";

export const getTradingPairs = async(_req: Request, res: Response) => {
    try {
        const tradingPairs = await getActiveTradingPairs();

        return res.status(200).json({
            success: true,
            data: tradingPairs
        })
    } catch (error) {
        console.error("Failed to fetch trading pairs", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }

}

export const getTradingPairBySymbol = async (
    req: Request,
    res: Response
) => {
    try {
        const { symbol } = req.params;

        if (typeof symbol !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid trading pair symbol"
            });
        }

        const tradingPair = await getActiveTradingPairBySymbol(symbol);

        if(!tradingPair) {
            return res.status(401).json({
                success: false,
                message: "Trading Pair not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: tradingPair,
        })
    } catch (error) {
        console.error("Failed to fetch trading pair: ", error);
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })  
    }
}