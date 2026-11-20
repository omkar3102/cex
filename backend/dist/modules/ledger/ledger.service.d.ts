export declare class LedgerError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare const depositToWallet: (userId: string, assetSymbol: unknown, amount: unknown, idempotencyKey: unknown) => Promise<{
    wallet: {
        id: string;
        assetSymbol: string;
        availableBalance: string;
    };
    ledgerEntry: {
        id: string;
        type: string;
        availableDelta: string;
    };
    alreadyProcessed: boolean;
}>;
export declare const getUserLedgerHistory: (userId: string, limitInput: unknown, cursorInput: unknown) => Promise<{
    transactions: {
        id: string;
        asset: string;
        type: string;
        availableDelta: string;
        lockedDelta: string;
        referenceType: string | null;
        referenceId: string | null;
        createdAt: Date;
    }[];
    nextCursor: string | null | undefined;
}>;
export declare const withdrawFromWallet: (userId: string, assetSymbol: unknown, amount: unknown, idempotencyKey: unknown) => Promise<{
    wallet: {
        id: string;
        assetSymbol: string;
        availableBalance: string;
    };
    ledgerEntry: {
        id: string;
        type: string;
        availableDelta: string;
    };
    alreadyProcessed: boolean;
}>;
//# sourceMappingURL=ledger.service.d.ts.map