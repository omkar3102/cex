//no negative balances
//balance is updated simultaneously with the ledger entry
//use decimal
import { prisma } from "../../db/prisma.js";
export const creditWallet = async (userId, assetSymbol, amount, idempotencyKey) => {
    try {
        return await prisma.$transaction(async (tx) => {
            //1. Check whether this operation was already processed
            const existingEntry = await tx.ledgerEntry.findUnique({
                where: {
                    idempotencyKey
                }
            });
            if (existingEntry) {
                //prevent reuse of the same key for a different operation
                const wallet = await tx.wallet.findUnique({
                    where: {
                        id: existingEntry.walletId,
                    },
                    include: {
                        asset: true,
                    },
                });
                if (existingEntry.availableDelta.toString() !== amount ||
                    wallet?.userId !== userId ||
                    wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true
                };
            }
            //2. Find the user's wallet for one requested asset
            const wallet = await tx.wallet.findFirst({
                where: {
                    userId,
                    asset: {
                        symbol: assetSymbol,
                        isActive: true,
                    },
                },
            });
            if (!wallet) {
                throw new Error("WALLET_NOT_FOUND");
            }
            //3. Increment the available balance
            const updatedWallet = await tx.wallet.update({
                where: {
                    id: wallet.id,
                },
                data: {
                    availableBalance: {
                        increment: amount
                    }
                }
            });
            //4.Record the financial amount
            const ledgerEntry = await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "DEPOSIT",
                    availableDelta: amount,
                    lockedDelta: "0",
                    referenceType: "DEPOSIT",
                    referenceId: idempotencyKey,
                    idempotencyKey
                }
            });
            //Return the result
            return {
                wallet: updatedWallet,
                ledgerEntry,
                alreadyProcessed: false,
            };
        });
    }
    catch (error) {
        //Handle concurrent requests using the same idempotency key
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002") {
            const existingEntry = await prisma.ledgerEntry.findUnique({
                where: {
                    idempotencyKey
                }
            });
            if (existingEntry) {
                const wallet = await prisma.wallet.findUnique({
                    where: {
                        id: existingEntry.walletId
                    },
                    include: {
                        asset: true,
                    },
                });
                if (existingEntry.availableDelta.toString() !== amount || wallet?.userId !== userId || wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true,
                };
            }
        }
        throw error;
    }
};
export const lockFunds = async (userId, assetSymbol, amount, idempotencyKey) => {
    try {
        return await prisma.$transaction(async (tx) => {
            const existingEntry = await tx.ledgerEntry.findUnique({
                where: {
                    idempotencyKey
                }
            });
            if (existingEntry) {
                const wallet = await tx.wallet.findUnique({
                    where: {
                        id: existingEntry.walletId
                    },
                    include: {
                        asset: true
                    },
                });
                //Ensure the key belongs to exact operation
                if (existingEntry.type !== "LOCK" ||
                    existingEntry.availableDelta.toString() !== `-${amount}` ||
                    existingEntry.lockedDelta.toString() !== amount ||
                    wallet?.userId !== userId ||
                    wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true,
                };
            }
            //1. find user's wallet
            const wallet = await tx.wallet.findFirst({
                where: {
                    userId,
                    asset: {
                        is: {
                            symbol: assetSymbol,
                            isActive: true
                        }
                    },
                },
            });
            if (!wallet) {
                throw new Error("WALLET_NOT_FOUND");
            }
            //2. Conditionally move available funds to locked
            const result = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    availableBalance: {
                        gte: amount
                    },
                },
                data: {
                    availableBalance: {
                        decrement: amount,
                    },
                    lockedBalance: {
                        increment: amount
                    }
                }
            });
            //3. Check whether the update succeeded
            if (result.count === 0) {
                throw new Error("INSUFFICIENT_AVAILABLE_BALANCE");
            }
            const ledgerEntry = await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "LOCK",
                    availableDelta: `-${amount}`,
                    lockedDelta: amount,
                    referenceType: "ORDER"
                },
            });
            //4. Fetch the updated wallet
            const updatedWallet = await tx.wallet.findUnique({
                where: {
                    id: wallet.id,
                },
            });
            return updatedWallet;
        });
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002") {
            const existingEntry = await prisma.ledgerEntry.findUnique({
                where: {
                    idempotencyKey
                }
            });
            if (existingEntry) {
                const wallet = await prisma.wallet.findUnique({
                    where: { id: existingEntry.walletId },
                    include: { asset: true }
                });
                if (existingEntry.type !== "LOCK" ||
                    existingEntry.availableDelta.toString() !== `-${amount}` ||
                    existingEntry.lockedDelta.toString() !== amount ||
                    wallet?.userId !== userId || wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true,
                };
            }
        }
        throw error;
    }
};
export const unlockFunds = async (userId, assetSymbol, amount, idempotencyKey) => {
    try {
        return await prisma.$transaction(async (tx) => {
            const existingEntry = await tx.ledgerEntry.findUnique({
                where: {
                    idempotencyKey
                }
            });
            if (existingEntry) {
                const wallet = await tx.wallet.findUnique({
                    where: { id: existingEntry.walletId },
                    include: { asset: true }
                });
                if (existingEntry.type !== "UNLOCK" ||
                    existingEntry.availableDelta.toString() !== amount ||
                    existingEntry.lockedDelta.toString() !== `-${amount}` ||
                    wallet?.userId !== userId || wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true,
                };
            }
            //1 Find the user's wallet
            const wallet = await tx.wallet.findFirst({
                where: {
                    userId,
                    asset: {
                        is: {
                            symbol: assetSymbol,
                            isActive: true
                        },
                    },
                },
            });
            if (!wallet) {
                throw new Error("WALLET_NOT_FOUND");
            }
            //2. Conditionally move locked funds to available
            const result = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    lockedBalance: {
                        gte: amount
                    },
                },
                data: {
                    availableBalance: {
                        increment: amount
                    },
                    lockedBalance: {
                        decrement: amount
                    }
                }
            });
            //3. Ensure sufficient locked balance
            if (result.count === 0) {
                throw new Error("INSUFFICIENT_LOCKED_BALANCE");
            }
            const ledgerEntry = await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "UNLOCK",
                    availableDelta: amount,
                    lockedDelta: `-${amount}`,
                    referenceType: "ORDER",
                    idempotencyKey
                }
            });
            //5. Fetch the updated wallet
            const updatedWallet = await tx.wallet.findUnique({
                where: {
                    id: wallet.id,
                },
            });
            return {
                wallet: updatedWallet,
                ledgerEntry,
                alreadyProcessed: false
            };
        });
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002") {
            const existingEntry = await prisma.ledgerEntry.findUnique({
                where: { idempotencyKey },
            });
            if (existingEntry) {
                const wallet = await prisma.wallet.findUnique({
                    where: { id: existingEntry.walletId },
                    include: { asset: true },
                });
                if (existingEntry.type !== "UNLOCK" ||
                    existingEntry.availableDelta.toString() !== amount ||
                    existingEntry.lockedDelta.toString() !== `-${amount}` ||
                    wallet?.userId !== userId ||
                    wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true,
                };
            }
        }
        throw error;
    }
};
export const getLedgerHistory = async (userId, limit, cursor) => {
    return prisma.ledgerEntry.findMany({
        where: {
            wallet: {
                userId,
            },
        },
        take: limit + 1,
        ...(cursor && {
            skip: 1,
            cursor: {
                id: cursor
            },
        }),
        orderBy: {
            createdAt: "desc",
        },
        include: {
            wallet: {
                include: {
                    asset: true,
                },
            },
        },
    });
};
export const debitWallet = async (userId, assetSymbol, amount, idempotencyKey) => {
    try {
        return await prisma.$transaction(async (tx) => {
            //1. Check existing idempotency key
            const existingEntry = await tx.ledgerEntry.findUnique({
                where: { idempotencyKey }
            });
            if (existingEntry) {
                const wallet = await tx.wallet.findUnique({
                    where: { id: existingEntry.walletId },
                    include: { asset: true }
                });
                if (existingEntry.type !== "WITHDRAWAL" ||
                    existingEntry.availableDelta.toString() !== `-${amount}` ||
                    existingEntry.lockedDelta.toString() !== "0" ||
                    wallet?.userId !== userId ||
                    wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true
                };
            }
            console.log("Withdrawal userId:", userId);
            console.log("Withdrawal assetSymbol:", assetSymbol);
            //2. Find user's active asset wallet
            const wallet = await tx.wallet.findFirst({
                where: {
                    userId,
                    asset: {
                        is: {
                            symbol: assetSymbol,
                            isActive: true
                        }
                    }
                }
            });
            if (!wallet) {
                throw new Error("WALLET_NOT_FOUND");
            }
            //3. Conditionally deduct available funds
            const result = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    availableBalance: {
                        gte: amount
                    }
                },
                data: {
                    availableBalance: {
                        decrement: amount
                    }
                }
            });
            if (result.count === 0) {
                throw new Error("INSUFFICIENT_AVAILABLE_BALANCE");
            }
            //4. Create withdrawal ledger entry
            const ledgerEntry = await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "WITHDRAWAL",
                    availableDelta: `-${amount}`,
                    lockedDelta: "0",
                    referenceType: "WITHDRAWAL",
                    referenceId: idempotencyKey,
                    idempotencyKey
                }
            });
            //5. Fetch updated wallet
            const updatedWallet = await tx.wallet.findUnique({
                where: { id: wallet.id }
            });
            return {
                wallet: updatedWallet,
                ledgerEntry,
                alreadyProcessed: false
            };
        });
    }
    catch (error) {
        // Handle concurrent duplicate requests
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002") {
            const existingEntry = await prisma.ledgerEntry.findUnique({
                where: { idempotencyKey }
            });
            if (existingEntry) {
                const wallet = await prisma.wallet.findUnique({
                    where: { id: existingEntry.walletId },
                    include: { asset: true }
                });
                if (existingEntry.type !== "WITHDRAWAL" ||
                    existingEntry.availableDelta.toString() !== `-${amount}` ||
                    existingEntry.lockedDelta.toString() !== "0" ||
                    wallet?.userId !== userId ||
                    wallet?.asset.symbol !== assetSymbol) {
                    throw new Error("IDEMPOTENCY_KEY_REUSED");
                }
                return {
                    wallet,
                    ledgerEntry: existingEntry,
                    alreadyProcessed: true
                };
            }
        }
        throw error;
    }
};
//# sourceMappingURL=ledger.repository.js.map