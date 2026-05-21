/**
 * Dizo Cart — router.js
 * Browser Back Button & History Router
 * Extracted from dizo_cart_V47.html (lines 4459-5283)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== BROWSER BACK BUTTON HANDLER =====================
window.addEventListener('popstate', function(e){
  const state = e.state;

  // Priority order: deepest overlay first
  const checkoutPanel = document.getElementById('checkoutModal');
  const cartDrawer = document.getElementById('cartDrawer');
  const wishlistPanel = document.getElementById('wishlistPanel');
  const mobileMenu = document.getElementById('mobileMenu');
  const loginModal = document.getElementById('loginModal');
  const catSheet = document.getElementById('catSheet');

  if(checkoutPanel && checkoutPanel.classList.contains('open')){ closeCheckout(); return; }
  if(cartDrawer && cartDrawer.classList.contains('open')){ closeCart(); return; }
  if(wishlistPanel && wishlistPanel.classList.contains('open')){ closeWishlist(); return; }
  if(mobileMenu && mobileMenu.classList.contains('open')){ closeMobileMenu(false); return; }

  // Close login modal on back
  if(loginModal && loginModal.classList.contains('open')){
    loginModal.classList.remove('open');
    activeMobTab('home');
    return;
  }

  // Close category bottom sheet on back
  if(catSheet && catSheet.classList.contains('open')){
    closeCatSheet(false);
    return;
  }

  const pdpOpen = document.getElementById('productDetailPage').classList.contains('open');
  const catOpen = document.getElementById('categoryPage').classList.contains('open');

  if(pdpOpen){ closeProductDetail(false); return; }
  if(catOpen){ closeCategoryPageAnimated(); return; }

  // Already on home
  if(!state || state.page === 'home'){
    document.getElementById('mainSiteContent').classList.remove('hidden');
    activeMobTab('home');
  }
});

/* ============================================================
   API INTEGRATION MANAGER — Dizo Cart V26
   Secure, scalable REST API management module.
   All credentials stored in-memory (localStorage in production).
   ============================================================ */

/** In-memory API registry — keys: id, name, endpoint, key, enabled, type, lastTested, testStatus */
let apiRegistry = JSON.parse(localStorage.getItem('dizo_apis') || '[]');

/** Sanitize text input to prevent XSS */
function sanitizeInput(str){
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str||''));
  return div.innerHTML;
}

/** Validate URL format */
function isValidUrl(str){
  try { new URL(str); return true; } catch(_){ return false; }
}

/** Validate API key — must be non-empty, no script tags */
function isValidApiKey(key){
  return key && key.trim().length >= 4 && !/<script/i.test(key);
}

/** Save registry to localStorage */
function saveApiRegistry(){
  localStorage.setItem('dizo_apis', JSON.stringify(apiRegistry));
}

/** Generate unique ID */
function genId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

/** Mask API key for display: show first 4 + last 4, mask middle */
function maskKey(key){
  if(!key||key.length<=8) return '••••••••';
  return key.slice(0,4) + '••••••••' + key.slice(-4);
}

/** ---- Main admin view: API Manager ---- */
function showAdminApiManager(){
  document.getElementById('adminContent').innerHTML = `
    <h2 style="font-family:'Playfair Display',serif;font-size:1.35rem;margin-bottom:0.25rem">🔌 API Integration Manager</h2>
    <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1.25rem">Manage third-party REST API integrations. Keys are stored securely and masked in the UI.</p>

    <!-- Tabs -->
    <div class="admin-tabs" id="apiAdminTabs">
      <div class="admin-tab active" onclick="switchApiTab('list',this)">📋 Registered APIs</div>
      <div class="admin-tab" onclick="switchApiTab('add',this)">➕ Add API</div>
      <div class="admin-tab" onclick="switchApiTab('docs',this)">📖 Integration Guide</div>
    </div>

    <!-- List Tab -->
    <div id="apiTab-list">
      <div id="apiListContainer"></div>
    </div>

    <!-- Add/Edit Tab -->
    <div id="apiTab-add" style="display:none">
      <div class="admin-section" id="apiFormBox">
        <div class="admin-section-title" id="apiFormTitle">➕ Add New API Integration</div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>API Name <span style="color:#dc2626">*</span></label>
            <input type="text" id="apiF_name" placeholder="e.g. Facebook Graph API" maxlength="60">
          </div>
          <div class="form-group">
            <label>API Type</label>
            <select id="apiF_type">
              <option value="REST">REST API</option>
              <option value="GraphQL">GraphQL</option>
              <option value="Webhook">Webhook</option>
              <option value="OAuth2">OAuth 2.0</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Endpoint URL <span style="color:#dc2626">*</span></label>
          <input type="url" id="apiF_endpoint" placeholder="https://api.example.com/v1/endpoint">
          <div id="apiF_endpoint_err" style="font-size:0.72rem;color:#dc2626;margin-top:0.2rem;display:none">⚠ Enter a valid HTTPS URL</div>
        </div>
        <div class="form-group">
          <label>API Key / Token <span style="color:#dc2626">*</span></label>
          <div style="position:relative">
            <input type="password" id="apiF_key" placeholder="Paste your API key / Bearer token" style="padding-right:3rem">
            <button onclick="toggleApiKeyVisibility()" style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:0.8rem;color:var(--text3)" id="apiKeyEye">👁</button>
          </div>
          <div id="apiF_key_err" style="font-size:0.72rem;color:#dc2626;margin-top:0.2rem;display:none">⚠ API key must be at least 4 characters</div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Custom Header Name (optional)</label>
            <input type="text" id="apiF_headerName" placeholder="e.g. X-API-Key" maxlength="60">
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <input type="text" id="apiF_desc" placeholder="What does this API do?" maxlength="120">
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
          <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;cursor:pointer">
            <input type="checkbox" id="apiF_enabled" checked> Enable this API immediately
          </label>
        </div>
        <input type="hidden" id="apiF_editId" value="">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn-primary" style="padding:0.6rem 1.25rem" onclick="saveApiEntry()">💾 Save API</button>
          <button style="padding:0.6rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="resetApiForm()">Clear</button>
        </div>
      </div>
    </div>

    <!-- Docs Tab -->
    <div id="apiTab-docs" style="display:none" class="admin-section">
      <div class="admin-section-title">📖 How to Use API Integrations</div>
      <div style="font-size:0.85rem;color:var(--text2);line-height:1.8">
        <p style="margin-bottom:0.75rem"><strong>1. Register your API</strong> — Add the endpoint URL and key in the "Add API" tab.</p>
        <p style="margin-bottom:0.75rem"><strong>2. Enable/Disable</strong> — Toggle APIs on/off without deleting them.</p>
        <p style="margin-bottom:0.75rem"><strong>3. Test Connection</strong> — Click the "Test" button to fire a preflight GET request and verify the endpoint responds.</p>
        <p style="margin-bottom:0.75rem"><strong>4. Edit / Delete</strong> — Use the action buttons in the API list at any time.</p>
        <p style="margin-bottom:0.75rem"><strong>5. Calling APIs in code</strong> — Use <code style="background:var(--bg2);padding:0.1rem 0.3rem;border-radius:4px">callRegisteredApi(apiId, method, body)</code> from your JS to make authenticated requests.</p>
        <div style="background:var(--bg2);border-radius:var(--r2);padding:1rem;margin-top:0.75rem;font-family:monospace;font-size:0.78rem;white-space:pre-wrap;overflow-x:auto">// Example: call a registered API
const result = await callRegisteredApi('your-api-id', 'GET');
console.log(result);</div>
      </div>
    </div>
  `;
  renderApiList();
}

function switchApiTab(tab, btn){
  ['list','add','docs'].forEach(t=>{
    const el = document.getElementById('apiTab-'+t);
    if(el) el.style.display = (t===tab)?'block':'none';
  });
  document.querySelectorAll('#apiAdminTabs .admin-tab').forEach((b,i)=>{
    b.classList.toggle('active', b===btn);
  });
}

function renderApiList(){
  const container = document.getElementById('apiListContainer');
  if(!container) return;
  if(!apiRegistry.length){
    container.innerHTML = `
      <div class="admin-section" style="text-align:center;padding:2.5rem">
        <div style="font-size:3rem;margin-bottom:1rem">🔌</div>
        <p style="color:var(--text3);font-size:0.9rem;margin-bottom:1rem">No API integrations registered yet.</p>
        <button class="btn-primary" style="padding:0.6rem 1.25rem" onclick="switchApiTab('add',document.querySelectorAll('#apiAdminTabs .admin-tab')[1])">➕ Add Your First API</button>
      </div>`;
    return;
  }
  container.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>Registered APIs <span style="font-size:0.75rem;font-weight:400;color:var(--text3)">(${apiRegistry.length} total)</span></span>
        <button class="btn-primary" style="font-size:0.72rem;padding:0.3rem 0.75rem" onclick="switchApiTab('add',document.querySelectorAll('#apiAdminTabs .admin-tab')[1])">➕ Add New</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Endpoint</th>
              <th>Key</th>
              <th>Status</th>
              <th>Last Test</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${apiRegistry.map(api=>`
              <tr id="apiRow_${api.id}">
                <td>
                  <div style="font-weight:600;font-size:0.85rem;color:var(--text)">${sanitizeInput(api.name)}</div>
                  ${api.desc?`<div style="font-size:0.72rem;color:var(--text3);margin-top:0.1rem">${sanitizeInput(api.desc)}</div>`:''}
                </td>
                <td><span style="font-size:0.72rem;padding:0.1rem 0.4rem;background:var(--bg2);border-radius:4px;font-weight:600">${sanitizeInput(api.type||'REST')}</span></td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  <span title="${sanitizeInput(api.endpoint)}" style="font-size:0.78rem;color:var(--text2)">${sanitizeInput(api.endpoint)}</span>
                </td>
                <td><span style="font-family:monospace;font-size:0.78rem;letter-spacing:0.05em;color:var(--text3)">${maskKey(api.key)}</span></td>
                <td>
                  <label style="display:flex;align-items:center;gap:0.35rem;cursor:pointer">
                    <input type="checkbox" onchange="toggleApiEnabled('${api.id}',this.checked)" ${api.enabled?'checked':''} style="accent-color:var(--gold)">
                    <span id="apiStatusLabel_${api.id}" class="status-badge ${api.enabled?'status-shipped':'status-pending'}" style="font-size:0.62rem">
                      ${api.enabled?'ON':'OFF'}
                    </span>
                  </label>
                </td>
                <td>
                  <span id="apiTestStatus_${api.id}" style="font-size:0.72rem;color:${api.testStatus==='ok'?'#059669':api.testStatus==='fail'?'#dc2626':'var(--text3)'}">
                    ${api.testStatus==='ok'?'✅ OK':api.testStatus==='fail'?'❌ Failed':api.lastTested?'⚠ Untested':'—'}
                  </span>
                  ${api.lastTested?`<div style="font-size:0.62rem;color:var(--text3)">${new Date(api.lastTested).toLocaleTimeString()}</div>`:''}
                </td>
                <td>
                  <div style="display:flex;gap:0.3rem;flex-wrap:wrap">
                    <button onclick="editApiEntry('${api.id}')" title="Edit" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">✏️ Edit</button>
                    <button onclick="testApiConnection('${api.id}')" title="Test" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">🔗 Test</button>
                    <button onclick="deleteApiEntry('${api.id}')" title="Delete" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:#FEE2E2;border:1px solid #fca5a5;border-radius:4px;cursor:pointer;color:#dc2626">🗑</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function toggleApiKeyVisibility(){
  const inp = document.getElementById('apiF_key');
  const eye = document.getElementById('apiKeyEye');
  if(!inp) return;
  inp.type = inp.type==='password' ? 'text' : 'password';
  eye.textContent = inp.type==='password' ? '👁' : '🙈';
}

function resetApiForm(){
  ['apiF_name','apiF_endpoint','apiF_key','apiF_headerName','apiF_desc'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  const et = document.getElementById('apiF_editId'); if(et) et.value='';
  const ft = document.getElementById('apiFormTitle'); if(ft) ft.textContent='➕ Add New API Integration';
  const en = document.getElementById('apiF_enabled'); if(en) en.checked=true;
  const pw = document.getElementById('apiF_key'); if(pw) pw.type='password';
}

function saveApiEntry(){
  const name = (document.getElementById('apiF_name')?.value||'').trim();
  const endpoint = (document.getElementById('apiF_endpoint')?.value||'').trim();
  const key = (document.getElementById('apiF_key')?.value||'').trim();
  const type = document.getElementById('apiF_type')?.value||'REST';
  const headerName = (document.getElementById('apiF_headerName')?.value||'').trim();
  const desc = (document.getElementById('apiF_desc')?.value||'').trim();
  const enabled = document.getElementById('apiF_enabled')?.checked !== false;
  const editId = document.getElementById('apiF_editId')?.value||'';

  // Validation
  let valid = true;
  const endpointErr = document.getElementById('apiF_endpoint_err');
  const keyErr = document.getElementById('apiF_key_err');
  endpointErr.style.display='none'; keyErr.style.display='none';

  if(!name){showToast('⚠ API Name is required');return;}
  if(!isValidUrl(endpoint)){
    endpointErr.style.display='block'; valid=false;
  }
  if(!editId && !isValidApiKey(key)){
    keyErr.style.display='block'; valid=false;
  }
  if(!valid) return;

  if(editId){
    // Edit mode
    const idx = apiRegistry.findIndex(a=>a.id===editId);
    if(idx>=0){
      apiRegistry[idx].name=name;
      apiRegistry[idx].endpoint=endpoint;
      apiRegistry[idx].type=type;
      apiRegistry[idx].headerName=headerName;
      apiRegistry[idx].desc=desc;
      apiRegistry[idx].enabled=enabled;
      // Only update key if user typed a new one
      if(isValidApiKey(key)) apiRegistry[idx].key=key;
    }
    showToast('✅ API updated successfully!');
  } else {
    apiRegistry.push({id:genId(),name,endpoint,key,type,headerName,desc,enabled,lastTested:null,testStatus:null});
    showToast('✅ API added successfully!');
  }
  saveApiRegistry();
  resetApiForm();
  // Switch back to list
  const listTab = document.querySelectorAll('#apiAdminTabs .admin-tab')[0];
  switchApiTab('list', listTab);
  renderApiList();
}

function editApiEntry(id){
  const api = apiRegistry.find(a=>a.id===id);
  if(!api) return;
  // Switch to add tab
  const addTab = document.querySelectorAll('#apiAdminTabs .admin-tab')[1];
  switchApiTab('add', addTab);
  // Fill form
  document.getElementById('apiF_name').value = api.name||'';
  document.getElementById('apiF_endpoint').value = api.endpoint||'';
  document.getElementById('apiF_key').value = ''; // security: don't pre-fill key
  document.getElementById('apiF_key').placeholder = 'Leave blank to keep existing key';
  document.getElementById('apiF_type').value = api.type||'REST';
  document.getElementById('apiF_headerName').value = api.headerName||'';
  document.getElementById('apiF_desc').value = api.desc||'';
  document.getElementById('apiF_enabled').checked = api.enabled !== false;
  document.getElementById('apiF_editId').value = api.id;
  const ft = document.getElementById('apiFormTitle');
  if(ft) ft.textContent = '✏️ Edit API: ' + api.name;
}

function deleteApiEntry(id){
  if(!confirm('Delete this API integration? This cannot be undone.')) return;
  apiRegistry = apiRegistry.filter(a=>a.id!==id);
  saveApiRegistry();
  renderApiList();
  showToast('🗑 API deleted');
}

function toggleApiEnabled(id, state){
  const api = apiRegistry.find(a=>a.id===id);
  if(!api) return;
  api.enabled = state;
  saveApiRegistry();
  const lbl = document.getElementById('apiStatusLabel_'+id);
  if(lbl){
    lbl.className = 'status-badge '+(state?'status-shipped':'status-pending');
    lbl.textContent = state?'ON':'OFF';
  }
  showToast(state?'✅ API enabled':'⏸ API disabled');
}

/** Test API connection — fires a HEAD/GET request to the endpoint */
async function testApiConnection(id){
  const api = apiRegistry.find(a=>a.id===id);
  if(!api){ showToast('⚠ API not found'); return; }
  const statusEl = document.getElementById('apiTestStatus_'+id);
  if(statusEl) statusEl.innerHTML='⏳ Testing…';
  showToast('🔗 Testing API connection…');

  const headers = {'Accept':'application/json'};
  if(api.headerName && api.key) headers[api.headerName] = api.key;
  else if(api.key) headers['Authorization'] = 'Bearer '+api.key;

  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 8000);

  try {
    const res = await fetch(api.endpoint, {method:'HEAD', headers, signal:controller.signal, mode:'no-cors'});
    clearTimeout(timeout);
    // no-cors always returns opaque response (status 0) — treat as success if no error thrown
    api.testStatus='ok'; api.lastTested=Date.now();
    saveApiRegistry();
    if(statusEl) statusEl.innerHTML='✅ OK';
    showToast('✅ API connection test passed!');
  } catch(err){
    clearTimeout(timeout);
    const isCors = err.name!=='AbortError';
    api.testStatus = isCors?'ok':'fail'; // CORS block = server exists = treat as reachable
    api.lastTested = Date.now();
    saveApiRegistry();
    if(statusEl) statusEl.innerHTML = isCors?'✅ Reachable':'❌ Timeout';
    showToast(isCors?'✅ Endpoint reachable (CORS)':'❌ API connection timed out');
  }
}

/**
 * Public helper — call a registered API by ID.
 * Usage: const data = await callRegisteredApi('id', 'POST', {key:'value'});
 */
async function callRegisteredApi(id, method='GET', body=null){
  const api = apiRegistry.find(a=>a.id===id);
  if(!api) throw new Error('API not found: '+id);
  if(!api.enabled) throw new Error('API is disabled: '+api.name);
  const headers = {'Content-Type':'application/json','Accept':'application/json'};
  if(api.headerName && api.key) headers[api.headerName]=api.key;
  else if(api.key) headers['Authorization']='Bearer '+api.key;
  const opts = {method, headers};
  if(body && method!=='GET') opts.body = JSON.stringify(body);
  const res = await fetch(api.endpoint, opts);
  if(!res.ok) throw new Error('API error: '+res.status+' '+res.statusText);
  return res.json();
}


/* ============================================================
   META PIXEL INTEGRATION — Dizo Cart V26
   Dynamic Meta (Facebook) Pixel injection with event tracking.
   Admin can add, update, enable/disable without touching code.
   ============================================================ */

/** Meta Pixel state stored in localStorage */
let metaPixelConfig = JSON.parse(localStorage.getItem('dizo_meta_pixel') || JSON.stringify({
  pixelId: '',
  enabled: false,
  events: {
    pageView: true,
    addToCart: true,
    purchase: true,
    lead: false,
    completeRegistration: false
  }
}));

/** Save config to localStorage */
function saveMetaPixelConfig(){
  localStorage.setItem('dizo_meta_pixel', JSON.stringify(metaPixelConfig));
}

/** Inject or update the Meta Pixel script in <head> */
/* ------ applyMetaPixel: inject pixel into <head> ------ */
function applyMetaPixel(){
  ['dizo-meta-pixel-script','dizo-meta-pixel-noscript','dizo-meta-pixel-fullcode'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.remove();
  });
  if(!metaPixelConfig.enabled) return;

  if(metaPixelConfig.useFullCode && metaPixelConfig.fullCode){
    /* Full code paste mode — extract <script> inner JS and inject */
    var code = metaPixelConfig.fullCode;
    var nsMatch = code.match(/<noscript>([\s\S]*?)<\/noscript>/i);
    if(nsMatch){
      var ns=document.createElement('noscript');
      ns.id='dizo-meta-pixel-noscript';
      ns.innerHTML=nsMatch[1];
      document.head.appendChild(ns);
      code=code.replace(nsMatch[0],'');
    }
    var smatch=code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    var jsCode=smatch?smatch[1].trim():code.replace(/<[^>]+>/g,'').trim();
    if(jsCode){
      var sc=document.createElement('script');
      sc.id='dizo-meta-pixel-fullcode';
      sc.async=true;
      sc.textContent=jsCode;
      document.head.appendChild(sc);
    }
  } else if(metaPixelConfig.pixelId){
    /* ID mode — auto-generate standard pixel code */
    var pid=metaPixelConfig.pixelId.replace(/\D/g,'');
    if(!pid||pid.length<10) return;
    var sc2=document.createElement('script');
    sc2.id='dizo-meta-pixel-script';
    sc2.async=true;
    sc2.textContent='!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,\'script\',\'https://connect.facebook.net/en_US/fbevents.js\');fbq(\'init\',\''+pid+'\');'+(metaPixelConfig.events.pageView?'fbq(\'track\',\'PageView\');':'');
    var ns2=document.createElement('noscript');
    ns2.id='dizo-meta-pixel-noscript';
    var img=document.createElement('img');
    img.height=1;img.width=1;img.style.display='none';
    img.src='https://www.facebook.com/tr?id='+pid+'&ev=PageView&noscript=1';
    ns2.appendChild(img);
    document.head.appendChild(sc2);
    document.head.appendChild(ns2);
  }
}

/* ------ firePixelEvent ------ */
function firePixelEvent(eventName, params){
  if(!metaPixelConfig.enabled) return;
  if(typeof fbq==='undefined') return;
  if(params) fbq('track',eventName,params);
  else fbq('track',eventName);
}

/* ------ Helper: extract Pixel ID from pasted code ------ */
function extractPixelIdFromCode(code){
  var m=code.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d{10,20})['"]?\s*\)/);
  return m?m[1]:'';
}

/* ------ Helper: preview detected Pixel ID while typing ------ */
function previewExtractedPixelId(code){
  var pid=extractPixelIdFromCode(code);
  var prev=document.getElementById('mpCodePreview');
  var det=document.getElementById('mpDetectedId');
  if(prev&&det){ prev.style.display=pid?'flex':'none'; if(pid) det.textContent=pid; }
}

/* ------ Helper: switch tabs in Meta Pixel panel ------ */
function switchMpTab(tab,btn){
  ['id','code','events','status'].forEach(function(t){
    var el=document.getElementById('mpTab-'+t);
    if(el) el.style.display=(t===tab)?'block':'none';
  });
  document.querySelectorAll('#mpModeTabs .admin-tab').forEach(function(b){
    b.classList.toggle('active',b===btn);
  });
}

/* ------ Admin view: Meta Pixel ------ */
function showAdminMetaPixel(){
  var active=metaPixelConfig.enabled&&(metaPixelConfig.pixelId||metaPixelConfig.fullCode);
  var savedCode=metaPixelConfig.fullCode||'';
  var detectedId=savedCode?extractPixelIdFromCode(savedCode):'';
  document.getElementById('adminContent').innerHTML=
    '<h2 style="font-family:\'Playfair Display\',serif;font-size:1.35rem;margin-bottom:0.25rem">📊 Meta Pixel Integration</h2>'+
    '<p style="font-size:0.8rem;color:var(--text3);margin-bottom:1.25rem">Paste your Meta Pixel code directly or enter just the Pixel ID. Saving will inject it into the website.</p>'+
    '<div class="admin-tabs" id="mpModeTabs">'+
      '<div class="admin-tab'+(metaPixelConfig.useFullCode?'':' active')+'" onclick="switchMpTab(\'id\',this)">🔢 Pixel ID</div>'+
      '<div class="admin-tab'+(metaPixelConfig.useFullCode?' active':'')+'" onclick="switchMpTab(\'code\',this)">📋 Code Paste</div>'+
      '<div class="admin-tab" onclick="switchMpTab(\'events\',this)">📡 Events</div>'+
      '<div class="admin-tab" onclick="switchMpTab(\'status\',this)">📋 Status</div>'+
    '</div>'+

    /* ---- TAB: Pixel ID ---- */
    '<div id="mpTab-id" style="display:'+(metaPixelConfig.useFullCode?'none':'block')+'">'+
      '<div class="admin-section">'+
        '<div class="admin-section-title" style="display:flex;justify-content:space-between;align-items:center">'+
          '<span>🔢 Setup with Pixel ID</span>'+
          '<span class="status-badge '+(active&&!metaPixelConfig.useFullCode?'status-shipped':'status-pending')+'" id="mpStatusBadgeId">'+(active&&!metaPixelConfig.useFullCode?'● ACTIVE':'○ INACTIVE')+'</span>'+
        '</div>'+
        '<div class="form-group">'+
          '<label>Meta Pixel ID <span style="color:#dc2626">*</span></label>'+
          '<input type="text" id="mpPixelId" value="'+sanitizeInput(metaPixelConfig.pixelId||'')+'" placeholder="e.g. 1234567890123456" maxlength="20" oninput="validatePixelId(this)" style="font-family:monospace;font-size:1.05rem;font-weight:600;letter-spacing:0.06em">'+
          '<div id="mpPixelIdErr" style="font-size:0.72rem;color:#dc2626;margin-top:0.2rem;display:none">⚠ Pixel ID must be 10–20 digits</div>'+
          '<div style="font-size:0.72rem;color:var(--text3);margin-top:0.25rem">📍 Meta Business Manager → Events Manager → Your Pixel → Settings</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem;background:var(--bg2);border-radius:var(--r2);margin-bottom:1rem;border:1px solid var(--border)">'+
          '<input type="checkbox" id="mpEnabledId" '+(metaPixelConfig.enabled&&!metaPixelConfig.useFullCode?'checked':'')+' style="accent-color:var(--gold);width:16px;height:16px">'+
          '<div><div style="font-weight:600;font-size:0.85rem">Enable Pixel</div><div style="font-size:0.72rem;color:var(--text3)">Will start working immediately after saving</div></div>'+
        '</div>'+
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">'+
          '<button class="btn-primary" style="padding:0.65rem 1.5rem;background:var(--gold)" onclick="saveMetaPixelSettings(\'id\')">💾 Save & Inject into Website</button>'+
          '<button style="padding:0.65rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="testPixelFire()">🔥 Test Fire</button>'+
          '<button style="padding:0.65rem 1rem;border:1.5px solid #fca5a5;border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:#fff0f0;color:#dc2626" onclick="disableMetaPixel()">⏸ Disable</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* ---- TAB: Full Code ---- */
    '<div id="mpTab-code" style="display:'+(metaPixelConfig.useFullCode?'block':'none')+'">'+
      '<div class="admin-section">'+
        '<div class="admin-section-title" style="display:flex;justify-content:space-between;align-items:center">'+
          '<span>📋 Paste Full Pixel Code</span>'+
          '<span class="status-badge '+(active&&metaPixelConfig.useFullCode?'status-shipped':'status-pending')+'">'+(active&&metaPixelConfig.useFullCode?'● ACTIVE':'○ INACTIVE')+'</span>'+
        '</div>'+
        '<p style="font-size:0.78rem;color:var(--text3);margin-bottom:0.75rem">Paste the &lt;script&gt;...&lt;/script&gt; code copied from Meta Business Manager here.</p>'+
        '<textarea id="mpFullCode" rows="12" placeholder="&lt;!-- Meta Pixel Code --&gt;&#10;&lt;script&gt;&#10;!function(f,b,e,v...&#10;fbq(\'init\', \'YOUR_PIXEL_ID\');&#10;fbq(\'track\', \'PageView\');&#10;&lt;/script&gt;&#10;&lt;noscript&gt;...&lt;/noscript&gt;" oninput="previewExtractedPixelId(this.value)" style="width:100%;padding:0.875rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:monospace;font-size:0.78rem;outline:none;resize:vertical;background:#1e1e2e;color:#e0e0f0;line-height:1.6;min-height:200px">'+
          (savedCode?savedCode.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):'')+'</textarea>'+
        '<div id="mpCodePreview" style="display:'+(detectedId?'flex':'none')+';align-items:center;gap:0.5rem;padding:0.6rem 0.875rem;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--r2);margin-top:0.5rem;font-size:0.8rem">'+
          '<span style="color:#059669">✅</span><span style="color:#166534">Detected Pixel ID: <strong id="mpDetectedId" style="font-family:monospace">'+(detectedId||'')+'</strong></span>'+
        '</div>'+
        '<div style="margin-top:0.75rem;padding:0.75rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:var(--r2);font-size:0.78rem;color:#92400e">'+
          '⚠️ <strong>Note:</strong> Paste the complete code from &lt;script&gt; to &lt;/script&gt; as received from Meta.'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem;background:var(--bg2);border-radius:var(--r2);margin-top:0.75rem;margin-bottom:0.75rem;border:1px solid var(--border)">'+
          '<input type="checkbox" id="mpEnabledCode" '+(metaPixelConfig.enabled&&metaPixelConfig.useFullCode?'checked':'')+' style="accent-color:var(--gold);width:16px;height:16px">'+
          '<div><div style="font-weight:600;font-size:0.85rem">Enable Pixel</div><div style="font-size:0.72rem;color:var(--text3)">Will be injected into &lt;head&gt; immediately after saving</div></div>'+
        '</div>'+
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">'+
          '<button class="btn-primary" style="padding:0.65rem 1.5rem;background:var(--gold)" onclick="saveMetaPixelSettings(\'code\')">💾 Save & Inject into Website</button>'+
          '<button style="padding:0.65rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="document.getElementById(\'mpFullCode\').value=\'\';document.getElementById(\'mpCodePreview\').style.display=\'none\'">🗑 Clear</button>'+
          '<button style="padding:0.65rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="testPixelFire()">🔥 Test Fire</button>'+
          '<button style="padding:0.65rem 1rem;border:1.5px solid #fca5a5;border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:#fff0f0;color:#dc2626" onclick="disableMetaPixel()">⏸ Disable</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* ---- TAB: Events ---- */
    '<div id="mpTab-events" style="display:none">'+
      '<div class="admin-section">'+
        '<div class="admin-section-title">📡 Event Tracking</div>'+
        '<p style="font-size:0.78rem;color:var(--text3);margin-bottom:1rem">Select which events will send Pixel data.</p>'+
        buildEventRows()+
        '<div style="margin-top:0.75rem;padding:0.75rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--r2);font-size:0.78rem;color:#1e40af;line-height:1.7">'+
          '💡 Events fire automatically. Verify using the <strong>Meta Pixel Helper</strong> extension in your browser.'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* ---- TAB: Status ---- */
    '<div id="mpTab-status" style="display:none">'+
      '<div class="admin-section">'+
        '<div class="admin-section-title">📋 Pixel Status</div>'+
        '<div id="mpStatusPanel" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem">'+
          renderPixelStatusCards()+
        '</div>'+
        '<div style="margin-top:1.25rem;padding:1rem;background:var(--bg2);border-radius:var(--r2);font-size:0.8rem;color:var(--text2)">'+
          '<strong>📌 Current Pixel Config:</strong>'+
          (metaPixelConfig.useFullCode&&metaPixelConfig.fullCode
            ? '<pre style="margin-top:0.5rem;font-size:0.72rem;background:#1e1e2e;color:#e0e0f0;padding:0.75rem;border-radius:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all">'+metaPixelConfig.fullCode.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,400)+'...</pre>'
            : metaPixelConfig.pixelId
            ? '<div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:#1e1e2e;color:#86efac;border-radius:8px;font-family:monospace;font-size:0.78rem">Pixel ID Mode: <strong>'+metaPixelConfig.pixelId+'</strong></div>'
            : '<div style="color:var(--text3);margin-top:0.5rem">No Pixel has been set.</div>')+
        '</div>'+
      '</div>'+
    '</div>';
}

function buildEventRows(){
  var evs=[
    {key:'pageView',label:'PageView',desc:'Fires on every page load',icon:'👁'},
    {key:'addToCart',label:'AddToCart',desc:'When a product is added to cart',icon:'🛒'},
    {key:'purchase',label:'Purchase',desc:'When an order is completed',icon:'💳'},
    {key:'lead',label:'Lead',desc:'When newsletter is subscribed',icon:'📧'},
    {key:'completeRegistration',label:'CompleteRegistration',desc:'When a new account is created',icon:'🎉'},
  ];
  return evs.map(function(ev){
    var on=metaPixelConfig.events[ev.key];
    return '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.875rem;border-radius:var(--r2);border:1px solid var(--border);margin-bottom:0.5rem;background:'+(on?'#f0fdf4':'var(--bg)')+'">'+
      '<div style="font-size:1.2rem;width:28px;text-align:center">'+ev.icon+'</div>'+
      '<div style="flex:1"><div style="font-weight:700;font-size:0.82rem;font-family:monospace">'+ev.label+'</div><div style="font-size:0.7rem;color:var(--text3)">'+ev.desc+'</div></div>'+
      '<input type="checkbox" id="mpEv_'+ev.key+'" '+(on?'checked':'')+' onchange="togglePixelEvent(\''+ev.key+'\',this.checked)" style="accent-color:var(--gold);width:18px;height:18px">'+
    '</div>';
  }).join('');
}

function renderPixelStatusCards(){
  var pid=metaPixelConfig.pixelId;
  var active=metaPixelConfig.enabled&&(pid||metaPixelConfig.fullCode);
  var evCount=Object.values(metaPixelConfig.events).filter(Boolean).length;
  var mode=metaPixelConfig.useFullCode?'Code Paste':'Pixel ID';
  return [
    {icon:'🔢',label:'Pixel ID',value:pid?maskPixelId(pid):(metaPixelConfig.useFullCode?'(code mode)':'Not set'),color:pid?'var(--text)':'var(--text3)'},
    {icon:'🟢',label:'Status',value:active?'Active':'Inactive',color:active?'#059669':'#dc2626'},
    {icon:'📡',label:'Events',value:evCount+' / 5 Active',color:'var(--gold)'},
    {icon:'⚙️',label:'Mode',value:mode,color:'var(--text2)'},
  ].map(function(c){
    return '<div style="padding:1rem;background:var(--bg2);border-radius:var(--r2);border:1px solid var(--border)">'+
      '<div style="font-size:1.25rem;margin-bottom:0.25rem">'+c.icon+'</div>'+
      '<div style="font-size:0.7rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">'+c.label+'</div>'+
      '<div style="font-size:0.95rem;font-weight:700;color:'+c.color+';margin-top:0.1rem">'+c.value+'</div>'+
    '</div>';
  }).join('');
}

function maskPixelId(id){
  if(!id||id.length<=4) return id;
  return id.slice(0,3)+'•'.repeat(Math.max(0,id.length-6))+id.slice(-3);
}

function validatePixelId(el){
  var val=(el.value||'').trim();
  var err=document.getElementById('mpPixelIdErr');
  var valid=/^\d+$/.test(val)&&val.length>=10&&val.length<=20;
  if(err) err.style.display=(!valid&&val.length>0)?'block':'none';
}

function updatePixelToggleUI(state){
  var track=document.getElementById('mpToggleTrack');
  var thumb=document.getElementById('mpToggleThumb');
  if(track) track.style.background=state?'#059669':'var(--border)';
  if(thumb) thumb.style.left=state?'20px':'2px';
}

function togglePixelEvent(key,state){
  metaPixelConfig.events[key]=state;
  saveMetaPixelConfig();
  showToast(state?'✅ '+key+' event enabled':'⏸ '+key+' event disabled');
}

function saveMetaPixelSettings(mode){
  var useCode=(mode==='code');
  metaPixelConfig.useFullCode=useCode;

  if(useCode){
    var raw=(document.getElementById('mpFullCode')||{}).value||'';
    raw=raw.trim();
    if(!raw){showToast('⚠ No code has been pasted');return;}
    if(!raw.includes('fbq')&&!raw.includes('<script')){showToast('⚠ This does not appear to be a valid Meta Pixel code');return;}
    var pid=extractPixelIdFromCode(raw);
    metaPixelConfig.fullCode=raw;
    metaPixelConfig.pixelId=pid||'';
    metaPixelConfig.enabled=!!(document.getElementById('mpEnabledCode')||{}).checked;
  } else {
    var pid2=((document.getElementById('mpPixelId')||{}).value||'').trim();
    if(pid2&&(!/^\d+$/.test(pid2)||pid2.length<10||pid2.length>20)){
      var e2=document.getElementById('mpPixelIdErr');
      if(e2) e2.style.display='block';
      showToast('⚠ Enter a valid Pixel ID (10–20 digits)');return;
    }
    metaPixelConfig.pixelId=pid2;
    metaPixelConfig.fullCode='';
    metaPixelConfig.enabled=!!(document.getElementById('mpEnabledId')||{}).checked&&!!pid2;
  }

  /* collect event toggles */
  ['pageView','addToCart','purchase','lead','completeRegistration'].forEach(function(k){
    var el=document.getElementById('mpEv_'+k);
    if(el) metaPixelConfig.events[k]=el.checked;
  });

  saveMetaPixelConfig();
  applyMetaPixel();
  showToast(metaPixelConfig.enabled?'✅ Meta Pixel saved and injected into the website!':'✅ Saved (Pixel is disabled)');
  showAdminMetaPixel();
}

function disableMetaPixel(){
  metaPixelConfig.enabled=false;
  saveMetaPixelConfig();
  applyMetaPixel();
  showToast('⏸ Meta Pixel has been disabled');
  showAdminMetaPixel();
}

function testPixelFire(){
  if(!metaPixelConfig.enabled){showToast('⚠ Please save and enable Pixel first');return;}
  firePixelEvent('Lead',{content_name:'Admin Test',status:'test'});
  showToast('🔥 Test event fired! Check in Meta Events Manager.');
}

/* ---- Hook pixel events into existing site actions ---- */

/** Wrap existing addToCart to also fire pixel */
const _origAddToCart = window.addToCart;
window.addToCart = function(id, qty){
  if(typeof _origAddToCart === 'function') _origAddToCart(id, qty);
  if(metaPixelConfig.events.addToCart){
    const all = [...(window.products||[]),...(window.bestSellers||[])];
    const p = all.find(x=>x.id===id);
    firePixelEvent('AddToCart', p ? {
      content_ids:[String(p.id)],
      content_name:p.name,
      content_type:'product',
      value:p.price,
      currency:'BDT'
    } : {});
  }
};

/** Wrap placeOrder to fire Purchase event */
const _origPlaceOrder = window.placeOrder;
window.placeOrder = function(){
  if(typeof _origPlaceOrder === 'function') _origPlaceOrder();
  if(metaPixelConfig.events.purchase){
    const cartItems = window.cart||[];
    const total = cartItems.reduce((s,c)=>s+c.price*c.qty, 0);
    firePixelEvent('Purchase', {
      content_ids: cartItems.map(c=>String(c.id)),
      content_type:'product',
      value: total,
      currency:'BDT',
      num_items: cartItems.reduce((s,c)=>s+c.qty,0)
    });
  }
};

/** Wrap newsletter subscription to fire Lead */
const _origSubscribeNewsletter = window.subscribeNewsletter;
window.subscribeNewsletter = function(){
  if(typeof _origSubscribeNewsletter === 'function') _origSubscribeNewsletter();
  if(metaPixelConfig.events.lead) firePixelEvent('Lead', {content_name:'Newsletter'});
};

/** Wrap handleRegister to fire CompleteRegistration */
const _origHandleRegister = window.handleRegister;
window.handleRegister = function(){
  if(typeof _origHandleRegister === 'function') _origHandleRegister();
  if(metaPixelConfig.events.completeRegistration) firePixelEvent('CompleteRegistration');
};

/* ---- On load: apply saved pixel config ---- */
document.addEventListener('DOMContentLoaded', function(){
  applyMetaPixel();
  // Preload primary images (image1) for all products for performance
  const allProds = [...(window.products||[]),...(window.bestSellers||[])];
  allProds.slice(0,8).forEach(p=>{
    const src = normalizeImages(p)[0] || p.img;
    if(src){
      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'image'; link.href = src;
      document.head.appendChild(link);
    }
  });
});

// Keyboard shortcuts
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();document.getElementById('navSearchInput').focus();}
  if(e.key==='Escape'){
    closeSearch();closeCart();closeWishlist();closeCheckout();
    closeCategoryPage();
    if(document.getElementById('adminPanel').classList.contains('open')) closeAdmin();
    document.getElementById('quickViewModal').classList.remove('open');
    document.getElementById('loginModal').classList.remove('open');
    document.getElementById('contactModal').classList.remove('open');
    document.getElementById('trackModal').classList.remove('open');
    document.getElementById('adminForgotGate').classList.remove('open');
  }
});

/* ---- Hidden Admin Route Listeners (V39 Security) ----
 * These are the ONLY legitimate triggers for the admin panel.
 * Access via: #dizo-admin-access OR ?admin=dizoowner
 */
document.addEventListener('DOMContentLoaded', initAdminAccessValidator);
window.addEventListener('hashchange', initAdminAccessValidator);
