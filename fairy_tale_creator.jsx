import { useState, useEffect, useRef, useCallback } from "react";

const ARCHETYPE_ICONS = {
  'Μάγος':'🧙','Πριγκίπισσα':'👑','Δράκος':'🐉',
  'Ήρωας':'⚔️','Νεράιδα':'🧚','Τέρας':'👹',
  'Σοφός Γέρος':'🦉','Τρελός Εφευρέτης':'⚙️','Μυστηριώδης Άγνωστος':'🌒'
};

const ARCHETYPES = Object.keys(ARCHETYPE_ICONS);

const WORLDS = [
  { value:'enchanted forest', label:'🌲 Μαγικό Δάσος' },
  { value:'underwater kingdom', label:'🌊 Υποθαλάσσιο Βασίλειο' },
  { value:'floating sky islands', label:'☁️ Νησιά στα Σύννεφα' },
  { value:'ancient magical kingdom', label:'🏰 Αρχαίο Μαγικό Βασίλειο' },
  { value:'dark cursed land', label:'🌑 Σκοτεινή Κατάρα Γη' },
  { value:'starry cosmos', label:'✨ Αστρικός Κόσμος' },
];

const TRAITS = ['γενναίος','σοφός','πονηρός','καλόκαρδος','μελαγχολικός','παιχνιδιάρης','μυστηριώδης','περήφανος','αδέσμευτος','τρυφερός','σκληρός','αθώος'];

const VOICE_HINTS = {
  'Μάγος': ['wizard','magic','deep','old','wise','mystic','george','clyde','arnold'],
  'Δράκος': ['deep','dark','monster','villain','dragon','bass','strong','arnold'],
  'Τέρας': ['deep','dark','monster','rough','scary','villain','bass'],
  'Σοφός Γέρος': ['old','wise','elder','grandfather','calm','deep','george'],
  'Πριγκίπισσα': ['princess','sweet','girl','young','female','soft','grace','bella','rachel'],
  'Νεράιδα': ['fairy','young','bright','energetic','female','high','elli','aria','nova'],
  'Ήρωας': ['hero','strong','confident','male','brave','adam','josh'],
  'Τρελός Εφευρέτης': ['excited','energetic','quirky','fast','young','sam','charlie'],
  'Μυστηριώδης Άγνωστος': ['mysterious','calm','quiet','whisper','low','dark','adam','antoni'],
};

const VOICE_SETTINGS = {
  'Μάγος':                { stability:0.55, similarity_boost:0.75, style:0.4 },
  'Δράκος':               { stability:0.30, similarity_boost:0.85, style:0.75 },
  'Τέρας':                { stability:0.28, similarity_boost:0.80, style:0.70 },
  'Σοφός Γέρος':          { stability:0.70, similarity_boost:0.75, style:0.20 },
  'Πριγκίπισσα':          { stability:0.60, similarity_boost:0.80, style:0.35 },
  'Νεράιδα':              { stability:0.45, similarity_boost:0.75, style:0.55 },
  'Ήρωας':                { stability:0.65, similarity_boost:0.80, style:0.30 },
  'Τρελός Εφευρέτης':     { stability:0.22, similarity_boost:0.70, style:0.85 },
  'Μυστηριώδης Άγνωστος': { stability:0.75, similarity_boost:0.85, style:0.12 },
};

function pickVoice(voices, archetype) {
  if (!voices.length) return null;
  const hints = VOICE_HINTS[archetype] || [];
  const scored = voices.map(v => {
    const text = [v.name, v.description, ...Object.values(v.labels||{})].join(' ').toLowerCase();
    let score = 0;
    hints.forEach((h,i) => { if(text.includes(h)) score += hints.length - i; });
    return { v, score };
  });
  return scored.sort((a,b) => b.score - a.score)[0].v;
}

// ── Styles ──────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body, #root {
  min-height: 100vh;
  background: #1a0e2e;
  color: #f5edd6;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 17px;
}

.app { max-width: 860px; margin: 0 auto; padding: 0 1.2rem 3rem; }

header { text-align:center; padding: 2.5rem 1rem 1.5rem; }
.ornament { font-size:.75rem; letter-spacing:.4em; color:#c9963a; opacity:.8; text-transform:uppercase; margin-bottom:.4rem; }
h1 {
  font-family:'Cinzel Decorative',serif; font-size:clamp(1.6rem,4.5vw,2.8rem); font-weight:900;
  background:linear-gradient(135deg,#e8c06a,#c9963a,#d4a830,#e8c06a);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  filter:drop-shadow(0 0 18px rgba(201,150,58,.4)); line-height:1.2; margin-bottom:.4rem;
}
.subtitle { font-style:italic; color:#a07ccc; font-size:1rem; opacity:.85; }
.divider { color:#c9963a; font-size:1.2rem; letter-spacing:.5rem; margin:.8rem 0; opacity:.5; }

.grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
@media(max-width:620px){ .grid{ grid-template-columns:1fr; } }

.card {
  background:rgba(245,237,214,.04);
  border:1px solid rgba(201,150,58,.22);
  border-radius:4px; padding:1.5rem; position:relative;
}
.card::before,.card::after { content:'✦'; position:absolute; color:#c9963a; opacity:.35; font-size:.7rem; }
.card::before { top:.45rem; left:.45rem; }
.card::after { bottom:.45rem; right:.45rem; }
.card-title { font-family:'Cinzel Decorative',serif; font-size:.82rem; color:#e8c06a; text-transform:uppercase; letter-spacing:.14em; margin-bottom:1.2rem; padding-bottom:.65rem; border-bottom:1px solid rgba(201,150,58,.18); }

.full { grid-column:1/-1; }

label { display:block; font-size:.78rem; letter-spacing:.12em; text-transform:uppercase; color:#c9963a; opacity:.8; margin-bottom:.35rem; margin-top:1rem; }
label:first-of-type { margin-top:0; }

input[type=text],input[type=password],textarea,select {
  width:100%; background:rgba(245,237,214,.06); border:1px solid rgba(201,150,58,.28);
  border-radius:2px; color:#f5edd6; font-family:'Crimson Pro',serif; font-size:1rem;
  padding:.55rem .85rem; outline:none; transition:border-color .25s,background .25s;
}
input:focus,textarea:focus,select:focus { border-color:#c9963a; background:rgba(245,237,214,.1); }
textarea { resize:vertical; min-height:80px; line-height:1.5; }
select option { background:#1a0e2e; }

.archetype-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; margin-top:.4rem; }
.arch-btn {
  cursor:pointer; padding:.55rem .3rem; border:1px solid rgba(201,150,58,.22); border-radius:3px;
  text-align:center; font-family:'Crimson Pro',serif; font-size:.82rem; color:#f5edd6;
  opacity:.55; transition:all .2s; background:transparent; line-height:1.25;
}
.arch-btn .icon { font-size:1.3rem; display:block; margin-bottom:.15rem; }
.arch-btn:hover { opacity:.9; border-color:#c9963a; }
.arch-btn.active { background:rgba(107,63,160,.25); border-color:#a07ccc; color:#a07ccc; opacity:1; }

.traits-wrap { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.4rem; }
.trait {
  cursor:pointer; padding:.3rem .75rem; border:1px solid rgba(201,150,58,.28); border-radius:16px;
  font-size:.85rem; color:#f5edd6; opacity:.55; transition:all .2s; user-select:none;
}
.trait:hover { opacity:.9; border-color:#c9963a; }
.trait.active { background:rgba(201,150,58,.18); border-color:#e8c06a; color:#e8c06a; opacity:1; }

.btn-primary {
  width:100%; margin-top:1.3rem; padding:.85rem 1.5rem;
  background:linear-gradient(135deg,rgba(201,150,58,.14),rgba(201,150,58,.07));
  border:1px solid #c9963a; border-radius:2px; color:#e8c06a;
  font-family:'Cinzel Decorative',serif; font-size:.88rem; letter-spacing:.1em;
  cursor:pointer; transition:all .3s; position:relative; overflow:hidden;
}
.btn-primary:hover { background:linear-gradient(135deg,rgba(201,150,58,.24),rgba(201,150,58,.14)); box-shadow:0 0 18px rgba(201,150,58,.2); }
.btn-primary:disabled { opacity:.45; cursor:not-allowed; }

.btn-small {
  padding:.3rem .9rem; background:rgba(107,63,160,.2); border:1px solid rgba(160,124,204,.4);
  border-radius:16px; color:#a07ccc; font-family:'Crimson Pro',serif; font-size:.85rem;
  cursor:pointer; transition:all .2s; white-space:nowrap;
}
.btn-small:hover { background:rgba(107,63,160,.38); }
.btn-small:disabled { opacity:.35; cursor:not-allowed; }
.btn-small.speaking { border-color:#a07ccc; animation:glow 1s infinite alternate; }
@keyframes glow { from{box-shadow:0 0 4px rgba(160,124,204,.3)} to{box-shadow:0 0 14px rgba(160,124,204,.8)} }

.api-row { display:flex; gap:.7rem; align-items:center; flex-wrap:wrap; }
.api-row input { flex:1; min-width:180px; }
.api-status { margin-top:.55rem; font-size:.85rem; font-style:italic; opacity:.75; }
.api-note { margin-top:.45rem; font-size:.75rem; opacity:.38; }

.char-sheet { display:grid; grid-template-columns:auto 1fr; gap:1.5rem; align-items:start; }
@media(max-width:500px){ .char-sheet{ grid-template-columns:1fr; } }
.avatar {
  width:110px; height:110px; border:2px solid #c9963a; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-size:3.2rem;
  background:radial-gradient(circle,rgba(107,63,160,.2),rgba(26,14,46,.5));
  flex-shrink:0; position:relative;
}
.avatar::after {
  content:''; position:absolute; inset:-5px; border-radius:50%;
  border:1px dashed rgba(201,150,58,.28); animation:spin 20s linear infinite;
}
@keyframes spin { to{ transform:rotate(360deg); } }

.char-name { font-family:'Cinzel Decorative',serif; font-size:1.4rem; color:#e8c06a; margin-bottom:.25rem; }
.char-arch { font-style:italic; color:#a07ccc; font-size:.92rem; margin-bottom:.7rem; }
.badges { display:flex; flex-wrap:wrap; gap:.35rem; }
.badge { font-size:.75rem; padding:.18rem .6rem; border-radius:12px; background:rgba(201,150,58,.1); border:1px solid rgba(201,150,58,.28); color:#e8c06a; }

.bio { line-height:1.75; color:#f5edd6; opacity:.92; font-size:1rem; margin-top:1.3rem; min-height:2rem; }

.section-sep { margin-top:1.3rem; padding-top:1.3rem; border-top:1px solid rgba(201,150,58,.16); }
.section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
.section-label { font-family:'Cinzel Decorative',serif; font-size:.72rem; color:#c9963a; letter-spacing:.14em; }

.voice-bubble {
  background:rgba(107,63,160,.1); border-left:3px solid #a07ccc; border-radius:0 4px 4px 0;
  padding:.9rem 1.1rem; font-style:italic; font-size:1.05rem; line-height:1.65;
  position:relative; color:#f5edd6;
}
.voice-bubble::before { content:'"'; position:absolute; top:-.4rem; left:.7rem; font-size:2.5rem; color:#a07ccc; opacity:.28; font-family:Georgia,serif; line-height:1; }

.chat-msgs { max-height:260px; overflow-y:auto; display:flex; flex-direction:column; gap:.7rem; margin-bottom:.9rem; padding-right:.4rem; }
.chat-msgs::-webkit-scrollbar { width:2px; }
.chat-msgs::-webkit-scrollbar-thumb { background:rgba(201,150,58,.28); }

.msg { max-width:88%; padding:.6rem .95rem; border-radius:2px; font-size:.97rem; line-height:1.5; animation:fadeUp .3s ease; }
@keyframes fadeUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
.msg.user { align-self:flex-end; background:rgba(42,74,107,.32); border:1px solid rgba(42,74,107,.48); }
.msg.char { align-self:flex-start; background:rgba(107,63,160,.13); border:1px solid rgba(107,63,160,.28); border-left:3px solid #a07ccc; font-style:italic; }

.chat-input-row { display:flex; gap:.55rem; }
.chat-input-row input { flex:1; }

.btn-send { padding:.55rem 1.1rem; background:rgba(107,63,160,.22); border:1px solid rgba(160,124,204,.45); border-radius:2px; color:#a07ccc; font-family:'Crimson Pro',serif; font-size:.95rem; cursor:pointer; transition:all .2s; }
.btn-send:hover { background:rgba(107,63,160,.38); }
.btn-send:disabled { opacity:.38; cursor:not-allowed; }

.btn-sec { padding:.45rem 1rem; background:transparent; border:1px solid rgba(245,237,214,.18); border-radius:2px; color:#f5edd6; opacity:.55; font-family:'Crimson Pro',serif; font-size:.88rem; cursor:pointer; transition:all .2s; margin-top:.9rem; }
.btn-sec:hover { opacity:.9; }

.dots { display:inline-flex; gap:3px; align-items:center; }
.dots span { width:5px; height:5px; border-radius:50%; background:#a07ccc; animation:bounce .8s infinite alternate; }
.dots span:nth-child(2){ animation-delay:.15s } .dots span:nth-child(3){ animation-delay:.3s }
@keyframes bounce { from{transform:translateY(0);opacity:.4} to{transform:translateY(-5px);opacity:1} }

.err { color:#e07070; font-size:.85rem; margin-top:.5rem; font-style:italic; }
.hidden { display:none; }
`;

// ── Component ────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState({ msg:'', ok:null });
  const [voices, setVoices] = useState([]);
  const [connected, setConnected] = useState(false);

  const [archetype, setArchetype] = useState('');
  const [traits, setTraits] = useState([]);
  const [world, setWorld] = useState('enchanted forest');
  const [charName, setCharName] = useState('');
  const [extra, setExtra] = useState('');
  const [formErr, setFormErr] = useState('');

  const [phase, setPhase] = useState('form'); // form | loading | character
  const [charData, setCharData] = useState(null);
  const [bio, setBio] = useState('');
  const [voiceLine, setVoiceLine] = useState('');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // ── Listen for Claude responses via window messages ──────────────────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d?.type === 'char_response') {
          setBio(d.bio || '');
          setVoiceLine(d.voiceLine || '');
          setPhase('character');
          if (d.voiceLine) speakText(d.voiceLine, d.archetype);
        }
        if (d?.type === 'chat_response') {
          setChatMsgs(prev => [...prev, { role:'char', text: d.text }]);
          setChatLoading(false);
          if (d.text) speakText(d.text, charData?.archetype);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [charData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [chatMsgs]);

  // ── ElevenLabs ───────────────────────────────────────────────────────────
  const PROXY = 'http://localhost:5050';

  async function connectEL() {
    if (!apiKey.trim()) { setApiStatus({ msg:'⚠️ Βάλε API key', ok:false }); return; }
    setApiStatus({ msg:'⏳ Σύνδεση…', ok:null });
    try {
      // First check proxy is running
      const health = await fetch(`${PROXY}/health`).catch(() => null);
      if (!health || !health.ok) {
        setApiStatus({ msg:'❌ Το proxy δεν τρέχει! Εκτέλεσε το elevenlabs_proxy.py πρώτα.', ok:false });
        return;
      }
      const res = await fetch(`${PROXY}/voices`, {
        headers: { 'xi-api-key': apiKey.trim() }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const v = data.voices || [];
      setVoices(v);
      setConnected(true);
      setApiStatus({ msg:`✅ Συνδέθηκες! ${v.length} φωνές διαθέσιμες.`, ok:true });
    } catch {
      setApiStatus({ msg:'❌ Λάθος key ή πρόβλημα σύνδεσης.', ok:false });
    }
  }

  async function speakText(text, arch) {
    stopAudio();
    const voice = pickVoice(voices, arch || archetype);
    if (!voice || !apiKey) return;
    const settings = VOICE_SETTINGS[arch || archetype] || { stability:.5, similarity_boost:.75, style:.3 };
    setSpeaking(true);
    try {
      const res = await fetch(`${PROXY}/tts/${voice.voice_id}`, {
        method:'POST',
        headers:{ 'xi-api-key': apiKey, 'Content-Type':'application/json' },
        body: JSON.stringify({ text, model_id:'eleven_multilingual_v2', voice_settings: settings })
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch { setSpeaking(false); }
  }

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }

  // ── Create character — asks Claude via sendPrompt ────────────────────────
  function createCharacter() {
    if (!charName.trim() || !archetype) { setFormErr('Συμπλήρωσε όνομα και αρχέτυπο.'); return; }
    if (!connected) { setFormErr('Πρώτα συνδέσου με ElevenLabs.'); return; }
    setFormErr('');
    const traitsStr = traits.length ? traits.join(', ') : 'χωρίς συγκεκριμένα χαρακτηριστικά';
    setPhase('loading');
    setCharData({ name: charName, archetype, world, traits: traitsStr, extra });
    setBio(''); setVoiceLine(''); setChatMsgs([]);

    const voiceName = pickVoice(voices, archetype)?.name || '';

    // Ask Claude to generate bio + voice line
    sendPrompt(
      `CHAR_CREATE|${JSON.stringify({ name:charName, archetype, world, traits:traitsStr, extra, voice:voiceName })}`
    );
  }

  // ── Send chat message ────────────────────────────────────────────────────
  function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMsgs(prev => [...prev, { role:'user', text:msg }]);
    setChatLoading(true);
    sendPrompt(
      `CHAR_CHAT|${JSON.stringify({ charData, msg, history: chatMsgs.slice(-6) })}`
    );
  }

  function resetAll() {
    stopAudio();
    setPhase('form'); setCharData(null); setBio(''); setVoiceLine('');
    setChatMsgs([]); setArchetype(''); setTraits([]); setCharName(''); setExtra('');
    setWorld('enchanted forest');
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header>
          <div className="ornament">✦ Εργαστήριο Φαντασίας ✦</div>
          <h1>Παραμυθένιοι<br/>Χαρακτήρες</h1>
          <p className="subtitle">Δώσε ζωή στις φαντασίες σου</p>
          <div className="divider">⁕ ⁕ ⁕</div>
        </header>

        {phase === 'form' && (
          <div className="grid">
            {/* API Key */}
            <div className="card full">
              <div className="card-title">✦ Σύνδεση ElevenLabs</div>
              <div className="api-row">
                <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)}
                  placeholder="Επικόλλησε το ElevenLabs API key σου…"
                  onKeyDown={e=>e.key==='Enter'&&connectEL()} />
                <button className="btn-small" onClick={connectEL}>
                  {connected ? '✅ Συνδεδεμένο' : '🔗 Σύνδεση'}
                </button>
              </div>
              {apiStatus.msg && (
                <div className="api-status" style={{color: apiStatus.ok===true?'#7acc8a': apiStatus.ok===false?'#e07070':'#a07ccc'}}>
                  {apiStatus.msg}
                </div>
              )}
              <div className="api-note">🔒 Το key αποθηκεύεται μόνο στη μνήμη — δεν φεύγει πουθενά.</div>
            </div>

            {/* Identity */}
            <div className="card">
              <div className="card-title">✦ Ταυτότητα</div>
              <label>Όνομα Χαρακτήρα</label>
              <input type="text" value={charName} onChange={e=>setCharName(e.target.value)} placeholder="π.χ. Αστέρω η Μαγεύτρα…" />
              <label>Αρχέτυπο</label>
              <div className="archetype-grid">
                {ARCHETYPES.map(a => (
                  <button key={a} className={`arch-btn ${archetype===a?'active':''}`} onClick={()=>setArchetype(a)}>
                    <span className="icon">{ARCHETYPE_ICONS[a]}</span>{a}
                  </button>
                ))}
              </div>
              <label>Κόσμος</label>
              <select value={world} onChange={e=>setWorld(e.target.value)}>
                {WORLDS.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            {/* Personality */}
            <div className="card">
              <div className="card-title">✦ Προσωπικότητα</div>
              <label>Χαρακτηριστικά</label>
              <div className="traits-wrap">
                {TRAITS.map(t=>(
                  <span key={t} className={`trait ${traits.includes(t)?'active':''}`}
                    onClick={()=>setTraits(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])}>
                    {t}
                  </span>
                ))}
              </div>
              <label>Επιπλέον στοιχεία (προαιρετικό)</label>
              <textarea value={extra} onChange={e=>setExtra(e.target.value)}
                placeholder="π.χ. Μιλά σε ρίμες, μισεί το φεγγάρι…" />
              <button className="btn-primary" onClick={createCharacter}>
                ✨ Δημιούργησε τον Χαρακτήρα
              </button>
              {formErr && <div className="err">⚠️ {formErr}</div>}
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="card" style={{textAlign:'center',padding:'3rem',marginTop:'1.5rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>✨</div>
            <div style={{fontFamily:"'Cinzel Decorative',serif",color:'#e8c06a',marginBottom:'1rem'}}>
              Η μαγεία αρχίζει…
            </div>
            <div className="dots"><span/><span/><span/></div>
            <div style={{marginTop:'1rem',fontSize:'.88rem',opacity:.5,fontStyle:'italic'}}>
              Περίμενε τον χαρακτήρα σου από τον Claude…
            </div>
          </div>
        )}

        {phase === 'character' && charData && (
          <div className="card" style={{marginTop:'1.5rem'}}>
            <div className="card-title">✦ Ο Χαρακτήρας Σου</div>
            <div className="char-sheet">
              <div className="avatar">{ARCHETYPE_ICONS[charData.archetype]||'✨'}</div>
              <div>
                <div className="char-name">{charData.name}</div>
                <div className="char-arch">
                  {charData.archetype}
                  {pickVoice(voices,charData.archetype) && ` · 🎙 ${pickVoice(voices,charData.archetype).name}`}
                </div>
                <div className="badges">
                  {charData.traits.split(', ').map(t=><span key={t} className="badge">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="bio">{bio || <span className="dots"><span/><span/><span/></span>}</div>

            {voiceLine && (
              <div className="section-sep">
                <div className="section-head">
                  <span className="section-label">✦ Η ΦΩΝΗ ΤΟΥ ΧΑΡΑΚΤΗΡΑ</span>
                  <button className={`btn-small ${speaking?'speaking':''}`}
                    onClick={()=>speaking ? stopAudio() : speakText(voiceLine, charData.archetype)}>
                    {speaking ? '⏹ Σταμάτα' : '🔊 Άκουσε'}
                  </button>
                </div>
                <div className="voice-bubble">{voiceLine}</div>
              </div>
            )}

            {/* Chat */}
            <div className="section-sep">
              <div className="section-label" style={{marginBottom:'.8rem'}}>✦ ΜΙΛΑ ΜΑΖΙ ΤΟΥ</div>
              <div className="chat-msgs">
                {chatMsgs.map((m,i)=>(
                  <div key={i} className={`msg ${m.role==='user'?'user':'char'}`}>
                    {m.text}
                    {m.role==='char' && (
                      <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'.8rem',opacity:.5,marginLeft:'.4rem'}}
                        onClick={()=>speakText(m.text, charData.archetype)}>🔊</button>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="msg char"><div className="dots"><span/><span/><span/></div></div>
                )}
                <div ref={chatEndRef}/>
              </div>
              <div className="chat-input-row">
                <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  placeholder="Πες κάτι στον χαρακτήρα…"
                  onKeyDown={e=>e.key==='Enter'&&sendChat()} />
                <button className="btn-send" onClick={sendChat} disabled={chatLoading}>Στείλε ✦</button>
              </div>
            </div>

            <button className="btn-sec" onClick={resetAll}>↩ Νέος Χαρακτήρας</button>
          </div>
        )}
      </div>
    </>
  );
}
