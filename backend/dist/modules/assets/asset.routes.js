import { Router } from "express";
import { getAssets } from "./asset.controller.js";
const router = Router();
router.get("/", getAssets);
export default router;
//# sourceMappingURL=asset.routes.js.map