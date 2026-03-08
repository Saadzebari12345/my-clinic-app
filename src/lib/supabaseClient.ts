import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmntvfjjnwpbutkbkena.supabase.co'
// ل خوارێ ل جهێ KEY، ئەو کۆدێ درێژ یێ Supabase کۆپی بکە و لێرە Paste بکە
const supabaseAnonKey = 'sb_publishable_Sc6XJPMLGwIEt1qh7f6_3w_HgvD-1zJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)