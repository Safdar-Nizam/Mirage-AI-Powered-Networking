/*
  # Add Geographic Location Fields to Contacts

  1. Changes
    - Add `city` column to store the city name
    - Add `country` column to store the country name
    - Add `latitude` column to store geographic latitude
    - Add `longitude` column to store geographic longitude
  
  2. Purpose
    - Enable geographic visualization of contacts on a world map
    - Support grouping contacts by city/country
    - Allow mapping contacts to specific geographic coordinates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'city'
  ) THEN
    ALTER TABLE contacts ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'country'
  ) THEN
    ALTER TABLE contacts ADD COLUMN country text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE contacts ADD COLUMN latitude decimal(10, 7);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE contacts ADD COLUMN longitude decimal(10, 7);
  END IF;
END $$;
