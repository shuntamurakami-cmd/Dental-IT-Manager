import { createClient } from '@supabase/supabase-js';

// Provided credentials
const SUPABASE_URL = 'https://zjnylpxfecitxugrtkzn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vb5Q2nf_RcrJrajiAzOJPQ_6epbB3rO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);