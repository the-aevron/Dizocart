/**
 * Dizo Cart — init.js
 * Initialization & App Bootstrap
 * Extracted from dizo_cart_V47.html (lines 4449-4458)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== INIT =====================
renderProducts();
renderBestSellers();
applyFlashSaleToPage();
updateCartBadge();
loadSavedTheme();

// Push an initial home state so the very first back press doesn't close the site
history.replaceState({page:'home'}, '', window.location.href);

