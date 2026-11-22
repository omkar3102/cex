import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js"

export const createOrder = async (
    tx: Prisma.TransactionClient,
    data: {
        userId: string,
        tradingPairId: string,
        side: string,
        type: string,
        status: string,
        price: string | null;
        quantity: string;
        idempotencyKey: string
    }
) => {
    return await tx.order.create({
        data: {
            userId: data.userId,
            tradingPairId: data.tradingPairId,
            side: data.side,
            type: data.type,
            status: data.status,
            price: data.price,
            quantity: data.quantity,
            idempotencyKey: data.idempotencyKey,
        },
        include: {
            tradingPair: {
                include: {
                    baseAsset: true,
                    quoteAsset: true,
                }
            }
        }
    })
}

export const findOrderById = async (
    orderId: string,
    userId: string,
) => {
    return await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        include: {
            tradingPair: {
                include: {
                    baseAsset: true,
                    quoteAsset: true,
                }
            }
        }
    })
}


//Retrieve user's orders with cursor pagination
export const findUserOrders = async (
    userId: string,
    limit: number,
    cursor?: string,
) => {
    return await prisma.order.findMany({
        where: {
            userId,
        },
        take: limit + 1,
        ...(cursor && {
            cursor: {
                id: cursor,
            },
            skip: 1,
        }),
        orderBy : [
            {
                createdAt: "desc",

            }, {
                id: "desc",
            },
        ],
        include: {
            tradingPair: {
                include: {
                    baseAsset: true,
                    quoteAsset: true,
                }
            }
        }
    })
}


//4. Mark an order as cancelled
export const markOrderCancelled = async (
    tx: Prisma.TransactionClient,
    orderId: string,
    userId: string,
) => {
    const result = await tx.order.updateMany({
        where: {
            id: orderId,
            userId,
            status: {
                in: ["OPEN", "PARTIALLY_FILLED"],
            },
        },
        data: {
            status: "CANCELLED",
        }
    });

    //Order was ot found or is no longer cancellable
    if (result.count === 0) {
        return null
    }

    return await tx.order.findUnique({
        where: {
            id: orderId,
        },
        include: {
            tradingPair: {
                include: {
                    baseAsset: true,
                    quoteAsset: true,
                }
            }
        }
    })


}

export const findOrderByIdempotencyKey = async (
    tx: Prisma.TransactionClient,
    idempotencyKey: string,
) => {
    return await tx.order.findUnique({
        where: {
            idempotencyKey,
        },
        include: {
            tradingPair: {
                include: {
                    baseAsset: true,
                    quoteAsset: true,
                },
            },
        },
    })
}