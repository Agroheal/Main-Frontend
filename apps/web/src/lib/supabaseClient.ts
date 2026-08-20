import { createClient } from "@supabase/supabase-js";
import { supabaseURL, supabaseANON } from "../config/Index";

const supabaseUrl = supabaseURL;
const supabaseAnonKey = supabaseANON;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
