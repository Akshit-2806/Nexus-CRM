import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tivrvsoetggrkmppwhlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdnJ2c29ldGdncmttcHB3aGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjA3NzQsImV4cCI6MjA5MjkzNjc3NH0.lhdfKWBcOatVHtMMSaTolA18azRrq4rcUUCM0Afbu2Q';

export const supabase = createClient(supabaseUrl, supabaseKey);