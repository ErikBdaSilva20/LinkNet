-- Create link_type enum
CREATE TYPE link_type AS ENUM ('link', 'header');

-- Add link_type column to links table
ALTER TABLE public.links 
ADD COLUMN link_type link_type NOT NULL DEFAULT 'link';

-- Allow url to be nullable for headers
ALTER TABLE public.links ALTER COLUMN url DROP NOT NULL;