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

seedAssets()
.catch((error) => {
    console.error("Asset seeding failed:", error);
    process.exitCode = 1;
})
.finally(async () => {
    await prisma.$disconnect();
})