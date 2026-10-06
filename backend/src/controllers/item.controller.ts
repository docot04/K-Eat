import { query } from "../config";
import type {
  CreateItemBody,
  ListItemsQuery,
  UpdateItemBody,
} from "../schemas";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  getParams,
  getQuery,
  hasPgCode,
  notFound,
  sendPage,
  sendSuccess,
  Where,
  buildUpdate,
  like,
  pagedQuery,
} from "../utils";

const COLS = `i.id, i.name, i.description, i.category_id, c.name AS category_name, i.price, i.image, i.is_active`;
const FROM = "items i JOIN categories c ON c.id = i.category_id";

const assertCategory = async (categoryId: number): Promise<void> => {
  const r = await query("SELECT 1 FROM categories WHERE id = $1", [categoryId]);
  if (!r.rowCount) throw new AppError(400, "Category does not exist");
};

export const listItems = asyncHandler(async (req, res) => {
  const q = getQuery<ListItemsQuery>(req);
  const w = new Where();
  if (!(q.includeInactive && authUser(req).role === "admin"))
    w.addRaw("i.is_active = TRUE");
  if (q.search)
    w.add(
      "(i.name ILIKE ? OR i.description ILIKE ?)",
      like(q.search),
      like(q.search),
    );
  if (q.categoryId) w.add("i.category_id = ?", q.categoryId);
  const { rows, total } = await pagedQuery({
    select: COLS,
    from: FROM,
    countFrom: "items i",
    where: w,
    orderBy: "i.name, i.id",
    page: q,
  });
  sendPage(res, rows, q, total, "Items retrieved");
});

export const getItem = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { rows } = await query(`SELECT ${COLS} FROM ${FROM} WHERE i.id = $1`, [
    id,
  ]);
  if (!rows[0] || (!rows[0].is_active && authUser(req).role !== "admin"))
    throw notFound("Item");
  sendSuccess(res, rows[0], "Item retrieved");
});

export const createItem = asyncHandler(async (req, res) => {
  const b = getBody<CreateItemBody>(req);
  await assertCategory(b.categoryId);
  try {
    const { rows } = await query<{ id: number }>(
      "INSERT INTO items (name, description, category_id, price, image) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [b.name, b.description ?? null, b.categoryId, b.price, b.image ?? null],
    );
    const created = rows[0];
    if (!created) throw new AppError(500, "Failed to create item");
    const item = await query(`SELECT ${COLS} FROM ${FROM} WHERE i.id = $1`, [
      created.id,
    ]);
    const createdItem = item.rows[0];
    if (!createdItem) throw new AppError(500, "Failed to fetch created item");
    sendSuccess(res, createdItem, "Item created", 201);
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "An item with this name already exists");
    throw err;
  }
});

export const updateItem = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const b = getBody<UpdateItemBody>(req);
  if (b.categoryId !== undefined) await assertCategory(b.categoryId);
  const { sets, values } = buildUpdate(b, {
    name: "name",
    description: "description",
    categoryId: "category_id",
    price: "price",
    image: "image",
    isActive: "is_active",
  });
  values.push(id);
  try {
    const upd = await query(
      `UPDATE items SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    );
    if (!upd.rows[0]) throw notFound("Item");
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "An item with this name already exists");
    throw err;
  }
  const { rows } = await query(`SELECT ${COLS} FROM ${FROM} WHERE i.id = $1`, [
    id,
  ]);
  sendSuccess(res, rows[0], "Item updated");
});

export const deleteItem = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const exists = await query("SELECT 1 FROM items WHERE id = $1", [id]);
  if (!exists.rowCount) throw notFound("Item");
  const ordered = await query(
    "SELECT 1 FROM order_items WHERE item_id = $1 LIMIT 1",
    [id],
  );
  if (ordered.rowCount) {
    await query("UPDATE items SET is_active = FALSE WHERE id = $1", [id]);
    sendSuccess(
      res,
      { id, deactivated: true },
      "Item appears in past orders and was deactivated instead of deleted",
    );
    return;
  }
  await query("DELETE FROM items WHERE id = $1", [id]);
  sendSuccess(res, { id, deleted: true }, "Item deleted");
});
