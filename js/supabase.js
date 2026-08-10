import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://jnajwjqroywbptetcrwf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYWp3anFyb3l3YnB0ZXRjcndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTU1NTksImV4cCI6MjEwMTg5MTU1OX0.A3Cxu6lRHkdVddbWcNxhIL5IT4tfhyRtcRo5IDcHYiw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
