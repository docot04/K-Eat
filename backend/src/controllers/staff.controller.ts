import { query } from "../config";
import type {
  AssignStaffBody,
  ListStaffQuery,
  UpdateStaffBody,
} from "../schemas";
import {
  AppError,
  asyncHandler,
  requireCafeteriaAccess,
  authUser,
  getBody,
  getParams,
  getQuery,
  hasPgCode,
  notFound,
  sendPage,
  sendSuccess,
  Where,
  pagedQuery,
} from "../utils";

const STAFF_COLS = `cs.id AS staff_id, cs.user_id, u.name, u.email, u.phone, cs.cafeteria_id, cs.role, cs.created_at, cs.updated_at`;
const STAFF_FROM = "cafe_staff cs JOIN users u ON u.id = cs.user_id";

const fetchAssignment = async (staffId: number) => {
  const { rows } = await query(
    `SELECT ${STAFF_COLS} FROM ${STAFF_FROM} WHERE cs.id = $1`,
    [staffId],
  );
  return rows[0];
};

const cafeteriaHasManager = async (cafeteriaId: number): Promise<boolean> => {
  const r = await query(
    "SELECT 1 FROM cafe_staff WHERE cafeteria_id = $1 AND role = 'manager'",
    [cafeteriaId],
  );
  return (r.rowCount ?? 0) > 0;
};

export const listStaff = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  await requireCafeteriaAccess(authUser(req), id, "staff");
  const q = getQuery<ListStaffQuery>(req);
  const w = new Where().add("cs.cafeteria_id = ?", id);
  if (q.role) w.add("cs.role = ?", q.role);
  const { rows, total } = await pagedQuery({
    select: STAFF_COLS,
    from: STAFF_FROM,
    countFrom: "cafe_staff cs",
    where: w,
    orderBy: "cs.role DESC, u.name, cs.id",
    page: q,
  });
  sendPage(res, rows, q, total, "Staff retrieved");
});

export const assignStaff = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const b = getBody<AssignStaffBody>(req);
  const access = await requireCafeteriaAccess(authUser(req), id, "manager");
  if (b.role === "manager" && access !== "admin")
    throw new AppError(403, "Only an admin can assign a manager");
  const target =
    b.userId !== undefined
      ? await query<{ id: number; role: string; is_active: boolean }>(
          "SELECT id, role, is_active FROM users WHERE id = $1",
          [b.userId],
        )
      : await query<{ id: number; role: string; is_active: boolean }>(
          "SELECT id, role, is_active FROM users WHERE LOWER(email) = $1",
          [b.email],
        );
  const user = target.rows[0];
  if (!user) throw notFound("User");
  if (!user.is_active) throw new AppError(409, "User account is deactivated");
  if (user.role !== "cafe_staff") {
    throw new AppError(
      400,
      "User must have the cafe_staff role (an admin can change a user role)",
    );
  }
  if (b.role === "manager" && (await cafeteriaHasManager(id))) {
    throw new AppError(
      409,
      "This cafeteria already has a manager; demote or remove them first",
    );
  }
  try {
    const { rows } = await query<{ id: number }>(
      "INSERT INTO cafe_staff (user_id, cafeteria_id, role) VALUES ($1, $2, $3) RETURNING id",
      [user.id, id, b.role],
    );
    const assignment = rows[0];
    if (!assignment) throw new AppError(500, "Failed to create assignment");
    sendSuccess(
      res,
      await fetchAssignment(assignment.id),
      "Staff assigned",
      201,
    );
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "User is already assigned to this cafeteria");
    throw err;
  }
});

export const updateStaff = asyncHandler(async (req, res) => {
  const { id, staffId } = getParams<{ id: number; staffId: number }>(req);
  const b = getBody<UpdateStaffBody>(req);
  const access = await requireCafeteriaAccess(authUser(req), id, "manager");
  const current = await query<{ role: string }>(
    "SELECT role FROM cafe_staff WHERE id = $1 AND cafeteria_id = $2",
    [staffId, id],
  );
  if (!current.rows[0]) throw notFound("Staff assignment");
  if (
    (current.rows[0].role === "manager" || b.role === "manager") &&
    access !== "admin"
  ) {
    throw new AppError(403, "Only an admin can assign or change a manager");
  }
  if (current.rows[0].role === b.role) {
    sendSuccess(res, await fetchAssignment(staffId), "Role unchanged");
    return;
  }
  if (b.role === "manager" && (await cafeteriaHasManager(id))) {
    throw new AppError(
      409,
      "This cafeteria already has a manager; demote or remove them first",
    );
  }
  await query("UPDATE cafe_staff SET role = $1 WHERE id = $2", [
    b.role,
    staffId,
  ]);
  sendSuccess(res, await fetchAssignment(staffId), "Staff role updated");
});

export const removeStaff = asyncHandler(async (req, res) => {
  const { id, staffId } = getParams<{ id: number; staffId: number }>(req);
  const access = await requireCafeteriaAccess(authUser(req), id, "manager");
  const current = await query<{ role: string }>(
    "SELECT role FROM cafe_staff WHERE id = $1 AND cafeteria_id = $2",
    [staffId, id],
  );
  if (!current.rows[0]) throw notFound("Staff assignment");
  if (current.rows[0].role === "manager" && access !== "admin") {
    throw new AppError(403, "Only an admin can remove a manager");
  }
  await query("DELETE FROM cafe_staff WHERE id = $1", [staffId]);
  sendSuccess(res, { staffId, removed: true }, "Staff assignment removed");
});
