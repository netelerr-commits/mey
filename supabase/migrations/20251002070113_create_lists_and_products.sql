/*
  # Create Lists, Products, and List Items Tables

  ## New Tables
  
  ### `products`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text, product name)
  - `category` (text, optional category like "Frutas", "Limpeza", etc.)
  - `default_quantity` (integer, default quantity when adding to list)
  - `notes` (text, optional notes about the product)
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)
  
  ### `lists`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text, list name)
  - `notes` (text, optional notes)
  - `status` (text, enum: 'active', 'current', 'archived', 'completed')
  - `is_current` (boolean, flag for the active shopping list)
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)
  - `completed_at` (timestamptz, when list was completed)
  
  ### `list_items`
  - `id` (uuid, primary key)
  - `list_id` (uuid, foreign key to lists)
  - `product_id` (uuid, foreign key to products)
  - `quantity` (integer, quantity to buy)
  - `is_purchased` (boolean, whether item was purchased)
  - `price` (decimal, price paid for item)
  - `notes` (text, optional notes for this specific item)
  - `created_at` (timestamptz, creation timestamp)
  - `purchased_at` (timestamptz, when item was purchased)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT '',
  default_quantity integer DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'active',
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  is_purchased boolean DEFAULT false,
  price numeric(10, 2),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  purchased_at timestamptz
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Lists policies
CREATE POLICY "Users can view own lists"
  ON lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- List items policies
CREATE POLICY "Users can view own list items"
  ON list_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own list items"
  ON list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own list items"
  ON list_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own list items"
  ON list_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS lists_user_id_idx ON lists(user_id);
CREATE INDEX IF NOT EXISTS lists_is_current_idx ON lists(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS list_items_list_id_idx ON list_items(list_id);
CREATE INDEX IF NOT EXISTS list_items_product_id_idx ON list_items(product_id);
