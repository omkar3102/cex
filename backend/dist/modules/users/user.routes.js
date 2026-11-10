import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
const router = Router();
router.get("/me", authenticate, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        userId: req.userId,
    });
});
export default router;
//# sourceMappingURL=user.routes.js.map