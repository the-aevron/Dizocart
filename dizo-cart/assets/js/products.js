/**
 * Dizo Cart — products.js
 * Product Rendering & Filters
 * Extracted from dizo_cart_V47.html (lines 257-371)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== PRODUCTS =====================
function renderProducts(filter){
  filter=filter||currentFilter;
  const grid=document.getElementById('productGrid');
  const filtered=filter==='all'?products:products.filter(p=>p.cat===filter);
  if(!filtered.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;color:var(--text3)"><div style="font-size:3rem;margin-bottom:1rem">📦</div><div style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">No products yet</div><div style="font-size:0.85rem">Add products from the Admin Panel</div></div>';
    updateCategoryCounts();
    return;
  }
  grid.innerHTML=filtered.map(p=>productCard(p)).join('');
  updateCategoryCounts();
}
function renderBestSellers(){
  const grid=document.getElementById('bestSellersGrid');
  if(!bestSellers.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text3)"><div style="font-size:2.5rem;margin-bottom:0.75rem">⭐</div><div style="font-size:0.9rem;font-weight:600">No best sellers yet</div><div style="font-size:0.8rem;margin-top:0.3rem">Mark products as Best Seller in Admin Panel</div></div>';
    return;
  }
  grid.innerHTML=bestSellers.map(p=>productCard(p)).join('');
}

// ===================== REAL-TIME CATEGORY COUNTS =====================
function updateCategoryCounts(){
  const all = [...products, ...bestSellers];
  const cats = ['kitchen','home','gadgets','beauty'];

  cats.forEach(cat => {
    // Deduplicate by id (product may appear in both arrays)
    const ids = new Set();
    all.forEach(p => { if(p.cat === cat) ids.add(p.id); });
    const count = ids.size;
    const label = count === 1 ? '1 Product' : count + ' Products';

    // Update homepage category grid
    const gridEl = document.getElementById('catCount-' + cat);
    if(gridEl){
      const prev = parseInt(gridEl.dataset.prev || '-1');
      gridEl.textContent = label;
      // Pulse animation on change
      if(prev !== -1 && prev !== count){
        gridEl.style.transition = 'none';
        gridEl.style.color = count > prev ? 'var(--gold)' : '#dc2626';
        setTimeout(()=>{ gridEl.style.transition = 'color 0.6s ease'; gridEl.style.color = ''; }, 800);
      }
      gridEl.dataset.prev = count;
    }

    // Update category bottom sheet
    const sheetEl = document.getElementById('catSheetCount-' + cat);
    if(sheetEl) sheetEl.textContent = label;
  });
}

function productCard(p){
  const name=lang==='en'?p.name:(p.nameBn||p.name);
  const off=Math.round((1-p.price/p.oldPrice)*100);
  const isWish=wishlist.has(p.id);
  const primaryImg = p.image1 || p.img || '';
  const imgContent = primaryImg
    ? `<img src="${primaryImg}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:0;transition:transform 0.4s ease" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const emojiStyle = primaryImg ? 'display:none;font-size:3.5rem;position:absolute;inset:0;align-items:center;justify-content:center' : 'font-size:3.5rem';
  // hover-cycle data for secondary image
  const secondaryImg = p.image2 || p.img || '';
  return`<div class="product-card" onclick="openProductDetail(${p.id})" style="cursor:pointer"
    onmouseenter="productCardHover(this,${JSON.stringify(secondaryImg)})"
    onmouseleave="productCardLeave(this,${JSON.stringify(primaryImg)})">
    <div class="product-img" style="position:relative;overflow:hidden">
      <span class="product-badge badge-${p.badge}">${p.badge.toUpperCase()}</span>
      ${imgContent}
      <span style="${emojiStyle}">${p.emoji}</span>
      <div class="product-actions">
        <button class="product-action-btn ${isWish?'wish-active':''}" onclick="event.stopPropagation();toggleWish(${p.id})" id="wish-${p.id}" title="Wishlist">${isWish?'❤':'♡'}</button>
        <button class="product-action-btn" onclick="event.stopPropagation();openProductDetail(${p.id})" title="View Details">👁</button>
      </div>
    </div>
    <div class="product-body">
      <div class="product-cat">${p.cat}</div>
      <div class="product-name">${name}</div>
      <div class="product-rating"><span class="stars">★★★★★</span><span class="rating-count">(${p.reviews})</span></div>
      <div class="product-price">
        <span class="price-current">৳${p.price.toLocaleString()}</span>
        <span class="price-old">৳${p.oldPrice.toLocaleString()}</span>
        <span class="price-off">${off}% OFF</span>
      </div>
      <div class="product-card-btns">
        <button class="btn-atc" onclick="event.stopPropagation();addToCart(${p.id})">🛒 Add to Cart</button>
        <button class="btn-buynow" onclick="event.stopPropagation();buyNow(${p.id})">⚡ Buy Now</button>
      </div>
    </div>
  </div>`;
}

function productCardHover(card, secondaryImg){
  if(!secondaryImg) return;
  const img = card.querySelector('.product-img img');
  if(img){ img.style.transform='scale(1.04)'; if(secondaryImg && secondaryImg !== img.getAttribute('data-primary')) img.src = secondaryImg; }
}
function productCardLeave(card, primaryImg){
  const img = card.querySelector('.product-img img');
  if(img){ img.style.transform='scale(1)'; if(primaryImg) img.src = primaryImg; }
}

function setFilter(f){
  currentFilter=f;
  renderProducts(f);
}
function filterCat(cat){
  if(cat==='all'){setFilter('all');}
  else{setFilter(cat);}
  const grid=document.getElementById('productGrid');
  if(grid)grid.scrollIntoView({behavior:'smooth'});
}

