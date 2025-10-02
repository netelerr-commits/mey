/*
  # Create Pantry Items Table

  ## New Tables
  
  ### `pantry_items`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `product_id` (uuid, foreign key to products)
  - `quantity` (decimal, current quantity in stock)
  - `unit` (text, unit of measurement: 'kg', 'g', 'l', 'ml', 'un', 'pacote', etc.)
  - `expiry_date` (date, optional expiration date)
  - `low_stock_threshold` (decimal, threshold to trigger low stock alert)
  - `notes` (text, optional notes)
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)

  ## Security
  - Enable RLS on pantry_items table
  - Users can only access their own pantry items
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
  
  ## Indexes
  - Index on user_id for faster queries
  - Index on product_id for joins
  - Index on expiry_date for expiration alerts
*/

-- Create pantry_items table
CREATE TABLE IF NOT EXISTS pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric(10, 2) DEFAULT 0,
  unit text DEFAULT 'un',
  expiry_date date,
  low_stock_threshold numeric(10, 2) DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Pantry items policies
CREATE POLICY "Users can view own pantry items"
  ON pantry_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items"
  ON pantry_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items"
  ON pantry_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items"
  ON pantry_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS pantry_items_product_id_idx ON pantry_items(product_id);
CREATE INDEX IF NOT EXISTS pantry_items_expiry_date_idx ON pantry_items(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pantry_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pantry_items_updated_at'
  ) THEN
    CREATE TRIGGER update_pantry_items_updated_at
      BEFORE UPDATE ON pantry_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create trigger for products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create trigger for lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_lists_updated_at'
  ) THEN
    CREATE TRIGGER update_lists_updated_at
      BEFORE UPDATE ON lists
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
