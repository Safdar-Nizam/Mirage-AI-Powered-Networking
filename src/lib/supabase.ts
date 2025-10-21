import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  profession: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  profession: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  layer: 1 | 2 | 3;
  category_id: string | null;
  parent_contact_id: string | null;
  warmth_status: 'warm' | 'cooling' | 'cold';
  last_contacted: string | null;
  consent_status: 'pending' | 'accepted' | 'declined';
  ai_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  user_id: string;
  contact_id: string;
  content: string;
  is_ai_generated: boolean;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  sent_at: string | null;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  reminder_frequency_days: number;
  ai_messaging_enabled: boolean;
  require_approval: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
  created_at: string;
  updated_at: string;
};
