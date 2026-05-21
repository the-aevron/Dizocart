/**
 * Dizo Cart — admin.js
 * Admin Panel — Dashboard, Products, Orders
 * Extracted from dizo_cart_V47.html (lines 1009-3590)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== ADMIN PASSWORD GATE =====================
let ADMIN_PASSWORD = 'admin123';
let adminAuthenticated = false;

/* ============================================================
   HIDDEN ADMIN ACCESS SYSTEM — Dizo Cart V39 Security Layer
   Admin panel is COMPLETELY INVISIBLE to frontend users.
   Access ONLY via secret URL route — never from visible UI.
   ============================================================ */

/** Configurable secret route (change these to customize your access URL) */
const ADMIN_SECRET_ROUTE = 'dizo-admin-access'; // URL hash:  #dizo-admin-access
const ADMIN_SECRET_KEY   = 'dizoowner';          // URL query: ?admin=dizoowner
const ADMIN_SESSION_KEY  = 'dizo_admin_session_v1';
const ADMIN_INACTIVITY_MS = 15 * 60 * 1000;     // 15-minute inactivity timeout
let _adminInactivityTimer = null;

/** Check current URL for the secret admin route */
function validateAdminRoute() {
  const hash  = (window.location.hash || '').replace('#','');
  const params = new URLSearchParams(window.location.search);
  return hash === ADMIN_SECRET_ROUTE || params.get('admin') === ADMIN_SECRET_KEY;
}

/**
 * initAdminAccessValidator — silently checks for secret route on load/hashchange.
 * This is the ONLY legitimate trigger for the admin system from the URL.
 */
function initAdminAccessValidator() {
  if (!validateAdminRoute()) return;
  // Clean URL to hide the secret route from browser history
  try {
    const cleanSearch = window.location.search
      .replace(/[?&]admin=[^&]*/g,'').replace(/^[?&]/,'?').replace(/^\?$/,'');
    const cleanUrl = window.location.pathname + (cleanSearch || '');
    history.replaceState(null, '', cleanUrl);
    if (window.location.hash) history.pushState(null, '', window.location.pathname);
  } catch(e) {}
  initializeAdmin();
}

/**
 * initializeAdmin — the secure entry point for the admin system.
 * Checks for active session or opens the premium login gate.
 */
function initializeAdmin() {
  // Check for persisted session in sessionStorage
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.authenticated && s.expires > Date.now()) {
        adminAuthenticated = true;
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        adminAuthenticated = false;
      }
    }
  } catch(e) {}

  if (adminAuthenticated) {
    _openAdminPanel();
  } else {
    const gate = document.getElementById('adminLoginGate');
    if (gate) {
      gate.classList.add('open');
      const inp = document.getElementById('adminPwdInput');
      if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 300); }
      const err = document.getElementById('adminLoginError');
      if (err) err.classList.remove('show');
    }
  }
}

/** Internal function to open admin panel after successful authentication */
function _openAdminPanel() {
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('mainSiteContent').classList.add('hidden');
  showAdminDashboard();
  startAdminInactivityTimer();
  blockAdminDevTools();
}

/* ==== Inactivity Auto-Logout Timer ==== */
function startAdminInactivityTimer() {
  resetAdminInactivityTimer();
  const adminEl = document.getElementById('adminPanel');
  if (adminEl) {
    ['mousedown','mousemove','keydown','scroll','touchstart'].forEach(evt => {
      adminEl.addEventListener(evt, resetAdminInactivityTimer, { passive: true });
    });
  }
}
function resetAdminInactivityTimer() {
  if (_adminInactivityTimer) clearTimeout(_adminInactivityTimer);
  _adminInactivityTimer = setTimeout(() => {
    if (document.getElementById('adminPanel')?.classList.contains('open')) {
      adminLogout();
      showToast('⏱ Session expired due to inactivity. Please re-authenticate.');
    }
  }, ADMIN_INACTIVITY_MS);
}
function stopAdminInactivityTimer() {
  if (_adminInactivityTimer) { clearTimeout(_adminInactivityTimer); _adminInactivityTimer = null; }
  const adminEl = document.getElementById('adminPanel');
  if (adminEl) {
    ['mousedown','mousemove','keydown','scroll','touchstart'].forEach(evt => {
      adminEl.removeEventListener(evt, resetAdminInactivityTimer);
    });
  }
}

/* ==== Dev Tools Blocker — Active ONLY while admin panel is open ==== */
let _devToolsBlocked = false;
let _adminContextMenuHandler = null;
let _adminKeydownHandler = null;

function blockAdminDevTools() {
  if (_devToolsBlocked) return;
  _devToolsBlocked = true;
  // Block right-click context menu while admin is open
  _adminContextMenuHandler = function(e) {
    if (document.getElementById('adminPanel')?.classList.contains('open')) {
      e.preventDefault(); return false;
    }
  };
  document.addEventListener('contextmenu', _adminContextMenuHandler, true);
  // Block F12, Ctrl+Shift+I/J, Ctrl+U inside admin
  _adminKeydownHandler = function(e) {
    if (!document.getElementById('adminPanel')?.classList.contains('open')) return;
    const blocked = [
      e.key === 'F12',
      (e.ctrlKey||e.metaKey) && e.shiftKey && ['i','I','j','J'].includes(e.key),
      (e.ctrlKey||e.metaKey) && ['u','U'].includes(e.key) && !e.shiftKey,
    ];
    if (blocked.some(Boolean)) { e.preventDefault(); e.stopPropagation(); return false; }
  };
  document.addEventListener('keydown', _adminKeydownHandler, true);
}
function unblockAdminDevTools() {
  if (!_devToolsBlocked) return;
  _devToolsBlocked = false;
  if (_adminContextMenuHandler) { document.removeEventListener('contextmenu', _adminContextMenuHandler, true); _adminContextMenuHandler = null; }
  if (_adminKeydownHandler)     { document.removeEventListener('keydown',      _adminKeydownHandler,     true); _adminKeydownHandler     = null; }
}

function openAdmin(){
  // Legacy internal entry point — not exposed in frontend UI.
  // All real access flows through initializeAdmin() via secret route.
  if(adminAuthenticated){
    _openAdminPanel();
  } else {
    initializeAdmin();
  }
}

function closeAdminGate(){
  document.getElementById('adminLoginGate').classList.remove('open');
}

function toggleAdminPwdVisibility(){
  const inp = document.getElementById('adminPwdInput');
  const eye = document.getElementById('adminPwdEye');
  if(!inp) return;
  if(inp.type === 'password'){
    inp.type = 'text';
    if(eye) eye.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    inp.type = 'password';
    if(eye) eye.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

function checkAdminPassword(){
  const val = document.getElementById('adminPwdInput').value;
  const btn = document.getElementById('adminLoginBtn');
  // Show loading state
  if(btn) btn.classList.add('loading');
  setTimeout(() => {
    if(btn) btn.classList.remove('loading');
    if(val === ADMIN_PASSWORD){
      adminAuthenticated = true;
      // Persist session — duration based on "Stay signed in" toggle
      const remember = document.getElementById('adminRememberSession')?.checked;
      const expiresIn = remember ? 8*60*60*1000 : 60*60*1000; // 8h or 1h
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
          authenticated: true, expires: Date.now() + expiresIn
        }));
      } catch(e) {}
      document.getElementById('adminLoginGate').classList.remove('open');
      _openAdminPanel();
      showToast('🔓 Welcome to Admin Panel!');
    } else {
      const err = document.getElementById('adminLoginError');
      err.classList.add('show');
      document.getElementById('adminPwdInput').value = '';
      document.getElementById('adminPwdInput').focus();
      // Shake animation on the card
      const card = document.querySelector('.dizo-admin-login-card');
      if(card){ card.style.animation='none'; card.offsetHeight; card.style.animation='dizoAdminShake 0.45s ease'; setTimeout(()=>{ if(card) card.style.animation=''; },480); }
      setTimeout(()=>err.classList.remove('show'), 3500);
    }
  }, 550); // brief loading delay for UX
}

function showAdminForgotPwd(){
  document.getElementById('adminLoginGate').classList.remove('open');
  document.getElementById('adminForgotGate').classList.add('open');
  document.getElementById('adminForgotForm').style.display='block';
  document.getElementById('adminForgotSuccess').style.display='none';
  document.getElementById('adminForgotEmail').value='';
  setTimeout(()=>document.getElementById('adminForgotEmail').focus(),200);
}

function submitAdminForgot(){
  const email=document.getElementById('adminForgotEmail').value.trim();
  if(!email||!email.includes('@')){showToast('⚠️ Please enter a valid email');return;}
  document.getElementById('adminForgotForm').style.display='none';
  document.getElementById('adminForgotSuccess').style.display='block';
  showToast('📧 Reset link sent! (Demo)');
}

function backToAdminLogin(){
  document.getElementById('adminForgotGate').classList.remove('open');
  document.getElementById('adminLoginGate').classList.add('open');
  document.getElementById('adminPwdInput').value='';
  document.getElementById('adminLoginError').classList.remove('show');
  setTimeout(()=>document.getElementById('adminPwdInput').focus(),200);
}



function closeAdmin(){
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('mainSiteContent').classList.remove('hidden');
  stopAdminInactivityTimer();
  unblockAdminDevTools();
  showToast('← Returned to Store');
}

function adminLogout(){
  adminAuthenticated = false;
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch(e) {}
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('mainSiteContent').classList.remove('hidden');
  stopAdminInactivityTimer();
  unblockAdminDevTools();
  showToast('👋 Logged out of Admin Panel');
}

function showAdminTab(tab,btn){
  document.querySelectorAll('.admin-nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const fns={dashboard:showAdminDashboard,homepage:showAdminHomepage,products:showAdminProducts,orders:showAdminOrders,customers:showAdminCustomers,themes:showAdminThemes,messaging:showAdminMessaging,seo:showAdminSeo,settings:showAdminSettings,apimanager:showAdminApiManager,metapixel:showAdminMetaPixel};
  if(fns[tab])fns[tab]();
}

// ===================== ADMIN HOMEPAGE CUSTOMIZATION =====================
// In-memory banner slides data (synced from live page)
let adminBannerSlides = [
  {tag:'GREAT DEALS',headline:'Flash Sale',sub:'ON KITCHEN ESSENTIALS',discount:'60',emoji:'🍳',bgImage:'',gradient:'linear-gradient(135deg,#0a2a6e 0%,#1a4aae 60%,#2563EB 100%)',perks:['🗓️ 36 Month EMI','🛵 Free Delivery','✅ 2 Year Warranty']},
  {tag:'NEW ARRIVAL',headline:'Smart Gadgets',sub:'LATEST TECH COLLECTION',discount:'45',emoji:'📱',bgImage:'',gradient:'linear-gradient(135deg,#0d1b2a 0%,#1b3a5c 60%,#2d6a9f 100%)',perks:['📱 Latest Models','🔒 Genuine Products','🚀 Express Delivery']},
  {tag:'BEST SELLERS',headline:'Beauty & Care',sub:'PREMIUM SKINCARE',discount:'50',emoji:'💄',bgImage:'',gradient:'linear-gradient(135deg,#4a0e3c 0%,#8b1a6b 60%,#c0456b 100%)',perks:['💄 Authentic Brands','🌿 Natural Ingredients','⭐ 4.9 Rating']},
  {tag:'SUMMER SALE',headline:'Home Essentials',sub:'TRANSFORM YOUR SPACE',discount:'40',emoji:'🏠',bgImage:'',gradient:'linear-gradient(135deg,#1a3a2a 0%,#2d6a4f 60%,#4a9f7a 100%)',perks:['🏠 Quality Assured','🔄 Easy Returns','💬 24/7 Support']},
];
let adminEditingSlide = null; // null = new, number = index

function showAdminHomepage(){
  document.getElementById('adminContent').innerHTML=`
    <h2 style="font-family:'Playfair Display',serif;font-size:1.35rem;margin-bottom:0.25rem">Homepage Customization</h2>
    <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1.25rem">Manage your banner slider, app banner, and homepage sections live.</p>

    <!-- TABS -->
    <div class="admin-tabs" id="homepageAdminTabs">
      <div class="admin-tab active" onclick="switchHomepageTab('banner',this)">🖼 Banner Slider</div>
      <div class="admin-tab" onclick="switchHomepageTab('flashsale',this)">⚡ Flash Sale</div>
      <div class="admin-tab" onclick="switchHomepageTab('promo',this)">🏷️ Promo Strip</div>
      <div class="admin-tab" onclick="switchHomepageTab('sidepanel',this)">📌 Side Panels</div>
      <div class="admin-tab" onclick="switchHomepageTab('sections',this)">📦 Sections</div>
    </div>

    <!-- BANNER SLIDER TAB -->
    <div id="hpTab-banner">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div style="font-size:0.875rem;font-weight:600;color:var(--text2)">📊 ${adminBannerSlides.length} slides active · Auto-advance: 4s</div>
        <button class="btn-primary" style="font-size:0.75rem;padding:0.4rem 1rem" onclick="openSlideEditor(null)">+ Add Slide</button>
      </div>

      <!-- Slide Cards -->
      <div id="adminSlideList" style="display:flex;flex-direction:column;gap:0.75rem"></div>

      <!-- Slide Editor Form (hidden by default) -->
      <div id="slideEditorWrap" style="display:none;margin-top:1.25rem" class="admin-section">
        <div class="admin-section-title" id="slideEditorTitle">Edit Slide</div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Tag Label (e.g. GREAT DEALS)</label>
            <input type="text" id="se_tag" placeholder="GREAT DEALS" oninput="previewSlide()">
          </div>
          <div class="form-group">
            <label>Main Headline</label>
            <input type="text" id="se_headline" placeholder="Flash Sale" oninput="previewSlide()">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Sub-headline</label>
            <input type="text" id="se_sub" placeholder="ON KITCHEN ESSENTIALS" oninput="previewSlide()">
          </div>
          <div class="form-group">
            <label>Discount % (number only)</label>
            <input type="number" id="se_discount" placeholder="60" min="1" max="99" oninput="previewSlide()">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Emoji / Icon (shown when no image)</label>
            <input type="text" id="se_emoji" placeholder="🍳" maxlength="4" oninput="previewSlide()" style="font-size:1.5rem">
          </div>
          <div class="form-group">
            <label>Background Gradient</label>
            <select id="se_gradient" onchange="previewSlide()">
              <option value="linear-gradient(135deg,#0a2a6e 0%,#1a4aae 60%,#2563EB 100%)">🔵 Deep Blue</option>
              <option value="linear-gradient(135deg,#0d1b2a 0%,#1b3a5c 60%,#2d6a9f 100%)">🌊 Ocean Dark</option>
              <option value="linear-gradient(135deg,#4a0e3c 0%,#8b1a6b 60%,#c0456b 100%)">💜 Purple Pink</option>
              <option value="linear-gradient(135deg,#1a3a2a 0%,#2d6a4f 60%,#4a9f7a 100%)">🌿 Forest Green</option>
              <option value="linear-gradient(135deg,#7C2D12 0%,#b45309 60%,#F97316 100%)">🔥 Sunset Orange</option>
              <option value="linear-gradient(135deg,#1A1A18 0%,#2d2d2a 60%,#4a4a45 100%)">🖤 Charcoal Dark</option>
              <option value="linear-gradient(135deg,#831843 0%,#be185d 60%,#ec4899 100%)">🌸 Hot Pink</option>
              <option value="linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)">💚 Emerald</option>
            </select>
          </div>
        </div>

        <!-- IMAGE UPLOAD SECTION -->
        <div style="background:var(--bg2);border:1.5px dashed var(--border);border-radius:var(--r);padding:1rem;margin-bottom:1rem">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:0.75rem">🖼️ Banner Background Image <span style="font-weight:400;color:var(--text3)">(optional — replaces gradient)</span></div>
          <div class="admin-form-row" style="margin-bottom:0.75rem">
            <div class="form-group" style="margin:0">
              <label>Image URL</label>
              <input type="url" id="se_bgImageUrl" placeholder="https://example.com/banner.jpg" oninput="previewSlide()" style="width:100%">
            </div>
            <div class="form-group" style="margin:0">
              <label>Or Upload Image File</label>
              <input type="file" id="se_bgImageFile" accept="image/*" onchange="handleSlideImageUpload(this)" style="width:100%;padding:0.4rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.8rem;background:var(--white)">
            </div>
          </div>
          <div id="se_imagePreviewWrap" style="display:none;margin-top:0.5rem">
            <img id="se_imagePreview" src="" style="max-height:80px;border-radius:8px;border:1px solid var(--border);object-fit:cover">
            <button onclick="clearSlideImage()" style="margin-left:0.5rem;font-size:0.72rem;padding:0.2rem 0.6rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer">✕ Remove</button>
          </div>
          <div style="margin-top:0.5rem">
            <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;cursor:pointer">
              <input type="checkbox" id="se_overlayDark" checked> Add dark overlay on image (improves text readability)
            </label>
          </div>
          <!-- Visual image for right side -->
          <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border)">
            <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:0.5rem">📸 Right-side Product Image <span style="font-weight:400;color:var(--text3)">(shown beside text)</span></div>
            <div class="admin-form-row" style="margin-bottom:0">
              <div class="form-group" style="margin:0">
                <label>Product Image URL</label>
                <input type="url" id="se_visualImageUrl" placeholder="https://example.com/product.png" oninput="previewSlide()" style="width:100%">
              </div>
              <div class="form-group" style="margin:0">
                <label>Or Upload Product Image</label>
                <input type="file" id="se_visualImageFile" accept="image/*" onchange="handleSlideVisualUpload(this)" style="width:100%;padding:0.4rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.8rem;background:var(--white)">
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Perk Badges (comma-separated, use emoji)</label>
          <input type="text" id="se_perks" placeholder="🗓️ 36 Month EMI, 🛵 Free Delivery, ✅ 2 Year Warranty" oninput="previewSlide()">
        </div>

        <!-- Live Preview -->
        <div style="margin:1rem 0">
          <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:0.5rem">Live Preview</div>
          <div id="slidePreviewBox" style="border-radius:12px;overflow:hidden;min-height:130px;display:flex;align-items:stretch;position:relative;font-family:'DM Sans',sans-serif">
            <div id="slidePreviewContent" style="flex:1;padding:1.25rem 1.5rem;display:flex;flex-direction:column;justify-content:center;z-index:2">
              <div id="prev_tag" style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:0.6rem;font-weight:800;letter-spacing:0.14em;padding:0.15rem 0.6rem;border-radius:4px;margin-bottom:0.3rem;text-transform:uppercase"></div>
              <div id="prev_headline" style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:#fff;line-height:1.05"></div>
              <div id="prev_sub" style="font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:0.25rem;text-transform:uppercase"></div>
              <div id="prev_discount" style="font-size:0.85rem;font-weight:700;color:#fff;margin-bottom:0.5rem"></div>
              <div id="prev_perks" style="display:flex;flex-wrap:wrap;gap:0.3rem"></div>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;padding:1rem 1.5rem;flex-shrink:0">
              <div id="prev_emoji" style="font-size:4rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))"></div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button class="btn-primary" style="padding:0.6rem 1.5rem" onclick="saveSlideEdit()">💾 Save Slide</button>
          <button class="btn-outline" style="padding:0.6rem 1rem" onclick="cancelSlideEdit()">Cancel</button>
        </div>
      </div>

      <!-- Slider Settings -->
      <div class="admin-section" style="margin-top:1.25rem">
        <div class="admin-section-title">⚙️ Slider Settings</div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Auto-advance Speed (seconds)</label>
            <input type="number" id="sliderSpeed" value="4" min="2" max="20">
          </div>
          <div class="form-group">
            <label>Transition Style</label>
            <select id="sliderTransition">
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding:0.75rem 0;border-top:1px solid var(--border)">
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer">
            <input type="checkbox" id="showArrows" checked onchange="showToast('⚙️ Arrow setting updated')"> Show Navigation Arrows
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer">
            <input type="checkbox" id="showDots" checked onchange="showToast('⚙️ Dot setting updated')"> Show Dot Indicators
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer">
            <input type="checkbox" id="autoAdvance" checked onchange="showToast('⚙️ Auto-advance setting updated')"> Auto-advance
          </label>
        </div>
        <button class="btn-primary" style="padding:0.55rem 1.25rem;margin-top:0.5rem" onclick="applySliderSettings()">Apply Settings to Live Banner</button>
      </div>
    </div>

    <!-- FLASH SALE TAB (hidden) -->
    <div id="hpTab-flashsale" style="display:none">
      <!-- Section header settings -->
      <div class="admin-section" style="margin-bottom:1rem">
        <div class="admin-section-title">⚡ Flash Sale — Section Settings</div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="fs_sectionTitle" value="Flash Sale" placeholder="Flash Sale" oninput="previewFlashTitle()">
          </div>
          <div class="form-group">
            <label>Sale Duration (hours)</label>
            <input type="number" id="fs_hours" value="8" min="1" max="99" placeholder="8">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Minutes</label>
            <input type="number" id="fs_mins" value="34" min="0" max="59" placeholder="34">
          </div>
          <div class="form-group">
            <label>Seconds</label>
            <input type="number" id="fs_secs" value="22" min="0" max="59" placeholder="22">
          </div>
        </div>
        <button class="btn-primary" style="font-size:0.78rem;padding:0.5rem 1.1rem" onclick="applyFlashSaleSettings()">Apply Timer & Title</button>
      </div>

      <!-- Flash product list -->
      <div class="admin-section">
        <div class="admin-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>⚡ Flash Sale Products</span>
          <button class="btn-primary" style="font-size:0.74rem;padding:0.38rem 0.9rem" onclick="openFlashProductEditor(null)">+ Add Product</button>
        </div>
        <div id="flashProductList" style="display:flex;flex-direction:column;gap:0.6rem;margin-top:0.75rem"></div>
      </div>

      <!-- Flash product editor form -->
      <div id="flashProductEditorWrap" style="display:none;margin-top:1rem" class="admin-section">
        <div class="admin-section-title" id="flashEditorTitle">Add Flash Product</div>

        <!-- Image / emoji row -->
        <div style="display:flex;gap:1.25rem;margin-bottom:1rem;align-items:flex-start;flex-wrap:wrap">
          <div id="fpPreviewBox" style="width:90px;height:90px;border-radius:12px;border:2px dashed var(--border);background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:2.5rem;flex-shrink:0;overflow:hidden;position:relative">
            <span id="fpPreviewEmoji">🛍️</span>
            <img id="fpPreviewImg" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
          </div>
          <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:0.6rem">
            <div class="form-group" style="margin:0">
              <label style="font-size:0.73rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;display:block">📎 Upload Image</label>
              <input type="file" id="fpImgFile" accept="image/*" onchange="handleFlashImgUpload(this)" style="width:100%;padding:0.4rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.78rem;background:var(--white);cursor:pointer">
            </div>
            <div class="form-group" style="margin:0">
              <label style="font-size:0.73rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;display:block">🔗 Or Image URL</label>
              <input type="url" id="fpImgUrl" placeholder="https://example.com/product.jpg" oninput="handleFlashImgUrl(this.value)" style="width:100%;padding:0.5rem 0.7rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.8rem;outline:none">
            </div>
            <button onclick="clearFlashImg()" style="align-self:flex-start;font-size:0.7rem;color:var(--text3);background:none;border:none;cursor:pointer;text-decoration:underline;padding:0">✕ Clear image</button>
          </div>
          <div class="form-group" style="min-width:90px;margin:0">
            <label style="font-size:0.73rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;display:block">Emoji</label>
            <input type="text" id="fpEmoji" placeholder="🍕" maxlength="4" oninput="updateFlashEmojiPreview(this.value)" style="width:100%;padding:0.5rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:1.5rem;text-align:center;outline:none">
          </div>
        </div>

        <div class="admin-form-row">
          <div class="form-group"><label>Product Name</label><input type="text" id="fpName" placeholder="e.g. Non-Stick Pizza Pan" oninput="updateFlashPreview()"></div>
          <div class="form-group"><label>Category</label>
            <select id="fpCat" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;font-size:0.875rem;outline:none;background:var(--white)">
              <option value="kitchen">🍳 Kitchen</option>
              <option value="gadgets">📱 Gadgets</option>
              <option value="beauty">💄 Beauty</option>
              <option value="home">🏠 Home</option>
            </select>
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group"><label>Sale Price (৳)</label><input type="number" id="fpPrice" placeholder="1299" min="1" oninput="calcFlashDiscount()"></div>
          <div class="form-group"><label>Original Price (৳)</label><input type="number" id="fpOldPrice" placeholder="2500" min="1" oninput="calcFlashDiscount()"></div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>Discount % <span id="fpDiscountCalc" style="font-size:0.72rem;color:var(--gold);font-weight:700"></span></label>
            <input type="number" id="fpDiscount" placeholder="48" min="1" max="99" readonly style="background:var(--bg2);cursor:default">
          </div>
          <div class="form-group">
            <label>Units Sold (progress bar)</label>
            <input type="number" id="fpSold" placeholder="67" min="0" max="100" oninput="updateFlashPreview()">
          </div>
        </div>
        <div class="form-group">
          <label>Units Left</label>
          <input type="number" id="fpLeft" placeholder="33" min="0" oninput="updateFlashPreview()">
        </div>

        <!-- Live mini preview -->
        <div style="margin:0.75rem 0 1rem">
          <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:0.5rem">Preview</div>
          <div style="max-width:220px;background:rgba(26,26,24,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden">
            <div id="fpPrev_img" style="height:100px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:2.5rem">🛍️</div>
            <div style="padding:0.75rem">
              <div id="fpPrev_name" style="font-size:0.82rem;font-weight:600;color:#fff;margin-bottom:0.3rem">Product Name</div>
              <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap">
                <span id="fpPrev_price" style="font-family:'Playfair Display',serif;font-size:1rem;color:#C8A96E">৳0</span>
                <span id="fpPrev_old" style="font-size:0.75rem;color:rgba(255,255,255,0.4);text-decoration:line-through">৳0</span>
                <span id="fpPrev_badge" style="background:#C8A96E;color:#fff;font-size:0.6rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:20px">0% OFF</span>
              </div>
              <div style="margin-top:0.5rem">
                <div style="display:flex;justify-content:space-between;font-size:0.6rem;color:rgba(255,255,255,0.45);margin-bottom:0.3rem">
                  <span id="fpPrev_sold">Sold: 0</span><span id="fpPrev_left">Left: 0</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden">
                  <div id="fpPrev_bar" style="height:100%;background:#C8A96E;border-radius:2px;width:0%;transition:width 0.4s"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn-primary" style="padding:0.6rem 1.25rem" onclick="saveFlashProduct()">💾 Save Product</button>
          <button style="padding:0.6rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="cancelFlashEditor()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- APP BANNER TAB (hidden) -->

    <!-- PROMO STRIP TAB (hidden) -->
    <div id="hpTab-promo" style="display:none" class="admin-section">
      <div class="admin-section-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem">
        <span>⚡ Promo Services Strip</span>
        <button onclick="addPromoStripItem()" style="font-size:0.78rem;padding:0.35rem 0.875rem;background:var(--gold);color:#fff;border:none;border-radius:var(--r2);cursor:pointer;font-weight:700;transition:background 0.2s" onmouseover="this.style.background='#b8963a'" onmouseout="this.style.background='var(--gold)'">+ Add Item</button>
      </div>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:0.75rem">These trust badges appear below the banner slider. Edit labels, change icons, or remove items — homepage updates instantly.</p>
      <div id="promoStripAdminContainer">
        <!-- rendered by renderAdminPromoStripUI() -->
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
        <button class="btn-primary" style="padding:0.6rem 1.25rem" onclick="applyPromoStrip()">✅ Apply All Changes</button>
        <button style="padding:0.6rem 1rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.85rem;cursor:pointer;background:transparent" onclick="savePromoStrips(JSON.parse(JSON.stringify(defaultPromoStrips)));renderLivePromoStrip(defaultPromoStrips);renderAdminPromoStripUI();showToast('↩ Strip reset to defaults!')">↩ Reset Defaults</button>
      </div>
    </div>

    <!-- SIDE PANELS TAB (hidden) -->
    <div id="hpTab-sidepanel" style="display:none" class="admin-section">
      <div class="admin-section-title">📌 Desktop Side Panels</div>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">These panels appear to the right of the banner slider on desktop view only.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.75rem">Panel 1 (Top — Large)</div>
          <div class="form-group"><label>Title Text</label><input type="text" id="sp1_title" value="iPhone রিমেয়ারে আপনার পাশে"></div>
          <div class="form-group"><label>Highlight Text</label><input type="text" id="sp1_highlight" value="Dizo Cart Care"></div>
          <div class="form-group"><label>Sub Text</label><input type="text" id="sp1_sub" value="☎ 09678-149 149"></div>
          <div class="form-group"><label>Background Gradient</label>
            <select id="sp1_gradient">
              <option value="linear-gradient(135deg,#0d1b3e 0%,#1a3a6e 100%)">🔵 Navy Blue</option>
              <option value="linear-gradient(135deg,#1a3a2a 0%,#2d6a4f 100%)">🌿 Forest</option>
              <option value="linear-gradient(135deg,#4a0e3c 0%,#8b1a6b 100%)">💜 Purple</option>
              <option value="linear-gradient(135deg,#1A1A18 0%,#4a4a45 100%)">🖤 Dark</option>
            </select>
          </div>
          <div class="form-group"><label>Icon Emoji</label><input type="text" id="sp1_emoji" value="🔧" maxlength="4" style="font-size:1.5rem;width:80px"></div>
        </div>
        <div>
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.75rem">Panel 2 (Bottom — Small)</div>
          <div class="form-group"><label>Emoji</label><input type="text" id="sp2_emoji" value="🍲" maxlength="4" style="font-size:1.5rem;width:80px"></div>
          <div class="form-group"><label>Highlight Text</label><input type="text" id="sp2_highlight" value="Induction Cooker"></div>
          <div class="form-group"><label>Caption</label><input type="text" id="sp2_caption" value="Instant Heat, Instant Taste"></div>
          <div class="form-group"><label>Background Gradient</label>
            <select id="sp2_gradient">
              <option value="linear-gradient(135deg,#2d3e1e 0%,#4a6a2a 100%)">🌿 Green</option>
              <option value="linear-gradient(135deg,#0a2a6e 0%,#2563EB 100%)">🔵 Blue</option>
              <option value="linear-gradient(135deg,#7C2D12 0%,#F97316 100%)">🔥 Orange</option>
              <option value="linear-gradient(135deg,#1A1A18 0%,#4a4a45 100%)">🖤 Dark</option>
            </select>
          </div>
        </div>
      </div>
      <button class="btn-primary" style="padding:0.6rem 1.25rem;margin-top:1rem" onclick="applySidePanels()">Apply Side Panel Changes</button>
    </div>

    <!-- SECTIONS TAB (hidden) -->
    <div id="hpTab-sections" style="display:none" class="admin-section">
      <div class="admin-section-title">📦 Homepage Sections Visibility</div>
      <p style="font-size:0.8rem;color:var(--text3);margin-bottom:1rem">Toggle which sections appear on the homepage.</p>
      ${[
        {label:'Banner Slider',desc:'Main hero banner with slides',id:'sec_banner'},
        {label:'Promo Services Strip',desc:'Trust badges strip',id:'sec_promo'},
        {label:'Shop By Category',desc:'Category grid cards',id:'sec_cats'},
        {label:'Featured Products',desc:'Main products grid',id:'sec_products'},
        {label:'Flash Sale Section',desc:'Countdown sale section',id:'sec_flash'},
        {label:'Best Sellers',desc:'Best selling products',id:'sec_bestsellers'},
        {label:'Testimonials',desc:'Customer reviews',id:'sec_testimonials'},
        {label:'Newsletter',desc:'Email subscription section',id:'sec_newsletter'},
        {label:'Brands Strip',desc:'Brand logos marquee',id:'sec_brands'},
      ].map(s=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-weight:600;font-size:0.85rem">${s.label}</div>
            <div style="font-size:0.72rem;color:var(--text3)">${s.desc}</div>
          </div>
          <label style="position:relative;display:inline-flex;width:40px;height:22px;cursor:pointer">
            <input type="checkbox" checked style="opacity:0;width:0;height:0" onchange="showToast('✅ Section visibility updated!')">
            <span style="position:absolute;inset:0;background:#10B981;border-radius:11px;transition:0.3s"></span>
            <span style="position:absolute;left:20px;top:3px;width:16px;height:16px;background:white;border-radius:50%;transition:0.3s"></span>
          </label>
        </div>
      `).join('')}
      <button class="btn-primary" style="padding:0.6rem 1.25rem;margin-top:1rem" onclick="showToast('✅ Section settings saved!')">Save Visibility Settings</button>
    </div>
  `;

  renderAdminSlideList();
}

function switchHomepageTab(tab, btn) {
  // Update tab buttons
  document.querySelectorAll('#homepageAdminTabs .admin-tab').forEach(t => t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  // Show/hide content
  ['banner','flashsale','promo','sidepanel','sections'].forEach(t => {
    const el = document.getElementById('hpTab-' + t);
    if(el) el.style.display = t === tab ? '' : 'none';
  });
  // Init flash sale list when tab opens
  if(tab === 'flashsale') {
    renderFlashProductList();
    updateFlashPreview();
  }
  // Init promo strip admin UI when tab opens
  if(tab === 'promo') {
    renderAdminPromoStripUI();
  }
}

function renderAdminSlideList() {
  const list = document.getElementById('adminSlideList');
  if(!list) return;
  list.innerHTML = adminBannerSlides.map((s, i) => `
    <div class="admin-section" style="padding:0.875rem 1rem;display:flex;align-items:center;gap:0.875rem;cursor:default;border-left:4px solid transparent" id="adminSlide_${i}">
      <div style="width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.75rem;background:${s.gradient};flex-shrink:0">${s.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:0.9rem;color:var(--text)">${s.headline}</div>
        <div style="font-size:0.72rem;color:var(--text3)">${s.tag} · Up to ${s.discount}% Off · ${s.perks.length} perks</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.3rem">${s.perks.map(p=>`<span style="font-size:0.62rem;background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:0.1rem 0.4rem">${p}</span>`).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.3rem;flex-shrink:0">
        <button onclick="openSlideEditor(${i})" style="font-size:0.7rem;padding:0.25rem 0.625rem;background:#DBEAFE;color:#1E3A8A;border:none;border-radius:4px;cursor:pointer">✏️ Edit</button>
        ${i > 0 ? `<button onclick="moveSlide(${i},-1)" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">↑ Up</button>` : ''}
        ${i < adminBannerSlides.length-1 ? `<button onclick="moveSlide(${i},1)" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">↓ Down</button>` : ''}
        ${adminBannerSlides.length > 1 ? `<button onclick="deleteSlide(${i})" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer">🗑 Del</button>` : ''}
      </div>
    </div>
  `).join('');
}

function openSlideEditor(idx) {
  adminEditingSlide = idx;
  const s = idx !== null ? adminBannerSlides[idx] : {tag:'',headline:'',sub:'',discount:'',emoji:'🛍️',bgImage:'',visualImage:'',gradient:'linear-gradient(135deg,#0a2a6e 0%,#1a4aae 60%,#2563EB 100%)',perks:[]};
  document.getElementById('slideEditorTitle').textContent = idx !== null ? `Edit Slide ${idx+1}: ${s.headline}` : 'Add New Slide';
  document.getElementById('se_tag').value = s.tag;
  document.getElementById('se_headline').value = s.headline;
  document.getElementById('se_sub').value = s.sub;
  document.getElementById('se_discount').value = s.discount;
  document.getElementById('se_emoji').value = s.emoji;
  document.getElementById('se_perks').value = s.perks.join(', ');
  document.getElementById('se_bgImageUrl').value = s.bgImage || '';
  document.getElementById('se_visualImageUrl').value = s.visualImage || '';
  // Show preview if image exists
  const prevWrap = document.getElementById('se_imagePreviewWrap');
  const prevImg = document.getElementById('se_imagePreview');
  if(s.bgImage){ prevWrap.style.display='block'; prevImg.src=s.bgImage; }
  else { prevWrap.style.display='none'; prevImg.src=''; }
  // Set gradient select
  const gSel = document.getElementById('se_gradient');
  let matched = false;
  for(let o of gSel.options){ if(o.value === s.gradient){ gSel.value = s.gradient; matched = true; break; } }
  if(!matched) gSel.selectedIndex = 0;
  document.getElementById('slideEditorWrap').style.display = 'block';
  document.getElementById('slideEditorWrap').scrollIntoView({behavior:'smooth',block:'nearest'});
  previewSlide();
}

function previewSlide() {
  const gradient = document.getElementById('se_gradient').value;
  const bgImg = document.getElementById('se_bgImageUrl').value.trim();
  const overlayDark = document.getElementById('se_overlayDark') ? document.getElementById('se_overlayDark').checked : true;
  const box = document.getElementById('slidePreviewBox');
  if(bgImg){
    box.style.background = gradient;
    box.style.backgroundImage = `${overlayDark ? 'linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),' : ''}url('${bgImg}')`;
    box.style.backgroundSize = 'cover';
    box.style.backgroundPosition = 'center';
  } else {
    box.style.background = gradient;
    box.style.backgroundImage = '';
  }
  // Show bg image preview
  const prevWrap = document.getElementById('se_imagePreviewWrap');
  const prevImg = document.getElementById('se_imagePreview');
  if(bgImg){ prevWrap.style.display='block'; prevImg.src=bgImg; }
  else { prevWrap.style.display='none'; }

  document.getElementById('prev_tag').textContent = document.getElementById('se_tag').value;
  document.getElementById('prev_headline').textContent = document.getElementById('se_headline').value;
  document.getElementById('prev_sub').textContent = document.getElementById('se_sub').value;
  const disc = document.getElementById('se_discount').value;
  document.getElementById('prev_discount').innerHTML = disc ? `Upto <span style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#C8A96E;font-style:italic">${disc}%</span> Off` : '';
  // Visual: real image or emoji
  const visualSrc = document.getElementById('se_visualImageUrl').value.trim();
  const emojiVal = document.getElementById('se_emoji').value;
  const visualEl = document.getElementById('prev_emoji');
  if(visualSrc){
    visualEl.innerHTML = `<img src="${visualSrc}" style="max-height:90px;max-width:100px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));border-radius:8px" onerror="this.parentElement.textContent='${emojiVal}'">`;
  } else {
    visualEl.textContent = emojiVal;
  }
  const perksRaw = document.getElementById('se_perks').value;
  const perks = perksRaw.split(',').map(p=>p.trim()).filter(Boolean);
  document.getElementById('prev_perks').innerHTML = perks.map(p=>`<span style="background:rgba(255,255,255,0.15);color:#fff;font-size:0.62rem;font-weight:600;padding:0.2rem 0.5rem;border-radius:20px;border:1px solid rgba(255,255,255,0.2)">${p}</span>`).join('');
}

function handleSlideImageUpload(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('se_bgImageUrl').value = e.target.result;
    previewSlide();
  };
  reader.readAsDataURL(file);
}

function handleSlideVisualUpload(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('se_visualImageUrl').value = e.target.result;
    previewSlide();
  };
  reader.readAsDataURL(file);
}

function clearSlideImage() {
  document.getElementById('se_bgImageUrl').value = '';
  document.getElementById('se_bgImageFile').value = '';
  document.getElementById('se_imagePreviewWrap').style.display = 'none';
  previewSlide();
}

function saveSlideEdit() {
  const perksRaw = document.getElementById('se_perks').value;
  const slide = {
    tag: document.getElementById('se_tag').value.trim() || 'PROMOTION',
    headline: document.getElementById('se_headline').value.trim() || 'New Slide',
    sub: document.getElementById('se_sub').value.trim(),
    discount: document.getElementById('se_discount').value.trim() || '0',
    emoji: document.getElementById('se_emoji').value.trim() || '🛍️',
    bgImage: document.getElementById('se_bgImageUrl').value.trim(),
    visualImage: document.getElementById('se_visualImageUrl').value.trim(),
    overlayDark: document.getElementById('se_overlayDark') ? document.getElementById('se_overlayDark').checked : true,
    gradient: document.getElementById('se_gradient').value,
    perks: perksRaw.split(',').map(p=>p.trim()).filter(Boolean),
  };
  if(adminEditingSlide !== null) {
    adminBannerSlides[adminEditingSlide] = slide;
    showToast('✅ Slide updated!');
  } else {
    adminBannerSlides.push(slide);
    showToast('✅ New slide added!');
  }
  applyBannerSlidesToLivePage();
  cancelSlideEdit();
  renderAdminSlideList();
}

function cancelSlideEdit() {
  document.getElementById('slideEditorWrap').style.display = 'none';
  adminEditingSlide = null;
}

function moveSlide(idx, dir) {
  const target = idx + dir;
  if(target < 0 || target >= adminBannerSlides.length) return;
  [adminBannerSlides[idx], adminBannerSlides[target]] = [adminBannerSlides[target], adminBannerSlides[idx]];
  applyBannerSlidesToLivePage();
  renderAdminSlideList();
  showToast('🔀 Slide reordered!');
}

function deleteSlide(idx) {
  if(adminBannerSlides.length <= 1){ showToast('⚠️ Must have at least 1 slide!'); return; }
  adminBannerSlides.splice(idx, 1);
  applyBannerSlidesToLivePage();
  renderAdminSlideList();
  showToast('🗑 Slide deleted!');
}

function applyBannerSlidesToLivePage() {
  const slider = document.getElementById('bannerSlider');
  if(!slider) return;
  slider.innerHTML = adminBannerSlides.map((s, i) => {
    // Background: image or gradient
    let bgStyle = `background:${s.gradient}`;
    if(s.bgImage){
      const overlay = s.overlayDark !== false ? 'linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),' : '';
      bgStyle = `background:${s.gradient};background-image:${overlay}url('${s.bgImage}');background-size:cover;background-position:center`;
    }
    // Visual: image or emoji
    const visualHTML = s.visualImage
      ? `<img src="${s.visualImage}" style="max-height:180px;max-width:200px;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));border-radius:12px" onerror="this.outerHTML='<div class=banner-emoji-big>${s.emoji}</div>'">`
      : `<div class="banner-emoji-big">${s.emoji}</div>`;
    return `
    <div class="banner-slide ${i===0?'active':''}" style="${bgStyle}">
      <div class="banner-slide-content">
        <div class="banner-tag">${s.tag}</div>
        <div class="banner-headline">${s.headline}</div>
        <div class="banner-sub">${s.sub}</div>
        <div class="banner-discount">Upto <span>${s.discount}%</span> Off</div>
        <div class="banner-perks">${s.perks.map(p=>`<span>${p}</span>`).join('')}</div>
      </div>
      <div class="banner-slide-visual">${visualHTML}</div>
    </div>`;
  }).join('');
  // Re-append dots and arrows after all slides
  slider.insertAdjacentHTML('beforeend', `<div class="banner-dots-area" id="bannerDots"></div><button class="banner-arrow banner-prev" onclick="bannerSlide(-1)">&#8249;</button><button class="banner-arrow banner-next" onclick="bannerSlide(1)">&#8250;</button>`);
  bannerIndex = 0;
  // Clear old auto-interval and re-init slider
  if(bannerAutoInterval) clearInterval(bannerAutoInterval);
  bannerSlides = Array.from(slider.querySelectorAll('.banner-slide'));
  dotsArea = document.getElementById('bannerDots');
  if(dotsArea){
    dotsArea.innerHTML = bannerSlides.map((_,i)=>
      `<button class="banner-dot${i===0?' active':''}" onclick="goBannerSlide(${i})"></button>`
    ).join('');
  }
  bannerAutoInterval = setInterval(()=>bannerSlide(1), 4000);
}

// ===================== FLASH SALE ADMIN =====================
let flashSaleProducts = [];
let flashEditingId = null; // null=new, number=id
let flashProductImageBase64 = '';
let flashNextId = 1; // managed dynamically

// ✅ Load all saved catalog data now that all arrays are declared
loadProductsFromStorage();

function renderFlashProductList(){
  const list = document.getElementById('flashProductList');
  if(!list) return;
  if(!flashSaleProducts.length){
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:0.85rem">No flash sale products yet. Click "+ Add Product" to get started.</div>';
    return;
  }
  list.innerHTML = flashSaleProducts.map((p,i)=>{
    const imgHTML = p.img ? `<img src="${p.img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">` : `<div style="width:44px;height:44px;background:rgba(255,255,255,0.08);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">${p.emoji}</div>`;
    return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.875rem;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2)">
      ${imgHTML}
      <div style="flex:1;min-width:0">
        <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
        <div style="font-size:0.72rem;color:var(--text3)">৳${p.price.toLocaleString()} <span style="text-decoration:line-through">৳${p.oldPrice.toLocaleString()}</span> · <span style="color:#C8A96E;font-weight:700">${p.discount}% OFF</span> · Sold:${p.sold} Left:${p.left}</div>
      </div>
      <div style="display:flex;gap:0.375rem;flex-shrink:0">
        <button onclick="moveFlashProduct(${i},-1)" style="width:28px;height:28px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem" title="Move up">▲</button>
        <button onclick="moveFlashProduct(${i},1)" style="width:28px;height:28px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem" title="Move down">▼</button>
        <button onclick="openFlashProductEditor(${p.id})" style="font-size:0.72rem;padding:0.2rem 0.6rem;background:#DBEAFE;color:#1E3A8A;border:none;border-radius:4px;cursor:pointer;font-weight:600">✏️ Edit</button>
        <button onclick="deleteFlashProduct(${p.id})" style="font-size:0.72rem;padding:0.2rem 0.6rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer;font-weight:600">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function openFlashProductEditor(id){
  flashEditingId = id;
  flashProductImageBase64 = '';
  const wrap = document.getElementById('flashProductEditorWrap');
  wrap.style.display = 'block';
  wrap.scrollIntoView({behavior:'smooth',block:'start'});
  document.getElementById('flashEditorTitle').textContent = id===null ? 'Add Flash Product' : 'Edit Flash Product';

  // Reset
  document.getElementById('fpName').value='';
  document.getElementById('fpEmoji').value='';
  document.getElementById('fpImgUrl').value='';
  document.getElementById('fpImgFile').value='';
  document.getElementById('fpPrice').value='';
  document.getElementById('fpOldPrice').value='';
  document.getElementById('fpDiscount').value='';
  document.getElementById('fpDiscountCalc').textContent='';
  document.getElementById('fpSold').value='';
  document.getElementById('fpLeft').value='';
  document.getElementById('fpCat').value='kitchen';
  document.getElementById('fpPreviewEmoji').textContent='🛍️';
  document.getElementById('fpPreviewImg').style.display='none';
  document.getElementById('fpPreviewImg').src='';
  document.getElementById('fpPrev_img').innerHTML='<span style="font-size:2.5rem">🛍️</span>';
  updateFlashPreview();

  if(id !== null){
    const p = flashSaleProducts.find(x=>x.id===id);
    if(!p) return;
    document.getElementById('fpName').value = p.name;
    document.getElementById('fpEmoji').value = p.emoji;
    document.getElementById('fpPrice').value = p.price;
    document.getElementById('fpOldPrice').value = p.oldPrice;
    document.getElementById('fpDiscount').value = p.discount;
    document.getElementById('fpDiscountCalc').textContent = `(${p.discount}% OFF)`;
    document.getElementById('fpSold').value = p.sold;
    document.getElementById('fpLeft').value = p.left;
    document.getElementById('fpCat').value = p.cat;
    if(p.img){
      flashProductImageBase64 = p.img;
      document.getElementById('fpImgUrl').value = p.img.startsWith('data:') ? '' : p.img;
      showFlashImgPreview(p.img);
    } else {
      updateFlashEmojiPreview(p.emoji);
    }
    updateFlashPreview();
  }
}

function cancelFlashEditor(){
  document.getElementById('flashProductEditorWrap').style.display='none';
  flashEditingId = null;
  flashProductImageBase64 = '';
}

function handleFlashImgUpload(input){
  if(!input.files||!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e=>{
    flashProductImageBase64 = e.target.result;
    showFlashImgPreview(e.target.result);
    updateFlashPreview();
  };
  reader.readAsDataURL(input.files[0]);
}

function handleFlashImgUrl(url){
  if(!url){clearFlashImg();return;}
  flashProductImageBase64 = url;
  showFlashImgPreview(url);
  updateFlashPreview();
}

function showFlashImgPreview(src){
  const img = document.getElementById('fpPreviewImg');
  const em = document.getElementById('fpPreviewEmoji');
  img.src = src;
  img.style.display = 'block';
  em.style.display = 'none';
  const pimg = document.getElementById('fpPrev_img');
  pimg.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=font-size:2.5rem>${document.getElementById('fpEmoji').value||'🛍️'}</span>'">`;
}

function clearFlashImg(){
  flashProductImageBase64 = '';
  document.getElementById('fpImgFile').value='';
  document.getElementById('fpImgUrl').value='';
  const img = document.getElementById('fpPreviewImg');
  img.src=''; img.style.display='none';
  document.getElementById('fpPreviewEmoji').style.display='';
  updateFlashPreview();
}

function updateFlashEmojiPreview(val){
  document.getElementById('fpPreviewEmoji').textContent = val || '🛍️';
  if(!flashProductImageBase64){
    document.getElementById('fpPrev_img').innerHTML = `<span style="font-size:2.5rem">${val||'🛍️'}</span>`;
  }
  updateFlashPreview();
}

function calcFlashDiscount(){
  const price = parseFloat(document.getElementById('fpPrice').value)||0;
  const old = parseFloat(document.getElementById('fpOldPrice').value)||0;
  if(price>0 && old>0 && old>price){
    const pct = Math.round(((old-price)/old)*100);
    document.getElementById('fpDiscount').value = pct;
    document.getElementById('fpDiscountCalc').textContent = `(${pct}% OFF)`;
  } else {
    document.getElementById('fpDiscount').value='';
    document.getElementById('fpDiscountCalc').textContent='';
  }
  updateFlashPreview();
}

function updateFlashPreview(){
  const name = document.getElementById('fpName')?.value || 'Product Name';
  const price = parseInt(document.getElementById('fpPrice')?.value)||0;
  const old = parseInt(document.getElementById('fpOldPrice')?.value)||0;
  const discount = parseInt(document.getElementById('fpDiscount')?.value)||0;
  const sold = parseInt(document.getElementById('fpSold')?.value)||0;
  const left = parseInt(document.getElementById('fpLeft')?.value)||0;
  const total = sold+left||1;
  const pct = Math.round((sold/total)*100);
  const el = id=>document.getElementById(id);
  if(el('fpPrev_name')) el('fpPrev_name').textContent = name;
  if(el('fpPrev_price')) el('fpPrev_price').textContent = price?`৳${price.toLocaleString()}`:'৳0';
  if(el('fpPrev_old')) el('fpPrev_old').textContent = old?`৳${old.toLocaleString()}`:'৳0';
  if(el('fpPrev_badge')) el('fpPrev_badge').textContent = discount?`${discount}% OFF`:'0% OFF';
  if(el('fpPrev_sold')) el('fpPrev_sold').textContent = `Sold: ${sold}`;
  if(el('fpPrev_left')) el('fpPrev_left').textContent = `Left: ${left}`;
  if(el('fpPrev_bar')) el('fpPrev_bar').style.width = pct+'%';
}

function saveFlashProduct(){
  const name = document.getElementById('fpName').value.trim();
  const emoji = document.getElementById('fpEmoji').value.trim()||'🛍️';
  const price = parseInt(document.getElementById('fpPrice').value)||0;
  const oldPrice = parseInt(document.getElementById('fpOldPrice').value)||0;
  const discount = parseInt(document.getElementById('fpDiscount').value)||0;
  const sold = parseInt(document.getElementById('fpSold').value)||0;
  const left = parseInt(document.getElementById('fpLeft').value)||0;
  const cat = document.getElementById('fpCat').value;
  const img = flashProductImageBase64 || document.getElementById('fpImgUrl').value.trim();

  if(!name){showToast('⚠️ Product name is required!');return;}
  if(!price||!oldPrice){showToast('⚠️ Both prices are required!');return;}

  if(flashEditingId===null){
    const newFlashId = Math.max(...flashSaleProducts.map(f=>f.id), 0) + 1;
    flashSaleProducts.push({id:newFlashId,name,emoji,img,price,oldPrice,discount,sold,left,cat});
    showToast('✅ Flash product added!');
  } else {
    const idx = flashSaleProducts.findIndex(x=>x.id===flashEditingId);
    if(idx>-1) flashSaleProducts[idx] = {id:flashEditingId,name,emoji,img,price,oldPrice,discount,sold,left,cat};
    showToast('✅ Flash product updated!');
  }
  // Auto-generate ID for new products from flash panel
  if(flashEditingId === null){
    flashNextId = Math.max(...flashSaleProducts.map(f=>f.id), 0) + 1;
  }
  saveProductsToStorage();
  applyFlashSaleToPage();
  renderFlashProductList();
  cancelFlashEditor();
}

function deleteFlashProduct(id){
  flashSaleProducts = flashSaleProducts.filter(x=>x.id!==id);
  // Also update isFlashSale flag on the product if it exists in catalog
  const updateInCatalog = arr => {
    const p = arr.find(x=>x.id===id);
    if(p){ p.isFlashSale = false; p.flashSold = 0; p.flashLeft = 0; }
  };
  updateInCatalog(products);
  updateInCatalog(bestSellers);
  saveProductsToStorage();
  applyFlashSaleToPage();
  renderFlashProductList();
  showToast('🗑 Flash product removed!');
}

function moveFlashProduct(idx, dir){
  const newIdx = idx+dir;
  if(newIdx<0||newIdx>=flashSaleProducts.length) return;
  [flashSaleProducts[idx],flashSaleProducts[newIdx]] = [flashSaleProducts[newIdx],flashSaleProducts[idx]];
  saveProductsToStorage();
  applyFlashSaleToPage();
  renderFlashProductList();
}

function applyFlashSaleSettings(){
  const title = document.getElementById('fs_sectionTitle').value.trim()||'Flash Sale';
  const h = parseInt(document.getElementById('fs_hours').value)||8;
  const m = parseInt(document.getElementById('fs_mins').value)||0;
  const s = parseInt(document.getElementById('fs_secs').value)||0;
  const titleEl = document.getElementById('flashSaleTitleText');
  if(titleEl) titleEl.textContent = title;
  totalSecs = h*3600+m*60+s;
  showToast('✅ Flash sale settings applied!');
}

function previewFlashTitle(){
  const title = document.getElementById('fs_sectionTitle')?.value||'Flash Sale';
  const el = document.getElementById('flashSaleTitleText');
  if(el) el.textContent = title;
}

function applyFlashSaleToPage(){
  const grid = document.getElementById('flashSaleGrid');
  const section = document.querySelector('.flash-sale-section');
  if(!grid) return;
  if(!flashSaleProducts.length){
    // Hide entire flash sale section — nothing to show
    if(section) section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }
  // Show section
  if(section) section.style.display = '';
  grid.innerHTML = flashSaleProducts.map(p=>{
    const total = (p.sold+p.left)||1;
    const barPct = Math.round((p.sold/total)*100);
    const imgHTML = p.img
      ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const emojiHTML = `<div style="${p.img?'display:none;':''}width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem">${p.emoji}</div>`;
    return `<div class="flash-card hover-lift" onclick="openProductDetail(${p.id})" style="cursor:pointer">
      <div class="flash-img" style="position:relative;overflow:hidden">${imgHTML}${emojiHTML}</div>
      <div class="flash-body">
        <div class="flash-name">${p.name}</div>
        <div class="flash-price"><span class="flash-current">৳${p.price.toLocaleString()}</span><span class="flash-old">৳${p.oldPrice.toLocaleString()}</span><span class="flash-off-badge">${p.discount}% OFF</span></div>
        <div class="flash-progress"><div class="flash-progress-label"><span>Sold: ${p.sold}</span><span>Left: ${p.left}</span></div><div class="flash-bar"><div class="flash-fill" style="width:${barPct}%"></div></div></div>
        <div class="flash-btns">
          <button class="flash-btn-atc" onclick="event.stopPropagation();addToCartById(${p.id},'${p.name.replace(/'/g,"\\'")}','${p.emoji}',${p.price})">🛒 Cart</button>
          <button class="flash-btn-buy" onclick="event.stopPropagation();buyNowById(${p.id},'${p.name.replace(/'/g,"\\'")}','${p.emoji}',${p.price})">⚡ Buy Now</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function applySliderSettings() {
  const speed = parseInt(document.getElementById('sliderSpeed').value) || 4;
  showToast(`✅ Slider set to ${speed}s auto-advance!`);
}


/* ===== DYNAMIC PROMO STRIP SYSTEM ===== */
const PROMO_STRIP_KEY = 'dizo_promo_strip_v1';

// Default strips
const defaultPromoStrips = [
  {icon:'💳', label:'36 Months EMI'},
  {icon:'🛵', label:'Fastest Home Delivery'},
  {icon:'🔄', label:'Exchange Facility'},
  {icon:'🏷️', label:'Best Price Deals'},
  {icon:'🎧', label:'After-Sales Service'},
];

function loadPromoStrips(){
  try {
    const raw = localStorage.getItem(PROMO_STRIP_KEY);
    if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }
  } catch(e){}
  return JSON.parse(JSON.stringify(defaultPromoStrips));
}

function savePromoStrips(arr){
  try { localStorage.setItem(PROMO_STRIP_KEY, JSON.stringify(arr)); } catch(e){}
}

function renderLivePromoStrip(strips){
  const inner = document.querySelector('.promo-services-inner');
  if(!inner) return;
  inner.innerHTML = strips.map((s, i) => `
    <div class="promo-service-item">
      <div class="promo-service-icon">${s.icon}</div>
      <span>${s.label}</span>
    </div>
    ${i < strips.length - 1 ? '<div class="promo-service-sep"></div>' : ''}
  `).join('');
}

function applyPromoStrip() {
  // Read current values from admin form inputs
  const rows = document.querySelectorAll('.ps-admin-row');
  const newStrips = [];
  rows.forEach(row => {
    const iconInp = row.querySelector('.ps-icon-inp');
    const labelInp = row.querySelector('.ps-label-inp');
    if(iconInp && labelInp && labelInp.value.trim()){
      newStrips.push({icon: iconInp.value.trim() || '⭐', label: labelInp.value.trim()});
    }
  });
  if(!newStrips.length){ showToast('⚠️ At least one strip item is required'); return; }
  savePromoStrips(newStrips);
  renderLivePromoStrip(newStrips);
  showToast('✅ Promo strip updated on homepage!');
}

function removePromoStripItem(idx){
  const strips = loadPromoStrips();
  if(strips.length <= 1){ showToast('⚠️ Must keep at least 1 item'); return; }
  strips.splice(idx, 1);
  savePromoStrips(strips);
  renderLivePromoStrip(strips);
  renderAdminPromoStripUI();
  showToast('🗑 Strip item removed. Homepage updated!');
}

function addPromoStripItem(){
  const strips = loadPromoStrips();
  if(strips.length >= 8){ showToast('⚠️ Maximum 8 items allowed'); return; }
  strips.push({icon:'⭐', label:'New Service'});
  savePromoStrips(strips);
  renderLivePromoStrip(strips);
  renderAdminPromoStripUI();
  showToast('✅ New strip item added!');
}

function renderAdminPromoStripUI(){
  const container = document.getElementById('promoStripAdminContainer');
  if(!container) return;
  const strips = loadPromoStrips();
  container.innerHTML = strips.map((s, i) => `
    <div class="ps-admin-row" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--border)">
      <div style="font-size:1.5rem;width:36px;text-align:center;flex-shrink:0">${s.icon}</div>
      <div class="form-group" style="flex:1;margin:0;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
        <input type="text" class="ps-icon-inp" value="${s.icon}" maxlength="4"
          style="width:54px;font-size:1.2rem;text-align:center;padding:0.4rem;border:1.5px solid var(--border);border-radius:var(--r2);outline:none;font-family:inherit"
          oninput="this.parentElement.parentElement.querySelector('div').textContent=this.value||'⭐'"
          onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
        <input type="text" class="ps-label-inp" value="${s.label}"
          style="flex:1;min-width:160px;padding:0.45rem 0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.875rem;outline:none;font-family:inherit"
          onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
      </div>
      <button onclick="removePromoStripItem(${i})"
        style="flex-shrink:0;width:32px;height:32px;background:#FEE2E2;color:#991B1B;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s"
        onmouseover="this.style.background='#dc2626';this.style.color='#fff'"
        onmouseout="this.style.background='#FEE2E2';this.style.color='#991B1B'"
        title="Remove this item">✕</button>
    </div>
  `).join('');
}

// Apply saved promo strips on page load
document.addEventListener('DOMContentLoaded', function(){
  const saved = loadPromoStrips();
  // Only apply if different from default (i.e., admin has made changes)
  try {
    if(localStorage.getItem(PROMO_STRIP_KEY)) renderLivePromoStrip(saved);
  } catch(e){}
});

function applySidePanels() {
  const s1 = document.querySelector('.side-banner-1');
  const s2 = document.querySelector('.side-banner-2');
  if(s1) {
    s1.style.background = document.getElementById('sp1_gradient').value;
    const t = s1.querySelector('.side-banner-title'); if(t) t.innerHTML = document.getElementById('sp1_title').value;
    const h = s1.querySelector('.side-banner-highlight'); if(h) h.textContent = document.getElementById('sp1_highlight').value;
    const sb = s1.querySelector('.side-banner-sub'); if(sb) sb.textContent = document.getElementById('sp1_sub').value;
    const em = s1.querySelector('[style*="opacity:0.3"]'); if(em) em.textContent = document.getElementById('sp1_emoji').value;
  }
  if(s2) {
    s2.style.background = document.getElementById('sp2_gradient').value;
    const em2 = s2.querySelector('[style*="margin-bottom:0.5rem"]'); if(em2) em2.textContent = document.getElementById('sp2_emoji').value;
    const h2 = s2.querySelector('.side-banner-highlight'); if(h2) h2.textContent = document.getElementById('sp2_highlight').value;
    const cap = s2.querySelector('.side-banner-title'); if(cap) cap.textContent = document.getElementById('sp2_caption').value;
  }
  showToast('✅ Side panels updated!');
}

function showAdminDashboard(){
  const an = StoreDB.getAnalytics();
  const db = StoreDB.get();
  const recentOrders = db.orders.slice(0, 8);
  const allProds = [...products, ...bestSellers];

  // Format revenue
  const fmtRevenue = v => v >= 1000000 ? '৳'+(v/1000000).toFixed(1)+'M' : v >= 1000 ? '৳'+(v/1000).toFixed(1)+'K' : '৳'+v.toLocaleString();

  // Empty state helper
  const emptyState = (icon, msg) => `<div style="text-align:center;padding:2.5rem 1rem;color:var(--text3)"><div style="font-size:2.5rem;margin-bottom:0.75rem">${icon}</div><div style="font-size:0.875rem">${msg}</div></div>`;

  // Recent orders rows
  const orderRows = recentOrders.length ? recentOrders.map(o=>{
    const itemsLabel = (o.items||[]).map(i=>`${i.name}${i.qty>1?' ×'+i.qty:''}`).join(', ');
    return `<tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.name}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${itemsLabel}</td>
      <td>৳${(o.total||0).toLocaleString()}</td>
      <td><span class="status-badge status-${(o.status||'pending').toLowerCase()}">${o.status||'Pending'}</span></td>
      <td><button onclick="adminViewOrder('${o.id}')" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">View</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6">${emptyState('📦','No orders yet. Orders placed in the store will appear here.')}</td></tr>`;

  // Top products
  const topProdsHTML = an.topProducts.length
    ? an.topProducts.map(p=>`<div style="display:flex;justify-content:space-between;padding:0.55rem 0;border-bottom:1px solid var(--border);font-size:0.82rem"><span>${p.name}</span><span style="color:#059669">${p.sold} sold</span></div>`).join('')
    : emptyState('📊','No sales data yet');

  // Activity feed
  const activityHTML = db.activityLog.length
    ? db.activityLog.slice(0,6).map(a=>`<div style="display:flex;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid var(--border);font-size:0.8rem;align-items:flex-start"><span style="color:var(--text3);white-space:nowrap;font-size:0.7rem">${new Date(a.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><span>${a.text}</span></div>`).join('')
    : emptyState('📡','Activity feed is empty. Real-time events will appear here.');

  document.getElementById('adminContent').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.5rem">
      <h2 style="font-family:'Playfair Display',serif;font-size:1.35rem">Dashboard Overview</h2>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
        <button onclick="adminResetConfirm('orders')" style="font-size:0.7rem;padding:0.25rem 0.6rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer">🔐 Reset Orders</button>
        <button onclick="adminResetConfirm('customers')" style="font-size:0.7rem;padding:0.25rem 0.6rem;background:#FEF3C7;color:#92400E;border:none;border-radius:4px;cursor:pointer">🔐 Reset Customers</button>
        <button onclick="adminResetConfirm('analytics')" style="font-size:0.7rem;padding:0.25rem 0.6rem;background:#EDE9FE;color:#4C1D95;border:none;border-radius:4px;cursor:pointer">🔐 Reset Analytics</button>
        <button onclick="adminResetConfirm('factory')" style="font-size:0.7rem;padding:0.25rem 0.6rem;background:var(--text);color:#fff;border:none;border-radius:4px;cursor:pointer">🔐 Factory Reset</button>
      </div>
    </div>
    <div class="admin-cards">
      <div class="admin-card"><div class="admin-card-label">Total Revenue</div><div class="admin-card-value">${fmtRevenue(an.totalRevenue)}</div><div class="admin-card-change" style="color:${an.todayRevenue>0?'#059669':'var(--text3)'}">Today: ${fmtRevenue(an.todayRevenue)}</div></div>
      <div class="admin-card"><div class="admin-card-label">Total Orders</div><div class="admin-card-value">${an.totalOrders.toLocaleString()}</div><div class="admin-card-change" style="color:${an.todayOrders>0?'#059669':'var(--text3)'}">Today: ${an.todayOrders}</div></div>
      <div class="admin-card"><div class="admin-card-label">Customers</div><div class="admin-card-value">${an.totalCustomers.toLocaleString()}</div><div class="admin-card-change" style="color:var(--text3)">Unique buyers</div></div>
      <div class="admin-card"><div class="admin-card-label">Products</div><div class="admin-card-value">${an.totalProducts.toLocaleString()}</div><div class="admin-card-change" style="color:var(--text3)">In catalogue</div></div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">Recent Orders <button class="btn-primary" style="font-size:0.72rem;padding:0.3rem 0.625rem" onclick="showAdminTab('orders',null)">View All</button></div>
      <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Products</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem" class="admin-dash-bottom">
      <div class="admin-section">
        <div class="admin-section-title">Top Products</div>
        ${topProdsHTML}
      </div>
      <div class="admin-section">
        <div class="admin-section-title">Activity Feed</div>
        ${activityHTML}
      </div>
    </div>
  `;
  const dashBottom = document.querySelector('.admin-dash-bottom');
  if(dashBottom && window.innerWidth < 600){ dashBottom.style.gridTemplateColumns = '1fr'; }
}

function adminViewOrder(orderId){
  const db = StoreDB.get();
  const o = db.orders.find(x=>x.id===orderId);
  if(!o){ showToast('Order not found'); return; }
  const items = (o.items||[]).map(i=>`<div style="padding:0.35rem 0;font-size:0.85rem">${i.emoji||'📦'} ${i.name} × ${i.qty} — ৳${(i.price*i.qty).toLocaleString()}</div>`).join('');
  showToast(`📋 ${o.id} · ${o.name} · ৳${o.total.toLocaleString()}`);
}

// ===================== SECURE ADMIN RESET SYSTEM =====================
// Cooldown system
let _resetCooldownUntil = 0;
let _resetFailAttempts = 0;
let _resetCooldownTimer = null;

// Dynamically checks against ADMIN_PASSWORD — changes automatically when admin password is updated
function _verifyResetPassword(input){
  return input === ADMIN_PASSWORD;
}

let _pendingResetType = null;

function adminResetConfirm(type){
  // Check cooldown
  const now = Date.now();
  if(_resetCooldownUntil > now){
    const secs = Math.ceil((_resetCooldownUntil - now)/1000);
    showToast(`🔒 Too many failed attempts. Try again in ${secs}s.`);
    return;
  }
  _pendingResetType = type;
  const labels={
    orders:{label:'All Orders',icon:'📦',color:'#dc2626',desc:'This will permanently delete all order history and cannot be undone.'},
    customers:{label:'All Customers',icon:'👥',color:'#d97706',desc:'This will permanently delete all customer records.'},
    analytics:{label:'Analytics Data',icon:'📊',color:'#7c3aed',desc:'This will clear all activity logs and analytics counters.'},
    factory:{label:'EVERYTHING (Factory Reset)',icon:'⚠️',color:'#991B1B',desc:'This will wipe ALL data — orders, customers, analytics. The system will return to fresh install state.'}
  };
  const meta = labels[type] || {label:type,icon:'🗑️',color:'#dc2626',desc:'This action is irreversible.'};

  // Build and show the confirmation modal
  showResetConfirmModal(meta);
}

function showResetConfirmModal(meta){
  // Remove existing if any
  const existing = document.getElementById('secureResetModal');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'secureResetModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';

  modal.innerHTML = `
    <div style="background:var(--white);border-radius:16px;padding:2rem;max-width:420px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.35)">
      <!-- Step 1: Confirm -->
      <div id="resetStep1">
        <div style="font-size:2.5rem;text-align:center;margin-bottom:0.75rem">${meta.icon}</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.25rem;text-align:center;margin-bottom:0.5rem;color:var(--text)">Confirm Reset Action</h3>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:0.875rem 1rem;margin-bottom:1.25rem;font-size:0.82rem;color:#7f1d1d;line-height:1.6">
          <strong style="color:${meta.color}">⚠ Warning:</strong> ${meta.desc}
        </div>
        <div style="font-size:0.875rem;color:var(--text2);text-align:center;margin-bottom:1.25rem">You are about to delete: <strong style="color:${meta.color}">${meta.label}</strong></div>
        <div style="display:flex;gap:0.625rem">
          <button onclick="closeResetModal()" style="flex:1;padding:0.7rem;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:600;font-family:inherit">Cancel</button>
          <button onclick="showResetPasswordStep()" style="flex:1;padding:0.7rem;background:${meta.color};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:700;font-family:inherit">Yes, Continue →</button>
        </div>
      </div>

      <!-- Step 2: Password -->
      <div id="resetStep2" style="display:none">
        <div style="font-size:2rem;text-align:center;margin-bottom:0.625rem">🔐</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.15rem;text-align:center;margin-bottom:0.375rem">Admin Authentication</h3>
        <p style="font-size:0.8rem;color:var(--text3);text-align:center;margin-bottom:1.25rem">Enter your admin password to authorize this reset</p>
        <div style="position:relative;margin-bottom:0.75rem">
          <input type="password" id="resetPwdInput" placeholder="Enter admin password"
            onkeydown="if(event.key==='Enter')executeSecureReset()"
            style="width:100%;padding:0.7rem 2.75rem 0.7rem 0.875rem;border:2px solid var(--border);border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color 0.2s"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
          <button onclick="toggleResetPwdVisibility()" style="position:absolute;right:0.625rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;line-height:1" id="resetPwdEyeBtn">👁</button>
        </div>
        <div id="resetPwdError" style="display:none;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.78rem;color:#dc2626;margin-bottom:0.75rem;text-align:center"></div>
        <div id="resetCooldownBar" style="display:none;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.78rem;color:#c2410c;margin-bottom:0.75rem;text-align:center"></div>
        <div style="display:flex;gap:0.625rem">
          <button onclick="closeResetModal()" style="flex:1;padding:0.7rem;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:600;font-family:inherit">Cancel</button>
          <button onclick="executeSecureReset()" id="resetExecuteBtn" style="flex:1;padding:0.7rem;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:700;font-family:inherit">🗑 Execute Reset</button>
        </div>
        <button onclick="showResetStep1()" style="width:100%;margin-top:0.5rem;background:none;border:none;color:var(--text3);font-size:0.78rem;cursor:pointer;text-decoration:underline;font-family:inherit">← Back</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  // Prevent background scroll
  setTimeout(()=>{ const inp = document.getElementById('resetPwdInput'); }, 100);
}

function showResetPasswordStep(){
  document.getElementById('resetStep1').style.display='none';
  document.getElementById('resetStep2').style.display='block';
  setTimeout(()=>{ const inp = document.getElementById('resetPwdInput'); if(inp) inp.focus(); }, 100);
}

function showResetStep1(){
  document.getElementById('resetStep1').style.display='block';
  document.getElementById('resetStep2').style.display='none';
}

function toggleResetPwdVisibility(){
  const inp = document.getElementById('resetPwdInput');
  const btn = document.getElementById('resetPwdEyeBtn');
  if(inp){ inp.type = inp.type==='password' ? 'text' : 'password'; }
  if(btn){ btn.textContent = inp.type==='password' ? '👁' : '🙈'; }
}

function closeResetModal(){
  const m = document.getElementById('secureResetModal');
  if(m){ m.style.opacity='0'; m.style.transition='opacity 0.2s'; setTimeout(()=>m.remove(),200); }
  _pendingResetType = null;
  if(_resetCooldownTimer){ clearInterval(_resetCooldownTimer); _resetCooldownTimer=null; }
}

function executeSecureReset(){
  const inp = document.getElementById('resetPwdInput');
  const errEl = document.getElementById('resetPwdError');
  const cooldownEl = document.getElementById('resetCooldownBar');
  const execBtn = document.getElementById('resetExecuteBtn');
  if(!inp) return;

  // Check cooldown
  const now = Date.now();
  if(_resetCooldownUntil > now){
    const secs = Math.ceil((_resetCooldownUntil - now)/1000);
    if(cooldownEl){ cooldownEl.style.display='block'; cooldownEl.textContent=`🔒 Locked out. Try again in ${secs}s`; }
    return;
  }

  const pwd = inp.value;
  if(!_verifyResetPassword(pwd)){
    _resetFailAttempts++;
    inp.value = '';
    inp.style.borderColor='#dc2626';
    setTimeout(()=>{ inp.style.borderColor='var(--border)'; },1500);

    if(_resetFailAttempts >= 3){
      // Apply 30-second cooldown
      _resetCooldownUntil = Date.now() + 30000;
      _resetFailAttempts = 0;
      if(execBtn){ execBtn.disabled=true; execBtn.style.opacity='0.5'; }
      if(errEl){ errEl.style.display='none'; }
      if(cooldownEl){ cooldownEl.style.display='block'; }
      let remaining = 30;
      _resetCooldownTimer = setInterval(()=>{
        remaining--;
        if(cooldownEl) cooldownEl.textContent=`🔒 Too many failed attempts. Locked for ${remaining}s`;
        if(remaining <= 0){
          clearInterval(_resetCooldownTimer);
          _resetCooldownTimer = null;
          _resetCooldownUntil = 0;
          if(execBtn){ execBtn.disabled=false; execBtn.style.opacity='1'; }
          if(cooldownEl){ cooldownEl.style.display='none'; }
        }
      },1000);
      showToast('🔒 3 failed attempts — 30 second lockout applied');
    } else {
      const remaining = 3 - _resetFailAttempts;
      if(errEl){ errEl.style.display='block'; errEl.textContent=`❌ Incorrect password. ${remaining} attempt${remaining!==1?'s':''} remaining before lockout.`; }
    }
    return;
  }

  // ✅ Password correct — execute reset
  _resetFailAttempts = 0;
  const type = _pendingResetType;

  // Close modal first
  closeResetModal();

  // Execute the reset action
  setTimeout(()=>{
    if(type==='orders'){ StoreDB.resetOrders(); showToast('🗑️ All orders cleared. Dashboard refreshed.'); }
    else if(type==='customers'){ StoreDB.resetCustomers(); showToast('🗑️ All customers cleared.'); }
    else if(type==='analytics'){ StoreDB.resetAnalytics(); showToast('📊 Analytics reset to zero.'); }
    else if(type==='factory'){
      // Full wipe
      StoreDB.factoryReset();
      // Clear all storage
      try{ localStorage.clear(); }catch(e){}
      try{ sessionStorage.clear(); }catch(e){}
      // Reset in-memory state
      cart = [];
      wishlist = new Map();
      couponDiscount = 0;
      updateCartBadge();
      // Clear saved product catalog
      try{ localStorage.removeItem('dizo_catalog_v1'); }catch(e){}
      // Reset in-memory product arrays to empty (no default products)
      products = [];
      bestSellers = [];
      flashSaleProducts = [];
      flashNextId = 1;
      renderProducts();
      renderBestSellers();
      applyFlashSaleToPage();
      showToast('🔄 Factory reset complete. All products cleared.');
    }
    showAdminDashboard();
  }, 300);
}

let adminEditingProductId = null; // null = add new, number = editing existing
let adminProductImageBase64 = ''; // holds uploaded image base64

function showAdminProducts(){
  document.getElementById('adminContent').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem">Product Management</h2>
      <button class="btn-primary" style="padding:0.5rem 1rem" onclick="openAdminProductForm(null)">+ Add Product</button>
    </div>

    <!-- ADD / EDIT PRODUCT FORM -->
    <div id="addProductForm" style="display:none" class="admin-section">
      <div class="admin-section-title" id="adminProductFormTitle">Add New Product</div>

      <!-- UNLIMITED IMAGE SYSTEM -->
      <div style="margin-bottom:1.25rem">
        <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:0.625rem;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
          🖼️ Product Images <span style="background:var(--gold);color:#fff;font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:10px">UNLIMITED</span>
          <span style="font-size:0.65rem;color:var(--text3);font-weight:500">· First image = primary/thumbnail · All images shown in gallery</span>
        </div>
        <div id="imgUrlList"></div>
        <button id="addMoreImgBtn" onclick="addAdminImgField()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          + Add More Image
        </button>
        <div style="margin-top:0.5rem;font-size:0.72rem;color:var(--text3)">
          💡 First image = primary (used in cards & thumbnails). Add as many gallery images as needed.
          <span id="imgValidationStatus" style="margin-left:0.5rem;font-weight:600"></span>
        </div>
      </div>

      <!-- Emoji fallback -->
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;padding:0.75rem;background:var(--bg2);border-radius:var(--r2);border:1px solid var(--border)">
        <div style="font-size:2rem" id="apEmojiPreviewBox">📦</div>
        <div style="flex:1">
          <label style="font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:0.25rem">Emoji (fallback if images fail)</label>
          <input type="text" id="apEmoji" placeholder="🍳" maxlength="4" oninput="updateAdminEmojiPreview(this.value)"
            style="width:80px;padding:0.4rem 0.5rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;font-size:1.4rem;outline:none;text-align:center">
        </div>
      </div>

      <!-- NAME ROW -->
      <div class="admin-form-row">
        <div class="form-group"><label>Product Name (English)</label><input type="text" id="apNameEn" placeholder="e.g. Air Fryer Pro"></div>
        <div class="form-group"><label>Product Name (বাংলা)</label><input type="text" id="apNameBn" placeholder="e.g. এয়ার ফ্রায়ার প্রো"></div>
      </div>
      <!-- CAT / BADGE -->
      <div class="admin-form-row">
        <div class="form-group"><label>Category</label>
          <select id="apCat" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;font-size:0.875rem;outline:none;background:var(--white)">
            <option value="kitchen">🍳 Kitchen</option>
            <option value="gadgets">📱 Gadgets</option>
            <option value="beauty">💆 Beauty</option>
            <option value="home">🏠 Home</option>
          </select>
        </div>
        <div class="form-group"><label>Badge</label>
          <select id="apBadge" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;font-size:0.875rem;outline:none;background:var(--white)">
            <option value="sale">🏷️ Sale</option>
            <option value="new">✨ New</option>
            <option value="hot">🔥 Hot</option>
          </select>
        </div>
      </div>
      <!-- PRICE ROW -->
      <div class="admin-form-row">
        <div class="form-group"><label>Price (৳)</label><input type="number" id="apPrice" placeholder="3499" min="1"></div>
        <div class="form-group"><label>Old Price (৳)</label><input type="number" id="apOldPrice" placeholder="5000" min="1"></div>
      </div>
      <!-- DESCRIPTION -->
      <div class="form-group">
        <label>Description</label>
        <textarea id="apDesc" rows="3" placeholder="Describe the product…" style="width:100%;padding:0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;outline:none;resize:vertical"></textarea>
      </div>

      <!-- SPECIFICATIONS -->
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:0.5rem">
          📋 Specifications
          <span style="font-size:0.7rem;color:var(--text3);font-weight:400">· Enter one spec per line as "Key: Value"</span>
        </label>
        <textarea id="apSpecs" rows="6" placeholder="Brand: Samsung&#10;Material: Stainless Steel&#10;Capacity: 4.5L&#10;Wattage: 1500W&#10;Dimensions: 30×28×32 cm&#10;Warranty: 1 Year" style="width:100%;padding:0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:'DM Sans',sans-serif;font-size:0.875rem;outline:none;resize:vertical;line-height:1.7;transition:border-color 0.2s" onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"></textarea>
        <div style="font-size:0.7rem;color:var(--text3);margin-top:0.3rem">💡 Example: <code style="background:var(--bg2);padding:0.1rem 0.4rem;border-radius:4px;font-size:0.68rem">Color: Black</code> &nbsp; <code style="background:var(--bg2);padding:0.1rem 0.4rem;border-radius:4px;font-size:0.68rem">Weight: 1.2 kg</code></div>
      </div>

      <!-- SECTION / PLACEMENT ROW -->
      <div class="admin-form-row" style="margin-top:0.5rem">
        <div class="form-group">
          <label>📂 Section / Placement</label>
          <select id="apSection" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;font-size:0.875rem;outline:none;background:var(--white)">
            <option value="main">🛍️ Main Products Grid</option>
            <option value="bestSeller">⭐ Best Sellers Section</option>
          </select>
        </div>
        <div class="form-group">
          <label>⭐ Rating (0.0 – 5.0)</label>
          <input type="number" id="apRating" placeholder="4.5" min="0" max="5" step="0.1" style="width:100%;padding:0.65rem 0.875rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.875rem;font-family:inherit;outline:none">
        </div>
      </div>
      <div class="admin-form-row">
        <div class="form-group">
          <label>💬 Reviews Count</label>
          <input type="number" id="apReviews" placeholder="0" min="0" style="width:100%;padding:0.65rem 0.875rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.875rem;font-family:inherit;outline:none">
        </div>
        <div class="form-group" style="display:flex;flex-direction:column;justify-content:flex-end">
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.65rem;background:linear-gradient(135deg,#1a1a18,#2d2d28);border-radius:var(--r2);color:#fff;font-size:0.875rem;font-weight:600;border:2px solid transparent;transition:all 0.2s" id="apFlashSaleLabel">
            <input type="checkbox" id="apFlashSale" onchange="toggleFlashFields()" style="width:18px;height:18px;accent-color:var(--gold);cursor:pointer">
            <span>⚡ Add to Flash Sale</span>
          </label>
        </div>
      </div>

      <!-- FLASH SALE FIELDS (shown only when checkbox is ticked) -->
      <div id="apFlashFields" style="display:none;background:linear-gradient(135deg,#1a1a18,#232320);border-radius:var(--r);padding:1rem;margin-bottom:1rem;border:1px solid rgba(200,169,110,0.3)">
        <div style="font-size:0.78rem;font-weight:700;color:var(--gold);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">⚡ Flash Sale Configuration</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div>
            <label style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:0.3rem">Sold Count</label>
            <input type="number" id="apFlashSold" placeholder="0" min="0" oninput="calcFlashFieldsDiscount()" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid rgba(255,255,255,0.15);border-radius:var(--r2);font-size:0.875rem;font-family:inherit;outline:none;background:rgba(255,255,255,0.08);color:#fff">
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:0.3rem">Left (Stock)</label>
            <input type="number" id="apFlashLeft" placeholder="100" min="0" style="width:100%;padding:0.55rem 0.75rem;border:1.5px solid rgba(255,255,255,0.15);border-radius:var(--r2);font-size:0.875rem;font-family:inherit;outline:none;background:rgba(255,255,255,0.08);color:#fff">
          </div>
        </div>
        <div style="margin-top:0.5rem;font-size:0.72rem;color:rgba(255,255,255,0.4)">💡 Discount % is auto-calculated from price vs old price</div>
      </div>

      <div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap">
        <button class="btn-primary" style="padding:0.65rem 1.5rem" onclick="saveAdminProduct()">💾 Save Product</button>
        <button class="btn-outline" style="padding:0.65rem 1rem" onclick="cancelAdminProductForm()">Cancel</button>
      </div>
    </div>

    <!-- PRODUCT TABLE -->
    <div class="admin-section">
      <div class="admin-table-wrap">
      <table class="admin-table admin-product-table">
        <thead><tr><th>Images</th><th>Product</th><th>Section</th><th>Category</th><th>Price</th><th>⭐ Rating / 💬 Reviews</th><th>Tags</th><th>Actions</th></tr></thead>
        <tbody id="adminProductTableBody">
        </tbody>
      </table>
      </div>
    </div>
  `;
  renderAdminProductTable();
}

function renderAdminProductTable(){
  const tbody = document.getElementById('adminProductTableBody');
  if(!tbody) return;
  const all = [...products, ...bestSellers];
  tbody.innerHTML = all.map(p => {
    const imgs = normalizeImages(p);
    const thumbsHTML = imgs.slice(0,6).map((src, idx) =>
      `<div style="position:relative;flex-shrink:0" title="Image ${idx+1}">
        <img src="${src}" loading="lazy" alt="img${idx+1}" style="width:${idx===0?'44':'30'}px;height:${idx===0?'44':'30'}px;object-fit:cover;border-radius:${idx===0?'8':'6'}px;border:${idx===0?'2px solid var(--gold)':'1px solid var(--border)'};display:block"
          onerror="this.style.display='none'">
        <span style="position:absolute;bottom:-1px;right:-1px;background:${idx===0?'var(--gold)':'var(--text3)'};color:#fff;font-size:0.45rem;font-weight:800;width:12px;height:12px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #fff">${idx+1}</span>
      </div>`
    ).join('');
    const emojiHTML = `<span style="${imgs.length?'display:none;':'display:flex;'}width:44px;height:44px;background:var(--bg2);border-radius:8px;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${p.emoji}</span>`;
    const imgCountTag = imgs.length === 0
      ? `<span style="font-size:0.62rem;color:#dc2626;background:#fee2e2;border-radius:4px;padding:0.1rem 0.35rem;font-weight:700">⚠ No images</span>`
      : `<span style="font-size:0.62rem;color:#059669;background:#d1fae5;border-radius:4px;padding:0.1rem 0.35rem;font-weight:700">✓ ${imgs.length} img${imgs.length>1?'s':''}</span>`;
    const sectionLabel = p.isBestSeller
      ? '<span style="font-size:0.65rem;font-weight:700;background:#FEF9EC;color:#92400E;border:1px solid #fcd34d;padding:0.15rem 0.5rem;border-radius:4px">⭐ Best Seller</span>'
      : '<span style="font-size:0.65rem;font-weight:700;background:#EFF6FF;color:#1E3A8A;border:1px solid #bfdbfe;padding:0.15rem 0.5rem;border-radius:4px">🛍️ Main</span>';
    const flashTag = p.isFlashSale
      ? '<span style="font-size:0.65rem;font-weight:700;background:#1a1a18;color:#C8A96E;border:1px solid #C8A96E;padding:0.15rem 0.5rem;border-radius:4px">⚡ Flash</span>'
      : '';
    const starsHTML = '★'.repeat(Math.floor(p.rating||0))+'☆'.repeat(5-Math.floor(p.rating||0));
    return `<tr>
      <td class="pm-td-images">
        <div class="pm-imgs-wrap">
          ${imgs.length ? thumbsHTML : emojiHTML}
        </div>
        <div style="margin-top:4px">${imgCountTag}</div>
      </td>
      <td class="pm-td-name" data-label="Product">${p.name}<br><span style="font-size:0.68rem;color:var(--text3)">${p.nameBn||''}</span></td>
      <td data-label="Section">${sectionLabel}</td>
      <td data-label="Category" style="text-transform:capitalize">${p.cat}</td>
      <td data-label="Price">৳${p.price.toLocaleString()} <span style="font-size:0.7rem;color:var(--text3);text-decoration:line-through">৳${p.oldPrice.toLocaleString()}</span></td>
      <td data-label="Rating/Reviews" style="font-size:0.75rem">
        <span style="color:#C8A96E">${starsHTML}</span><br>
        <span style="color:var(--text2)">${p.rating||4.5} · ${p.reviews||0} reviews</span>
      </td>
      <td data-label="Tags" style="white-space:nowrap">${sectionLabel} ${flashTag}<br><span class="product-badge badge-${p.badge}" style="position:static;display:inline-block;margin-top:0.25rem">${p.badge.toUpperCase()}</span></td>
      <td class="pm-td-actions">
        <div class="pm-actions-wrap">
          <button onclick="openAdminProductForm(${p.id})" style="font-size:0.72rem;padding:0.2rem 0.6rem;background:#DBEAFE;color:#1E3A8A;border:none;border-radius:4px;cursor:pointer;font-weight:600">✏️ Edit</button>
          <button onclick="deleteAdminProduct(${p.id})" style="font-size:0.72rem;padding:0.2rem 0.6rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer;font-weight:600">🗑 Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openAdminProductForm(id){
  adminEditingProductId = id;
  adminProductImageBase64 = '';
  const form = document.getElementById('addProductForm');
  form.style.display = 'block';
  form.scrollIntoView({behavior:'smooth', block:'start'});
  document.getElementById('adminProductFormTitle').textContent = id === null ? 'Add New Product' : 'Edit Product';

  // Reset dynamic image fields — start with 4 blank slots
  document.getElementById('apNameEn').value = '';
  document.getElementById('apNameBn').value = '';
  document.getElementById('apEmoji').value = '';
  document.getElementById('apCat').value = 'kitchen';
  document.getElementById('apBadge').value = 'sale';
  document.getElementById('apPrice').value = '';
  document.getElementById('apOldPrice').value = '';
  document.getElementById('apDesc').value = '';
  document.getElementById('apSpecs').value = '';
  document.getElementById('apSection').value = 'main';
  document.getElementById('apRating').value = '4.5';
  document.getElementById('apReviews').value = '0';
  document.getElementById('apFlashSale').checked = false;
  document.getElementById('apFlashSold').value = '0';
  document.getElementById('apFlashLeft').value = '100';
  document.getElementById('apFlashFields').style.display = 'none';
  updateAdminEmojiPreview('📦');

  if(id !== null){
    const all = [...products, ...bestSellers];
    const p = all.find(x => x.id === id);
    if(!p) return;
    document.getElementById('apNameEn').value = p.name;
    document.getElementById('apNameBn').value = p.nameBn || '';
    document.getElementById('apEmoji').value = p.emoji || '';
    document.getElementById('apCat').value = p.cat;
    document.getElementById('apBadge').value = p.badge;
    document.getElementById('apPrice').value = p.price;
    document.getElementById('apOldPrice').value = p.oldPrice;
    document.getElementById('apDesc').value = p.desc || '';
    document.getElementById('apSpecs').value = p.specs || '';
    document.getElementById('apSection').value = p.isBestSeller ? 'bestSeller' : 'main';
    document.getElementById('apRating').value = p.rating || 4.5;
    document.getElementById('apReviews').value = p.reviews || 0;
    // Flash sale
    const isFlash = !!p.isFlashSale;
    document.getElementById('apFlashSale').checked = isFlash;
    document.getElementById('apFlashFields').style.display = isFlash ? 'block' : 'none';
    if(isFlash){
      document.getElementById('apFlashSold').value = p.flashSold || 0;
      document.getElementById('apFlashLeft').value = p.flashLeft || 100;
    }
    // Load images — normalize from old or new format
    const imgs = normalizeImages(p);
    renderAdminImgFields(imgs.length ? imgs : ['']);
    updateAdminEmojiPreview(p.emoji||'📦');
  } else {
    renderAdminImgFields(['','','','']);
  }
  validateImgInputs();
}

function cancelAdminProductForm(){
  document.getElementById('addProductForm').style.display='none';
  adminEditingProductId = null;
  adminProductImageBase64 = '';
}

// ============================================================
// UNLIMITED IMAGE SYSTEM — Dynamic field management
// ============================================================

/** Normalize any product (old image1-4 or new images[]) to a clean array */
function normalizeImages(p) {
  if (p.images && Array.isArray(p.images) && p.images.length) {
    return p.images.filter(Boolean);
  }
  return [p.image1||p.img, p.image2, p.image3, p.image4].filter(Boolean);
}

/** Render image URL fields — called by openAdminProductForm */
function renderAdminImgFields(urls) {
  const list = document.getElementById('imgUrlList');
  if (!list) return;
  // Ensure at least one field
  const slots = (urls && urls.length) ? urls : [''];
  list.innerHTML = slots.map((url, idx) => buildImgFieldHTML(idx, url)).join('');
}

/** Build HTML for one image row */
function buildImgFieldHTML(idx, url) {
  const isPrimary = idx === 0;
  return `<div class="admin-img-field-row" id="imgRow_${idx}">
    <div class="img-preview-box" id="imgPrevBox_${idx}">
      ${isPrimary ? '<div class="img-primary-badge">PRIMARY</div>' : ''}
      <img id="imgPrevImg_${idx}" src="${url||''}" alt="" loading="lazy"
        style="display:${url?'block':'none'}"
        onerror="this.style.display=\'none\';document.getElementById(\'imgPrevLbl_${idx}\').style.display=\'block\'">
      <span id="imgPrevLbl_${idx}" style="display:${url?'none':'block'};font-size:0.65rem;font-weight:700;color:var(--text3);text-align:center;padding:4px">IMG ${idx+1}${isPrimary?' ★':''}</span>
    </div>
    <input type="url" class="img-url-input" id="apImgDyn_${idx}"
      placeholder="https://… image ${idx+1} URL${isPrimary?' (primary/featured)':''}"
      value="${url||''}"
      oninput="handleDynImgUrl(${idx},this.value)"
      onfocus="this.style.borderColor='var(--gold)'"
      onblur="this.style.borderColor='var(--border)'">
    ${isPrimary ? '' : `<button class="admin-img-remove-btn" onclick="removeAdminImgField(${idx})" title="Remove image ${idx+1}">✕</button>`}
  </div>`;
}

/** Add a new blank image field */
function addAdminImgField() {
  const list = document.getElementById('imgUrlList');
  if (!list) return;
  const idx = list.children.length;
  const div = document.createElement('div');
  div.innerHTML = buildImgFieldHTML(idx, '');
  const row = div.firstElementChild;
  list.appendChild(row);
  // Focus the new input
  setTimeout(()=>{ const inp = document.getElementById('apImgDyn_'+idx); if(inp) inp.focus(); }, 50);
  validateImgInputs();
}

/** Remove an image field by index */
function removeAdminImgField(idx) {
  const list = document.getElementById('imgUrlList');
  if (!list || list.children.length <= 1) { showToast('⚠ At least 1 image field is required'); return; }
  const row = document.getElementById('imgRow_'+idx);
  if (row) row.remove();
  // Re-index remaining rows
  reindexAdminImgFields();
  validateImgInputs();
}

/** Re-index all rows after a removal */
function reindexAdminImgFields() {
  const list = document.getElementById('imgUrlList');
  if (!list) return;
  Array.from(list.children).forEach((row, idx) => {
    const url = (row.querySelector('input')||{}).value || '';
    row.outerHTML = buildImgFieldHTML(idx, url);
  });
  // innerHTML causes issues with listeners — rebuild properly
  const urls = getAdminImages();
  renderAdminImgFields(urls);
}

/** Handle URL change on any dynamic field */
function handleDynImgUrl(idx, url) {
  url = (url||'').trim();
  const img = document.getElementById('imgPrevImg_'+idx);
  const lbl = document.getElementById('imgPrevLbl_'+idx);
  if (!img) return;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    if (lbl) lbl.style.display = 'none';
    img.onerror = function() { this.style.display='none'; if(lbl) { lbl.style.display='block'; lbl.textContent='❌'; } };
    img.onload  = function() { validateImgInputs(); };
  } else {
    img.style.display = 'none';
    img.src = '';
    if (lbl) { lbl.style.display='block'; lbl.textContent=`IMG ${idx+1}${idx===0?' ★':''}`; }
  }
  validateImgInputs();
}

/** Collect all non-empty image URLs from dynamic fields */
function getAdminImages() {
  const list = document.getElementById('imgUrlList');
  if (!list) return [];
  const urls = [];
  Array.from(list.querySelectorAll('input.img-url-input')).forEach(inp => {
    const v = (inp.value||'').trim();
    if (v) urls.push(v);
  });
  return urls;
}

function validateImgInputs(){
  const status = document.getElementById('imgValidationStatus');
  if(!status) return;
  const list = document.getElementById('imgUrlList');
  if(!list){ status.textContent=''; return; }
  const total = list.querySelectorAll('input.img-url-input').length;
  const filled = Array.from(list.querySelectorAll('input.img-url-input')).filter(i=>i.value.trim()).length;
  if(filled === 0){ status.textContent = '⚠ No images (emoji will be used)'; status.style.color = '#d97706'; }
  else if(filled === total){ status.textContent = `✅ ${filled} image${filled>1?'s':''} set`; status.style.color = '#059669'; }
  else { status.textContent = `📷 ${filled}/${total} images set`; status.style.color = '#2563eb'; }
}

// Legacy stubs — keep so any residual references don't break
function setAdminImgSlotPreview(){}
function handleAdminImg1Url(url){ handleDynImgUrl(0,url); }
function handleAdminImg2Url(url){ handleDynImgUrl(1,url); }
function handleAdminImg3Url(url){ handleDynImgUrl(2,url); }
function handleAdminImg4Url(url){ handleDynImgUrl(3,url); }
function clearAdminImg1(){ const i=document.getElementById('apImgDyn_0'); if(i){i.value='';handleDynImgUrl(0,'');} }
function clearAdminImg2(){ const i=document.getElementById('apImgDyn_1'); if(i){i.value='';handleDynImgUrl(1,'');} }
function clearAdminImg3(){ const i=document.getElementById('apImgDyn_2'); if(i){i.value='';handleDynImgUrl(2,'');} }
function clearAdminImg4(){ const i=document.getElementById('apImgDyn_3'); if(i){i.value='';handleDynImgUrl(3,'');} }
function handleAdminImgUpload(){}
function handleAdminImgUrl(){}
function clearAdminImg(){}
function setAdminImgPreview(){}

function updateAdminEmojiPreview(val){
  const box = document.getElementById('apEmojiPreviewBox');
  if(box) box.textContent = val || '📦';
}

function toggleFlashFields(){
  const checked = document.getElementById('apFlashSale').checked;
  document.getElementById('apFlashFields').style.display = checked ? 'block' : 'none';
}

function calcFlashFieldsDiscount(){
  // auto-fill discount preview (used in flash fields area)
}

function saveAdminProduct(){
  const nameEn = document.getElementById('apNameEn').value.trim();
  const price = parseInt(document.getElementById('apPrice').value);
  const oldPrice = parseInt(document.getElementById('apOldPrice').value);

  if(!nameEn){ showToast('⚠️ Product name (English) is required'); return; }
  if(!price || price < 1){ showToast('⚠️ Please enter a valid price'); return; }
  if(!oldPrice || oldPrice < 1){ showToast('⚠️ Please enter a valid old price'); return; }
  if(oldPrice <= price){ showToast('⚠️ Old price must be higher than current price'); return; }

  const image1 = (document.getElementById('apImgDyn_0') ? (document.getElementById('apImgDyn_0').value||'').trim() : '');
  if(!image1){ showToast('⚠️ At least Image 1 (primary) is required'); return; }

  // Collect all image URLs from dynamic fields
  const allImages = getAdminImages();

  // Keep backward-compatible named fields for old code
  const image2 = allImages[1] || image1;
  const image3 = allImages[2] || image1;
  const image4 = allImages[3] || image1;

  const section     = document.getElementById('apSection').value;   // 'main' or 'bestSeller'
  const isBestSeller = section === 'bestSeller';
  const rating      = parseFloat(document.getElementById('apRating').value) || 4.5;
  const reviews     = parseInt(document.getElementById('apReviews').value) || 0;
  const isFlashSale = document.getElementById('apFlashSale').checked;
  const flashSold   = parseInt(document.getElementById('apFlashSold').value) || 0;
  const flashLeft   = parseInt(document.getElementById('apFlashLeft').value) || 100;
  const discount    = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const productData = {
    name:       nameEn,
    nameBn:     document.getElementById('apNameBn').value.trim() || nameEn,
    emoji:      document.getElementById('apEmoji').value.trim() || '📦',
    cat:        document.getElementById('apCat').value,
    badge:      document.getElementById('apBadge').value,
    price:      price,
    oldPrice:   oldPrice,
    desc:       document.getElementById('apDesc').value.trim(),
    specs:      document.getElementById('apSpecs').value.trim(),
    image1:     image1,
    image2:     image2 || image1,
    image3:     image3 || image1,
    image4:     image4 || image1,
    images:     allImages.length ? allImages : [image1],
    img:        image1,
    rating:     rating,
    reviews:    reviews,
    isBestSeller: isBestSeller,
    isFlashSale:  isFlashSale,
    flashSold:    flashSold,
    flashLeft:    flashLeft,
    discount:     discount,
  };

  let productId;

  if(adminEditingProductId === null){
    // ---- ADD NEW ----
    const allIds = [...products, ...bestSellers].map(p => p.id);
    productId = allIds.length ? Math.max(...allIds) + 1 : 1;
    productData.id = productId;
    if(isBestSeller){
      bestSellers.push(productData);
    } else {
      products.push(productData);
    }
    showToast('✅ Product added' + (isBestSeller ? ' to Best Sellers' : '') + (isFlashSale ? ' + Flash Sale' : '') + '!');
  } else {
    // ---- EDIT EXISTING ----
    productId = adminEditingProductId;
    productData.id = productId;

    // Remove from whichever array it's currently in
    let pi = products.findIndex(p => p.id === productId);
    if(pi !== -1) products.splice(pi, 1);
    let bi = bestSellers.findIndex(p => p.id === productId);
    if(bi !== -1) bestSellers.splice(bi, 1);

    // Re-insert in the correct array based on new section choice
    if(isBestSeller){
      bestSellers.push(productData);
    } else {
      products.push(productData);
    }
    showToast('✅ Product updated successfully!');
  }

  // ---- Sync Flash Sale ----
  // Remove any existing flash entry for this product
  flashSaleProducts = flashSaleProducts.filter(f => f.id !== productId);
  if(isFlashSale){
    // Add/update flash sale entry derived from product data
    flashSaleProducts.push({
      id:       productId,
      name:     productData.name,
      emoji:    productData.emoji,
      img:      normalizeImages(productData)[0] || productData.image1,
      price:    productData.price,
      oldPrice: productData.oldPrice,
      discount: productData.discount,
      sold:     flashSold,
      left:     flashLeft,
      cat:      productData.cat,
    });
  }

  saveProductsToStorage();
  applyFlashSaleToPage();
  renderAdminProductTable();
  cancelAdminProductForm();
  renderProducts();
  renderBestSellers();
}

function deleteAdminProduct(id){
  const all = [...products,...bestSellers];
  const p = all.find(x=>x.id===id);
  if(!p) return;
  if(!confirm(`Delete "${p.name}"? This will remove it from the store.`)) return;
  const pi = products.findIndex(x=>x.id===id);
  if(pi !== -1) products.splice(pi,1);
  const bi = bestSellers.findIndex(x=>x.id===id);
  if(bi !== -1) bestSellers.splice(bi,1);
  // Also remove from flash sale if it was there
  flashSaleProducts = flashSaleProducts.filter(f => f.id !== id);
  saveProductsToStorage();
  applyFlashSaleToPage();
  showToast(`🗑️ "${p.name}" deleted.`);
  renderAdminProductTable();
  renderProducts();
  renderBestSellers();
}

function showAddProduct(){ openAdminProductForm(null); }
function saveProduct(){ saveAdminProduct(); }

function showAdminOrders(){
  const db = StoreDB.get();
  let filteredOrders = db.orders;
  let activeFilter = 'All';

  function renderOrdersTable(orders){
    const tbody = document.getElementById('ordersTableBody');
    if(!tbody) return;
    if(!orders.length){
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem 1rem;color:var(--text3)"><div style="font-size:2rem;margin-bottom:0.5rem">📦</div><div>No orders found. Orders placed in your store will appear here.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o=>{
      const itemsLabel = (o.items||[]).map(i=>`${i.name}${i.qty>1?' ×'+i.qty:''}`).join(', ');
      const statusOpts = ['Pending','Processing','Shipped','Delivered','Cancelled'].map(s=>`<option${o.status===s?' selected':''}>${s}</option>`).join('');
      return `<tr>
        <td><strong>${o.id}</strong><br><span style="font-size:0.65rem;color:var(--text3)">${new Date(o.timestamp).toLocaleDateString()}</span></td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${itemsLabel}">${itemsLabel}</td>
        <td>৳${(o.total||0).toLocaleString()}</td>
        <td>${(o.payment||'cod').toUpperCase()}</td>
        <td><span class="status-badge status-${(o.status||'pending').toLowerCase()}">${o.status||'Pending'}</span></td>
        <td><select style="font-size:0.7rem;padding:0.2rem;border:1px solid var(--border);border-radius:4px" onchange="adminUpdateOrderStatus('${o.id}',this.value)">${statusOpts}</select></td>
      </tr>`;
    }).join('');
  }

  document.getElementById('adminContent').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
      <h2 style="font-family:'Playfair Display',serif;font-size:1.35rem">Order Management</h2>
      <div style="display:flex;gap:0.4rem;align-items:center">
        <input type="text" id="orderSearchInput" placeholder="Search by name, phone, ID…" oninput="adminSearchOrders(this.value)"
          style="padding:0.35rem 0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.8rem;outline:none;min-width:200px">
        <button onclick="adminResetConfirm('orders')" style="font-size:0.7rem;padding:0.3rem 0.625rem;background:#FEE2E2;color:#991B1B;border:none;border-radius:4px;cursor:pointer">🔐 Reset All</button>
      </div>
    </div>
    <div style="display:flex;gap:0.4rem;margin-bottom:1.1rem;flex-wrap:wrap" id="orderFilterBtns">
      ${['All','Pending','Processing','Shipped','Delivered','Cancelled'].map(s=>`<button id="ofBtn_${s}" style="padding:0.3rem 0.75rem;border:1.5px solid ${s==='All'?'var(--text)':'var(--border)'};border-radius:var(--r3);font-size:0.72rem;cursor:pointer;background:${s==='All'?'var(--text)':'transparent'};color:${s==='All'?'#fff':'inherit'};transition:all 0.2s" onclick="adminFilterOrders('${s}')">${s}</button>`).join('')}
    </div>
    <div class="admin-section">
      <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>Products</th><th>Total</th><th>Pay</th><th>Status</th><th>Update</th></tr></thead>
        <tbody id="ordersTableBody"></tbody>
      </table>
      </div>
    </div>
  `;
  renderOrdersTable(filteredOrders);

  window.adminFilterOrders = function(status){
    activeFilter = status;
    document.querySelectorAll('#orderFilterBtns button').forEach(b=>{
      const active = b.textContent===status;
      b.style.border = `1.5px solid ${active?'var(--text)':'var(--border)'}`;
      b.style.background = active ? 'var(--text)' : 'transparent';
      b.style.color = active ? '#fff' : 'inherit';
    });
    filteredOrders = status==='All' ? db.orders : db.orders.filter(o=>(o.status||'Pending')===status);
    renderOrdersTable(filteredOrders);
  };

  window.adminSearchOrders = function(q){
    const qLow = q.toLowerCase().trim();
    if(!qLow){ filteredOrders = activeFilter==='All' ? db.orders : db.orders.filter(o=>(o.status||'Pending')===activeFilter); }
    else { filteredOrders = db.orders.filter(o=> o.id.toLowerCase().includes(qLow) || o.name.toLowerCase().includes(qLow) || (o.phone||'').includes(qLow)); }
    renderOrdersTable(filteredOrders);
  };
}

function adminUpdateOrderStatus(orderId, newStatus){
  StoreDB.updateOrderStatus(orderId, newStatus);
  showToast(`✅ ${orderId} → ${newStatus}`);
}

function showAdminCustomers(){
  const db = StoreDB.get();
  const customers = Object.values(db.customers);

  function renderCustomerTable(list){
    const tbody = document.getElementById('customerTableBody');
    if(!tbody) return;
    if(!list.length){
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem 1rem;color:var(--text3)"><div style="font-size:2rem;margin-bottom:0.5rem">👥</div><div>No customers yet. Customers are registered when orders are placed.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(c=>`<tr>
      <td>${c.name}</td>
      <td>${c.phone}</td>
      <td>${c.email||'—'}</td>
      <td>${(c.orders||[]).length}</td>
      <td>৳${(c.totalSpent||0).toLocaleString()}</td>
      <td><button onclick="adminViewCustomer('${c.phone}')" style="font-size:0.7rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">View</button></td>
    </tr>`).join('');
  }

  const an = StoreDB.getAnalytics();
  const repeatBuyers = customers.filter(c=>(c.orders||[]).length > 1).length;

  document.getElementById('adminContent').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
      <h2 style="font-family:'Playfair Display',serif;font-size:1.35rem">Customer Management</h2>
      <input type="text" id="custSearchInput" placeholder="Search name or phone…" oninput="adminSearchCustomers(this.value)"
        style="padding:0.35rem 0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-size:0.8rem;outline:none;min-width:200px">
    </div>
    <div class="admin-cards">
      <div class="admin-card"><div class="admin-card-label">Total Customers</div><div class="admin-card-value">${an.totalCustomers}</div></div>
      <div class="admin-card"><div class="admin-card-label">Repeat Buyers</div><div class="admin-card-value">${repeatBuyers}</div></div>
      <div class="admin-card"><div class="admin-card-label">Total Orders</div><div class="admin-card-value">${an.totalOrders}</div></div>
    </div>
    <div class="admin-section">
      <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Spent</th><th>Action</th></tr></thead>
        <tbody id="customerTableBody"></tbody>
      </table>
      </div>
    </div>
  `;
  renderCustomerTable(customers);

  window.adminSearchCustomers = function(q){
    const qLow = q.toLowerCase().trim();
    const list = qLow ? customers.filter(c=>c.name.toLowerCase().includes(qLow)||(c.phone||'').includes(qLow)) : customers;
    renderCustomerTable(list);
  };
}

function adminViewCustomer(phone){
  const db = StoreDB.get();
  const c = db.customers[phone];
  if(!c){ showToast('Customer not found'); return; }
  const orderList = db.orders.filter(o=>o.phone===phone);
  showToast(`👤 ${c.name} · ${orderList.length} orders · ৳${(c.totalSpent||0).toLocaleString()} total`);
}

function showAdminThemes(){
  document.getElementById('adminContent').innerHTML=`
    <div style="font-family:'Playfair Display',serif;font-size:1.35rem;margin-bottom:1.25rem">Theme Management</div>
    <div class="admin-cards">
      ${[
        {name:'Default',accent:'#1A1A18',gold:'#C8A96E',key:'default'},
        {name:'Emerald',accent:'#065F46',gold:'#10B981',key:'emerald'},
        {name:'Ocean Blue',accent:'#1E3A8A',gold:'#2563EB',key:'ocean'},
        {name:'Royal Purple',accent:'#4C1D95',gold:'#7C3AED',key:'purple'},
        {name:'Sunset Orange',accent:'#7C2D12',gold:'#F97316',key:'sunset'},
      ].map(t=>`
        <div class="admin-card" style="cursor:pointer" onclick="setTheme('${t.key}')">
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
            <div style="width:28px;height:28px;border-radius:50%;background:${t.accent};border:2px solid rgba(0,0,0,0.1)"></div>
            <div style="width:28px;height:28px;border-radius:50%;background:${t.gold};border:2px solid rgba(0,0,0,0.1)"></div>
          </div>
          <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.25rem">${t.name}</div>
          <button class="btn-primary" style="font-size:0.72rem;padding:0.3rem 0.75rem;margin-top:0.5rem">Apply Theme</button>
        </div>
      `).join('')}
      <div class="admin-card" style="border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="showToast('🎨 Custom theme creator coming soon!')">
        <div style="text-align:center;color:var(--text3)"><div style="font-size:2rem">+</div><div style="font-size:0.85rem;margin-top:0.5rem">Custom Theme</div></div>
      </div>
    </div>
  `;
}

function showAdminMessaging(){
  document.getElementById('adminContent').innerHTML=`
    <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:1.5rem">Messaging System</h2>
    <div class="admin-tabs">
      <div class="admin-tab active">WhatsApp</div>
      <div class="admin-tab" onclick="this.parentNode.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')">Email</div>
      <div class="admin-tab" onclick="this.parentNode.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')">SMS</div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">WhatsApp Automation</div>
      ${[
        {label:'Order Confirmation',desc:'Sent when order is placed',status:true},
        {label:'Shipping Update',desc:'Sent when order is shipped',status:true},
        {label:'Delivery Confirmation',desc:'Sent when order is delivered',status:true},
        {label:'Promotional Broadcast',desc:'Bulk marketing messages',status:false},
        {label:'Abandoned Cart Reminder',desc:'Sent 24h after cart abandonment',status:false},
      ].map(m=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-weight:600;font-size:0.875rem">${m.label}</div>
            <div style="font-size:0.75rem;color:var(--text3)">${m.desc}</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <label style="position:relative;display:inline-flex;width:36px;height:20px;cursor:pointer">
              <input type="checkbox" ${m.status?'checked':''} style="opacity:0;width:0;height:0" onchange="showToast('⚙️ Setting updated!')">
              <span style="position:absolute;inset:0;background:${m.status?'#10B981':'#E4E3DF'};border-radius:10px;transition:0.3s"></span>
              <span style="position:absolute;left:${m.status?'18':'2'}px;top:2px;width:16px;height:16px;background:white;border-radius:50%;transition:0.3s"></span>
            </label>
            <button onclick="showToast('✏️ Edit template')" style="font-size:0.72rem;padding:0.2rem 0.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;cursor:pointer">Edit Template</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="admin-section">
      <div class="admin-section-title">Send Bulk Message</div>
      <div class="form-group"><label>Message Template</label><textarea rows="3" style="width:100%;padding:0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;outline:none;resize:vertical" placeholder="Hello {name}, we have an exclusive deal just for you! 🎉"></textarea></div>
      <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
        <button class="btn-primary" style="padding:0.6rem 1.25rem" onclick="showToast('📤 Bulk message queued!')">Send to All Customers</button>
        <button class="btn-outline" style="padding:0.6rem 1rem" onclick="showToast('📋 Preview ready')">Preview</button>
      </div>
    </div>
  `;
}

function showAdminSeo(){
  document.getElementById('adminContent').innerHTML=`
    <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:1.5rem">SEO Management</h2>
    <div class="admin-section">
      <div class="admin-section-title">Global SEO Settings</div>
      <div class="form-group"><label>Meta Title</label><input type="text" value="Dizo Cart — Premium E-Commerce Bangladesh"></div>
      <div class="form-group"><label>Meta Description</label><textarea rows="2" style="width:100%;padding:0.65rem;border:1.5px solid var(--border);border-radius:var(--r2);font-family:inherit;outline:none">Bangladesh's premier destination for premium kitchen, home, gadget, and beauty products.</textarea></div>
      <div class="form-group"><label>Keywords</label><input type="text" value="dizo cart, online shopping, kitchen essentials, gadgets bangladesh"></div>
      <div class="form-group"><label>OG Image URL</label><input type="url" placeholder="https://..."></div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem">
        <button class="btn-primary" style="padding:0.65rem 1.5rem" onclick="showToast('✅ SEO settings saved!')">Save SEO Settings</button>
        <button class="btn-outline" style="padding:0.65rem 1rem" onclick="showToast('🗺️ Sitemap generated!')">Generate Sitemap</button>
      </div>
    </div>
  `;
}

// ===================== CHANGE ADMIN PASSWORD =====================
function changeAdminPassword(){
  const cur  = document.getElementById('chgPwdCurrent')?.value || '';
  const nw   = document.getElementById('chgPwdNew')?.value     || '';
  const conf = document.getElementById('chgPwdConfirm')?.value || '';
  const errEl = document.getElementById('chgPwdError');
  const okEl  = document.getElementById('chgPwdSuccess');
  if(errEl) errEl.style.display='none';
  if(okEl)  okEl.style.display='none';

  if(cur !== ADMIN_PASSWORD){
    if(errEl){ errEl.textContent='❌ Current password is incorrect.'; errEl.style.display='block'; }
    return;
  }
  if(nw.length < 6){
    if(errEl){ errEl.textContent='❌ New password must be at least 6 characters.'; errEl.style.display='block'; }
    return;
  }
  if(nw !== conf){
    if(errEl){ errEl.textContent='❌ New passwords do not match.'; errEl.style.display='block'; }
    return;
  }

  // ✅ Update the single shared password — data reset uses the same variable automatically
  ADMIN_PASSWORD = nw;

  // Clear fields
  ['chgPwdCurrent','chgPwdNew','chgPwdConfirm'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  if(okEl){ okEl.textContent='✅ Password updated! Data reset password is now in sync.'; okEl.style.display='block'; }
  showToast('🔐 Admin password changed successfully!');
}

function showAdminSettings(){
  document.getElementById('adminContent').innerHTML=`
    <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:1.5rem">Store Settings</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div class="admin-section">
        <div class="admin-section-title">General</div>
        <div class="form-group"><label>Store Name</label><input type="text" value="Dizo Cart"></div>
        <div class="form-group"><label>Currency</label><select><option>BDT (৳)</option><option>USD ($)</option></select></div>
        <button class="btn-primary" style="padding:0.65rem 1.5rem" onclick="showToast('✅ General settings saved!')">Save Settings</button>
      </div>

      <div class="admin-section" style="border:2px solid var(--gold)">
        <div class="admin-section-title" style="color:var(--gold)">🔐 Change Admin Password</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:1rem">Changing the password here automatically updates the Data Reset password too — they are always in sync.</p>
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" id="chgPwdCurrent" placeholder="Enter current password">
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="chgPwdNew" placeholder="Min. 6 characters">
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input type="password" id="chgPwdConfirm" placeholder="Re-enter new password" onkeydown="if(event.key==='Enter')changeAdminPassword()">
        </div>
        <div id="chgPwdError"   style="display:none;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:0.8rem;color:#dc2626;margin-bottom:0.75rem"></div>
        <div id="chgPwdSuccess" style="display:none;padding:0.5rem 0.75rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:0.8rem;color:#15803d;margin-bottom:0.75rem"></div>
        <button class="btn-primary" style="padding:0.65rem 1.5rem;background:var(--gold)" onclick="changeAdminPassword()">💾 Update Password</button>
      </div>

      <div class="admin-section" style="border:2px solid var(--gold);border-radius:var(--r)">
        <div class="admin-section-title" style="color:var(--gold)">🚚 Delivery Charge Settings</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:1rem">Set delivery charges for each zone. Changes apply instantly to checkout.</p>

        <div style="background:var(--bg2);border-radius:var(--r2);padding:1rem;margin-bottom:1rem;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
            <span style="font-size:1.1rem">🏙️</span>
            <span style="font-weight:700;font-size:0.9rem">Inside Dhaka</span>
            <span id="adminInsideStatus" style="margin-left:auto;font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:var(--r3);background:#D1FAE5;color:#065F46;font-weight:700">ACTIVE</span>
          </div>
          <div class="form-group" style="margin-bottom:0.5rem">
            <label style="font-size:0.75rem">Delivery Charge (৳)</label>
            <input type="number" id="adminInsideCharge" value="${deliveryConfig.insideDhaka.charge}" min="0" style="font-weight:700;font-size:1rem" onchange="previewDeliveryChange()">
          </div>
        </div>

        <div style="background:var(--bg2);border-radius:var(--r2);padding:1rem;margin-bottom:1rem;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
            <span style="font-size:1.1rem">🗺️</span>
            <span style="font-weight:700;font-size:0.9rem">Outside Dhaka</span>
            <span id="adminOutsideStatus" style="margin-left:auto;font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:var(--r3);background:#D1FAE5;color:#065F46;font-weight:700">ACTIVE</span>
          </div>
          <div class="form-group" style="margin-bottom:0.5rem">
            <label style="font-size:0.75rem">Delivery Charge (৳)</label>
            <input type="number" id="adminOutsideCharge" value="${deliveryConfig.outsideDhaka.charge}" min="0" style="font-weight:700;font-size:1rem" onchange="previewDeliveryChange()">
          </div>
        </div>

        <div style="background:var(--bg2);border-radius:var(--r2);padding:0.75rem;margin-bottom:1rem;border:1px solid var(--border)">
          <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem">🎁 Free Delivery Over (৳) — 0 to disable</label>
            <input type="number" id="adminFreeOver" value="${deliveryConfig.freeDeliveryOver}" min="0" onchange="previewDeliveryChange()">
          </div>
        </div>

        <div id="deliveryPreview" style="font-size:0.78rem;color:var(--text3);padding:0.5rem 0.75rem;background:var(--bg3);border-radius:var(--r2);margin-bottom:0.75rem;display:none"></div>

        <button class="btn-primary" style="width:100%;padding:0.75rem;background:var(--gold)" onclick="saveDeliverySettings()">💾 Save Delivery Settings</button>
      </div>

      <div class="admin-section" style="border:2px solid var(--gold)">
        <div class="admin-section-title" style="color:var(--gold)">💳 Payment Methods</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:1rem">যেসব method disable করবেন সেগুলো checkout-এ user দেখতে পাবে না। পরিবর্তন সাথে সাথে কার্যকর হয়।</p>
        <div id="adminPaymentMethodsList">
          ${Object.entries(paymentConfig).map(([key, val]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0.875rem;border-radius:var(--r2);margin-bottom:0.5rem;background:${val.enabled?'var(--bg2)':'#fef2f2'};border:1.5px solid ${val.enabled?'var(--border)':'#fecaca'};transition:all 0.2s" id="pmRow_${key}">
              <div style="display:flex;align-items:center;gap:0.625rem">
                <span style="font-size:1.1rem">${val.label.split(' ')[0]}</span>
                <div>
                  <div style="font-weight:600;font-size:0.875rem;color:var(--text)">${val.label.replace(/^[^\s]+\s/, '')}</div>
                  <div id="pmStatus_${key}" style="font-size:0.7rem;font-weight:700;color:${val.enabled?'#059669':'#dc2626'}">${val.enabled?'✅ চালু':'❌ বন্ধ'}</div>
                </div>
              </div>
              <label style="position:relative;display:inline-flex;align-items:center;cursor:pointer;gap:0.5rem">
                <div style="position:relative;width:44px;height:24px">
                  <input type="checkbox" id="pmToggle_${key}" ${val.enabled?'checked':''} onchange="togglePaymentMethod('${key}',this.checked)"
                    style="opacity:0;width:0;height:0;position:absolute">
                  <div id="pmTrack_${key}" style="position:absolute;inset:0;border-radius:12px;background:${val.enabled?'#10B981':'#E4E3DF'};transition:background 0.25s;cursor:pointer" onclick="document.getElementById('pmToggle_${key}').click()"></div>
                  <div id="pmThumb_${key}" style="position:absolute;top:3px;left:${val.enabled?'23':'3'}px;width:18px;height:18px;background:white;border-radius:50%;transition:left 0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.2);pointer-events:none"></div>
                </div>
                <span style="font-size:0.78rem;font-weight:600;color:var(--text2)">${val.enabled?'ON':'OFF'}</span>
              </label>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:0.75rem;padding:0.625rem 0.875rem;background:var(--bg3);border-radius:var(--r2);font-size:0.75rem;color:var(--text3)">
          💡 কমপক্ষে একটি payment method চালু রাখুন।
        </div>
      </div>
      <div class="admin-section" style="border:2px solid #DC2626">
        <div class="admin-section-title" style="color:#DC2626">⚠️ Reset System</div>
        <p style="font-size:0.78rem;color:var(--text3);margin-bottom:1rem">These actions are irreversible. Use with caution.</p>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <button onclick="adminResetConfirm('orders');showAdminDashboard();" style="padding:0.6rem 1rem;background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;border-radius:var(--r2);cursor:pointer;font-size:0.82rem;text-align:left">🗑️ Reset Orders — Delete all order records</button>
          <button onclick="adminResetConfirm('customers');showAdminDashboard();" style="padding:0.6rem 1rem;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:var(--r2);cursor:pointer;font-size:0.82rem;text-align:left">👥 Reset Customers — Delete all customer records</button>
          <button onclick="adminResetConfirm('analytics');showAdminDashboard();" style="padding:0.6rem 1rem;background:#EDE9FE;color:#4C1D95;border:1px solid #DDD6FE;border-radius:var(--r2);cursor:pointer;font-size:0.82rem;text-align:left">📊 Reset Analytics — Clear activity feed</button>
          <button onclick="adminResetConfirm('factory');showAdminDashboard();" style="padding:0.75rem 1rem;background:#1A1A18;color:#fff;border:none;border-radius:var(--r2);cursor:pointer;font-size:0.82rem;font-weight:700;text-align:left">🔄 Factory Reset — Wipe ALL store data (orders + customers + analytics)</button>
        </div>
      </div>
        <div class="form-group"><label>SMTP Host</label><input type="text" placeholder="smtp.gmail.com"></div>
        <div class="form-group"><label>SMTP Port</label><input type="number" value="587"></div>
        <div class="form-group"><label>Email</label><input type="email" placeholder="noreply@dizocart.com"></div>
        <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••"></div>
        <button class="btn-primary" style="padding:0.65rem 1.5rem" onclick="showToast('📧 SMTP saved!')">Save SMTP</button>
      </div>
      <div class="admin-section">
        <div class="admin-section-title">Analytics Codes</div>
        <div class="form-group"><label>Google Analytics ID</label><input type="text" placeholder="G-XXXXXXXXXX"></div>
        <div class="form-group"><label>Facebook Pixel ID</label><input type="text" placeholder="XXXXXXXXXXXXXXXXXX"></div>
        <div class="form-group"><label>📞 Store Phone Number</label><input type="tel" id="adminStorePhone" value="${STORE_CONTACT.phone}" placeholder="+8801712345678"></div>
        <div class="form-group"><label>💬 WhatsApp Number (no + prefix)</label><input type="tel" id="adminStoreWhatsapp" value="${STORE_CONTACT.whatsapp}" placeholder="8801712345678"></div>
        <button class="btn-primary" style="padding:0.65rem 1.5rem" onclick="saveStoreContact()">✅ Save Contact Numbers</button>
      </div>
    </div>
  `;
}

function togglePaymentMethod(key, enabled){
  if(!paymentConfig[key]) return;

  // Prevent disabling last active method
  const activeCount = Object.values(paymentConfig).filter(v=>v.enabled).length;
  if(!enabled && activeCount <= 1){
    showToast('⚠️ কমপক্ষে একটি payment method চালু রাখতে হবে!');
    // Revert toggle visually
    const cb = document.getElementById('pmToggle_'+key);
    if(cb) cb.checked = true;
    return;
  }

  paymentConfig[key].enabled = enabled;
  savePaymentConfig();

  // Update row UI
  const row   = document.getElementById('pmRow_'+key);
  const track = document.getElementById('pmTrack_'+key);
  const thumb = document.getElementById('pmThumb_'+key);
  const status= document.getElementById('pmStatus_'+key);
  const label = document.querySelector(`label[for="pmToggle_${key}"] span`) ||
                document.querySelector(`#pmToggle_${key}`)?.closest('label')?.querySelector('span');

  if(row){
    row.style.background = enabled ? 'var(--bg2)' : '#fef2f2';
    row.style.borderColor = enabled ? 'var(--border)' : '#fecaca';
  }
  if(track) track.style.background = enabled ? '#10B981' : '#E4E3DF';
  if(thumb) thumb.style.left = enabled ? '23px' : '3px';
  if(status){
    status.textContent = enabled ? '✅ চালু' : '❌ বন্ধ';
    status.style.color = enabled ? '#059669' : '#dc2626';
  }
  // Update the ON/OFF label next to toggle
  const allSpans = document.querySelectorAll(`#pmRow_${key} label span`);
  if(allSpans.length) allSpans[allSpans.length-1].textContent = enabled ? 'ON' : 'OFF';

  showToast(enabled ? `✅ ${paymentConfig[key].label} চালু করা হয়েছে` : `⏸ ${paymentConfig[key].label} বন্ধ করা হয়েছে`);
}

// ✅ FIX: Save store contact (phone + WhatsApp) to localStorage
function saveStoreContact() {
  const phone = (document.getElementById('adminStorePhone')?.value || '').trim();
  const whatsapp = (document.getElementById('adminStoreWhatsapp')?.value || '').trim().replace(/\D/g, '');
  if (!phone) { showToast('⚠️ Please enter a phone number'); return; }
  if (!whatsapp) { showToast('⚠️ Please enter a WhatsApp number'); return; }
  STORE_CONTACT.phone = phone;
  STORE_CONTACT.whatsapp = whatsapp;
  try { localStorage.setItem('dizo_store_contact', JSON.stringify({ phone, whatsapp })); } catch(e) {}
  showToast('✅ Contact numbers saved! 📞 ' + phone + ' · 💬 ' + whatsapp);
}

function previewDeliveryChange(){
  const inside=parseInt(document.getElementById('adminInsideCharge')?.value)||0;
  const outside=parseInt(document.getElementById('adminOutsideCharge')?.value)||0;
  const freeOver=parseInt(document.getElementById('adminFreeOver')?.value)||0;
  const prev=document.getElementById('deliveryPreview');
  if(prev){
    prev.style.display='block';
    prev.innerHTML=`Preview: 🏙️ Inside Dhaka ৳${inside} · 🗺️ Outside Dhaka ৳${outside} · 🎁 Free over ৳${freeOver||'—'}`;
  }
}

function saveDeliverySettings(){
  const inside=parseInt(document.getElementById('adminInsideCharge')?.value);
  const outside=parseInt(document.getElementById('adminOutsideCharge')?.value);
  const freeOver=parseInt(document.getElementById('adminFreeOver')?.value)||0;
  if(isNaN(inside)||inside<0){showToast('⚠️ Invalid Inside Dhaka charge');return;}
  if(isNaN(outside)||outside<0){showToast('⚠️ Invalid Outside Dhaka charge');return;}
  deliveryConfig.insideDhaka.charge=inside;
  deliveryConfig.outsideDhaka.charge=outside;
  deliveryConfig.freeDeliveryOver=freeOver;
  // ✅ FIX: Persist delivery config to localStorage so it loads on next visit
  try { localStorage.setItem('dizo_delivery_config', JSON.stringify(deliveryConfig)); } catch(e){}
  showToast('✅ Delivery settings saved! 🚚 Inside Dhaka: ৳'+inside+' · Outside: ৳'+outside+(freeOver?' · Free over ৳'+freeOver:''));
}

