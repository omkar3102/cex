import { prisma } from  '../src/db/prisma.js';

const assets = [
    {
        symbol: "BTC",
        name: "Bitcoin",
        decimals: 8,
    },
    {
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
    },
    {
        symbol: "USDT",
        name: "Tether",
        decimals: 6,
    },
];
//upsert() -> if the data exists it updates it or creates it if it doesn't exist

const tradingPairs = [
    {
        symbol: "BTC/USDT",
        baseAssetSymbol: "BTC",
        quoteAssetSymbol: "USDT",
        priceDecimals: 2,
        quantityDecimals: 8,
    },
    {
        symbol: "ETH/USDT",
        baseAssetSymbol: "ETH",
        quoteAssetSymbol: "USDT",
        priceDecimals: 2,
        quantityDecimals: 8,
    },
    {
        symbol: "BTC/ETH",
        baseAssetSymbol: "BTC",
        quoteAssetSymbol: "ETH",
        priceDecimals: 6,
        quantityDecimals: 8,
    },

]

const seedAssets = async() => {
    for (const asset of assets) {
        await prisma.asset.upsert({
            where: {
                symbol: asset.symbol,
            },
            update: {
                name: asset.name,
                decimals: asset.decimals,
            },
            create: asset,
        })
    }

    console.log('Assets seeded successfully');
};

// seedAssets()
// .catch((error) => {
//     console.error("Asset seeding failed:", error);
//     process.exitCode = 1;
// })
// .finally(async () => {
//     await prisma.$disconnect();
// })

const seedTradingPairs = async () => {
    for (const pair of tradingPairs) {
        const baseAsset = await prisma.asset.findUnique({
            where: {
                symbol: pair.baseAssetSymbol,
            },
        });

        const quoteAsset = await prisma.asset.findUnique({
            where: {
                symbol: pair.quoteAssetSymbol
            },
        });

        if(!baseAsset || !quoteAsset) {
            throw new Error(`Assets not found for pair: ${pair.symbol}`);
        }

        await prisma.tradingPair.upsert({
            where: {
                symbol: pair.symbol,
            },
            update: {
                baseAssetId: baseAsset.id,
                quoteAssetId: quoteAsset.id,
                priceDecimals: pair.priceDecimals,
                quantityDecimal: pair.quantityDecimals
            },
            create: {
                symbol: pair.symbol,
                baseAssetId: baseAsset.id,
                quoteAssetId: quoteAsset.id,
                priceDecimals :pair.priceDecimals,
                quantityDecimal: pair.quantityDecimals
            }
        })
    };

    console.log("Trading pairs seeded successfully");
}

const main = async () => {
    await seedAssets();
    await seedTradingPairs();
};

main()
     .catch((error) => {
        console.error("Seeding failed: ", error);
        process.exitCode = 1;
     })
     .finally(async () => {
        await prisma.$disconnect();
     });