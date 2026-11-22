import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

import { getActiveTradingPairBySymbol } from "../trading-pair/trading-pair-service.js";

import { lockFunds } from "../ledger/ledger.repository.js";

import { createOrder, findOrderByIdempotencyKey, findOrderById, findUserOrders } from "./order.repository.js";

export class OrderError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "OrderError";
    }
}

const normalizeOrderAmount = (
    amount : unknown,
    maxDecimals: number,
    fieldName: string
): string  => {

    if(typeof amount !== "string") {
        throw new OrderError(
            `${fieldName} must be provided as a decimal string`,
            400
        );
    }

    const trimmedAmount = amount.trim();

    if(!/^\d+(\.\d+)?$/.test(trimmedAmount)){
        throw new OrderError(
            `Invalid ${fieldName}`,
            400
        );
    }

    const [integerPart = "", fractionalPart = ""] =
        trimmedAmount.split(".")

    const integer = integerPart.replace(/^0+(?=\d)/, "");
    const fraction = fractionalPart.replace(/0+$/, "");

    if(integer === "0" && fraction.length === 0) {
        throw new OrderError(
            `${fieldName} must be greater than zero`, 
             400
        )
    }

    if(integer.length > 18 || fraction.length > 18) {
        throw new OrderError(
            `${fieldName} exceeds supported precision`,
            400
        );
    }

    if(fraction.length > maxDecimals) {
        throw new OrderError(
            `Maximum decimal places allowed for ${fieldName}: ${maxDecimals}`,
             400
        )
    }

    return fraction.length > 0
        ? `${integer}.${fraction}` 
        : integer;
};

//place order
export const placeOrder = async (
    userId: string,
    symbol: unknown,
    side: unknown,
    type: unknown,
    price: unknown,
    quantity: unknown,
    idempotencyKey: unknown,
) => {
    //1. Validate authenticated user
    if(!userId) {
        throw new OrderError("Authentication required", 401);
    }

    //2. Validate and normalize trading pair symbol
    if(
        typeof symbol !== "string" ||
        !symbol.trim()
    ) {
        throw new OrderError("Trading pair symbol is required", 400);

    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    //3. Validate order side
    if (typeof side !== "string" || !["BUY", "SELL"].includes(side.trim().toUpperCase())) {
        throw new OrderError("Invalid order side", 400);
    }

    const normalizedSide = side.trim().toUpperCase();

    //4. Validate order type
    if(
        typeof type !== "string" ||
        type.trim().toUpperCase() !== "LIMIT"
    ) {
        throw new OrderError("Only LIMIT orders are currently supported",
        400
        );
    };

    const normalizedType = "LIMIT";

    //5.Validate idempotency key
    if(typeof idempotencyKey !== "string" ||
        !/^[\x21-\x7E]{1,128}$/.test(idempotencyKey.trim())
    ) {
        throw new OrderError(
        "A valid Idempotency-Key header is required",
        400
        );
    }

    const normalizedKey = idempotencyKey.trim();

    //6.Find active trading pair
    const tradingPair = await getActiveTradingPairBySymbol(
        normalizedSymbol
    );

    if(!tradingPair) {
        throw new OrderError(
            "Trading pair not found or inactive",
            404        
        );
    }

    //Normalize price and quantity
    const normalizedPrice = normalizeOrderAmount(
        price,
        tradingPair.priceDecimals,
        "Price"
    );

    const normalizedQuantity = normalizeOrderAmount(
        quantity,
        tradingPair.quantityDecimal,
        "Quantity"
    )

    const assetToLock =
          normalizedSide === "BUY"
               ? tradingPair.quoteAsset.symbol
               : tradingPair.baseAsset.symbol;

    //BUY: Lock quote asset (price * quantity)
    //SELL: Lock base asset (quantity)

    let requiredAmount: string;

    if(normalizedSide === "BUY") {

        const calculatedAmount = new Prisma.Decimal(normalizedPrice)
            .mul(new Prisma.Decimal(normalizedQuantity));

        //Round up to quote asset precision to avoid under-locking
        requiredAmount = calculatedAmount.toDecimalPlaces(
            tradingPair.quoteAsset.decimals,
            Prisma.Decimal.ROUND_UP
        )
        .toFixed(tradingPair.quoteAsset.decimals);
    } else {
        requiredAmount = normalizedQuantity
    }

//9. Execute order creation and fund locking atomically
 // 9. Execute order creation and fund locking atomically
    try {

        const result = await prisma.$transaction(async (tx) => {

            // Check for an existing request
            const existingOrder = await findOrderByIdempotencyKey(
                tx,
                normalizedKey
            );

            if (existingOrder) {

                const sameRequest =
                    existingOrder.userId === userId &&
                    existingOrder.tradingPairId === tradingPair.id &&
                    existingOrder.side === normalizedSide &&
                    existingOrder.type === normalizedType &&
                    existingOrder.price?.eq(normalizedPrice) === true &&
                    existingOrder.quantity.eq(normalizedQuantity);

                if (!sameRequest) {
                    throw new OrderError(
                        "Idempotency key has already been used for a different order",
                        409
                    );
                }

                return {
                    order: existingOrder,
                    alreadyProcessed: true,
                };
            }

            // Create order first to obtain its ID
            const order = await createOrder(tx, {
                userId,
                tradingPairId: tradingPair.id,
                side: normalizedSide,
                type: normalizedType,
                status: "OPEN",
                price: normalizedPrice,
                quantity: normalizedQuantity,
                idempotencyKey: normalizedKey,
            });

            // Lock required funds using the same transaction
            const lockResult = await lockFunds(
                tx,
                userId,
                assetToLock,
                requiredAmount,
                normalizedKey,
                order.id
            );

            if (!lockResult.wallet) {
                throw new OrderError("Wallet not found", 404);
            }

            return {
                order,
                alreadyProcessed: false,
            };

        });

        // 10. Return safe API response
        return {
            message: result.alreadyProcessed
                ? "Order already processed"
                : "Order placed successfully",

            order: {
                id: result.order.id,
                symbol: normalizedSymbol,
                side: result.order.side,
                type: result.order.type,
                status: result.order.status,
                price: result.order.price?.toString() ?? null,
                quantity: result.order.quantity.toString(),
                filledQuantity: result.order.filledQuantity.toString(),
                createdAt: result.order.createdAt,
            },

            alreadyProcessed: result.alreadyProcessed,
        };

    } catch (error) {

        if (error instanceof OrderError) {
            throw error;
        }

        if (
            error instanceof Error &&
            error.message === "WALLET_NOT_FOUND"
        ) {
            throw new OrderError("Wallet not found", 404);
        }

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_AVAILABLE_BALANCE"
        ) {
            throw new OrderError(
                "Insufficient available balance",
                400
            );
        }

        if (
            error instanceof Error &&
            error.message === "IDEMPOTENCY_KEY_REUSED"
        ) {
            throw new OrderError(
                "Idempotency key has already been used for a different operation",
                409
            );
        }

        throw error;
    }
}


// Get a single order belonging to the authenticated user

export const getUserOrder = async (
    userId: string,
    orderId: unknown,
) => {
    if(!userId) {
        throw new OrderError("Authentication required", 401);
    }
    if (
        typeof orderId !== "string" ||
        !orderId.trim()
    ) {
        throw new OrderError("Valid order Id is required", 400);

    }

    const order = await findOrderById(
        orderId.trim(),
        userId
    );

    if(!order) {
        throw new OrderError("Order not found", 404);
    }

    return order
};

    //Get authenticated user's order history
    export const getUserOrderHistory = async (
        userId: string,
        limit: unknown,
        cursor: unknown,
    ) => {
        if(!userId) {
            throw new OrderError("Authentication required", 401);
    }

    let parsedLimit = 20;

    if(limit !== undefined) {
        const value = String(limit);

        if(!/^\d+$/.test(value)) {
            throw new OrderError("Invalid limit" , 400);
        }

        parsedLimit = Number(value);

        if(
            !Number.isSafeInteger(parsedLimit) ||
             parsedLimit < 1 ||
             parsedLimit > 100
        ) {
            throw new OrderError(
                "Limit must between 1 and 100",
                400
            )
        }
    }

    let parsedCursor: string | undefined;

    if(cursor !== undefined) {
        if (
            typeof cursor !== "string" ||
            !cursor.trim()
        ) {
            throw new OrderError("Invalid cursor", 400);
        }

        parsedCursor = cursor.trim()
    }

    const orders = await findUserOrders(
        userId,
        parsedLimit,
        parsedCursor
    );

    const hasMore = orders.length > parsedLimit;

    if(hasMore) {
        orders.pop();
    }

    return {
        orders,
        pagination: {
            limit: parsedLimit,
            hasMore,
            nextCursor: hasMore
                ?  orders[orders.length - 1] ?.id ?? null : null,
        },
    };

};