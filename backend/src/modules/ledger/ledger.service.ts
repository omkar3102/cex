//BTC supports till 8 decimal places acc to our asset model
//all financial validations will happen here
import { findActiveAssetBySymbol } from "../assets/asset.repository.js";


import {
    creditWallet
} from "./ledger.repository.js";

//ledger specific application error
export class LedgerError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "LedgerError"
    }
}


//Normalize and validate a financial amount
const normalizeAmount = (
    amount: unknown,
    maxDecimals: number
): string => {
    
    if(typeof amount !== 'string') {
        throw new LedgerError(
            "Amount must be provided as a decimal string", 400
        );
    }

    const trimmedAmount = amount.trim();

    //Accept only ordinary positive decimal notation
    if(!/^\d+(\.\d+)?$/.test(trimmedAmount)) {
        throw new LedgerError(
            "Invalid deposit amount", 400
        )
    }

    const [integerPart = "", fractionalPart = ""] = 
       trimmedAmount.split(".");

    //Remove unnecessary leading and trailing zeroes
    const integer = integerPart.replace(/^0+(?=\d)/, "");
    const fraction = fractionalPart.replace(/0+$/, "");


    //reject zero
    if(integer === "0" && fraction.length === 0) {
        throw new LedgerError(
            "Deposit Amount must be greater than zero", 400
        );
    }

    //PostgreSQL Decimal(36,18) supports at least
    //18 integer digits and 18 fractional digits.
    if(integer.length > 18 || fraction.length > 18) {
        throw new LedgerError(
            "Deposit amount exceeds supported precision", 400
        )
    }

    //validate against the asset's own precision
    if(fraction.length > maxDecimals) {
        throw new LedgerError(
            `Maximum decimal places allowed: ${maxDecimals}`, 400
        );
    }

    return fraction.length > 0
        ? `${integer}.${fraction}`
        : integer;
};

    //process a simulated deposit
    export const depositToWallet = async (
        userId: string,
        assetSymbol: unknown,
        amount: unknown,
        idempotencyKey: unknown
    ) => {
        //1. Validate authenticated user
        if (!userId) {
            throw new LedgerError(
                "Authentication required", 401
            );
        }
        //2. Normalize asset symbol
        if (
            typeof assetSymbol !== "string" ||
            !assetSymbol.trim()
        ) {
            throw new LedgerError(
                "Asset symbol is required", 400
            );
        }

        const normalizedSymbol = assetSymbol.trim().toUpperCase();

        //3. Validate idempotency key
        if(
            typeof idempotencyKey !== "string" || !/^[\x21-\x7E]{1,128}$/.test(idempotencyKey.trim())
        ) {
            throw new LedgerError(
                "A valid Idempotency-Key header is required",
                400
            );

        }
        
        const normalizedKey = idempotencyKey.trim();

        //4. Find active asset
        const asset = await findActiveAssetBySymbol(
            normalizedSymbol
        );

        if(!asset) {
            throw new LedgerError(
                "Asset not found or inactive", 404
            );
        }

        //5. Validate amount against asset precision
        const normalizedAmount = normalizeAmount(
            amount,
            asset.decimals
        );

        //6.Execute financial operation
        try {
            const result =  await creditWallet(
                userId,
                normalizedSymbol,
                normalizedAmount,
                normalizedKey
            );

            if(!result.wallet) {
                throw new LedgerError(
                    "Wallet not found", 404
                )
            }

            //7. Return as safe API rep
            return {
                wallet: {
                    id: result.wallet.id,
                    assetSymbol: normalizedSymbol,
                    availableBalance:
                    result.wallet.availableBalance.toString(),
                },

                ledgerEntry: {
                    id: result.ledgerEntry.id,
                    type: result.ledgerEntry.type,
                    availableDelta:
                    result.ledgerEntry.availableDelta.toString()
                },

                alreadyProcessed: result.alreadyProcessed,
            }
        } catch (error){
            if (
            error instanceof Error &&
            error.message === "WALLET_NOT_FOUND"
        ) {
            throw new LedgerError("Wallet not found", 404);
        }

        if (
            error instanceof Error &&
            error.message === "IDEMPOTENCY_KEY_REUSED"
        ) {
            throw new LedgerError(
                "Idempotency key has already been used for a different operation",
                409
            );
        }

        throw error;
        }

    }
