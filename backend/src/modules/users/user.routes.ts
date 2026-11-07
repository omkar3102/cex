import { Router } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get("/me", authenticate, (req: AuthenticatedRequest, res) => {
    return res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        userId: req.userId,
    });
});

export default router;