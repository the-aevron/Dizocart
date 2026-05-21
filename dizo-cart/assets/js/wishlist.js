/**
 * Dizo Cart — wishlist.js
 * Wishlist Management
 * Extracted from dizo_cart_V47.html (lines 481-532)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== WISHLIST =====================
function toggleWish(id){
  const all=[...products,...bestSellers];
  const p=all.find(x=>x.id===id);
  if(!p)return;
  const btn=document.getElementById('wish-'+id);
  if(wishlist.has(id)){
    wishlist.delete(id);
    if(btn){btn.textContent='♡';btn.classList.remove('wish-active');}
    showToast('💔 Removed from wishlist');
  }else{
    wishlist.set(id,p);
    if(btn){btn.textContent='❤';btn.classList.add('wish-active');}
    showToast('❤️ Added to wishlist!');
  }
}
function toggleWishFromModal(){if(modalProduct)toggleWish(modalProduct.id);}

function openWishlist(){
  document.getElementById('wishlistPanel').classList.add('open');
  document.getElementById('wishlistOverlay').classList.add('open');
  renderWishlist();
  history.pushState({page:'wishlist'},'','#wishlist');
}
function closeWishlist(){
  document.getElementById('wishlistPanel').classList.remove('open');
  document.getElementById('wishlistOverlay').classList.remove('open');
}
function renderWishlist(){
  const items=[...wishlist.values()];
  const el=document.getElementById('wishlistItems');
  if(!items.length){el.innerHTML=`<div style="text-align:center;padding:3rem 1rem;color:var(--text3)"><div style="font-size:3rem;margin-bottom:1rem">💝</div><p>Your wishlist is empty</p></div>`;return;}
  el.innerHTML=items.map(p=>`
    <div class="cart-item">
      <div class="cart-item-img">${p.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">৳${p.price.toLocaleString()}</div>
        <div class="cart-item-qty" style="margin-top:0.5rem;gap:0.5rem">
          <button class="btn-atc" style="padding:0.3rem 0.6rem;font-size:0.72rem" onclick="addToCart(${p.id});renderWishlist()">🛒 Add to Cart</button>
          <button class="btn-buynow" style="padding:0.3rem 0.6rem;font-size:0.72rem" onclick="buyNow(${p.id});closeWishlist()">⚡ Buy Now</button>
          <button style="margin-left:auto;font-size:0.75rem;color:var(--text3);cursor:pointer;background:none;border:none" onclick="toggleWish(${p.id});renderWishlist()">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}
function addAllWishToCart(){
  [...wishlist.values()].forEach(p=>addToCart(p.id));
  showToast('🛒 All wishlist items added to cart!');
}

