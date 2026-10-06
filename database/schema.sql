CREATE TYPE user_role AS ENUM ('student', 'staff', 'cafe_staff', 'admin');
CREATE TYPE cafe_staff_role AS ENUM ('staff', 'manager');
CREATE TYPE order_status AS ENUM ('not_paid', 'paid', 'preparing', 'ready', 'collected', 'cancelled');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'upi');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));
CREATE INDEX users_role_idx ON users (role);

CREATE TABLE cafeterias (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  image TEXT,
  location VARCHAR(200) NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  payment_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX cafeterias_manager_idx ON cafeterias (manager_id);

CREATE TABLE cafe_staff (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafeteria_id BIGINT NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  role cafe_staff_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cafe_staff_user_cafeteria_unique UNIQUE (user_id, cafeteria_id)
);
CREATE UNIQUE INDEX cafe_staff_one_manager_per_cafeteria ON cafe_staff (cafeteria_id) WHERE role = 'manager';
CREATE INDEX cafe_staff_cafeteria_idx ON cafe_staff (cafeteria_id);

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  price NUMERIC(10,2) NOT NULL CHECK (pri          ce >= 0),
  image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX items_category_idx ON items (category_id);

CREATE TABLE cafeteria_menu (
  cafeteria_id BIGINT NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  PRIMARY KEY (cafeteria_id, item_id)
);
CREATE INDEX cafeteria_menu_item_idx ON cafeteria_menu (item_id);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cafeteria_id BIGINT NOT NULL REFERENCES cafeterias(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status order_status NOT NULL DEFAULT 'not_paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_time TIMESTAMPTZ NOT NULL
);
CREATE INDEX orders_user_idx ON orders (user_id);
CREATE INDEX orders_cafeteria_idx ON orders (cafeteria_id);
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX orders_cafeteria_status_created_idx ON orders (cafeteria_id, status, created_at DESC);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  CONSTRAINT order_items_order_item_unique UNIQUE (order_id, item_id)
);
CREATE INDEX order_items_item_idx ON order_items (item_id);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL DEFAULT 'upi',
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(100),
  staff_note TEXT,
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX payments_status_idx ON payments (status);
CREATE UNIQUE INDEX payments_reference_unique ON payments (payment_method, transaction_id) WHERE transaction_id IS NOT NULL AND status <> 'failed';

CREATE TABLE queue (
  id BIGSERIAL PRIMARY KEY,
  cafeteria_id BIGINT NOT NULL UNIQUE REFERENCES cafeterias(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE queue_items (
  id BIGSERIAL PRIMARY KEY,
  queue_id BIGINT NOT NULL REFERENCES queue(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT queue_items_position_unique UNIQUE (queue_id, position) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX queue_items_queue_position_idx ON queue_items (queue_id, position);

CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  cafeteria_id BIGINT NOT NULL REFERENCES cafeterias(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  CONSTRAINT analytics_cafeteria_date_unique UNIQUE (cafeteria_id, date)
);
CREATE INDEX analytics_date_idx ON analytics (date);
