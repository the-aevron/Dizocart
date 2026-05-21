/**
 * Dizo Cart — pdp.js
 * Product Detail Page
 * Extracted from dizo_cart_V47.html (lines 3591-3991)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== PRODUCT DETAIL PAGE =====================
let currentPdpProduct = null;
let pdpQty = 1;
let pdpOpenedFromCategory = false; // track navigation source

function openProductDetail(id){
  const all=[...products,...bestSellers,...flashSaleProducts.map(fp=>({
    id:fp.id,name:fp.name,nameBn:fp.name,cat:fp.cat,emoji:fp.emoji,img:fp.img,
    price:fp.price,oldPrice:fp.oldPrice,badge:'sale',rating:4.5,reviews:0,
    desc:`Flash Sale item — ${fp.discount}% off. Limited stock!`
  }))];
  const p=all.find(x=>x.id===id);
  if(!p)return;
  currentPdpProduct=p;
  pdpQty=1;

  // Track if category page was open so we return to it
  const catPageOpen = document.getElementById('categoryPage').classList.contains('open');
  pdpOpenedFromCategory = catPageOpen;
  if(catPageOpen){
    // Save scroll position so we can restore it on back
    window._savedCatScrollTop = document.getElementById('categoryPage').scrollTop;
    document.getElementById('categoryPage').classList.remove('open');
  }

  // Show PDP, hide main content
  document.getElementById('mainSiteContent').classList.add('hidden');
  document.getElementById('productDetailPage').classList.add('open');
  window.scrollTo(0,0);

  // Update back button label
  const backLabel = document.getElementById('pdpBackLabel');
  if(backLabel){
    if(catPageOpen && currentCatPage){
      const meta = catMeta[currentCatPage];
      backLabel.textContent = meta ? meta.title : 'Category';
    } else {
      backLabel.textContent = 'Back to Shop';
    }
  }

  // Fill breadcrumb
  document.getElementById('pdpBreadCat').textContent=p.cat;
  document.getElementById('pdpBreadName').textContent=lang==='en'?p.name:p.nameBn;

  // Fill gallery — unlimited image slider
  const mainImgEl = document.getElementById('pdpMainImg');
  const pdpEmojiEl = document.getElementById('pdpEmoji');
  const galleryImgs = normalizeImages(p);
  const primaryImg = galleryImgs[0] || p.img || '';

  if(primaryImg){
    // Build slider HTML
    const slidesHTML = galleryImgs.map((src,i) =>
      `<div class="pdp-slide">
        <img src="${src}" loading="${i===0?'eager':'lazy'}" alt="Product image ${i+1}"
          onerror="this.style.display='none'">
      </div>`
    ).join('');

    const dotsHTML = galleryImgs.length > 1 ? galleryImgs.map((_,i) =>
      `<button class="pdp-gallery-dot${i===0?' active':''}" onclick="goToPdpSlide(${i})" aria-label="Image ${i+1}"></button>`
    ).join('') : '';

    const arrowsHTML = galleryImgs.length > 1 ? `
      <button class="pdp-gallery-arrow prev" onclick="pdpSlideDir(-1)" aria-label="Previous">&#8249;</button>
      <button class="pdp-gallery-arrow next" onclick="pdpSlideDir(1)" aria-label="Next">&#8250;</button>` : '';

    mainImgEl.className = 'pdp-main-img pdp-gallery-slider';
    mainImgEl.innerHTML = `
      <div class="pdp-slides-track" id="pdpSlidesTrack">${slidesHTML}</div>
      ${arrowsHTML}
      <div class="pdp-zoom-hint" style="opacity:0.9;bottom:0.625rem;right:0.75rem;position:absolute">🔍 Swipe to browse</div>`;
    pdpEmojiEl.style.display = 'none';

    // Dots below slider
    const dotsContainer = document.getElementById('pdpGalleryDots') || (() => {
      const d = document.createElement('div');
      d.id = 'pdpGalleryDots';
      d.className = 'pdp-gallery-dots';
      mainImgEl.insertAdjacentElement('afterend', d);
      return d;
    })();
    dotsContainer.innerHTML = dotsHTML;

    // Initialize slider state
    window._pdpSlideIndex = 0;
    window._pdpSlideCount = galleryImgs.length;

    // Touch swipe support
    let _touchStartX = 0;
    mainImgEl.addEventListener('touchstart', e=>{ _touchStartX = e.changedTouches[0].clientX; }, {passive:true});
    mainImgEl.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - _touchStartX;
      if(Math.abs(dx) > 40) pdpSlideDir(dx < 0 ? 1 : -1);
    }, {passive:true});

    // Thumbnails — all images
    const thumbLabels = ['Main','Side','Detail','Package','View 5','View 6','View 7','View 8'];
    document.getElementById('pdpThumbnails').className = 'pdp-thumbnails-scroll';
    document.getElementById('pdpThumbnails').innerHTML = galleryImgs.map((src,i) =>
      `<div class="pdp-thumb${i===0?' active':''}" onclick="goToPdpSlide(${i})" id="pdpThumb_${i}"
        style="overflow:hidden;padding:0;position:relative;flex-shrink:0">
        <img src="${src}" loading="lazy" style="width:100%;height:100%;object-fit:cover"
          onerror="this.parentElement.innerHTML='<span style=\\'font-size:1.2rem\\'>🖼️</span>'">
        <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.45);color:#fff;font-size:0.55rem;text-align:center;padding:2px 0;font-weight:600;letter-spacing:0.03em">${thumbLabels[i]||'View '+(i+1)}</div>
      </div>`
    ).join('');
  } else {
    // emoji fallback — reset to original markup
    mainImgEl.className = 'pdp-main-img';
    mainImgEl.innerHTML = `<div class="pdp-zoom-hint">🔍 Zoom</div>`;
    pdpEmojiEl.style.display = '';
    pdpEmojiEl.textContent = p.emoji;
    const dc = document.getElementById('pdpGalleryDots');
    if(dc) dc.innerHTML = '';
    document.getElementById('pdpThumbnails').innerHTML =
      [p.emoji,'🖼️','📷','🗂️'].map((em,i) =>
        `<div class="pdp-thumb${i===0?' active':''}" onclick="selectPdpThumb(this,'${em}')">${em}</div>`
      ).join('');
  }

  // Fill info
  document.getElementById('pdpCatTag').textContent=p.cat;
  const badgeColors={sale:'background:#FEF3C7;color:#92400E',new:'background:#D1FAE5;color:#065F46',hot:'background:#FEE2E2;color:#991B1B'};
  const bdg=document.getElementById('pdpBadgeTag');
  bdg.textContent=p.badge.toUpperCase();
  bdg.style.cssText=`font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:20px;${badgeColors[p.badge]||''}`;

  document.getElementById('pdpTitle').textContent=lang==='en'?p.name:p.nameBn;
  document.getElementById('pdpRatingNum').textContent=p.rating;
  document.getElementById('pdpReviewCount').textContent=`(${p.reviews} reviews)`;

  const off=Math.round((1-p.price/p.oldPrice)*100);
  const save=p.oldPrice-p.price;
  document.getElementById('pdpPriceCurrent').textContent='৳'+p.price.toLocaleString();
  document.getElementById('pdpPriceOld').textContent='৳'+p.oldPrice.toLocaleString();
  document.getElementById('pdpPriceOff').textContent=off+'% OFF';
  document.getElementById('pdpPriceSave').textContent='Save ৳'+save.toLocaleString();

  // Description
  // Description — show as readable paragraphs + feature bullets (no duplicate)
  const descEl = document.getElementById('pdpDescText');
  const featEl = document.getElementById('pdpFeatureList');
  const descRaw = p.desc || '';
  // Split into sentences, filter meaningful ones, show as bullet list only
  const sentences = descRaw.split(/(?<=[।\.\!\?])\s+/).map(s=>s.trim()).filter(s=>s.length>8);
  featEl.innerHTML = sentences.map(f=>`<li>${f.endsWith('.')||f.endsWith('।')?f:f+'.'}</li>`).join('');

  // Specs — use admin-entered specs if available, otherwise use category defaults
  const specMap={kitchen:[['Capacity','4.5L'],['Wattage','1500W'],['Material','Food-grade'],['Dimensions','30×28×32 cm'],['Weight','3.2 kg'],['Warranty','1 Year']],gadgets:[['Connectivity','Bluetooth 5.0'],['Battery','Up to 30H'],['Water Rating','IPX5'],['Charging','USB-C'],['Color','Matte Black'],['Warranty','1 Year']],beauty:[['Volume','30ml'],['Skin Type','All Types'],['Key Ingredient','Vitamin C'],['Dermatologist','Tested'],['Shelf Life','24 Months'],['Made In','Korea']],home:[['Material','Premium Plastic'],['Dimensions','25×20×15 cm'],['Color','Beige/White'],['Capacity','400ml'],['Run Time','8 Hours'],['Warranty','1 Year']]};
  let specs;
  if(p.specs && p.specs.trim()){
    // Parse admin-entered "Key: Value" lines
    specs = p.specs.trim().split('\n').map(line=>{
      const colonIdx = line.indexOf(':');
      if(colonIdx > 0){
        return [line.slice(0,colonIdx).trim(), line.slice(colonIdx+1).trim()];
      }
      return [line.trim(), ''];
    }).filter(([k])=>k.length > 0);
  } else {
    specs = specMap[p.cat] || specMap.home;
  }
  document.getElementById('pdpSpecsTable').innerHTML=specs.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  // Reviews
  const reviewsData=[
    {name:'Rahima A.',avatar:'RA',stars:'★★★★★',text:'Excellent product! Exactly as described. Fast delivery.',date:'12 May 2025'},
    {name:'Tanvir H.',avatar:'TH',stars:'★★★★☆',text:'Great quality. Worth the price. Highly recommend!',date:'8 May 2025'},
    {name:'Sumaiya M.',avatar:'SM',stars:'★★★★★',text:'Absolutely love it. Will buy again from Dizo Cart.',date:'2 May 2025'},
  ];
  document.getElementById('pdpReviewsList').innerHTML=reviewsData.map(r=>`
    <div class="pdp-review-card">
      <div class="pdp-review-header">
        <div class="pdp-review-avatar">${r.avatar}</div>
        <div>
          <div style="font-weight:600;font-size:0.875rem">${r.name}</div>
          <div style="color:var(--gold);font-size:0.8rem">${r.stars}</div>
        </div>
      </div>
      <div class="pdp-review-text">${r.text}</div>
      <div class="pdp-review-date">${r.date}</div>
    </div>
  `).join('');

  // Related products
  const related=all.filter(x=>x.cat===p.cat&&x.id!==p.id).slice(0,4);
  document.getElementById('pdpRelatedGrid').innerHTML=related.map(r=>productCard(r)).join('');

  // Qty
  document.getElementById('pdpQtyVal').textContent=pdpQty;

  // Wishlist state
  const wb=document.getElementById('pdpBtnWish');
  if(wishlist.has(p.id)){wb.textContent='❤ In Wishlist';wb.classList.add('active');}
  else{wb.textContent='♡ Add to Wishlist';wb.classList.remove('active');}

  // Push browser history so back button works
  history.pushState({page:'product', id:p.id, fromCat: pdpOpenedFromCategory ? currentCatPage : null}, '', '#product-' + p.id);

  // Reset tabs
  switchPdpTab('desc');
}

function closeProductDetail(pushState=true){
  document.getElementById('productDetailPage').classList.remove('open');
  if(pdpOpenedFromCategory && currentCatPage){
    document.getElementById('categoryPage').classList.add('open');
    // Restore saved scroll position
    requestAnimationFrame(()=>{
      document.getElementById('categoryPage').scrollTop = window._savedCatScrollTop || 0;
    });
    activeMobTab('category');
    if(pushState) history.pushState({page:'category', cat:currentCatPage}, '', '#cat-' + currentCatPage);
  } else {
    document.getElementById('mainSiteContent').classList.remove('hidden');
    activeMobTab('home');
    if(pushState) history.pushState({page:'home'}, '', window.location.pathname + window.location.search);
  }
  pdpOpenedFromCategory = false;
  currentPdpProduct=null;
}

function selectPdpThumb(el,emoji){
  document.querySelectorAll('.pdp-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pdpEmoji').textContent=emoji;
}

function selectPdpThumbImg(el, src){
  document.querySelectorAll('.pdp-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const mainImgEl = document.getElementById('pdpMainImg');
  const realImg = mainImgEl.querySelector('img.pdp-real-img');
  if(realImg) realImg.src = src;
}

function changePdpQty(delta){
  pdpQty=Math.max(1,pdpQty+delta);
  document.getElementById('pdpQtyVal').textContent=pdpQty;
}

function pdpAddToCart(){
  if(!currentPdpProduct)return;
  const existing=cart.find(c=>c.id===currentPdpProduct.id);
  if(existing){existing.qty+=pdpQty;}
  else{cart.push({id:currentPdpProduct.id,name:currentPdpProduct.name,emoji:currentPdpProduct.emoji,price:currentPdpProduct.price,qty:pdpQty});}
  updateCartBadge();
  showToast(`🛒 ${currentPdpProduct.name} × ${pdpQty} added to cart!`);
}

function pdpBuyNow(){
  pdpAddToCart();
  setTimeout(()=>openCheckout(),300);
}

function pdpToggleWish(){
  if(!currentPdpProduct)return;
  const wb=document.getElementById('pdpBtnWish');
  if(wishlist.has(currentPdpProduct.id)){
    wishlist.delete(currentPdpProduct.id);
    wb.textContent='♡ Add to Wishlist';
    wb.classList.remove('active');
    showToast('💔 Removed from wishlist');
  }else{
    wishlist.set(currentPdpProduct.id,currentPdpProduct);
    wb.textContent='❤ In Wishlist';
    wb.classList.add('active');
    showToast('❤️ Added to wishlist!');
  }
}

// ===================== CALL NOW & WHATSAPP — PDP (Feature 7) =====================

/**
 * pdpCallNow — attempts to open the phone dialer.
 * Detects if the device supports telephone links; shows a fallback
 * message with the number if calling is not supported.
 */
function pdpCallNow(){
  const fallback = document.getElementById('pdpCallFallback');
  const btn = document.getElementById('pdpBtnCall');

  // Hide any previous fallback
  if(fallback){ fallback.style.display = 'none'; }

  // Animate the button on click
  if(btn){
    btn.style.transform = 'scale(0.95)';
    setTimeout(()=>{ btn.style.transform = ''; }, 200);
  }

  // Detect device capability: mobile/tablet devices support tel: reliably.
  // Desktop browsers may open Skype/FaceTime or show a prompt.
  const isMobileOrTablet = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);

  if(!STORE_CONTACT.phone || STORE_CONTACT.phone.includes('XXXXXXXXX')){
    // Phone number not yet configured
    if(fallback){
      fallback.innerHTML = '⚠️ Phone number not configured yet. Please update <strong>STORE_CONTACT.phone</strong> in the JS config.';
      fallback.style.display = 'block';
    }
    return;
  }

  if(isMobileOrTablet){
    // Mobile: open the native dialer directly
    window.location.href = 'tel:' + STORE_CONTACT.phone;
  } else {
    // Desktop: tel: may still work (Skype, FaceTime, etc.) — attempt it
    // and also show the number as a fallback copy reference
    try {
      window.location.href = 'tel:' + STORE_CONTACT.phone;
    } catch(e){ /* silent */ }

    // Show informative fallback with the number for desktop users
    if(fallback){
      const displayNum = STORE_CONTACT.phone;
      fallback.innerHTML =
        '📞 Call us at: <strong>' + displayNum + '</strong>' +
        '<br><span style="font-size:0.75rem;color:var(--text3)">Tap the number to copy, or dial manually on your phone.</span>';
      fallback.style.display = 'block';
      // Auto-hide after 8 seconds
      setTimeout(()=>{ if(fallback) fallback.style.display = 'none'; }, 8000);
    }
    showToast('📞 Our number: ' + STORE_CONTACT.phone);
  }
}

/**
 * pdpWhatsApp — opens WhatsApp with a pre-filled message for the current product.
 * Works on both mobile (app) and desktop (WhatsApp Web).
 */
function pdpWhatsApp(){
  const btn = document.getElementById('pdpBtnWA');

  // Animate on click
  if(btn){
    btn.style.transform = 'scale(0.95)';
    setTimeout(()=>{ btn.style.transform = ''; }, 200);
  }

  if(!STORE_CONTACT.whatsapp || STORE_CONTACT.whatsapp.includes('XXXXXXXXX')){
    showToast('⚠️ WhatsApp number not configured. Update STORE_CONTACT.whatsapp in JS config.');
    return;
  }

  // Build a helpful pre-filled message with product context
  let msg = 'Hello! I am interested in ordering from Dizo Cart.';
  if(currentPdpProduct){
    const pName = currentPdpProduct.name || 'a product';
    const pPrice = currentPdpProduct.price ? '৳' + currentPdpProduct.price.toLocaleString() : '';
    msg = `Hello! I want to order: *${pName}*${pPrice ? ' (' + pPrice + ')' : ''}. Please assist me. 🛒`;
  }

  const encodedMsg = encodeURIComponent(msg);
  const waNum = STORE_CONTACT.whatsapp.replace(/\D/g, ''); // strip non-digits
  const waUrl = 'https://wa.me/' + waNum + '?text=' + encodedMsg;

  // Open in new tab — works on both mobile (app deep-link) and desktop (WhatsApp Web)
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

// ===================== END CALL NOW & WHATSAPP =====================

function switchPdpTab(tab){
  ['desc','specs','reviews'].forEach(t=>{
    document.getElementById('pdpTab'+t.charAt(0).toUpperCase()+t.slice(1))?.classList.toggle('active',t===tab);
    document.getElementById('pdpContent'+t.charAt(0).toUpperCase()+t.slice(1))?.classList.toggle('active',t===tab);
  });
}

// ===================== PDP GALLERY SLIDER =====================
function goToPdpSlide(idx){
  const count = window._pdpSlideCount || 1;
  idx = ((idx % count) + count) % count;
  window._pdpSlideIndex = idx;
  const track = document.getElementById('pdpSlidesTrack');
  if(track) track.style.transform = `translateX(-${idx*100}%)`;
  // Sync dots
  document.querySelectorAll('.pdp-gallery-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));
  // Sync thumbs
  document.querySelectorAll('#pdpThumbnails .pdp-thumb').forEach((t,i)=>t.classList.toggle('active',i===idx));
}
function pdpSlideDir(dir){ goToPdpSlide((window._pdpSlideIndex||0)+dir); }

// Legacy — kept for any old references
function selectPdpThumbImg(el, src){
  document.querySelectorAll('#pdpThumbnails .pdp-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const real = document.querySelector('.pdp-main-img img.pdp-real-img');
  if(real) real.src = src;
}
function selectPdpThumb(el, emoji){
  document.querySelectorAll('#pdpThumbnails .pdp-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const pdpEmojiEl = document.getElementById('pdpEmoji');
  if(pdpEmojiEl) pdpEmojiEl.textContent = emoji;
}

