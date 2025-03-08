import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://eanbeozedjxftwbgmvfn.supabase.co';
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbmJlb3plZGp4ZnR3YmdtdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Njk1NTksImV4cCI6MjA1NjU0NTU1OX0.j83PF9Zf8evMG5shlsL5FimDCc2HIutNqRJ-NTwwIKs';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});

// Log current session on startup
(async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Initial Supabase session check:', 
              data?.session ? 'Session exists' : 'No session', 
              'Error:', error);
})();