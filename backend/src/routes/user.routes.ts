import { Router } from "express";
import { changePassword, getMe, updateMe } from "../controllers";
import { validate } from "../middlewares";
import { changePasswordSchema, updateProfileSchema } from "../schemas";

const router = Router();

router.get("/me", getMe);
router.patch("/me", validate({ body: updateProfileSchema }), updateMe);
router.patch(
  "/me/password",
  validate({ body: changePasswordSchema }),
  changePassword,
);

export default router;
