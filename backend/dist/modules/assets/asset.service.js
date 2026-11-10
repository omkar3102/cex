import { findActiveAssets } from "./asset.repository.js";
export const getActiveAssets = async () => {
    const assets = await findActiveAssets();
    return assets;
};
//# sourceMappingURL=asset.service.js.map