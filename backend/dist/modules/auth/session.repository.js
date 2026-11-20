import { prisma } from "../../db/prisma.js";
export const createRefreshSession = async (data) => {
    return prisma.refreshSession.create({
        data: {
            userId: data.userId,
            tokenHash: data.tokenHash,
            familyId: data.familyId,
            expiresAt: data.expiresAt,
        }
    });
};
export const findRefreshSession = async (tokenHash) => {
    return prisma.refreshSession.findUnique({
        where: {
            tokenHash
        }
    });
};
export const revokeRefreshSession = async (id) => {
    return prisma.refreshSession.updateMany({
        where: {
            id,
            revokedAt: null
        },
        data: {
            revokedAt: new Date(),
        }
    });
};
export const revokeTokenFamily = async (familyId) => {
    return prisma.refreshSession.updateMany({
        where: {
            familyId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
};
export const rotateRefreshSession = async (data) => {
    return prisma.$transaction(async (tx) => {
        const now = new Date();
        //1. Find the existing session
        const existingSession = await tx.refreshSession.findUnique({
            where: {
                tokenHash: data.oldTokenHash,
            },
        });
        if (!existingSession) {
            return { status: "NOT_FOUND" };
        }
        //2. Detect reuse of an already-revoked token
        if (existingSession.revokedAt !== null) {
            await tx.refreshSession.updateMany({
                where: {
                    familyId: existingSession.familyId,
                    revokedAt: null,
                },
                data: {
                    revokedAt: now,
                }
            });
            return { status: "REUSED" };
        }
        //3. Reject expired tokens
        if (existingSession.expiresAt <= now) {
            return { status: "EXPIRED" };
        }
        //4. Atomically claim the old refresh token
        const revoked = await tx.refreshSession.updateMany({
            where: {
                id: existingSession.id,
                revokedAt: null,
                expiresAt: {
                    gt: now
                },
            },
            data: {
                revokedAt: now,
            },
        });
        //another request may have rotated this token
        if (revoked.count !== 1) {
            const latestSession = await tx.refreshSession.findUnique({
                where: {
                    id: existingSession.id,
                },
            });
            if (latestSession?.revokedAt !== null) {
                await tx.refreshSession.updateMany({
                    where: {
                        familyId: existingSession.familyId,
                        revokedAt: null,
                    },
                    data: {
                        revokedAt: now
                    },
                });
                return { status: "REUSED" };
            }
            return { status: "EXPIRED" };
        }
        //create replacement session in the same family
        await tx.refreshSession.create({
            data: {
                userId: existingSession.userId,
                tokenHash: data.newTokenHash,
                familyId: existingSession.familyId,
                expiresAt: data.newExpiresAt
            }
        });
        return {
            status: "ROTATED",
            userId: existingSession.userId,
            familyId: existingSession.familyId,
        };
    });
};
//# sourceMappingURL=session.repository.js.map