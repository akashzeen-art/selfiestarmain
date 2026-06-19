import { Router } from "express";
import { demoLoginController, loginController, meController, registerController } from "../controllers/auth-controller";
import { requireAuth } from "../middleware/auth";
import { validateLogin, validateRegister } from "../middleware/validation";

/**
 * Authentication Routes
 * Handles user registration, login, and authentication
 */
const router = Router();

// Public routes with validation
router.post("/register", validateRegister, registerController);
router.post("/login", validateLogin, loginController);
router.post("/demo-login", demoLoginController);

// Protected routes (require authentication)
router.get("/me", requireAuth, meController);

export default router;
