import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    placeOrder,
    getUserOrder,
    getUserOrderHistory,
    OrderError
} from "./order.service.js";


export const createOrderController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const userId = req.userId!;
        
        const {
            symbol,
            side,
            type,
            price,
            quantity,
        } = req.body;

        const idempotencyKey = req.get("Idempotency-Key");

        const result = await placeOrder(
            userId,
            symbol,
            side,
            type,
            price,
            quantity,
            idempotencyKey
        );

        return res
               .status(result.alreadyProcessed ? 200 : 201)
               .json({
                success: true,
                message: result.message,
                data: result,
               });
    } catch (error) {
        if (error instanceof OrderError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create order controller error: ", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const getOrder = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const order = await getUserOrder(
            req.userId!,
            req.params.orderId,
        );

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        if (error instanceof OrderError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Get order error:", error)

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const getOrderHistory = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const result = await getUserOrderHistory(
            req.userId!,
            req.query.limit,
            req.query.cursor
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if(error instanceof OrderError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            })
        }
        console.error("Get order history error: ", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}