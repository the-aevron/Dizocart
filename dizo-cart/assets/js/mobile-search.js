/**
 * Dizo Cart — mobile-search.js
 * Mobile Search Dropdown
 * Extracted from dizo_cart_V47.html (lines 4165-4311)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== MOBILE SEARCH =====================
const mobileTrending = ['Air Fryer','Wireless Earbuds','Face Serum','Smart Watch','Blender Pro','Skincare Kit'];

function getMobileDropdown(){ return document.getElementById('mobileSearchDropdown'); }
function getMobileInput(){ return document.getElementById('mobileSearchInput'); }

function mobileSearchFocus(){
  const q = getMobileInput().value.trim();
  renderMobileDropdown(q);
  getMobileDropdown().classList.add('open');
}

function mobileSearchBlur(){
  getMobileDropdown().classList.remove('open');
}

function mobileSearchLive(q){
  renderMobileDropdown(q);
  const dd = getMobileDropdown();
  if(!dd.classList.contains('open')) dd.classList.add('open');
}

function renderMobileDropdown(q){
  const dd = getMobileDropdown();
  const all = [...products,...bestSellers];

  if(!q.trim()){
    dd.innerHTML = `
      <div class="nav-sd-section">
        <div class="nav-sd-label">🔥 Trending</div>
        ${mobileTrending.map(t=>`
          <div class="nav-sd-tag" onclick="mobileQuickSearch('${t}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            ${t}
          </div>
        `).join('')}
      </div>`;
    return;
  }

  const matches = all.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.nameBn && p.nameBn.includes(q)) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    (p.desc && p.desc.toLowerCase().includes(q.toLowerCase()))
  ).slice(0,6);

  if(!matches.length){
    dd.innerHTML = `<div class="nav-sd-no-results">No results for "<strong>${q}</strong>"</div>`;
    return;
  }

  dd.innerHTML = `
    <div class="nav-sd-section">
      <div class="nav-sd-label">Products</div>
      ${matches.map(p=>`
        <div class="nav-sd-item" onclick="mobileSearchSelect(${p.id})">
          <div class="nav-sd-emoji">${p.emoji}</div>
          <div class="nav-sd-info">
            <div class="nav-sd-name">${highlightMatch(p.name, q)}</div>
            <div class="nav-sd-meta">${p.cat} &bull; ${Math.round((1-p.price/p.oldPrice)*100)}% off</div>
          </div>
          <div class="nav-sd-price">৳${p.price.toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
    <div class="nav-sd-divider"></div>
    <div class="nav-sd-footer" onclick="mobileSearchSubmit()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      Search all results for "${q}"
    </div>`;
}

function mobileQuickSearch(term){
  getMobileInput().value = term;
  renderMobileDropdown(term);
  getMobileDropdown().classList.add('open');
}

function mobileSearchSelect(id){
  getMobileDropdown().classList.remove('open');
  getMobileInput().value = '';
  openProductDetail(id);
}

function mobileSearchSubmit(){
  const q = getMobileInput().value.trim();
  getMobileDropdown().classList.remove('open');
  if(!q){ showToast('⚠️ Please enter a search term'); return; }

  // Close any inner pages and return to home so productGrid is visible
  const catPage = document.getElementById('categoryPage');
  const pdpPage = document.getElementById('productDetailPage');
  const main = document.getElementById('mainSiteContent');
  if(catPage && catPage.classList.contains('open')){
    catPage.classList.remove('open');
    currentCatPage = null;
  }
  if(pdpPage && pdpPage.classList.contains('open')){
    pdpPage.classList.remove('open');
    pdpOpenedFromCategory = false;
    currentPdpProduct = null;
  }
  main.classList.remove('hidden');
  activeMobTab('home');

  const all = [...products,...bestSellers];
  const filtered = all.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    (p.desc && p.desc.toLowerCase().includes(q.toLowerCase()))
  );
  const grid = document.getElementById('productGrid');
  if(grid){
    if(!filtered.length){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3)">No products found for "'+q+'"</div>';
    } else {
      grid.innerHTML = filtered.map(p=>productCard(p)).join('');
    }
    // Scroll after a tiny delay to ensure mainSiteContent is visible
    setTimeout(()=>{
      const sec = document.querySelector('#productGrid')?.closest('.section');
      if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
    }, 80);
  }
  showToast('🔍 Showing results for "'+q+'"');
}

function mobileSearchKey(e){
  if(e.key==='Enter'){ e.preventDefault(); mobileSearchSubmit(); }
  if(e.key==='Escape'){ getMobileDropdown().classList.remove('open'); getMobileInput().blur(); }
}


function openMobileMenu(){
  document.getElementById('mobileMenu').classList.add('open');
  document.getElementById('mobileMenuOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  history.pushState({page:'mobileMenu'},'','#menu');
}
function closeMobileMenu(pushState=true){
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('mobileMenuOverlay').classList.remove('open');
  document.body.style.overflow='';
  if(pushState) history.pushState({page:'home'},'',window.location.pathname+window.location.search);
}

