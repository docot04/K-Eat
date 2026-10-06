import { Router } from "express";
import { login, me, signup } from "../controllers";
import { authenticate, rateLimit, validate } from "../middlewares";
import { loginSchema, signupSchema } from "../schemas";

const router = Router();
const authLimiter = rateLimit(30, 15 * 60 * 1000);

router.post("/signup", authLimiter, validate({ body: signupSchema }), signup);
router.post("/login", authLimiter, validate({ body: loginSchema }), login);
router.get("/me", authenticate, me);

export default router;
