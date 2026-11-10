import { prisma } from "../../db/prisma.js";

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: {
            email,
        }
    });
};

export const createUser = async(email: string, password: string) => {
    return prisma.user.create({
        data: {
            email,
            password,
        },
        select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

export const createUserWithWallets = async (
    email: string,
    password: string,
) => {
    return prisma.$transaction(async(tx) => {

        //create user
        const user = await tx.user.create({
            data: {
                email,
                password
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        //fetch all active assets
        const assets = await tx.asset.findMany({
            where: {
                isActive: true,
            }, 
            select: {
                id: true,
            },
        });

        if(assets.length === 0) {
            throw new Error("No active assets available for wallet creation")
        }

        //3. Create one wallet for every active asset
        await tx.wallet.createMany({
            data: assets.map((asset) => ({
                userId: user.id,
                assetId: asset.id,
            }))
        });

        return user
    })
}