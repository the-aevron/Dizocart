/**
 * Dizo Cart — cart.js
 * Cart & Buy Now Logic
 * Extracted from dizo_cart_V47.html (lines 372-480)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== CART =====================
function addToCart(id){
  const all=[...products,...bestSellers];
  const p=all.find(x=>x.id===id);
  if(!p)return;
  const existing=cart.find(c=>c.id===id);
  if(existing){existing.qty++;}
  else{cart.push({id:p.id,name:p.name,emoji:p.emoji,price:p.price,qty:1});}
  updateCartBadge();
  showToast(`🛒 ${p.name} added to cart!`);
}

function addToCartById(id,name,emoji,price){
  const existing=cart.find(c=>c.id===id);
  if(existing){existing.qty++;}
  else{cart.push({id,name,emoji,price,qty:1});}
  updateCartBadge();
  showToast(`🛒 ${name} added to cart!`);
}

function addToCartFromModal(){
  if(modalProduct)addToCart(modalProduct.id);
  document.getElementById('quickViewModal').classList.remove('open');
}

function buyNow(id){
  const all=[...products,...bestSellers];
  const p=all.find(x=>x.id===id);
  if(!p)return;
  // Add to cart then open checkout
  addToCart(id);
  setTimeout(()=>{openCheckout();},300);
}

function buyNowById(id,name,emoji,price){
  addToCartById(id,name,emoji,price);
  setTimeout(()=>{openCheckout();},300);
}

function buyNowFromModal(){
  if(modalProduct){
    addToCart(modalProduct.id);
    document.getElementById('quickViewModal').classList.remove('open');
    setTimeout(()=>openCheckout(),300);
  }
}

function updateCartBadge(){
  const total=cart.reduce((s,c)=>s+c.qty,0);
  document.getElementById('cartCount').textContent=total;
  const mob=document.getElementById('mobileCartCount');
  if(mob) mob.textContent=total;
  const catBadge=document.getElementById('catPageCartCount');
  if(catBadge) catBadge.textContent=total;
  renderCartItems();
}

function renderCartItems(){
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const disc=couponDiscount;
  const total=sub-disc+60;
  document.getElementById('cartSubtotal').textContent='৳'+sub.toLocaleString();
  document.getElementById('cartDiscount').textContent='-৳'+disc.toLocaleString();
  document.getElementById('cartTotal').textContent='৳'+Math.max(0,total).toLocaleString();
  if(!cart.length){
    document.getElementById('cartItems').innerHTML=`<div style="text-align:center;padding:3rem 1rem;color:var(--text3)"><div style="font-size:3rem;margin-bottom:1rem">🛒</div><p style="font-size:0.9rem">Your cart is empty</p><button class="btn-primary" style="margin-top:1rem;padding:0.6rem 1.25rem;font-size:0.8rem" onclick="closeCart()">Start Shopping</button></div>`;
    return;
  }
  document.getElementById('cartItems').innerHTML=cart.map(c=>`
    <div class="cart-item">
      <div class="cart-item-img">${c.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-price">৳${c.price.toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
          <button style="margin-left:auto;font-size:0.75rem;color:var(--text3);cursor:pointer;background:none;border:none;padding:0.2rem 0.4rem;border-radius:4px;transition:all 0.2s" onclick="removeFromCart(${c.id})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function changeQty(id,delta){
  const item=cart.find(c=>c.id===id);
  if(!item)return;
  item.qty+=delta;
  if(item.qty<=0)cart=cart.filter(c=>c.id!==id);
  updateCartBadge();
}
function removeFromCart(id){cart=cart.filter(c=>c.id!==id);updateCartBadge();}
function openCart(){document.getElementById('cartDrawer').classList.add('open');document.getElementById('cartOverlay').classList.add('open');renderCartItems();history.pushState({page:'cart'},'','#cart');}
function closeCart(){document.getElementById('cartDrawer').classList.remove('open');document.getElementById('cartOverlay').classList.remove('open');}

function applyCoupon(){
  const code=document.getElementById('couponInput').value.trim().toUpperCase();
  if(code==='DIZO20'){couponDiscount=Math.round(cart.reduce((s,c)=>s+c.price*c.qty,0)*0.2);showToast('✅ Coupon DIZO20 applied! 20% off');renderCartItems();}
  else if(code==='SAVE10'){couponDiscount=Math.round(cart.reduce((s,c)=>s+c.price*c.qty,0)*0.1);showToast('✅ Coupon SAVE10 applied! 10% off');renderCartItems();}
  else{showToast('❌ Invalid coupon code');}
}
function applyCouponCheckout(){
  const code=document.getElementById('chkCoupon').value.trim().toUpperCase();
  if(code==='DIZO20'){couponDiscount=Math.round(cart.reduce((s,c)=>s+c.price*c.qty,0)*0.2);showToast('✅ Coupon applied!');updateCheckoutTotals();}
  else if(code==='SAVE10'){couponDiscount=Math.round(cart.reduce((s,c)=>s+c.price*c.qty,0)*0.1);showToast('✅ Coupon applied!');updateCheckoutTotals();}
  else{showToast('❌ Invalid coupon code');}
}

