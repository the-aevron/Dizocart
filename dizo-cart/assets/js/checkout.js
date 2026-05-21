/**
 * Dizo Cart — checkout.js
 * Checkout Flow & Order Placement
 * Extracted from dizo_cart_V47.html (lines 803-974)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== CHECKOUT =====================
function openCheckout(){
  if(!cart.length){showToast('🛒 Your cart is empty!');return;}
  closeCart();
  selectedDeliveryZone='insideDhaka';
  refreshDeliveryZoneUI();
  updateCheckoutTotals();
  document.getElementById('checkoutModal').classList.add('open');
  setCheckoutStep(1);
  history.pushState({page:'checkout'},'','#checkout');
}

function selectDeliveryZone(zone){
  selectedDeliveryZone=zone;
  refreshDeliveryZoneUI();
  updateCheckoutTotals();
}

function refreshDeliveryZoneUI(){
  const inside=deliveryConfig.insideDhaka;
  const outside=deliveryConfig.outsideDhaka;
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const isFree=sub>=deliveryConfig.freeDeliveryOver;

  // Update labels with current charges
  const inLbl=document.getElementById('dzInsiDeliveryLabel');
  const outLbl=document.getElementById('dzOutsiDeliveryLabel');
  if(inLbl)inLbl.textContent=isFree?'Free delivery!':'৳'+inside.charge+' delivery charge';
  if(outLbl)outLbl.textContent=isFree?'Free delivery!':'৳'+outside.charge+' delivery charge';

  // Update selected styling
  const inOpt=document.getElementById('dzOptInside');
  const outOpt=document.getElementById('dzOptOutside');
  if(inOpt){
    inOpt.style.borderColor=selectedDeliveryZone==='insideDhaka'?'var(--gold)':'var(--border)';
    inOpt.style.background=selectedDeliveryZone==='insideDhaka'?'#fffbf4':'var(--bg2)';
  }
  if(outOpt){
    outOpt.style.borderColor=selectedDeliveryZone==='outsideDhaka'?'var(--gold)':'var(--border)';
    outOpt.style.background=selectedDeliveryZone==='outsideDhaka'?'#fffbf4':'var(--bg2)';
  }

  // Free delivery note
  const freeNote=document.getElementById('dzFreeNote');
  if(freeNote)freeNote.style.display=isFree?'block':'none';

  // Update step 2 delivery label
  const zoneLbl=document.getElementById('chkDeliveryZoneLabel');
  if(zoneLbl)zoneLbl.textContent='Delivery ('+(selectedDeliveryZone==='insideDhaka'?'Inside Dhaka':'Outside Dhaka')+')';
}
function closeCheckout(){document.getElementById('checkoutModal').classList.remove('open');}

function setCheckoutStep(n){
  [1,2,3].forEach(i=>{
    document.getElementById('checkoutStep'+i).classList.toggle('active',i===n);
    const ind=document.getElementById('step'+i+'ind');
    if(i<n)ind.classList.add('done'),ind.classList.remove('active');
    else if(i===n)ind.classList.add('active'),ind.classList.remove('done');
    else ind.classList.remove('active','done');
  });
}

function getDeliveryCharge(){
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  if(sub>=deliveryConfig.freeDeliveryOver) return 0;
  const zone=deliveryConfig[selectedDeliveryZone];
  return zone?zone.charge:60;
}

function updateCheckoutTotals(){
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const disc=couponDiscount;
  const delivery=getDeliveryCharge();
  const total=sub-disc+delivery;
  if(document.getElementById('chkSubtotal'))document.getElementById('chkSubtotal').textContent='৳'+sub.toLocaleString();
  if(document.getElementById('chkDiscount'))document.getElementById('chkDiscount').textContent='-৳'+disc.toLocaleString();
  const delEl=document.getElementById('chkDelivery');
  if(delEl)delEl.textContent=delivery===0?'🎉 Free':'৳'+delivery.toLocaleString();
  if(document.getElementById('chkTotal'))document.getElementById('chkTotal').textContent='৳'+Math.max(0,total).toLocaleString();
}

function goCheckoutStep2(){
  const name=document.getElementById('chkName').value.trim();
  const phone=document.getElementById('chkPhone').value.trim();
  const addr=document.getElementById('chkAddr').value.trim();
  if(!name||!phone||!addr){showToast('⚠️ Please fill in all required fields');return;}
  const zoneName=deliveryConfig[selectedDeliveryZone]?.label||'Inside Dhaka';
  const summary=`<strong>${name}</strong> · ${phone}<br>${addr}<br><span style="font-size:0.78rem;color:var(--text3)">Delivery: ${zoneName}</span><br><br>${cart.map(c=>`${c.emoji} ${c.name} × ${c.qty} = ৳${(c.price*c.qty).toLocaleString()}`).join('<br>')}`;
  document.getElementById('checkoutSummary').innerHTML=summary;
  updateCheckoutTotals();
  renderCheckoutPaymentMethods();
  setCheckoutStep(2);
}
function goCheckoutStep1(){setCheckoutStep(1);}

function selectPayment(el,method){
  document.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayment=method;
}

function placeOrder(){
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const delivery=getDeliveryCharge();
  const total=sub-couponDiscount+delivery;
  const ordId=StoreDB.nextOrderId();
  document.getElementById('orderId').textContent=ordId;
  const name=document.getElementById('chkName').value||'Customer';
  const phone=document.getElementById('chkPhone').value||'N/A';
  const addr=document.getElementById('chkAddr').value||'N/A';

  // Persist real order
  StoreDB.recordOrder({
    id: ordId,
    name, phone, addr,
    items: cart.map(c=>({id:c.id,name:c.name,emoji:c.emoji,price:c.price,qty:c.qty})),
    subtotal: sub,
    discount: couponDiscount,
    delivery,
    total: Math.max(0,total),
    payment: selectedPayment,
    zone: selectedDeliveryZone,
    status: 'Pending',
    timestamp: Date.now()
  });

  document.getElementById('orderSummaryFinal').innerHTML=`
    <div style="margin-bottom:0.5rem"><strong>Order ID:</strong> ${ordId}</div>
    <div style="margin-bottom:0.5rem"><strong>Name:</strong> ${name}</div>
    <div style="margin-bottom:0.5rem"><strong>Phone:</strong> ${phone}</div>
    <div style="margin-bottom:0.5rem"><strong>Address:</strong> ${addr}</div>
    <div style="margin-bottom:0.5rem"><strong>Delivery Zone:</strong> ${deliveryConfig[selectedDeliveryZone]?.label||'Inside Dhaka'}</div>
    <div style="margin-bottom:0.5rem"><strong>Payment:</strong> ${selectedPayment.toUpperCase()}</div>
    <div style="padding-top:0.5rem;border-top:1px solid var(--border);margin-top:0.5rem">
      ${cart.map(c=>`<div>${c.emoji} ${c.name} × ${c.qty} — ৳${(c.price*c.qty).toLocaleString()}</div>`).join('')}
    </div>
    <div style="font-weight:700;padding-top:0.5rem;border-top:1px solid var(--border);margin-top:0.5rem">Total: ৳${Math.max(0,total).toLocaleString()} ${delivery===0?'(Free Delivery 🎉)':'(incl. ৳'+delivery+' delivery)'}</div>
  `;
  setCheckoutStep(3);
  cart=[];couponDiscount=0;
  updateCartBadge();
  showToast('🎉 Order placed successfully!');
}

function downloadInvoice(){showToast('📄 Invoice downloaded! (Demo)');}
function openTrackOrder(){
  document.getElementById('trackModal').classList.add('open');
}
function closeTrackModal(e){if(e.target===document.getElementById('trackModal'))document.getElementById('trackModal').classList.remove('open');}
function trackOrder(){
  const input = document.querySelector('#trackModal input[type=text]');
  const q = (input?.value||'').trim();
  if(!q){ showToast('⚠️ Enter an order ID or phone number'); return; }
  const db = StoreDB.get();
  const order = db.orders.find(o=>o.id===q || o.id===(q.startsWith('#')?q:'#'+q) || o.phone===q);
  const resultEl = document.getElementById('trackResult');
  if(!order){
    resultEl.style.display='block';
    resultEl.innerHTML=`<p style="text-align:center;font-size:0.875rem;color:#DC2626;margin-top:0.5rem">⚠️ No order found for "<strong>${q}</strong>". Please check your order ID or phone number.</p>`;
    return;
  }
  const statuses = ['Pending','Processing','Shipped','Delivered'];
  const curIdx = statuses.indexOf(order.status||'Pending');
  resultEl.style.display='block';
  resultEl.innerHTML=`
    <div class="order-tracking">
      ${statuses.map((s,i)=>`<div class="track-step"><div class="track-dot ${i<curIdx?'done':i===curIdx?'active':''}">${i<curIdx?'✓':i===curIdx?'🚚':'📦'}</div><div class="track-label">${s}</div></div>`).join('')}
    </div>
    <p style="text-align:center;font-size:0.8rem;color:var(--text3);margin-top:1rem">Order <strong>${order.id}</strong> · Status: <strong>${order.status||'Pending'}</strong></p>
  `;
}

