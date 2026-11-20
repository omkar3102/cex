import {
    findActiveTradingPairs,
    findActiveTradingPairBySymbol
} from "./trading-pair-repository.js";

export const getActiveTradingPairs = async () => {
    return findActiveTradingPairs()
};

export const getActiveTradingPairBySymbol = async (symbol: string) => {
    const normalizedSymbol = symbol.trim().toUpperCase()

    if(!normalizedSymbol) {
        throw new Error("Trading pair symbol is required");
    }

    return findActiveTradingPairBySymbol(normalizedSymbol)
}