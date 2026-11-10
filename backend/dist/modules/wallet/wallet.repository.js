import { prisma } from "../../db/prisma.js";
export const findWalletsByUserId = async (userId) => {
    return prisma.wallet.findMany({
        where: {
            userId,
        },
        select: {
            id: true,
            availableBalance: true,
            lockedBalance: true,
            asset: {
                select: {
                    symbol: true,
                    name: true,
                    decimals: true,
                },
            },
        },
        orderBy: {
            asset: {
                symbol: "asc"
            },
        },
    });
};
//fetch a specific asset wallet belonging to a user
export const findWalletByUserAndAsset = async (userId, assetSymbol) => {
    return prisma.wallet.findFirst({
        where: {
            userId,
            asset: {
                symbol: assetSymbol,
            }
        },
        select: {
            id: true,
            availableBalance: true,
            lockedBalance: true,
            asset: {
                select: {
                    symbol: true,
                    name: true,
                    decimals: true
                }
            }
        }
    });
};
//# sourceMappingURL=wallet.repository.js.map