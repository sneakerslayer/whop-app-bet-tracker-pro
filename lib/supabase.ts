import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to set RLS context for multi-tenant security
export async function setRLSContext(userId: string, experienceId: string) {
  try {
    await supabase.rpc('set_user_context', {
      user_id: userId,
      experience_id: experienceId
    });
  } catch (error) {
    console.error('Error setting RLS context:', error);
    throw error;
  }
}

// Helper function to clear RLS context
export async function clearRLSContext() {
  try {
    await supabase.rpc('clear_user_context');
  } catch (error) {
    console.error('Error clearing RLS context:', error);
    throw error;
  }
}
