import { query } from "../config";
import type {
  CafeteriaStatusBody,
  CreateCafeteriaBody,
  ListCafeteriasQuery,
  UpdateCafeteriaBody,
} from "../schemas";
import {
  requireCafeteriaAccess,
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
  buildUpdate,
  like,
  pagedQuery,
} from "../utils";

const CAFE_COLS = `c.id, c.name, c.image, c.location, c.is_open, c.is_active, c.manager_id,
  m.name AS manager_name, c.payment_instructions, c.created_at`;
const CAFE_FROM = "cafeterias c LEFT JOIN users m ON m.id = c.manager_id";

export const listCafeterias = asyncHandler(async (req, res) => {
  const q = getQuery<ListCafeteriasQuery>(req);
  const w = new Where();
  if (authUser(req).role !== "admin") w.addRaw("c.is_active = TRUE");
  if (q.search) w.add("c.name ILIKE ?", like(q.search));
  if (q.location) w.add("c.location ILIKE ?", like(q.location));
  if (q.isOpen !== undefined) w.add("c.is_open = ?", q.isOpen);
  const { rows, total } = await pagedQuery({
    select: CAFE_COLS,
    from: CAFE_FROM,
    countFrom: "cafeterias c",
    where: w,
    orderBy: "c.name, c.id",
    page: q,
  });
  sendPage(res, rows, q, total, "Cafeterias retrieved");
});

export const getCafeteria = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { rows } = await query(
    `SELECT ${CAFE_COLS} FROM ${CAFE_FROM} WHERE c.id = $1`,
    [id],
  );
  if (!rows[0] || (!rows[0].is_active && authUser(req).role !== "admin"))
    throw notFound("Cafeteria");
  sendSuccess(res, rows[0], "Cafeteria retrieved");
});

export const createCafeteria = asyncHandler(async (req, res) => {
  const b = getBody<CreateCafeteriaBody>(req);
  const { rows } = await query(
    `INSERT INTO cafeterias (name, location, image, is_open, payment_instructions)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      b.name,
      b.location,
      b.image ?? null,
      b.isOpen,
      b.paymentInstructions ?? null,
    ],
  );
  const cafeteria = rows[0];
  if (!cafeteria) throw new AppError(500, "Failed to create cafeteria");
  const created = await query(
    `SELECT ${CAFE_COLS} FROM ${CAFE_FROM} WHERE c.id = $1`,
    [cafeteria.id],
  );
  sendSuccess(res, created.rows[0], "Cafeteria created", 201);
});

export const updateCafeteria = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  await requireCafeteriaAccess(authUser(req), id, "manager");
  const { sets, values } = buildUpdate(getBody<UpdateCafeteriaBody>(req), {
    name: "name",
    location: "location",
    image: "image",
    paymentInstructions: "payment_instructions",
  });
  values.push(id);
  await query(
    `UPDATE cafeterias SET ${sets.join(", ")} WHERE id = $${values.length}`,
    values,
  );
  const { rows } = await query(
    `SELECT ${CAFE_COLS} FROM ${CAFE_FROM} WHERE c.id = $1`,
    [id],
  );
  sendSuccess(res, rows[0], "Cafeteria updated");
});

export const setCafeteriaStatus = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { isOpen } = getBody<CafeteriaStatusBody>(req);
  const cafe = await requireCafeteriaAccess(authUser(req), id, "manager").then(
    () =>
      query<{ is_active: boolean }>(
        "SELECT is_active FROM cafeterias WHERE id = $1",
        [id],
      ),
  );
  const cafeteria = cafe.rows[0];
  if (!cafeteria) throw new AppError(404, "Cafeteria not found");

  if (isOpen && !cafeteria.is_active)
    throw new AppError(409, "A deactivated cafeteria cannot be opened");
  const { rows } = await query(
    "UPDATE cafeterias SET is_open = $1 WHERE id = $2 RETURNING id, name, is_open",
    [isOpen, id],
  );
  sendSuccess(res, rows[0], isOpen ? "Cafeteria opened" : "Cafeteria closed");
});

export const deleteCafeteria = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const exists = await query("SELECT 1 FROM cafeterias WHERE id = $1", [id]);
  if (!exists.rowCount) throw notFound("Cafeteria");
  const hasOrders = await query(
    "SELECT 1 FROM orders WHERE cafeteria_id = $1 LIMIT 1",
    [id],
  );
  if (hasOrders.rowCount) {
    await query(
      "UPDATE cafeterias SET is_active = FALSE, is_open = FALSE WHERE id = $1",
      [id],
    );
    sendSuccess(
      res,
      { id, deactivated: true },
      "Cafeteria has order history and was deactivated instead of deleted",
    );
    return;
  }
  await query("DELETE FROM cafeterias WHERE id = $1", [id]);
  sendSuccess(res, { id, deleted: true }, "Cafeteria deleted");
});
