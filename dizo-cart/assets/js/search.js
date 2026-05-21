/**
 * Dizo Cart — search.js
 * Inline Search & PDP Search
 * Extracted from dizo_cart_V47.html (lines 533-802)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== INLINE SEARCH (Amazon-style) =====================
let navSearchCat = 'all';
const trending = ['Air Fryer','Wireless Earbuds','Face Serum','Smart Watch','Blender Pro','Skincare Kit'];

function setNavCat(val){ navSearchCat = val; }

function navSearchFocus(){
  const isMobile = window.innerWidth <= 768;
  const inputId = isMobile ? 'mobileSearchInput' : 'navSearchInput';
  const q = (document.getElementById(inputId) || document.getElementById('navSearchInput')).value.trim();
  renderNavDropdown(q);
  document.getElementById('navSearchDropdown').classList.add('open');
}

function navSearchBlur(){
  document.getElementById('navSearchDropdown').classList.remove('open');
}

function navSearchLive(q){
  renderNavDropdown(q);
  const dd = document.getElementById('navSearchDropdown');
  if(!dd.classList.contains('open')) dd.classList.add('open');
}

function renderNavDropdown(q){
  const dd = document.getElementById('navSearchDropdown');
  const all = [...products,...bestSellers];
  let filtered = navSearchCat === 'all' ? all : all.filter(p => p.cat === navSearchCat);

  if(!q.trim()){
    // Show trending when empty
    dd.innerHTML = `
      <div class="nav-sd-section">
        <div class="nav-sd-label">🔥 Trending</div>
        ${trending.map(t=>`
          <div class="nav-sd-tag" onclick="navQuickSearch('${t}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            ${t}
          </div>
        `).join('')}
      </div>`;
    return;
  }

  const matches = filtered.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.nameBn.includes(q) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    p.desc.toLowerCase().includes(q.toLowerCase())
  ).slice(0,6);

  if(!matches.length){
    dd.innerHTML = `<div class="nav-sd-no-results">No results for "<strong>${q}</strong>"</div>`;
    return;
  }

  dd.innerHTML = `
    <div class="nav-sd-section">
      <div class="nav-sd-label">Products</div>
      ${matches.map(p=>`
        <div class="nav-sd-item" onclick="navSearchSelect(${p.id})">
          <div class="nav-sd-emoji">${p.emoji}</div>
          <div class="nav-sd-info">
            <div class="nav-sd-name">${highlightMatch(p.name, q)}</div>
            <div class="nav-sd-meta">${p.cat} • ${Math.round((1-p.price/p.oldPrice)*100)}% off</div>
          </div>
          <div class="nav-sd-price">৳${p.price.toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
    <div class="nav-sd-divider"></div>
    <div class="nav-sd-tag" style="padding:0.6rem 1rem;font-weight:600;color:var(--gold)" onclick="navSearchSubmit()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      Search all results for "${q}"
    </div>`;
}

function highlightMatch(text, q){
  if(!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if(idx === -1) return text;
  return text.slice(0,idx) + `<mark style="background:rgba(200,169,110,0.25);color:var(--text);border-radius:2px">${text.slice(idx,idx+q.length)}</mark>` + text.slice(idx+q.length);
}

function navQuickSearch(term){
  document.getElementById('navSearchInput').value = term;
  navSearchLive(term);
}

function navSearchSelect(id){
  document.getElementById('navSearchDropdown').classList.remove('open');
  document.getElementById('navSearchInput').value = '';
  openProductDetail(id);
}

function navSearchSubmit(){
  const isMobile = window.innerWidth <= 768;
  const inputId = isMobile ? 'mobileSearchInput' : 'navSearchInput';
  const inputEl = document.getElementById(inputId) || document.getElementById('navSearchInput');
  const q = inputEl.value.trim();
  if(!q){ showToast('⚠️ Please enter a search term'); return; }
  document.getElementById('navSearchDropdown').classList.remove('open');

  // On mobile: close any inner page and return to home so grid is visible
  if(isMobile){
    const catPage = document.getElementById('categoryPage');
    const pdpPage = document.getElementById('productDetailPage');
    const main = document.getElementById('mainSiteContent');
    if(catPage && catPage.classList.contains('open')){ catPage.classList.remove('open'); currentCatPage = null; }
    if(pdpPage && pdpPage.classList.contains('open')){ pdpPage.classList.remove('open'); pdpOpenedFromCategory = false; currentPdpProduct = null; }
    main.classList.remove('hidden');
    activeMobTab('home');
  }

  // Filter products grid and scroll to it
  const all = [...products,...bestSellers];
  let filtered = (navSearchCat==='all' ? all : all.filter(p=>p.cat===navSearchCat))
    .filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.cat.toLowerCase().includes(q.toLowerCase()) || p.desc.toLowerCase().includes(q.toLowerCase()));
  const grid = document.getElementById('productGrid');
  if(grid){
    if(!filtered.length){
      grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text3)"><div style="font-size:3rem;margin-bottom:0.75rem">🔍</div><p>No products found for "<strong style="color:var(--text)">${q}</strong>"</p></div>`;
    } else {
      grid.innerHTML = filtered.map(p=>productCard(p)).join('');
    }
    setTimeout(()=>{ grid.closest('section')?.scrollIntoView({behavior:'smooth'}); }, 80);
  }
  showToast(`🔍 Showing results for "${q}"`);
}

function navSearchKey(e){
  if(e.key==='Enter') navSearchSubmit();
  if(e.key==='Escape'){ document.getElementById('navSearchDropdown').classList.remove('open'); document.getElementById('navSearchInput').blur(); }
}

// Legacy stubs so old references don't break
function openSearch(){ document.getElementById('navSearchInput').focus(); }
function closeSearch(){ document.getElementById('navSearchDropdown').classList.remove('open'); }
function handleSearch(){}
function handleSearchKey(){}
function handleSearchOverlayClick(){}
function setSearchCat(){}
function quickSearch(q){ navQuickSearch(q); }

// ===================== PDP SEARCH =====================
const pdpTrending = ['Air Fryer','Smart Watch','Face Serum','Wireless Earbuds','Blender Pro'];

function pdpSearchFocus(){
  renderPdpDropdown(document.getElementById('pdpSearchInput').value.trim());
  document.getElementById('pdpSearchDropdown').classList.add('open');
}

function pdpSearchBlur(){
  document.getElementById('pdpSearchDropdown').classList.remove('open');
}

function pdpSearchLive(q){
  const clear = document.getElementById('pdpSearchClear');
  if(clear) clear.style.display = q ? 'flex' : 'none';
  renderPdpDropdown(q);
  document.getElementById('pdpSearchDropdown').classList.add('open');
}

function pdpSearchClear(){
  const inp = document.getElementById('pdpSearchInput');
  inp.value = '';
  inp.focus();
  document.getElementById('pdpSearchClear').style.display = 'none';
  renderPdpDropdown('');
  document.getElementById('pdpSearchDropdown').classList.add('open');
}

function renderPdpDropdown(q){
  const dd = document.getElementById('pdpSearchDropdown');
  const all = [...products, ...bestSellers];

  if(!q.trim()){
    dd.innerHTML = `
      <div class="pdp-sd-label">🔥 Trending</div>
      ${pdpTrending.map(t => `
        <div class="pdp-sd-trending" onclick="pdpSearchPick('${t}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          ${t}
        </div>
      `).join('')}`;
    return;
  }

  const matches = all.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.nameBn.includes(q) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    p.desc.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6);

  if(!matches.length){
    dd.innerHTML = `<div class="pdp-sd-no-results">No results for "<strong>${q}</strong>"</div>`;
    return;
  }

  dd.innerHTML = `
    <div class="pdp-sd-label">Products</div>
    ${matches.map(p => `
      <div class="pdp-sd-item" onclick="pdpSearchGoTo(${p.id})">
        <div class="pdp-sd-emoji">${p.emoji}</div>
        <div class="pdp-sd-info">
          <div class="pdp-sd-name">${pdpHighlight(p.name, q)}</div>
          <div class="pdp-sd-meta">${p.cat} · ${Math.round((1-p.price/p.oldPrice)*100)}% off</div>
        </div>
        <div class="pdp-sd-price">৳${p.price.toLocaleString()}</div>
      </div>
    `).join('')}`;
}

function pdpHighlight(text, q){
  if(!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if(i === -1) return text;
  return text.slice(0,i) + `<mark style="background:rgba(200,169,110,0.3);color:var(--text);border-radius:2px;padding:0 1px">${text.slice(i,i+q.length)}</mark>` + text.slice(i+q.length);
}

function pdpSearchPick(term){
  document.getElementById('pdpSearchInput').value = term;
  document.getElementById('pdpSearchClear').style.display = 'flex';
  renderPdpDropdown(term);
}

function pdpSearchGoTo(id){
  document.getElementById('pdpSearchDropdown').classList.remove('open');
  document.getElementById('pdpSearchInput').value = '';
  document.getElementById('pdpSearchClear').style.display = 'none';
  openProductDetail(id);
}

function pdpSearchKey(e){
  if(e.key === 'Enter'){
    const q = document.getElementById('pdpSearchInput').value.trim();
    if(!q) return;
    document.getElementById('pdpSearchDropdown').classList.remove('open');
    // Navigate back to main, filter products, scroll
    closeProductDetail();
    setTimeout(() => {
      const inp = document.getElementById('navSearchInput');
      if(inp){ inp.value = q; navSearchLive(q); }
      navSearchSubmit && navSearchSubmit();
    }, 350);
  }
  if(e.key === 'Escape'){
    document.getElementById('pdpSearchDropdown').classList.remove('open');
    document.getElementById('pdpSearchInput').blur();
  }
}


function openQuickView(id){
  const all=[...products,...bestSellers];
  const p=all.find(x=>x.id===id);
  if(!p)return;
  modalProduct=p;
  document.getElementById('modalImg').textContent=p.emoji;
  document.getElementById('modalCat').textContent=p.cat;
  document.getElementById('modalName').textContent=lang==='en'?p.name:p.nameBn;
  document.getElementById('modalPrice').textContent='৳'+p.price.toLocaleString();
  document.getElementById('modalOldPrice').textContent='৳'+p.oldPrice.toLocaleString();
  document.getElementById('modalOff').textContent=Math.round((1-p.price/p.oldPrice)*100)+'% OFF';
  document.getElementById('modalDesc').textContent=p.desc;
  document.getElementById('quickViewModal').classList.add('open');
}
function closeModal(e){if(e.target===document.getElementById('quickViewModal'))document.getElementById('quickViewModal').classList.remove('open');}

