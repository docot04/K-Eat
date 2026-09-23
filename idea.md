For **CampusBite: Smart Campus Dining Management System**, I would design the database around these main entities:

- Users (students, staff, admins)
- Cafeterias/vendors
- Menu management
- Inventory
- Orders
- Payments
- Pickup management
- Feedback
- Meal subscriptions
- Analytics

I would use **PostgreSQL** because it handles relational data, transactions, and analytics well.

---

# Database Schema

## 1. Users

Stores all system users.

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    university_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK(role IN ('student', 'staff', 'admin')),

    profile_image TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 2. Cafeterias / Vendors

A university can have multiple cafeterias.

Example:

- Main Canteen
- Hostel Mess
- Food Court
- Coffee Shop

```sql
CREATE TABLE cafeterias (
    cafeteria_id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    location TEXT,

    manager_id INT REFERENCES users(user_id),

    opening_time TIME,
    closing_time TIME,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 3. Food Categories

```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,

    name VARCHAR(50) UNIQUE NOT NULL,

    description TEXT
);
```

Examples:

```
Breakfast
Lunch
Snacks
Beverages
Desserts
```

---

# 4. Menu Items

Food available for ordering.

```sql
CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,

    cafeteria_id INT NOT NULL
        REFERENCES cafeterias(cafeteria_id),

    category_id INT
        REFERENCES categories(category_id),

    name VARCHAR(100) NOT NULL,

    description TEXT,

    price DECIMAL(10,2) NOT NULL,

    image_url TEXT,

    calories INT,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,

    preparation_time INT DEFAULT 10,

    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Example:

| item        | price |
| ----------- | ----- |
| Paneer Roll | 80    |
| Cold Coffee | 60    |

---

# 5. Inventory

Tracks available quantity.

```sql
CREATE TABLE inventory (

    inventory_id SERIAL PRIMARY KEY,

    item_id INT UNIQUE
        REFERENCES menu_items(item_id),

    quantity_available INT DEFAULT 0,

    reorder_level INT DEFAULT 10,

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Example:

```
Paneer Roll
Available: 35
```

---

# 6. Orders

Main transaction table.

```sql
CREATE TABLE orders (

    order_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL
        REFERENCES users(user_id),

    cafeteria_id INT NOT NULL
        REFERENCES cafeterias(cafeteria_id),


    status VARCHAR(20)
        CHECK(status IN
        (
            'placed',
            'accepted',
            'preparing',
            'ready',
            'completed',
            'cancelled'
        ))
        DEFAULT 'placed',


    total_amount DECIMAL(10,2),

    pickup_time TIMESTAMP,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 7. Order Items

Because one order can have many items.

Example:

Order #102

```
2x Burger
1x Coffee
```

```sql
CREATE TABLE order_items (

    order_item_id SERIAL PRIMARY KEY,


    order_id INT NOT NULL
        REFERENCES orders(order_id)
        ON DELETE CASCADE,


    item_id INT NOT NULL
        REFERENCES menu_items(item_id),


    quantity INT NOT NULL,


    price DECIMAL(10,2) NOT NULL
);
```

---

# 8. Payments

```sql
CREATE TABLE payments (

    payment_id SERIAL PRIMARY KEY,


    order_id INT UNIQUE
        REFERENCES orders(order_id),


    payment_method VARCHAR(20)
        CHECK(payment_method IN
        (
            'upi',
            'card',
            'cash',
            'wallet'
        )),


    transaction_id VARCHAR(100),


    amount DECIMAL(10,2),


    status VARCHAR(20)
        CHECK(status IN
        (
            'pending',
            'success',
            'failed',
            'refunded'
        )),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 9. Pickup Slots

Controls crowd.

```sql
CREATE TABLE pickup_slots (

    slot_id SERIAL PRIMARY KEY,


    cafeteria_id INT
        REFERENCES cafeterias(cafeteria_id),


    start_time TIMESTAMP,

    end_time TIMESTAMP,


    max_orders INT,


    current_orders INT DEFAULT 0
);
```

Example:

```
1:00 PM - 1:15 PM
Maximum orders: 30
```

---

# 10. Feedback

```sql
CREATE TABLE feedback (

    feedback_id SERIAL PRIMARY KEY,


    user_id INT REFERENCES users(user_id),


    item_id INT REFERENCES menu_items(item_id),


    order_id INT REFERENCES orders(order_id),


    rating INT CHECK(rating BETWEEN 1 AND 5),


    comment TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 11. Complaints

```sql
CREATE TABLE complaints (

    complaint_id SERIAL PRIMARY KEY,


    user_id INT REFERENCES users(user_id),


    order_id INT REFERENCES orders(order_id),


    category VARCHAR(50),


    description TEXT,


    status VARCHAR(20)
        CHECK(status IN
        (
            'open',
            'processing',
            'resolved'
        ))
        DEFAULT 'open',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 12. Meal Subscription Plans

For monthly mess plans.

```sql
CREATE TABLE meal_plans (

    plan_id SERIAL PRIMARY KEY,


    cafeteria_id INT
        REFERENCES cafeterias(cafeteria_id),


    name VARCHAR(100),


    duration_days INT,


    price DECIMAL(10,2),


    meals_per_day INT
);
```

Example:

```
Monthly Lunch Plan
30 days
₹2500
```

---

# 13. User Subscriptions

```sql
CREATE TABLE subscriptions (

    subscription_id SERIAL PRIMARY KEY,


    user_id INT
        REFERENCES users(user_id),


    plan_id INT
        REFERENCES meal_plans(plan_id),


    start_date DATE,


    end_date DATE,


    remaining_meals INT,


    status VARCHAR(20)
);
```

---

# 14. Loyalty Points

```sql
CREATE TABLE loyalty_points (

    user_id INT PRIMARY KEY
        REFERENCES users(user_id),


    points INT DEFAULT 0
);
```

---

# 15. Notifications

```sql
CREATE TABLE notifications (

    notification_id SERIAL PRIMARY KEY,


    user_id INT REFERENCES users(user_id),


    title VARCHAR(100),


    message TEXT,


    is_read BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 16. Sales Analytics

Stores aggregated data.

```sql
CREATE TABLE sales_analytics (

    analytics_id SERIAL PRIMARY KEY,


    cafeteria_id INT
        REFERENCES cafeterias(cafeteria_id),


    date DATE,


    total_orders INT,


    total_revenue DECIMAL(10,2),


    food_wastage FLOAT
);
```

---

# Relationships Overview

```
Users
 |
 |
 +---- Orders
 |        |
 |        |
 |     Order_Items
 |        |
 |        |
 |    Menu_Items
 |        |
 |        |
 |    Inventory
 |
 |
 +---- Feedback
 |
 +---- Complaints
 |
 +---- Subscriptions


Cafeterias
 |
 |
 +---- Menu_Items
 |
 +---- Orders
 |
 +---- Meal_Plans
 |
 +---- Analytics
```

---

## Important Indexes (for performance)

```sql
CREATE INDEX idx_orders_user
ON orders(user_id);


CREATE INDEX idx_orders_status
ON orders(status);


CREATE INDEX idx_menu_available
ON menu_items(is_available);


CREATE INDEX idx_feedback_item
ON feedback(item_id);
```

---

This schema is already enough to support:

- student mobile/web app
- cafeteria dashboard
- admin analytics dashboard
- real-time ordering
- inventory tracking
- AI demand prediction later

For an SDE paper, this gives you a very good ER diagram because it has **15+ entities, multiple relationships, normalization, transactions, and real-world workflows**.
