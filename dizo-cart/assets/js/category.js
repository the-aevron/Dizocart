/**
 * Dizo Cart — category.js
 * Category Page Logic
 * Extracted from dizo_cart_V47.html (lines 3992-4164)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== CATEGORY PAGE =====================
const catMeta = {
  kitchen: {
    title: 'Kitchen Essentials',
    icon: '🍳',
    desc: 'Upgrade your kitchen with premium cookware, appliances, and tools. Cook smarter and faster with our curated selection.',
    tags: ['Cookware','Appliances','Storage','Utensils','Bakeware'],
    subcats: [
      {icon:'🍟',name:'Air Fryers',count:'48'},
      {icon:'🫖',name:'Kettles & Brewers',count:'32'},
      {icon:'🍲',name:'Pressure Cookers',count:'27'},
      {icon:'🥤',name:'Blenders & Mixers',count:'41'},
      {icon:'🍕',name:'Bakeware',count:'35'},
      {icon:'🫙',name:'Storage & Containers',count:'101'},
    ]
  },
  home: {
    title: 'Home Essentials',
    icon: '🏠',
    desc: 'Transform your living space with beautiful home decor, smart lighting, organizers, and everything you need for a comfortable home.',
    tags: ['Decor','Lighting','Organizers','Bedding','Cleaning'],
    subcats: [
      {icon:'💡',name:'Lighting',count:'54'},
      {icon:'🪴',name:'Organizers',count:'38'},
      {icon:'🛏️',name:'Bedding',count:'29'},
      {icon:'🧹',name:'Cleaning',count:'45'},
      {icon:'🏺',name:'Decor & Accents',count:'62'},
      {icon:'🪟',name:'Curtains & Rugs',count:'28'},
    ]
  },
  gadgets: {
    title: 'Gadget Items',
    icon: '📱',
    desc: 'Stay ahead with the latest smart gadgets, wearables, audio devices, and tech accessories for every lifestyle.',
    tags: ['Wearables','Audio','Smart Home','Accessories','Cameras'],
    subcats: [
      {icon:'⌚',name:'Smart Watches',count:'56'},
      {icon:'🎧',name:'Audio & Earbuds',count:'74'},
      {icon:'📷',name:'Cameras & Drones',count:'22'},
      {icon:'🔌',name:'Power & Cables',count:'89'},
      {icon:'🖥️',name:'Computer Accessories',count:'43'},
      {icon:'💡',name:'Smart Home',count:'48'},
    ]
  },
  beauty: {
    title: 'Beauty & Skincare',
    icon: '💄',
    desc: 'Discover authentic beauty products, skincare essentials, and wellness items from top brands. Glow up with Dizo Cart.',
    tags: ['Skincare','Makeup','Hair Care','Fragrance','Wellness'],
    subcats: [
      {icon:'🧴',name:'Serums & Moisturizers',count:'42'},
      {icon:'💄',name:'Makeup',count:'38'},
      {icon:'🧖',name:'Face Care',count:'31'},
      {icon:'💇',name:'Hair Care',count:'27'},
      {icon:'🌸',name:'Fragrance',count:'12'},
      {icon:'🫧',name:'Cleansers',count:'18'},
    ]
  }
};

let currentCatPage = null;
let catPageProducts = [];

function openCategoryPage(cat, pushState=true) {
  currentCatPage = cat;
  const meta = catMeta[cat] || {};
  const all = [...products, ...bestSellers];
  catPageProducts = all.filter(p => p.cat === cat);

  // Close PDP if open (seamless transition, no home flash)
  const pdpEl = document.getElementById('productDetailPage');
  if(pdpEl.classList.contains('open')){
    pdpEl.classList.remove('open');
    pdpOpenedFromCategory = false;
    currentPdpProduct = null;
  }

  // Set hero
  document.getElementById('catPageIcon').textContent = meta.icon || '🛍';
  document.getElementById('catPageTitle').textContent = meta.title || cat;
  document.getElementById('catPageDesc').textContent = meta.desc || '';
  document.getElementById('catPageBreadcrumb').textContent = meta.title || cat;

  // Tags
  const tagsEl = document.getElementById('catPageTags');
  tagsEl.innerHTML = (meta.tags||[]).map(t=>
    `<span class="cat-page-tag">${t}</span>`
  ).join('');

  // Sub-categories removed
  const subcatEl = document.getElementById('catPageSubcats');
  subcatEl.innerHTML = '';

  // Reset sort
  document.getElementById('catPageSort').value = 'default';
  renderCategoryGrid(catPageProducts);

  // Show page
  document.getElementById('categoryPage').classList.add('open');
  document.getElementById('mainSiteContent').classList.add('hidden');
  document.getElementById('categoryPage').scrollTop = 0;

  // Push browser history so back button works
  if(pushState) history.pushState({page:'category', cat}, '', '#cat-' + cat);

  // Sync cart badge
  syncCatPageCartBadge();

  // Sync tab bar
  activeMobTab('category');
}

function closeCategoryPage(pushState=true) {
  document.getElementById('categoryPage').classList.remove('open');
  document.getElementById('mainSiteContent').classList.remove('hidden');
  currentCatPage = null;
  activeMobTab('home');
  if(pushState) history.pushState({page:'home'}, '', window.location.pathname + window.location.search);
}

// Animated close for back-press — adds overlay flash + smooth slide-down
function closeCategoryPageAnimated() {
  const page = document.getElementById('categoryPage');
  const main = document.getElementById('mainSiteContent');

  // Show overlay flash
  let overlay = document.getElementById('catBackOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'catBackOverlay';
    overlay.className = 'cat-back-overlay';
    document.body.appendChild(overlay);
  }
  overlay.classList.add('animating');
  setTimeout(()=>{ overlay.classList.remove('animating'); }, 450);

  // Slide down animation
  page.classList.add('closing');
  setTimeout(()=>{
    page.classList.remove('open','closing');
    main.classList.remove('hidden');
    currentCatPage = null;
    activeMobTab('home');
  }, 420);
}

function syncCatPageCartBadge() {
  const total = cart.reduce((s,c)=>s+c.qty,0);
  const el = document.getElementById('catPageCartCount');
  if(el) el.textContent = total;
}

function renderCategoryGrid(prods) {
  const grid = document.getElementById('catPageGrid');
  const countEl = document.getElementById('catPageCount');
  countEl.innerHTML = `<strong>${prods.length}</strong> products found`;
  if(!prods.length) {
    grid.innerHTML = `<div class="cat-page-empty" style="grid-column:1/-1"><div class="cat-page-empty-icon">🛍️</div><p>No products found in this category.</p></div>`;
    return;
  }
  grid.innerHTML = prods.map(p => productCard(p)).join('');
}

function sortCategoryProducts() {
  const sort = document.getElementById('catPageSort').value;
  let sorted = [...catPageProducts];
  if(sort === 'price-asc') sorted.sort((a,b)=>a.price-b.price);
  else if(sort === 'price-desc') sorted.sort((a,b)=>b.price-a.price);
  else if(sort === 'rating') sorted.sort((a,b)=>b.rating-a.rating);
  else if(sort === 'discount') sorted.sort((a,b)=>(b.oldPrice-b.price)/b.oldPrice-(a.oldPrice-a.price)/a.oldPrice);
  renderCategoryGrid(sorted);
}

