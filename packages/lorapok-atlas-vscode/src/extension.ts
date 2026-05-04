import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

const CAT_ICONS: Record<string, string> = {
  'AI & Machine Learning':'🤖','Developer Tools':'💻','E-Commerce & Finance':'💰',
  'Blockchain & Crypto':'⛓','Sports & Games':'🏋️','Maps & Geolocation':'🗺',
  'Music':'🎵','Education & Knowledge':'📚','Images & Media':'📸',
  'Health & Medicine':'🏥','Communication & Social':'📡','Food & Recipes':'🍕',
  'Real Estate & Property':'🏠','IoT & Hardware':'📡','HR & Productivity':'🧑‍💼',
  'Legal & Compliance':'🧾','Data & Analytics':'📊','Art & Culture':'🎨',
  'Streaming & Live':'📺','Privacy & Anonymity':'🕵️','News & Media':'📰',
  'Movies & Entertainment':'🎬','Weather & Environment':'🌤','Travel & Transport':'✈️',
  'Animals & Nature':'🐾','Security & Identity':'🔐','Space & Astronomy':'🚀',
  'Government & Public Data':'🏛','Science & Research':'🔬','Cloud & Infrastructure':'☁️',
  'Language & Translation':'🌍','Documents & PDF':'📄','QR & Barcodes':'🔢',
  'Advertising & Marketing':'📣',
}

function loadApis() {
  const dataPath = path.join(__dirname, '..', 'data', 'api_collection.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const apis: any[] = []
  const byCategory: Record<string, any[]> = {}
  for (const cat of raw.item) {
    const catApis: any[] = []
    for (const api of (cat.item || [])) {
      let auth = api.authRequired ?? null
      if (!auth) {
        const hdrs: any[] = api.request?.header || []
        if (hdrs.some((h: any) => String(h.value||'').includes('YOUR_') || String(h.value||'').includes('<<')))
          auth = 'API Key'
      }
      const item = {
        name: api.name, category: cat.name,
        description: api.request?.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: auth || null,
        authLink: api.authLink || null,
      }
      apis.push(item)
      catApis.push(item)
    }
    if (catApis.length) byCategory[cat.name] = catApis
  }
  return { apis, categories: Object.keys(byCategory).sort(), byCategory }
}

function buildHtml(apis: any[], categories: string[], byCategory: Record<string, any[]>): string {
  const apisJ = JSON.stringify(apis)
  const catsJ = JSON.stringify(categories)
  const byCatJ = JSON.stringify(byCategory)
  const iconsJ = JSON.stringify(CAT_ICONS)

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none';style-src 'unsafe-inline';script-src 'unsafe-inline';"/>
<title>Lorapok Atlas</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#070e18;--card:#0c1828;--card2:#091220;--border:#1a3050;--border2:#264560;--text:#d4e4f7;--muted:#4a6278;--dim:#334d63;--green:#4ade80;--sky:#38bdf8;--indigo:#818cf8;--red:#f87171;--yellow:#fbbf24}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;height:100vh;display:flex;flex-direction:column;overflow:hidden}

/* ── Navbar ── */
nav{flex-shrink:0;height:52px;background:rgba(7,14,24,.95);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:16px;backdrop-filter:blur(8px)}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.nav-logo svg{width:32px;height:32px}
.nav-brand{font-size:15px;font-weight:900;background:linear-gradient(90deg,#4ade80,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.nav-tag{font-size:9px;color:var(--dim);letter-spacing:1.5px;text-transform:uppercase;margin-top:1px}
.nav-search{flex:1;max-width:480px;position:relative}
.nav-search input{width:100%;background:#0c1828;border:1px solid var(--border);border-radius:8px;padding:7px 12px 7px 34px;color:var(--text);font-size:12px;outline:none;transition:border-color .15s}
.nav-search input:focus{border-color:var(--sky);background:#0d1f38}
.nav-search .si{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dim);font-size:13px;pointer-events:none}
.nav-stats{margin-left:auto;display:flex;gap:12px;flex-shrink:0}
.stat{text-align:center}
.stat-n{font-size:14px;font-weight:800;color:var(--green)}
.stat-l{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px}

/* ── Layout ── */
.layout{flex:1;display:flex;overflow:hidden}

/* ── Sidebar ── */
.sidebar{width:220px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;background:#060d18}
.sidebar-hdr{padding:10px 14px 6px;font-size:9px;font-weight:700;color:var(--dim);letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #0d1e30}
.cat-row{display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;transition:background .12s;border-bottom:1px solid #0a1520}
.cat-row:hover{background:rgba(255,255,255,.03)}
.cat-row.active{background:rgba(56,189,248,.08);border-right:2px solid var(--sky)}
.cat-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0}
.cat-name{flex:1;font-size:11px;color:#8aaccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cat-count{font-size:9px;color:var(--dim);background:#0c1828;border:1px solid var(--border);border-radius:8px;padding:1px 5px;flex-shrink:0}

/* ── Main ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.toolbar{flex-shrink:0;padding:8px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;background:#060d18}
.filter-btn{padding:4px 10px;border-radius:12px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.filter-btn.active{border-color:var(--sky);color:var(--sky);background:rgba(56,189,248,.1)}
.sort-sel{background:#0c1828;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:10px;padding:4px 8px;outline:none;cursor:pointer}
.result-count{margin-left:auto;font-size:10px;color:var(--dim)}

/* ── Grid ── */
.grid-wrap{flex:1;overflow-y:auto;padding:12px 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.card{background:linear-gradient(135deg,var(--card) 0%,var(--card2) 100%);border:1px solid var(--border);border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(56,189,248,.04),transparent);opacity:0;transition:opacity .18s}
.card:hover{border-color:var(--border2);transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,.4)}
.card:hover::before{opacity:1}
.card.selected{border-color:var(--sky);box-shadow:0 0 0 1px rgba(56,189,248,.3)}
.card-name{font-size:12px;font-weight:700;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-cat{font-size:10px;color:var(--muted);margin-bottom:4px}
.card-desc{font-size:11px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;min-height:30px}
.card-foot{display:flex;align-items:center;gap:6px}
.method{font-size:9px;font-weight:800;font-family:monospace;padding:2px 6px;border-radius:4px}
.m-GET{background:rgba(52,211,153,.15);color:#34d399}
.m-POST{background:rgba(129,140,248,.15);color:#818cf8}
.m-PUT{background:rgba(251,191,36,.15);color:#fbbf24}
.m-DELETE{background:rgba(248,113,113,.15);color:#f87171}
.m-PATCH{background:rgba(56,189,248,.15);color:#38bdf8}
.badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px}
.b-free{background:#0d2b1a;color:#34d399;border:1px solid #065f46}
.b-key{background:#1a1a2e;color:#818cf8;border:1px solid #3730a3}
.b-oauth{background:#2d1b1b;color:#f87171;border:1px solid #991b1b}
.empty{grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--dim)}
.empty-icon{font-size:40px;margin-bottom:12px}

/* ── Modal overlay ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.overlay.show{display:flex}
.modal{background:linear-gradient(135deg,#0c1828,#091220);border:1px solid var(--border2);border-radius:14px;width:min(680px,95vw);max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.8);position:relative}
.modal-hdr{padding:20px 24px 0;display:flex;align-items:flex-start;gap:12px}
.modal-method{font-size:11px;font-weight:800;font-family:monospace;padding:3px 8px;border-radius:5px;flex-shrink:0;margin-top:3px}
.modal-title{flex:1}
.modal-name{font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px}
.modal-cat{font-size:11px;color:var(--muted)}
.modal-close{background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0;line-height:1;flex-shrink:0;transition:color .12s}
.modal-close:hover{color:var(--red)}
.modal-url{font-family:monospace;font-size:11px;color:#34d399;background:#050c18;border:1px solid var(--border);border-radius:7px;padding:10px 14px;margin:14px 24px;word-break:break-all;line-height:1.5}
.modal-desc{font-size:12px;color:#8aaccc;line-height:1.6;padding:0 24px 14px}
.modal-section{padding:0 24px 14px}
.modal-section-title{font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.lang-tabs{display:flex;gap:6px;margin-bottom:10px}
.lt{padding:4px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;transition:all .12s}
.lt.active{border-color:#34d399;color:#34d399;background:rgba(52,211,153,.1)}
.snippet{background:#050c18;border:1px solid var(--border);border-radius:8px;padding:14px;font-family:'Fira Code',monospace;font-size:11px;color:#a5f3fc;white-space:pre;overflow-x:auto;max-height:200px;overflow-y:auto;line-height:1.6}
.modal-actions{display:flex;gap:8px;padding:0 24px 20px;flex-wrap:wrap}
.btn{padding:8px 18px;border-radius:8px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px}
.btn-ins{background:var(--green);color:#000}
.btn-ins:hover{background:#34d399;transform:translateY(-1px)}
.btn-cpy{background:rgba(56,189,248,.15);color:var(--sky);border:1px solid rgba(56,189,248,.3)}
.btn-cpy:hover{background:rgba(56,189,248,.25)}
.btn-auth{background:rgba(129,140,248,.15);color:var(--indigo);border:1px solid rgba(129,140,248,.3)}
.btn-auth:hover{background:rgba(129,140,248,.25)}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px}
</style>
</head>
<body>
<!-- Navbar -->
<nav>
  <div class="nav-logo">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#818cf8"/></linearGradient>
      </defs>
      <ellipse cx="16" cy="25" rx="4" ry="3" fill="url(#g1)" opacity=".65"/>
      <ellipse cx="16" cy="20" rx="5" ry="3.5" fill="url(#g1)" opacity=".8"/>
      <ellipse cx="16" cy="14.5" rx="6" ry="4" fill="url(#g1)"/>
      <ellipse cx="16" cy="9" rx="6" ry="5.5" fill="url(#g1)"/>
      <circle cx="13.5" cy="8.2" r="1.5" fill="#0a1628"/><circle cx="13.5" cy="8.2" r=".8" fill="#38bdf8"/>
      <circle cx="18.5" cy="8.2" r="1.5" fill="#0a1628"/><circle cx="18.5" cy="8.2" r=".8" fill="#818cf8"/>
      <line x1="13" y1="4.2" x2="11" y2="2" stroke="url(#g2)" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="10.5" cy="1.5" r="1" fill="#38bdf8"/>
      <line x1="19" y1="4.2" x2="21" y2="2" stroke="url(#g2)" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="21.5" cy="1.5" r="1" fill="#818cf8"/>
      <path d="M10 14.5 Q7.5 14 7 15 Q7.5 16 10 15.5" fill="url(#g1)" opacity=".8"/>
      <path d="M22 14.5 Q24.5 14 25 15 Q24.5 16 22 15.5" fill="url(#g1)" opacity=".8"/>
    </svg>
    <div><div class="nav-brand">Lorapok Atlas</div><div class="nav-tag">◈ Open Source Intelligence</div></div>
  </div>
  <div class="nav-search">
    <span class="si">🔍</span>
    <input id="search" placeholder="Search 2100+ APIs…" oninput="onSearch()" autocomplete="off"/>
  </div>
  <div class="nav-stats">
    <div class="stat"><div class="stat-n" id="s-total">0</div><div class="stat-l">APIs</div></div>
    <div class="stat"><div class="stat-n" id="s-cats">0</div><div class="stat-l">Categories</div></div>
    <div class="stat"><div class="stat-n" id="s-free">0</div><div class="stat-l">Free</div></div>
  </div>
</nav>

<!-- Layout -->
<div class="layout">
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-hdr">Categories</div>
    <div id="cat-list"></div>
  </div>
  <!-- Main -->
  <div class="main">
    <div class="toolbar">
      <button class="filter-btn active" id="f-all" onclick="setAuth('all')">All</button>
      <button class="filter-btn" id="f-free" onclick="setAuth('free')">🔓 Free</button>
      <button class="filter-btn" id="f-key" onclick="setAuth('key')">🗝 Key</button>
      <button class="filter-btn" id="f-oauth" onclick="setAuth('oauth')">🔑 OAuth</button>
      <select class="sort-sel" id="sort" onchange="render()">
        <option value="default">Default order</option>
        <option value="az">A → Z</option>
        <option value="za">Z → A</option>
        <option value="method">By method</option>
      </select>
      <span class="result-count" id="rcount"></span>
    </div>
    <div class="grid-wrap"><div class="grid" id="grid"></div></div>
  </div>
</div>

<!-- Modal -->
<div class="overlay" id="overlay" onclick="overlayClick(event)">
  <div class="modal" id="modal">
    <div class="modal-hdr">
      <span class="modal-method" id="m-method"></span>
      <div class="modal-title">
        <div class="modal-name" id="m-name"></div>
        <div class="modal-cat" id="m-cat"></div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-url" id="m-url"></div>
    <div class="modal-desc" id="m-desc"></div>
    <div class="modal-section">
      <div class="modal-section-title">Code Snippet</div>
      <div class="lang-tabs">
        <button class="lt active" onclick="setLang('javascript',this)">JavaScript</button>
        <button class="lt" onclick="setLang('python',this)">Python</button>
        <button class="lt" onclick="setLang('curl',this)">cURL</button>
      </div>
      <pre class="snippet" id="m-snippet"></pre>
    </div>
    <div class="modal-actions" id="m-actions"></div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
const ALL = ${apisJ};
const CATS = ${catsJ};
const BY_CAT = ${byCatJ};
const ICONS = ${iconsJ};

let activeCat = 'All';
let activeAuth = 'all';
let activeLang = 'javascript';
let query = '';
let selectedApi = null;

// Stats
document.getElementById('s-total').textContent = ALL.length;
document.getElementById('s-cats').textContent = CATS.length;
document.getElementById('s-free').textContent = ALL.filter(a => !a.authRequired).length;

// Build sidebar
const catList = document.getElementById('cat-list');
function buildSidebar() {
  let html = \`<div class="cat-row \${activeCat==='All'?'active':''}" onclick="setCat('All')">
    <span class="cat-icon">🌐</span><span class="cat-name">All APIs</span>
    <span class="cat-count">\${ALL.length}</span></div>\`;
  for (const c of CATS) {
    const n = (BY_CAT[c]||[]).length;
    html += \`<div class="cat-row \${activeCat===c?'active':''}" onclick="setCat('\${c.replace(/'/g,"\\\\'")}')">
      <span class="cat-icon">\${ICONS[c]||'📦'}</span>
      <span class="cat-name">\${c}</span>
      <span class="cat-count">\${n}</span></div>\`;
  }
  catList.innerHTML = html;
}

function setCat(c) { activeCat = c; buildSidebar(); render(); }
function setAuth(a) {
  activeAuth = a;
  ['all','free','key','oauth'].forEach(x => document.getElementById('f-'+x).classList.toggle('active', x===a));
  render();
}
function onSearch() { query = document.getElementById('search').value.toLowerCase().trim(); render(); }

function filtered() {
  let r = activeCat === 'All' ? ALL : (BY_CAT[activeCat]||[]);
  if (query) r = r.filter(a => a.name.toLowerCase().includes(query)||a.description.toLowerCase().includes(query)||a.category.toLowerCase().includes(query));
  if (activeAuth === 'free') r = r.filter(a => !a.authRequired);
  if (activeAuth === 'key') r = r.filter(a => a.authRequired && a.authRequired !== 'OAuth');
  if (activeAuth === 'oauth') r = r.filter(a => a.authRequired === 'OAuth');
  const sort = document.getElementById('sort').value;
  if (sort === 'az') r = [...r].sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'za') r = [...r].sort((a,b) => b.name.localeCompare(a.name));
  if (sort === 'method') r = [...r].sort((a,b) => a.method.localeCompare(b.method));
  return r;
}

function badgeHtml(auth) {
  if (!auth) return '<span class="badge b-free">🔓 Free</span>';
  if (auth==='OAuth') return '<span class="badge b-oauth">🔑 OAuth</span>';
  return '<span class="badge b-key">🗝 Key</span>';
}

function render() {
  const results = filtered();
  document.getElementById('rcount').textContent = results.length + ' APIs';
  const grid = document.getElementById('grid');
  if (!results.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div>No APIs found</div>';
    return;
  }
  grid.innerHTML = results.slice(0, 200).map(a => {
    const idx = ALL.indexOf(a);
    return \`<div class="card \${selectedApi===a?'selected':''}" onclick="openModal(\${idx})">
      <div class="card-name">\${a.name}</div>
      <div class="card-cat">\${a.category}</div>
      <div class="card-desc">\${a.description||a.url}</div>
      <div class="card-foot">
        <span class="method m-\${a.method}">\${a.method}</span>
        \${badgeHtml(a.authRequired)}
      </div>
    </div>\`;
  }).join('');
}

function getSnippet(api, lang) {
  const {url, method, authRequired} = api;
  const isPost = ['POST','PUT','PATCH'].includes(method);
  if (lang==='javascript') return \`const response = await fetch('\${url}', {
  method: '\${method}',
  headers: {
    'Accept': 'application/json',\${authRequired?"\\n    'Authorization': 'Bearer YOUR_KEY',":""}
  },\${isPost?"\\n  body: JSON.stringify({}),":''}
});
const data = await response.json();
console.log(data);\`;
  if (lang==='python') return \`import requests

response = requests.\${method.toLowerCase()}(
  '\${url}',
  headers={'Accept': 'application/json'\${authRequired?", 'Authorization': 'Bearer YOUR_KEY'":""}},
)
print(response.json())\`;
  return \`curl --request \${method} \\\\
  --url '\${url}' \\\\
  --header 'Accept: application/json'\${authRequired?" \\\\\\n  --header 'Authorization: Bearer YOUR_KEY'":""}\`;
}

function openModal(idx) {
  selectedApi = ALL[idx];
  const a = selectedApi;
  const mColors = {GET:'rgba(52,211,153,.15)',POST:'rgba(129,140,248,.15)',PUT:'rgba(251,191,36,.15)',DELETE:'rgba(248,113,113,.15)',PATCH:'rgba(56,189,248,.15)'};
  const mText = {GET:'#34d399',POST:'#818cf8',PUT:'#fbbf24',DELETE:'#f87171',PATCH:'#38bdf8'};
  const mm = document.getElementById('m-method');
  mm.textContent = a.method;
  mm.style.background = mColors[a.method]||mColors.GET;
  mm.style.color = mText[a.method]||mText.GET;
  document.getElementById('m-name').textContent = a.name;
  document.getElementById('m-cat').textContent = a.category;
  document.getElementById('m-url').textContent = a.url;
  document.getElementById('m-desc').textContent = a.description || '';
  document.querySelectorAll('.lt').forEach((t,i) => t.classList.toggle('active', i===0));
  activeLang = 'javascript';
  document.getElementById('m-snippet').textContent = getSnippet(a, activeLang);
  const actions = document.getElementById('m-actions');
  let btns = \`<button class="btn btn-ins" onclick="insertSnippet()">⬆ Insert into Editor</button>
    <button class="btn btn-cpy" onclick="copySnippet()">⎘ Copy Snippet</button>\`;
  if (a.authLink) btns += \`<a href="\${a.authLink}" target="_blank" style="text-decoration:none"><button class="btn btn-auth">🔑 Get API Key</button></a>\`;
  actions.innerHTML = btns;
  document.getElementById('overlay').classList.add('show');
}

function setLang(lang, btn) {
  activeLang = lang;
  document.querySelectorAll('.lt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (selectedApi) document.getElementById('m-snippet').textContent = getSnippet(selectedApi, lang);
}

function closeModal() {
  document.getElementById('overlay').classList.remove('show');
  selectedApi = null;
}
function overlayClick(e) { if (e.target===document.getElementById('overlay')) closeModal(); }

function insertSnippet() {
  if (!selectedApi) return;
  vscode.postMessage({type:'insert', code: getSnippet(selectedApi, activeLang), lang: activeLang});
}
function copySnippet() {
  if (!selectedApi) return;
  vscode.postMessage({type:'copy', code: getSnippet(selectedApi, activeLang)});
}

buildSidebar();
render();
</script>
</body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
  const { apis, categories, byCategory } = loadApis()
  let panel: vscode.WebviewPanel | undefined
  let lastEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.uri.scheme !== 'output') lastEditor = e
    })
  )

  function openPanel() {
    if (panel) { panel.reveal(vscode.ViewColumn.One); return }

    panel = vscode.window.createWebviewPanel(
      'lorapok-atlas',
      '🐛 Lorapok Atlas',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    )

    panel.webview.html = buildHtml(apis, categories, byCategory)

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'insert') {
        const editor = lastEditor ?? vscode.window.visibleTextEditors.find(e => e.document.uri.scheme === 'file')
        if (!editor) { vscode.window.showWarningMessage('Open a file first to insert a snippet.'); return }
        await editor.edit(b => b.insert(editor.selection.active, msg.code))
        await vscode.window.showTextDocument(editor.document, editor.viewColumn)
        vscode.window.showInformationMessage('✓ Snippet inserted!')
      }
      if (msg.type === 'copy') {
        await vscode.env.clipboard.writeText(msg.code)
        vscode.window.showInformationMessage('✓ Copied to clipboard!')
      }
    })

    panel.onDidDispose(() => { panel = undefined })
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('lorapok-atlas.open', openPanel)
  )
}

export function deactivate() {}
