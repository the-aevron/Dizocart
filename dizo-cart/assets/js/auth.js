/**
 * Dizo Cart — auth.js
 * Login, Register, Sessions
 * Extracted from dizo_cart_V47.html (lines 975-1008)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== LOGIN / REGISTER =====================
function openLoginModal(){
  document.getElementById('loginModal').classList.add('open');
  activeMobTab('signin');
  history.pushState({page:'login'},'','#login');
}
function closeLoginModal(e){
  if(e && e.target !== document.getElementById('loginModal')) return;
  document.getElementById('loginModal').classList.remove('open');
  activeMobTab('home');
  history.pushState({page:'home'},'',window.location.pathname+window.location.search);
}
function showRegister(){document.getElementById('loginView').style.display='none';document.getElementById('registerView').style.display='block';}
function showLogin(){document.getElementById('loginView').style.display='block';document.getElementById('registerView').style.display='none';}
function handleLogin(){showToast('✅ Logged in successfully! (Demo)');document.getElementById('loginModal').classList.remove('open');}
function handleRegister(){showToast('🎉 Account created! Welcome to Dizo Cart!');document.getElementById('loginModal').classList.remove('open');}

// ===================== CONTACT =====================
function openContact(){document.getElementById('contactModal').classList.add('open');}
function closeContactModal(e){if(e.target===document.getElementById('contactModal'))document.getElementById('contactModal').classList.remove('open');}
function sendContact(){showToast('✉️ Message sent! We\'ll reply within 24h.');document.getElementById('contactModal').classList.remove('open');}
function subscribeNewsletter(){showToast('📧 Subscribed! Thank you for joining Dizo Cart.');}

// ===================== WHATSAPP =====================
function openWhatsApp(){
  if(!STORE_CONTACT.whatsapp || STORE_CONTACT.whatsapp.includes('XXXXXXXXX')){
    showToast('⚠️ WhatsApp number not configured. Please update STORE_CONTACT.whatsapp in JS config.');
    return;
  }
  const waNum = STORE_CONTACT.whatsapp.replace(/\D/g,'');
  const msg = encodeURIComponent('Hello! I need help with my order.');
  window.open('https://wa.me/'+waNum+'?text='+msg,'_blank');
}

