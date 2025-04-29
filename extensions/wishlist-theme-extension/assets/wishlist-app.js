/**
 * Wishlist App - Consolidated JavaScript for wishlist functionality
 *
 * This file handles all wishlist-related functionality:
 * - Add/remove products from wishlist
 * - Display wishlist page
 * - Add to cart from wishlist
 * - Track wishlist conversions
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the wishlist page
  const wishlistPageContainer = document.querySelector('.wishlist-page-container');
  if (wishlistPageContainer) {
    initWishlistPage();
  }

  // Initialize wishlist buttons on all pages
  initWishlistButtons();
});

/**
 * Get the customer ID from meta tag or data attribute
 */
function getCustomerId() {
  // First check for meta tag
  const customerIdMeta = document.querySelector('meta[name="customer-id"]');
  if (customerIdMeta && customerIdMeta.content) {
    return customerIdMeta.content;
  }

  // Then check for data attribute in wishlist container
  const wishlistContainer = document.querySelector('.wishlist-page-container');
  if (wishlistContainer && wishlistContainer.dataset.customerId) {
    return wishlistContainer.dataset.customerId;
  }

  // Finally check if it's in Shopify's global customer object
  if (window.Shopify && window.Shopify.customer && window.Shopify.customer.id) {
    return window.Shopify.customer.id.toString();
  }

  return null;
}

/**
 * Get the shop domain
 */
function getShopDomain() {
  return window.Shopify?.shop || window.location.hostname;
}

/**
 * Initialize the wishlist page functionality
 */
function initWishlistPage() {
  const customerId = getCustomerId();

  if (customerId) {
    loadWishlistItems(customerId);
  } else {
    const wishlistContainer = document.getElementById('wishlist-items');
    if (wishlistContainer) {
      wishlistContainer.innerHTML = `
        <div class="empty-wishlist">
          <p>Please log in to view your wishlist.</p>
          <a href="/account/login" class="button">Log In</a>
        </div>
      `;
    }
  }
}

/**
 * Load wishlist items from API and render them
 */
function loadWishlistItems(customerId) {
  const wishlistContainer = document.getElementById('wishlist-items');
  if (!wishlistContainer) return;

  wishlistContainer.innerHTML = '<div class="loading-indicator">Loading your wishlist...</div>';

  fetch(`/apps/wishlist/api/wishlist/${customerId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.wishlist && data.wishlist.length > 0) {
        renderWishlistItems(wishlistContainer, data.wishlist, customerId);
      } else {
        renderEmptyWishlist(wishlistContainer);
      }
    })
    .catch(error => {
      console.error('Error loading wishlist:', error);
      wishlistContainer.innerHTML = '<p>Error loading wishlist. Please try again later.</p>';
    });
}

/**
 * Render wishlist items in the container
 */
function renderWishlistItems(container, items, customerId) {
  const itemsHtml = items.map(item => `
    <div class="wishlist-item">
      <div class="wishlist-item-image">
        <a href="/products/${item.handle}">
          <img src="${item.image || 'https://cdn.shopify.com/s/assets/no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c.gif'}" alt="${item.title}">
        </a>
      </div>
      <div class="wishlist-item-info">
        <h3><a href="/products/${item.handle}">${item.title}</a></h3>
        <p class="price">${item.price}</p>
        <div class="wishlist-item-actions">
          <button class="add-to-cart-btn" data-product-id="${item.id}" data-variant-id="${item.variantId}">Add to Cart</button>
          <button class="remove-wishlist-btn" data-product-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="wishlist-grid">${itemsHtml}</div>`;

  // Add event listeners to the buttons
  attachWishlistItemEventListeners(customerId);
}

/**
 * Render empty wishlist state
 */
function renderEmptyWishlist(container) {
  container.innerHTML = `
    <div class="empty-wishlist">
      <p>Your wishlist is empty.</p>
      <a href="/collections/all" class="button">Continue Shopping</a>
    </div>
  `;
}

/**
 * Attach event listeners to wishlist item buttons
 */
function attachWishlistItemEventListeners(customerId) {
  // Remove from wishlist buttons
  document.querySelectorAll('.remove-wishlist-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.dataset.productId;
      removeFromWishlist(customerId, productId, this.closest('.wishlist-item'));
    });
  });

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function() {
      const variantId = this.dataset.variantId;
      const productId = this.dataset.productId;
      addToCart(productId, customerId, variantId);
    });
  });
}

/**
 * Initialize wishlist buttons throughout the site
 */
function initWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.wishlist-button');
  const customerId = getCustomerId();

  // No wishlist buttons found or no customer ID
  if (wishlistButtons.length === 0 || !customerId) {
    return;
  }

  // Check if products are in wishlist
  checkWishlistStatus(customerId, wishlistButtons);

  // Add click event listeners
  wishlistButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();

      const productId = this.dataset.productId;
      const isInWishlist = this.classList.contains('in-wishlist');

      if (isInWishlist) {
        removeFromWishlist(customerId, productId, null, this);
      } else {
        addToWishlist(customerId, productId, this);
      }
    });
  });
}

/**
 * Check if products are in the customer's wishlist
 */
function checkWishlistStatus(customerId, buttons) {
  fetch(`/apps/wishlist/api/wishlist/${customerId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.wishlist) {
        const wishlistIds = data.wishlist.map(item => item.id.toString());

        buttons.forEach(button => {
          const productId = button.dataset.productId;
          if (wishlistIds.includes(productId)) {
            updateButtonState(button, true);
          }
        });
      }
    })
    .catch(error => {
      console.error('Error checking wishlist status:', error);
    });
}

/**
 * Add a product to the wishlist
 */
function addToWishlist(customerId, productId, button) {
  // Get the product handle from the button
  const productHandle = button.dataset.productHandle;

  if (!productHandle) {
    console.error('Missing product handle');
    return;
  }

  // Get product data using the handle
  fetch(`/products/${productHandle}.js`)
    .then(response => response.json())
    .then(product => {
      return fetch(`/apps/wishlist/api/wishlist/${customerId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product })
      });
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateButtonState(button, true);
      }
    })
    .catch(error => {
      console.error('Error adding to wishlist:', error);
    });
}

/**
 * Remove a product from the wishlist
 */
function removeFromWishlist(customerId, productId, itemElement, button) {
  fetch(`/apps/wishlist/api/wishlist/${customerId}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // If on wishlist page and item element exists, remove it
        if (itemElement) {
          itemElement.remove();

          // Check if wishlist is now empty
          if (document.querySelectorAll('.wishlist-item').length === 0) {
            const wishlistContainer = document.getElementById('wishlist-items');
            if (wishlistContainer) {
              renderEmptyWishlist(wishlistContainer);
            }
          }
        }

        // If button exists (on product pages), update its state
        if (button) {
          updateButtonState(button, false);
        }
      }
    })
    .catch(error => {
      console.error('Error removing from wishlist:', error);
    });
}

/**
 * Update the visual state of a wishlist button
 */
function updateButtonState(button, isInWishlist) {
  if (isInWishlist) {
    button.classList.add('in-wishlist');
    const icon = button.querySelector('.wishlist-icon svg');
    if (icon) {
      icon.setAttribute('fill', 'currentColor');
    }

    const text = button.querySelector('.wishlist-text');
    if (text) {
      text.textContent = 'Remove from Wishlist';
    }
  } else {
    button.classList.remove('in-wishlist');
    const icon = button.querySelector('.wishlist-icon svg');
    if (icon) {
      icon.setAttribute('fill', 'none');
    }

    const text = button.querySelector('.wishlist-text');
    if (text) {
      text.textContent = 'Add to Wishlist';
    }
  }
}

/**
 * Add a product to the cart
 */
function addToCart(productId, customerId, variantId) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: variantId,
      quantity: 1
    })
  })
    .then(response => response.json())
    .then(async data => {
      // Track this wishlist conversion
      await trackWishlistAddToCart(productId, customerId, variantId);

      // Refresh cart or redirect
      if (typeof window.refreshCart === 'function') {
        window.refreshCart();
      } else {
        window.location.href = '/cart';
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
    });
}

/**
 * Track when a wishlist item is added to cart
 */
async function trackWishlistAddToCart(productId, customerId = null, variantId = null) {
  try {
    const shop = getShopDomain();
    const url = `/apps/wishlist/api/wishlist/add-to-cart?shop=${encodeURIComponent(shop)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        customerId,
        variantId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to track wishlist add to cart:', result);
      return { success: false, error: result.error };
    }

    console.log('Successfully tracked wishlist add to cart:', result);
    return result;
  } catch (error) {
    console.error('Error tracking wishlist add to cart:', error);
    return { success: false, error: error.message };
  }
}
