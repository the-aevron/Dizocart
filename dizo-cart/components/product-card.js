/**
 * Dizo Cart — ProductCard Component
 * ============================================================
 * Reusable product card template function.
 * This is the single source of truth for product card HTML.
 * Used by: products.js, category.js, pdp.js (related products)
 * ============================================================
 */

/**
 * Renders a single product card HTML string.
 * @param {Object} p - Product object
 * @param {string} [context='home'] - Where it's rendered: 'home' | 'category' | 'related'
 * @returns {string} HTML string
 */
function productCard(p, context = 'home') {
  const name = (typeof lang !== 'undefined' && lang === 'bn') ? (p.nameBn || p.name) : p.name;
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  const isWish = (typeof wishlist !== 'undefined') && wishlist.has(p.id);
  const primaryImg = p.image1 || p.img || '';
  const secondaryImg = p.image2 || p.img || '';

  const imgContent = primaryImg
    ? `<img src="${primaryImg}" alt="${p.name}" loading="lazy"
         style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:0;transition:transform 0.4s ease"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';

  const emojiStyle = primaryImg
    ? 'display:none;font-size:3.5rem;position:absolute;inset:0;align-items:center;justify-content:center'
    : 'font-size:3.5rem';

  return `
    <div class="product-card" onclick="openProductDetail(${p.id})" style="cursor:pointer"
      onmouseenter="productCardHover(this,'${secondaryImg}')"
      onmouseleave="productCardLeave(this,'${primaryImg}')">
      <div class="product-img" style="position:relative;overflow:hidden">
        <span class="product-badge badge-${p.badge}">${p.badge.toUpperCase()}</span>
        ${imgContent}
        <span style="${emojiStyle}">${p.emoji}</span>
        <div class="product-actions">
          <button class="product-action-btn ${isWish ? 'wish-active' : ''}"
            onclick="event.stopPropagation();toggleWish(${p.id})"
            id="wish-${p.id}" title="Wishlist">${isWish ? '❤' : '♡'}</button>
          <button class="product-action-btn"
            onclick="event.stopPropagation();openProductDetail(${p.id})"
            title="View Details">👁</button>
        </div>
      </div>
      <div class="product-body">
        <div class="product-cat">${p.cat}</div>
        <div class="product-name">${name}</div>
        <div class="product-rating">
          <span class="stars">★★★★★</span>
          <span class="rating-count">(${p.reviews})</span>
        </div>
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
