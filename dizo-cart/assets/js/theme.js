/**
 * Dizo Cart — theme.js
 * Theme & Language Toggle
 * Extracted from dizo_cart_V47.html (lines 208-256)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== THEME =====================
const THEME_STORAGE_KEY = 'dizo_active_theme_v1';

function setTheme(t){
  const themes={
    default:{accent:'#1A1A18',gold:'#C8A96E',bg:'#FAFAF8',bg2:'#F4F3EF',bg3:'#EEECEA',border:'#E4E3DF'},
    emerald:{accent:'#065F46',gold:'#10B981',bg:'#F0FDF4',bg2:'#DCFCE7',bg3:'#BBF7D0',border:'#A7F3D0'},
    ocean:{accent:'#1E3A8A',gold:'#2563EB',bg:'#EFF6FF',bg2:'#DBEAFE',bg3:'#BFDBFE',border:'#93C5FD'},
    purple:{accent:'#4C1D95',gold:'#7C3AED',bg:'#F5F3FF',bg2:'#EDE9FE',bg3:'#DDD6FE',border:'#C4B5FD'},
    sunset:{accent:'#7C2D12',gold:'#F97316',bg:'#FFF7ED',bg2:'#FFEDD5',bg3:'#FED7AA',border:'#FDBA74'},
  };
  const th=themes[t]||themes.default;
  const r=document.documentElement;
  r.style.setProperty('--text',th.accent);
  r.style.setProperty('--accent',th.accent);
  r.style.setProperty('--gold',th.gold);
  r.style.setProperty('--accent2',th.gold);
  r.style.setProperty('--bg',th.bg);
  r.style.setProperty('--bg2',th.bg2);
  r.style.setProperty('--bg3',th.bg3);
  r.style.setProperty('--border',th.border);
  // Save to localStorage so theme persists after refresh
  try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch(e){}
  showToast('🎨 Theme applied & saved!');
}

function loadSavedTheme(){
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if(saved && saved !== 'default') setTheme(saved);
  } catch(e){}
}

// ===================== LANG =====================
function toggleLang(){
  lang=lang==='en'?'bn':'en';
  document.getElementById('langBtn').textContent=lang==='en'?'বাং':'EN';
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=lang==='en'?el.dataset.en:el.dataset.bn;
  });
  document.querySelectorAll('[data-en-placeholder]').forEach(el=>{
    el.placeholder=lang==='en'?el.dataset.enPlaceholder:el.dataset.bnPlaceholder;
  });
  if(lang==='bn'){document.body.classList.add('lang-bangla');}
  else{document.body.classList.remove('lang-bangla');}
  renderProducts();renderBestSellers();
  showToast(lang==='en'?'🌐 English':'🌐 বাংলা');
}

