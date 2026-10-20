import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cronSecret } from '@/lib/env';

// Supabase pauses free projects after 7 days without activity; one heartbeat a day prevents it.
// The publishable key is enough: heartbeat() is the only thing it can touch (migration 0008).
export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${cronSecret()}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc('heartbeat', { source: 'vercel-cron' });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, at: data });
}
