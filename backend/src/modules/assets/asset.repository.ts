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