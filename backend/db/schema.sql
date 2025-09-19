CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  price NUMERIC(12,2),
  image TEXT,
  category TEXT,
  attributes JSONB,
  status TEXT DEFAULT 'active'
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  name TEXT,
  phone TEXT,
  delivery TEXT,
  address TEXT,
  payment TEXT,
  total NUMERIC(12,2),
  status TEXT DEFAULT 'Новый'
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_title TEXT,
  qty INT,
  price NUMERIC(12,2),
  selected_attributes JSONB
);
