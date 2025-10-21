/*
  # Mirage Social Graph Messenger - Initial Schema

  ## Overview
  Creates the core database schema for Mirage, a professional networking app with AI-assisted connections.

  ## New Tables

  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - User email
  - `full_name` (text) - User's full name
  - `profession` (text) - User's profession/title
  - `photo_url` (text, nullable) - Profile photo URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `categories`
  - `id` (uuid, primary key) - Category identifier
  - `user_id` (uuid, foreign key) - Owner of the category
  - `name` (text) - Category name (e.g., Finance, Marketing, Arts & History)
  - `color` (text) - Display color for the category
  - `created_at` (timestamptz) - Creation timestamp

  ### `contacts`
  - `id` (uuid, primary key) - Contact identifier
  - `user_id` (uuid, foreign key) - Owner of the contact
  - `name` (text) - Contact's name
  - `profession` (text, nullable) - Contact's profession
  - `photo_url` (text, nullable) - Contact's photo
  - `email` (text, nullable) - Contact's email
  - `phone` (text, nullable) - Contact's phone
  - `layer` (integer, 1-3) - Connection layer (1=close, 2=secondary, 3=acquaintance)
  - `category_id` (uuid, foreign key, nullable) - Category assignment
  - `parent_contact_id` (uuid, foreign key, nullable) - Parent contact for tree structure
  - `warmth_status` (text) - warm/cooling/cold
  - `last_contacted` (timestamptz, nullable) - Last interaction date
  - `consent_status` (text) - pending/accepted/declined
  - `ai_enabled` (boolean) - Whether AI catch-ups are enabled
  - `notes` (text, nullable) - Personal notes about the contact
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `messages`
  - `id` (uuid, primary key) - Message identifier
  - `user_id` (uuid, foreign key) - Message sender (owner)
  - `contact_id` (uuid, foreign key) - Message recipient
  - `content` (text) - Message body
  - `is_ai_generated` (boolean) - Whether message was AI-generated
  - `status` (text) - draft/sent/scheduled/failed
  - `sent_at` (timestamptz, nullable) - When message was sent
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_settings`
  - `id` (uuid, primary key) - Settings identifier
  - `user_id` (uuid, foreign key, unique) - User these settings belong to
  - `reminder_frequency_days` (integer) - Default reminder cadence (30/60/90)
  - `ai_messaging_enabled` (boolean) - Global AI messaging toggle
  - `require_approval` (boolean) - Whether AI messages require approval before sending
  - `email_notifications` (boolean) - Email notification preference
  - `in_app_notifications` (boolean) - In-app notification preference
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Contacts can only be accessed by their owner
  - Messages require ownership validation
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  profession text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#008080',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  profession text,
  photo_url text,
  email text,
  phone text,
  layer integer NOT NULL DEFAULT 1 CHECK (layer BETWEEN 1 AND 3),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  parent_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  warmth_status text DEFAULT 'warm' CHECK (warmth_status IN ('warm', 'cooling', 'cold')),
  last_contacted timestamptz,
  consent_status text DEFAULT 'pending' CHECK (consent_status IN ('pending', 'accepted', 'declined')),
  ai_enabled boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_ai_generated boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_frequency_days integer DEFAULT 60,
  ai_messaging_enabled boolean DEFAULT true,
  require_approval boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  in_app_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category_id ON contacts(category_id);
CREATE INDEX IF NOT EXISTS idx_contacts_layer ON contacts(layer);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);