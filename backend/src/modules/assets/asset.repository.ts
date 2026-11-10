import { prisma } from '../../db/prisma.js';

export const findActiveAssets = async () => {
    return await prisma.asset.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            symbol: "asc",
        },
    });
};

export const findActiveAssetBySymbol = async (symbol: string) => {
    return prisma.asset.findFirst({
        where: {
            symbol,
            isActive: true,
        }, select: {
            id: true,
            symbol: true,
            name: true,
            decimals: true
        },
    });
}