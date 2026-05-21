/**
 * Dizo Cart — ui.js
 * Toast, Banner Slider, Mobile Tab Bar
 * Extracted from dizo_cart_V47.html (lines 4312-4448)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== TOAST =====================
function showToast(msg){
  const container=document.getElementById('toastContainer');
  const toast=document.createElement('div');
  toast.className='toast';
  toast.textContent=msg;
  container.appendChild(toast);
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{toast.classList.add('show');});});
  setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),400);},2800);
}

// ===================== BANNER SLIDER =====================
let bannerIndex = 0;
let bannerSlides = [];
let dotsArea = null;
let bannerAutoInterval = null;

function initBannerSlider(){
  bannerSlides = Array.from(document.querySelectorAll('.banner-slide'));
  dotsArea = document.getElementById('bannerDots');
  if(!bannerSlides.length) return;

  // Build dots
  if(dotsArea){
    dotsArea.innerHTML = bannerSlides.map((_,i)=>
      `<button class="banner-dot${i===0?' active':''}" onclick="goBannerSlide(${i})"></button>`
    ).join('');
  }

  // Start auto-advance
  bannerAutoInterval = setInterval(()=>bannerSlide(1), 4000);
}

function goBannerSlide(idx){
  if(!bannerSlides.length) return;
  bannerSlides[bannerIndex].classList.remove('active');
  bannerIndex = ((idx % bannerSlides.length) + bannerSlides.length) % bannerSlides.length;
  bannerSlides[bannerIndex].classList.add('active');
  const dots = dotsArea ? dotsArea.querySelectorAll('.banner-dot') : [];
  dots.forEach((d,i)=>d.classList.toggle('active',i===bannerIndex));
}

function bannerSlide(dir){ goBannerSlide(bannerIndex + dir); }

document.addEventListener('DOMContentLoaded', initBannerSlider);

// ===================== MOBILE TAB BAR =====================
function activeMobTab(tab){
  ['home','category','offer','signin'].forEach(t=>{
    const el = document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el) el.classList.toggle('active', t===tab);
  });
}

/** Navigate to home page from any inner page */
function goToHomePage(){
  const catPage = document.getElementById('categoryPage');
  const pdpPage = document.getElementById('productDetailPage');
  const main = document.getElementById('mainSiteContent');
  // Close bottom sheet if open
  document.getElementById('catSheetOverlay')?.classList.remove('open');
  document.getElementById('catSheet')?.classList.remove('open');
  if(catPage.classList.contains('open')){
    catPage.classList.remove('open');
    currentCatPage = null;
  }
  if(pdpPage.classList.contains('open')){
    pdpPage.classList.remove('open');
    pdpOpenedFromCategory = false;
    currentPdpProduct = null;
  }
  main.classList.remove('hidden');
  setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}), 50);
}

/** Category tab: open a bottom sheet over whatever page is currently showing — no page transition */
function openCategorySheet(){
  document.getElementById('catSheetOverlay').classList.add('open');
  document.getElementById('catSheet').classList.add('open');
  activeMobTab('category');
  history.pushState({page:'catSheet'},'','#categories');
}

function closeCatSheet(pushState=true){
  document.getElementById('catSheetOverlay').classList.remove('open');
  document.getElementById('catSheet').classList.remove('open');
  const catOpen = document.getElementById('categoryPage').classList.contains('open');
  const pdpOpen = document.getElementById('productDetailPage').classList.contains('open');
  if(!catOpen && !pdpOpen) activeMobTab('home');
  if(pushState) history.pushState({page:'home'},'',window.location.pathname+window.location.search);
}

function pickCatFromSheet(cat){
  document.getElementById('catSheetOverlay').classList.remove('open');
  document.getElementById('catSheet').classList.remove('open');
  openCategoryPage(cat); // openCategoryPage does its own pushState
}

function scrollToFlashSale(){
  const catOpen = document.getElementById('categoryPage').classList.contains('open');
  const pdpOpen = document.getElementById('productDetailPage').classList.contains('open');
  if(catOpen){
    document.getElementById('categoryPage').classList.remove('open');
    document.getElementById('mainSiteContent').classList.remove('hidden');
    currentCatPage = null;
  }
  if(pdpOpen){
    document.getElementById('productDetailPage').classList.remove('open');
    document.getElementById('mainSiteContent').classList.remove('hidden');
    pdpOpenedFromCategory = false;
    currentPdpProduct = null;
  }
  activeMobTab('offer');
  setTimeout(()=>{
    const flashEl = document.querySelector('.flash-sale-section');
    if(flashEl) flashEl.scrollIntoView({behavior:'smooth',block:'start'});
    // Reset tab to home after scroll so back nav stays clean
    setTimeout(()=>activeMobTab('home'), 1200);
  }, (catOpen||pdpOpen) ? 150 : 0);
}

// ===================== COUNTDOWN =====================
let totalSecs=8*3600+34*60+22;
setInterval(()=>{
  totalSecs=Math.max(0,totalSecs-1);
  const h=Math.floor(totalSecs/3600),m=Math.floor((totalSecs%3600)/60),s=totalSecs%60;
  document.getElementById('cdH').textContent=String(h).padStart(2,'0');
  document.getElementById('cdM').textContent=String(m).padStart(2,'0');
  document.getElementById('cdS').textContent=String(s).padStart(2,'0');
},1000);

// ===================== SCROLL REVEAL =====================
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

