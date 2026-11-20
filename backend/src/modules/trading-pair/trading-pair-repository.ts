import { prisma } from "../../db/prisma.js";

export const findActiveTradingPairs = async () => {
    return prisma.tradingPair.findMany({
        where: {
            isActive: true,
            baseAsset: {
                isActive: true,
            },
            quoteAsset: {
                isActive: true,
            },
        },
        include: {
            baseAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true,
                    decimals: true
                },
            },
            quoteAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true,
                    decimals: true
                },
            },
        },
        orderBy: {
            symbol: "asc",
        }
    });
};

export const findActiveTradingPairBySymbol = async (symbol: string) => {
    return prisma.tradingPair.findFirst({
        where: {
            symbol,
            isActive: true,
            baseAsset: {
                isActive: true,
            },
            quoteAsset: {
                isActive: true
            },
        },
        include : {
            baseAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true,
                    decimals: true
                }
            },
            quoteAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true,
                    decimals: true
                },
            }
        },
    })
}