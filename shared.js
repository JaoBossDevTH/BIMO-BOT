const SUPABASE_URL = 'https://abjxbvjeafmylhuuicsf.supabase.co', SUPABASE_KEY = 'sb_publishable_IXdw6ieOtEtsVqLt97UZEw_K5tVSxIT';
const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;
const initial = { name: 'BIMO', owner: 'เพื่อน', happiness: 82, energy: 76, eye: '#95e9ff', favorite: 'strawberry', personality: 'อบอุ่น ขี้เล่น ชอบช่วยเหลือ', sound: false, lastSeen: Date.now(), craving: 'strawberry', tasks: [], notes: [], memories: [], chats: [], activeChat: null, aiEndpoint: 'https://abjxbvjeafmylhuuicsf.supabase.co/functions/v1/bimo-chat' };
let state; try { state = { ...initial, ...JSON.parse(localStorage.getItem('bimo-world-v1') || '{}') } } catch { state = { ...initial } };
state.happiness = Math.max(30, Math.min(100, Number(state.happiness) || 82)); state.energy = Math.max(25, Math.min(100, (Number(state.energy) || 76) + Math.min(30, Math.max(0, (Date.now() - state.lastSeen) / 3600000) * 6))); state.lastSeen = Date.now();
function save() { state.lastSeen = Date.now(); localStorage.setItem('bimo-world-v1', JSON.stringify(state)); window.dispatchEvent(new Event('bimo-state')) }
function clamp(n) { return Math.max(0, Math.min(100, n)) }
function toast(s) { document.querySelector('.toast')?.remove(); let e = document.createElement('div'); e.className = 'toast'; e.textContent = s; document.body.append(e); setTimeout(() => e.remove(), 2600) }
function escapeHTML(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function uid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2) }
const foods = [{ id: 'strawberry', emoji: '🍓', name: 'สตรอว์เบอร์รี' }, { id: 'cookie', emoji: '🍪', name: 'คุกกี้' }, { id: 'pudding', emoji: '🍮', name: 'พุดดิ้ง' }, { id: 'rice', emoji: '🍙', name: 'ข้าวปั้น' }, { id: 'watermelon', emoji: '🍉', name: 'แตงโม' }, { id: 'milk', emoji: '🥛', name: 'นมอุ่น' }];
function shell(active) { return `<aside class="side"><a class="brand" href="BIMOBOT.html">✦ BIMO<small>YOUR LITTLE AI BUDDY</small></a>${[['BIMOBOT.html', '🏠', 'Home'], ['Chat.html', '💬', 'Chat'], ['MySpace.html', '🌷', 'My Space'], ['Bimodoku.html', '🎨', 'Bimodoku'], ['Garden.html', '🌱', 'Garden'], ['Mart.html', '🛍️', 'Mart'], ['Settings.html', '⚙️', 'Settings']].map(([url, icon, name]) => `<a class="nav ${active === name ? 'active' : ''}" href="${url}"><span class="ico">${icon}</span>${name}</a>`).join('')}<div class="side-bottom"><button class="nav" id="logout" style="border:0;background:transparent;width:100%">↪ ออกจากระบบ</button></div></aside><nav class="nav-mobile">${[['BIMOBOT.html', '🏠', 'Home'], ['Chat.html', '💬', 'Chat'], ['MySpace.html', '🌷', 'My Space'], ['Bimodoku.html', '🎨', 'Bimodoku'], ['Garden.html', '🌱', 'Garden'], ['Mart.html', '🛍️', 'Mart'], ['Settings.html', '⚙️', 'Settings']].map(([url, icon, name]) => `<a class="${active === name ? 'active' : ''}" href="${url}"><span>${icon}</span>${name}</a>`).join('')}</nav>` }
function bimoMarkup(extra = '') { return `<div class="bimo ${extra}" id="bimo" data-mood="normal" style="--eye:${state.eye}" role="img" aria-label="BIMO หุ่นยนต์เพื่อนตัวน้อย"><div class="cube-side"></div><div class="cube-top"></div><div class="bodybot"><div class="face"><i class="eye left"></i><i class="eye right"></i><i class="cheek left"></i><i class="cheek right"></i><i class="mouth"></i></div></div></div>` }
function eyeFollow(x, y) { document.querySelectorAll('.bimo').forEach(bot => { const r = bot.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), distance = Math.hypot(dx, dy) || 1, ox = Math.max(-9, Math.min(9, dx / 26)), oy = Math.max(-7, Math.min(7, dy / 34)); bot.style.setProperty('--look-x', ox + 'px'); bot.style.setProperty('--look-y', oy + 'px'); bot.style.setProperty('--tilt-y', Math.max(-5, Math.min(5, dx / 100)) + 'deg'); bot.style.setProperty('--tilt-x', Math.max(-4, Math.min(4, -dy / 120)) + 'deg') }) }
document.addEventListener('pointermove', e => { if (document.getElementById('bimo')) eyeFollow(e.clientX, e.clientY) }, { passive: true }); document.addEventListener('pointerdown', e => { if (document.getElementById('bimo')) eyeFollow(e.clientX, e.clientY) }, { passive: true });
let moodTimer; function mood(m, ms = 1800) { let b = document.getElementById('bimo'); if (!b) return; b.dataset.mood = m; clearTimeout(moodTimer); if (ms) moodTimer = setTimeout(() => { b.dataset.mood = 'normal' }, ms) }
function blink() { let b = document.getElementById('bimo'); if (b && b.dataset.mood === 'normal') { mood('blink', 170) } } setInterval(blink, 4500 + Math.random() * 2500);
let audioContext;
function sound(freq = 500, duration = .1) { if (!state.sound) return; try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume(); const t = audioContext.currentTime, o = audioContext.createOscillator(), g = audioContext.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.22, t + duration); g.gain.setValueAtTime(.035, t); g.gain.exponentialRampToValueAtTime(.001, t + duration); o.connect(g); g.connect(audioContext.destination); o.start(t); o.stop(t + duration) } catch { } }
function voiceCue(type) { if (!state.sound) return; const cues = { greet: [[580, .09], [780, .12], [990, .16]], pet: [[650, .09], [760, .13]], tickle: [[840, .07], [1050, .07], [910, .09]], hurt: [[420, .13], [310, .18]], eat: [[520, .09], [610, .09], [730, .16]], dance: [[580, .09], [740, .09], [930, .09], [1150, .17]], sleep: [[540, .18], [390, .24]] }; (cues[type] || cues.pet).forEach(([freq, duration], i) => setTimeout(() => sound(freq, duration), i * 135)) }
async function checkAuth() { if (!client) { toast('โหลดระบบบัญชีไม่สำเร็จ'); return } try { const { data, error } = await client.auth.getUser(); if (error || !data?.user) { location.replace('index.html'); return } document.body.classList.remove('auth-pending') } catch { toast('ตรวจสอบบัญชีไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต') } }
function initPage(active) { document.getElementById('app').innerHTML = shell(active) + `<main class="page" id="content"></main>`; document.getElementById('logout').onclick = async () => { await client?.auth.signOut(); location.replace('index.html') }; checkAuth() }

function bimoSpeak(text) {
  if (!state.sound || !('speechSynthesis' in window) || !text) return false;
  try {
    const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 420));
    utterance.lang = 'th-TH';
    utterance.rate = 1.13;
    utterance.pitch = 1.35;
    utterance.volume = 0.82;
    const voices = speechSynthesis.getVoices();
    const thai = voices.filter(v => v.lang.toLowerCase().startsWith('th'));
    const male = thai.find(v => /male|ชาย|narong|pattara/i.test(v.name));
    utterance.voice = male || thai[0] || null;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    return true;
  } catch { return false; }
}
