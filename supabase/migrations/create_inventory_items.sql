-- Migration: Create inventory_items table
-- Paste this script into your Supabase Dashboard SQL Editor to create the table

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_type TEXT,
  fund_cluster TEXT,
  article TEXT,
  acquisition_date TEXT,
  description TEXT,
  end_user TEXT,
  office_center TEXT,
  serial_number TEXT,
  ngas_number TEXT,
  property_number TEXT,
  unit_of_measure TEXT,
  unit_value NUMERIC,
  total_cost NUMERIC,
  qty_property_card INTEGER,
  qty_physical_count INTEGER,
  qty_shortage_overage INTEGER,
  value_shortage_overage NUMERIC,
  remarks TEXT,
  par_ics_ro TEXT,
  par_ics_received_by TEXT,
  par_ics_pos TEXT,
  actual_user TEXT,
  location TEXT,
  sub_location TEXT,
  condition TEXT,
  tagging_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow authenticated users to read inventory"
ON inventory_items
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert inventory
CREATE POLICY "Allow authenticated users to insert inventory"
ON inventory_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update inventory
CREATE POLICY "Allow authenticated users to update inventory"
ON inventory_items
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete inventory
CREATE POLICY "Allow authenticated users to delete inventory"
ON inventory_items
FOR DELETE
TO authenticated
USING (true);
