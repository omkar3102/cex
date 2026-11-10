export declare const creditWallet: (userId: string, assetSymbol: string, amount: string, idempotencyKey: string) => Promise<{
    wallet: {
        id: string;
        userId: string;
        assetId: string;
        availableBalance: import("@prisma/client-runtime-utils").Decimal;
        lockedBalance: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
    };
    ledgerEntry: {
        id: string;
        walletId: string;
        type: string;
        availableDelta: import("@prisma/client-runtime-utils").Decimal;
        lockedDelta: import("@prisma/client-runtime-utils").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        idempotencyKey: string | null;
        createdAt: Date;
    };
    alreadyProcessed: boolean;
}>;
export declare const lockFunds: (userId: string, assetSymbol: string, amount: string, idempotencyKey: string) => Promise<{
    id: string;
    userId: string;
    assetId: string;
    availableBalance: import("@prisma/client-runtime-utils").Decimal;
    lockedBalance: import("@prisma/client-runtime-utils").Decimal;
    createdAt: Date;
    updatedAt: Date;
} | {
    wallet: {
        asset: {
            id: string;
            symbol: string;
            name: string;
            decimals: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        userId: string;
        assetId: string;
        availableBalance: import("@prisma/client-runtime-utils").Decimal;
        lockedBalance: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
    };
    ledgerEntry: {
        id: string;
        walletId: string;
        type: string;
        availableDelta: import("@prisma/client-runtime-utils").Decimal;
        lockedDelta: import("@prisma/client-runtime-utils").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        idempotencyKey: string | null;
        createdAt: Date;
    };
    alreadyProcessed: boolean;
} | null>;
export declare const unlockFunds: (userId: string, assetSymbol: string, amount: string, idempotencyKey: string) => Promise<{
    wallet: {
        id: string;
        userId: string;
        assetId: string;
        availableBalance: import("@prisma/client-runtime-utils").Decimal;
        lockedBalance: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    ledgerEntry: {
        id: string;
        walletId: string;
        type: string;
        availableDelta: import("@prisma/client-runtime-utils").Decimal;
        lockedDelta: import("@prisma/client-runtime-utils").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        idempotencyKey: string | null;
        createdAt: Date;
    };
    alreadyProcessed: boolean;
}>;
//# sourceMappingURL=ledger.repository.d.ts.map