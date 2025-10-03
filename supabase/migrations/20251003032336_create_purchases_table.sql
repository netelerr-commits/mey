/*
  # Create Purchases Table for Financial Tracking

  ## New Tables
  
  ### `purchases`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `list_id` (uuid, nullable foreign key to lists)
  - `name` (text, name of the purchase/list)
  - `total_amount` (decimal, total spent)
  - `item_count` (integer, number of items purchased)
  - `purchase_date` (date, date of purchase)
  - `notes` (text, optional notes)
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)

  ### `purchase_items`
  - `id` (uuid, primary key)
  - `purchase_id` (uuid, foreign key to purchases)
  - `product_id` (uuid, foreign key to products)
  - `quantity` (decimal, quantity purchased)
  - `price` (decimal, price paid per item)
  - `category` (text, product category)
  - `created_at` (timestamptz, creation timestamp)

  ### `financial_settings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `monthly_budget` (decimal, optional monthly budget limit)
  - `alert_threshold` (decimal, percentage to trigger alert)
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id uuid REFERENCES lists(id) ON DELETE SET NULL,
  name text NOT NULL,
  total_amount numeric(10, 2) DEFAULT 0,
  item_count integer DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric(10, 2) DEFAULT 1,
  price numeric(10, 2) DEFAULT 0,
  category text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create financial_settings table
CREATE TABLE IF NOT EXISTS financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_budget numeric(10, 2),
  alert_threshold numeric(5, 2) DEFAULT 80,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Purchase items policies
CREATE POLICY "Users can view own purchase items"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own purchase items"
  ON purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own purchase items"
  ON purchase_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own purchase items"
  ON purchase_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

-- Financial settings policies
CREATE POLICY "Users can view own financial settings"
  ON financial_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial settings"
  ON financial_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial settings"
  ON financial_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial settings"
  ON financial_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_purchase_date_idx ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS purchase_items_purchase_id_idx ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS purchase_items_category_idx ON purchase_items(category);

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchases_updated_at'
  ) THEN
    CREATE TRIGGER update_purchases_updated_at
      BEFORE UPDATE ON purchases
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_financial_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_financial_settings_updated_at
      BEFORE UPDATE ON financial_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
