import { createClient } from '@supabase/supabase-js';

// Project ID: iwpyulfnrvmbngfbwyzy
const SUPABASE_URL = 'https://iwpyulfnrvmbngfbwyzy.supabase.co';

// Publishable API Key
const SUPABASE_KEY = 'sb_publishable_0g1J7tFE6dKchNMybDrYQA_O4bg9E6H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);