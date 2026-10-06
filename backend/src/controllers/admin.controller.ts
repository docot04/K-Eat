import { query, withTransaction } from "../config";
import type {
  AdminListUsersQuery,
  UpdateUserRoleBody,
  UpdateUserStatusBody,
} from "../schemas";
import { USER_COLS } from "../consts";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  getParams,
  getQuery,
  notFound,
  sendPage,
  sendSuccess,
  Where,
  like,
  pagedQuery,
} from "../utils";
import { loadProfile } from "./user.controller";

export const listUsers = asyncHandler(async (req, res) => {
  const q = getQuery<AdminListUsersQuery>(req);
  const w = new Where();
  if (q.search)
    w.add("(name ILIKE ? OR email ILIKE ?)", like(q.search), like(q.search));
  if (q.role) w.add("role = ?", q.role);
  if (q.isActive !== undefined) w.add("is_active = ?", q.isActive);
  const { rows, total } = await pagedQuery({
    select: USER_COLS,
    from: "users",
    where: w,
    orderBy: "created_at DESC, id DESC",
    page: q,
  });
  sendPage(res, rows, q, total, "Users retrieved");
});

export const getUser = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  sendSuccess(res, await loadProfile(id), "User retrieved");
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { role } = getBody<UpdateUserRoleBody>(req);
  if (id === authUser(req).id)
    throw new AppError(400, "You cannot change your own role");
  const user = await withTransaction(async (client) => {
    const found = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!found.rows[0]) throw notFound("User");
    if (role !== "cafe_staff")
      await client.query("DELETE FROM cafe_staff WHERE user_id = $1", [id]);
    const upd = await client.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${USER_COLS}`,
      [role, id],
    );
    return upd.rows[0];
  });
  sendSuccess(
    res,
    user,
    "User role updated (cafeteria assignments are removed when leaving the cafe_staff role)",
  );
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { isActive } = getBody<UpdateUserStatusBody>(req);
  if (id === authUser(req).id && !isActive)
    throw new AppError(400, "You cannot deactivate your own account");
  const { rows } = await query(
    `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING ${USER_COLS}`,
    [isActive, id],
  );
  if (!rows[0]) throw notFound("User");
  sendSuccess(res, rows[0], isActive ? "User activated" : "User deactivated");
});
