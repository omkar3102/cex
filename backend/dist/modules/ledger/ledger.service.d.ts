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
//# sourceMappingURL=ledger.service.d.ts.map