import { query } from "../config";
import type {
  AddMenuItemBody,
  AvailabilityBody,
  InventoryQuery,
  MenuQuery,
  UpdateMenuItemBody,
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
  sendSuccess,
  assertCafeteriaExists,
  getCafeteriaRole,
  requireCafeteriaAccess,
  Where,
  buildUpdate,
  like,
} from "../utils";

type Ids = { cafeteriaId: number; itemId: number };

const MENU_ROW = `m.item_id, i.name, i.description, i.image, i.price, i.category_id, cat.name AS category_name,
  m.is_available, (m.is_available AND m.stock > 0 AND i.is_active) AS available,
  CASE WHEN m.stock = 0 THEN 'out' WHEN m.stock <= m.reorder_level THEN 'low' ELSE 'ok' END AS stock_level,
  m.stock, m.reorder_level, m.last_updated, i.is_active AS item_active`;

const MENU_FROM = `cafeteria_menu m JOIN items i ON i.id = m.item_id JOIN categories cat ON cat.id = i.category_id`;

const INV_ROW = `m.item_id, i.name, cat.name AS category_name, m.stock, m.reorder_level, m.is_available,
  (m.stock <= m.reorder_level) AS low_stock, m.last_updated`;

export const getMenu = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  const q = getQuery<MenuQuery>(req);
  const user = authUser(req);
  const cafe = await assertCafeteriaExists(cafeteriaId);
  if (!cafe.is_active && user.role !== "admin") throw notFound("Cafeteria");
  const privileged = (await getCafeteriaRole(user, cafeteriaId)) !== null;

  const w = new Where().add("m.cafeteria_id = ?", cafeteriaId);
  if (!privileged) w.addRaw("i.is_active = TRUE");
  if (q.search)
    w.add(
      "(i.name ILIKE ? OR i.description ILIKE ?)",
      like(q.search),
      like(q.search),
    );
  if (q.categoryId) w.add("i.category_id = ?", q.categoryId);
  if (q.availableOnly) w.addRaw("m.is_available = TRUE AND m.stock > 0");

  const { rows } = await query(
    `SELECT ${MENU_ROW} FROM ${MENU_FROM} ${w.clause} ORDER BY cat.name, i.name`,
    w.values,
  );
  const items = privileged
    ? rows
    : rows.map((r) => {
        const {
          stock: _s,
          reorder_level: _r,
          last_updated: _l,
          item_active: _a,
          ...publicRow
        } = r;
        return publicRow;
      });
  sendSuccess(
    res,
    {
      cafeteria: { id: cafe.id, name: cafe.name, is_open: cafe.is_open },
      items,
    },
    "Menu retrieved",
  );
});

export const addMenuItem = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  const b = getBody<AddMenuItemBody>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "manager");
  const item = await query<{ is_active: boolean }>(
    "SELECT is_active FROM items WHERE id = $1",
    [b.itemId],
  );
  if (!item.rows[0] || !item.rows[0].is_active)
    throw new AppError(404, "Item not found or inactive");
  try {
    await query(
      "INSERT INTO cafeteria_menu (cafeteria_id, item_id, stock, is_available, reorder_level) VALUES ($1, $2, $3, $4, $5)",
      [cafeteriaId, b.itemId, b.stock, b.isAvailable, b.reorderLevel],
    );
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "Item is already on this cafeteria menu");
    throw err;
  }
  const { rows } = await query(
    `SELECT ${MENU_ROW} FROM ${MENU_FROM} WHERE m.cafeteria_id = $1 AND m.item_id = $2`,
    [cafeteriaId, b.itemId],
  );
  sendSuccess(res, rows[0], "Item added to menu", 201);
});

const applyMenuUpdate = async (
  cafeteriaId: number,
  itemId: number,
  b: UpdateMenuItemBody,
): Promise<Record<string, unknown>> => {
  const { sets, values } = buildUpdate(b, {
    stock: "stock",
    isAvailable: "is_available",
    reorderLevel: "reorder_level",
  });
  values.push(cafeteriaId, itemId);
  const upd = await query(
    `UPDATE cafeteria_menu SET ${sets.join(", ")} WHERE cafeteria_id = $${values.length - 1} AND item_id = $${values.length} RETURNING item_id`,
    values,
  );
  if (!upd.rows[0]) throw notFound("Menu item");
  const { rows } = await query(
    `SELECT ${MENU_ROW} FROM ${MENU_FROM} WHERE m.cafeteria_id = $1 AND m.item_id = $2`,
    [cafeteriaId, itemId],
  );
  const menuItem = rows[0];
  if (!menuItem) throw notFound("Menu item");
  return menuItem;
};

export const updateMenuItem = asyncHandler(async (req, res) => {
  const { cafeteriaId, itemId } = getParams<Ids>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "manager");
  sendSuccess(
    res,
    await applyMenuUpdate(
      cafeteriaId,
      itemId,
      getBody<UpdateMenuItemBody>(req),
    ),
    "Menu item updated",
  );
});

export const removeMenuItem = asyncHandler(async (req, res) => {
  const { cafeteriaId, itemId } = getParams<Ids>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "manager");
  const del = await query(
    "DELETE FROM cafeteria_menu WHERE cafeteria_id = $1 AND item_id = $2",
    [cafeteriaId, itemId],
  );
  if (!del.rowCount) throw notFound("Menu item");
  sendSuccess(
    res,
    { cafeteriaId, itemId, removed: true },
    "Item removed from menu",
  );
});

export const setAvailability = asyncHandler(async (req, res) => {
  const { cafeteriaId, itemId } = getParams<Ids>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "staff");
  const { isAvailable } = getBody<AvailabilityBody>(req);
  sendSuccess(
    res,
    await applyMenuUpdate(cafeteriaId, itemId, { isAvailable }),
    "Availability updated",
  );
});

const listInventory = async (
  cafeteriaId: number,
  q: InventoryQuery,
  forceLowStock: boolean,
) => {
  const w = new Where().add("m.cafeteria_id = ?", cafeteriaId);
  if (forceLowStock || q.lowStock === true)
    w.addRaw("m.stock <= m.reorder_level");
  if (q.lowStock === false) w.addRaw("m.stock > m.reorder_level");
  if (q.available !== undefined) w.add("m.is_available = ?", q.available);
  if (q.search) w.add("i.name ILIKE ?", like(q.search));
  const { rows } = await query(
    `SELECT ${INV_ROW} FROM ${MENU_FROM} ${w.clause} ORDER BY (m.stock - m.reorder_level), i.name`,
    w.values,
  );
  return rows;
};

export const getInventory = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "staff");
  sendSuccess(
    res,
    await listInventory(cafeteriaId, getQuery<InventoryQuery>(req), false),
    "Inventory retrieved",
  );
});

export const getLowStock = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "staff");
  sendSuccess(
    res,
    await listInventory(cafeteriaId, {}, true),
    "Low-stock items retrieved",
  );
});

export const updateInventory = asyncHandler(async (req, res) => {
  const { cafeteriaId, itemId } = getParams<Ids>(req);
  const b = getBody<UpdateMenuItemBody>(req);
  const access = await requireCafeteriaAccess(
    authUser(req),
    cafeteriaId,
    "staff",
  );
  if (b.reorderLevel !== undefined && access === "staff") {
    throw new AppError(
      403,
      "Only a manager or admin can change reorder levels",
    );
  }
  sendSuccess(
    res,
    await applyMenuUpdate(cafeteriaId, itemId, b),
    "Inventory updated",
  );
});
