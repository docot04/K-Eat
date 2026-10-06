import { compare, hash } from "bcrypt";
import { query } from "../config";
import type { ChangePasswordBody, UpdateProfileBody } from "../schemas";
import { USER_COLS } from "../consts";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  notFound,
  sendSuccess,
  buildUpdate,
} from "../utils";

export const loadProfile = async (
  userId: number,
): Promise<Record<string, unknown>> => {
  const { rows } = await query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [
    userId,
  ]);
  const user = rows[0];
  if (!user) throw notFound("User");
  if (user.role !== "cafe_staff") return user;
  const assignments = await query(
    `SELECT cs.id AS assignment_id, cs.cafeteria_id, c.name AS cafeteria_name, cs.role
     FROM cafe_staff cs JOIN cafeterias c ON c.id = cs.cafeteria_id
     WHERE cs.user_id = $1 ORDER BY c.name`,
    [userId],
  );
  return { ...user, cafeterias: assignments.rows };
};

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, await loadProfile(authUser(req).id), "Profile retrieved");
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const { sets, values } = buildUpdate(getBody<UpdateProfileBody>(req), {
    name: "name",
    phone: "phone",
  });
  values.push(user.id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${USER_COLS}`,
    values,
  );
  sendSuccess(res, rows[0], "Profile updated");
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const { currentPassword, newPassword } = getBody<ChangePasswordBody>(req);
  const { rows } = await query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [user.id],
  );
  if (!rows[0]) throw notFound("User");
  if (!(await compare(currentPassword, rows[0].password_hash))) {
    throw new AppError(400, "Current password is incorrect");
  }
  if (currentPassword === newPassword)
    throw new AppError(
      400,
      "New password must differ from the current password",
    );
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await hash(newPassword, 10),
    user.id,
  ]);
  sendSuccess(res, null, "Password changed");
});
