
const CLOUD_KEY = 'bimo-cloud-last-sync';
async function bimoCloudPush() {
  if (!client) throw Error('Supabase unavailable');
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw Error('กรุณาเข้าสู่ระบบ');
  const payload = {
    state,
    world: JSON.parse(localStorage.getItem('bimo-world-economy-v1') || 'null'),
    game: JSON.parse(localStorage.getItem('bimo-queens-v2') || 'null'),
    progress: JSON.parse(localStorage.getItem('bimo-queens-progress') || '{}')
  };
  const { error } = await client.from('bimo_user_data').upsert({ user_id: auth.user.id, payload, updated_at: new Date().toISOString() });
  if (error) throw Error(error.message);
  localStorage.setItem(CLOUD_KEY, new Date().toISOString());
}
async function bimoCloudPull() {
  if (!client) throw Error('Supabase unavailable');
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw Error('กรุณาเข้าสู่ระบบ');
  const { data, error } = await client.from('bimo_user_data').select('payload').eq('user_id', auth.user.id).maybeSingle();
  if (error) throw Error(error.message);
  if (!data?.payload) throw Error('ยังไม่มีข้อมูลสำรองบน Cloud');
  const { state: remote, world, game, progress } = data.payload;
  if (!remote || !Array.isArray(remote.tasks) || !Array.isArray(remote.notes)) throw Error('รูปแบบข้อมูลไม่ถูกต้อง');
  localStorage.setItem('bimo-world-v1', JSON.stringify(remote));
  if (world?.plots && Array.isArray(world.plots)) localStorage.setItem('bimo-world-economy-v1', JSON.stringify(world));
  if (game?.marks && Array.isArray(game.marks)) localStorage.setItem('bimo-queens-v2', JSON.stringify(game));
  if (progress && typeof progress === 'object') localStorage.setItem('bimo-queens-progress', JSON.stringify(progress));
  location.reload();
}
