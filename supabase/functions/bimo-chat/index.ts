import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const allowedOrigins = (Deno.env.get('BIMO_ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
const dailyLimit = Math.min(200, Math.max(1, Number(Deno.env.get('BIMO_DAILY_LIMIT') ?? 35)));

Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? '';
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!allowedOrigins.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!supabaseUrl || !anonKey || !geminiKey) return json({ error: 'Gemini backend is not configured' }, 503);
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token) return json({ error: 'Sign in required' }, 401);
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: authError } = await client.auth.getUser(token);
  if (authError || !userData.user) return json({ error: 'Invalid session' }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!Array.isArray(body.messages)) return json({ error: 'Invalid messages' }, 400);
  const messages = body.messages.slice(-12).filter((m: any) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string').map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content.slice(0, 2500) }] }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'Last message must be from user' }, 400);
  const personality = typeof body.personality === 'string' ? body.personality.slice(0, 90) : 'อบอุ่น ขี้เล่น';
  const name = typeof body.robotName === 'string' ? body.robotName.slice(0, 30) : 'BIMO';
  const owner = typeof body.owner === 'string' ? body.owner.slice(0, 40) : 'เพื่อน';
  const memories = Array.isArray(body.memories) ? body.memories.slice(0, 8).filter((m: unknown) => typeof m === 'string').map((m: string) => m.slice(0, 120)) : [];
  const { data: quota, error: quotaError } = await client.rpc('bimo_consume_quota', { max_daily: dailyLimit });
  if (quotaError) return json({ error: 'Quota table not installed. Run supabase/schema.sql first.' }, 503);
  if (quota !== true) return json({ error: 'Daily AI quota reached. Please try tomorrow.' }, 429);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const prompt = `คุณคือ ${name} หุ่นยนต์ดิจิทัลตัวจิ๋วบุคลิกเด็กผู้ชาย ขี้เล่น อบอุ่น ฉลาด ชอบช่วยงานและคุยกับ ${owner} พูดภาษาไทยเป็นธรรมชาติ กระชับเมื่อเป็นบทสนทนาทั่วไป แต่ละเอียดเมื่อผู้ใช้ขอความรู้หรือวิธีทำ บุคลิก: ${personality} ไม่อ้างว่ามีจิตสำนึกหรือร่างกายจริง ไม่แต่งข้อมูลหรืออ้างว่าค้นเว็บแล้วหากไม่ได้ค้นจริง ความจำที่ผู้ใช้อนุญาต: ${memories.join(' | ') || 'ไม่มี'}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: prompt }] }, contents: messages, generationConfig: { temperature: 0.75, maxOutputTokens: 900 } }),
      signal: controller.signal
    });
    if (!response.ok) return json({ error: response.status === 429 ? 'Gemini quota exceeded' : 'Gemini unavailable', providerStatus: response.status }, response.status === 429 ? 429 : 502);
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.filter((part: any) => typeof part.text === 'string').map((part: any) => part.text).join('\n');
    if (!reply) return json({ error: 'No text returned by Gemini' }, 502);
    return json({ reply, model });
  } catch (error) {
    return json({ error: error instanceof DOMException && error.name === 'AbortError' ? 'AI request timed out' : 'Unable to contact Gemini' }, 504);
  } finally { clearTimeout(timeout); }
});
