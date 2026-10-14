-- Up Migration
CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  price_cents INTEGER     NOT NULL CHECK (price_cents >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE products;
