import { query } from "../config";
import type { CreateCategoryBody, UpdateCategoryBody } from "../schemas";
import {
  AppError,
  asyncHandler,
  buildUpdate,
  getBody,
  getParams,
  hasPgCode,
  notFound,
  sendSuccess,
} from "../utils";

const COLS = "id, name, description";

export const listCategories = asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT ${COLS} FROM categories ORDER BY name`);
  sendSuccess(res, rows, "Categories retrieved");
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { rows } = await query(`SELECT ${COLS} FROM categories WHERE id = $1`, [
    id,
  ]);
  if (!rows[0]) throw notFound("Category");
  sendSuccess(res, rows[0], "Category retrieved");
});

export const createCategory = asyncHandler(async (req, res) => {
  const b = getBody<CreateCategoryBody>(req);
  try {
    const { rows } = await query(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING ${COLS}`,
      [b.name, b.description ?? null],
    );
    sendSuccess(res, rows[0], "Category created", 201);
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "A category with this name already exists");
    throw err;
  }
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { sets, values } = buildUpdate(getBody<UpdateCategoryBody>(req), {
    name: "name",
    description: "description",
  });
  values.push(id);
  try {
    const { rows } = await query(
      `UPDATE categories SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${COLS}`,
      values,
    );
    if (!rows[0]) throw notFound("Category");
    sendSuccess(res, rows[0], "Category updated");
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "A category with this name already exists");
    throw err;
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const exists = await query("SELECT 1 FROM categories WHERE id = $1", [id]);
  if (!exists.rowCount) throw notFound("Category");
  const used = await query<{ count: number }>(
    "SELECT COUNT(*) AS count FROM items WHERE category_id = $1",
    [id],
  );
  const category = used.rows[0];
  if (!category) throw new AppError(404, "Category not found");
  if (category.count > 0) {
    throw new AppError(
      409,
      `Category is used by ${category.count} item(s); reassign or remove them first`,
    );
  }
  await query("DELETE FROM categories WHERE id = $1", [id]);
  sendSuccess(res, { id, deleted: true }, "Category deleted");
});
