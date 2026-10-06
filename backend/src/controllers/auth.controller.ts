import { compare, hash, hashSync } from "bcrypt";
import { SignOptions, sign } from "jsonwebtoken";
import { query, ENV } from "../config";
import type { LoginBody, SignupBody } from "../schemas";
import { USER_COLS } from "../consts";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  hasPgCode,
  sendSuccess,
} from "../utils";
import { loadProfile } from "./user.controller";

// Compared against when the email is unknown so response time does not reveal valid emails.
const DUMMY_HASH = hashSync("campusbite-dummy-password", 10);

const signToken = (userId: number, role: string): string => {
  const options: SignOptions = {
    subject: String(userId),
    expiresIn: ENV.jwtExpiresIn,
  };
  return sign({ role }, ENV.jwtSecret, options);
};

export const signup = asyncHandler(async (req, res) => {
  const b = getBody<SignupBody>(req);
  const passwordHash = await hash(b.password, 10);
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLS}`,
      [b.name, b.email, b.phone ?? null, passwordHash, b.role],
    );
    const user = rows[0];
    if (!user) throw new AppError(500, "Failed to create user");
    sendSuccess(
      res,
      { token: signToken(user.id, user.role), user: rows[0] },
      "Registration successful",
      201,
    );
  } catch (err) {
    if (hasPgCode(err, "23505"))
      throw new AppError(409, "Email is already registered");
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = getBody<LoginBody>(req);
  const { rows } = await query(
    `SELECT ${USER_COLS}, password_hash FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  const row = rows[0];
  const valid = await compare(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !valid) throw new AppError(401, "Invalid email or password");
  if (!row.is_active)
    throw new AppError(403, "This account has been deactivated");
  const { password_hash: _omit, ...user } = row;
  sendSuccess(
    res,
    { token: signToken(user.id, user.role), user },
    "Login successful",
  );
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, await loadProfile(authUser(req).id), "Authenticated user");
});
