import { getActiveAssets } from "./asset.service.js";
export const getAssets = async (_req, res) => {
    try {
        const assets = await getActiveAssets();
        return res.status(200).json({
            success: true,
            data: assets,
        });
    }
    catch (error) {
        console.error("Failed to fetch assets: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error"
        });
    }
};
//# sourceMappingURL=asset.controller.js.map