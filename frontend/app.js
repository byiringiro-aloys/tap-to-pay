const socket = io(BACKEND_URL);

// ==================== DOM Elements ====================
const statusDisplay = document.getElementById('status-display');
const uidInput = document.getElementById('uid');
const holderNameInput = document.getElementById('holderName');
const amountInput = document.getElementById('amount');
const topupBtn = document.getElementById('topup-btn');
const cardVisual = document.getElementById('card-visual');
const cardUidDisplay = document.getElementById('card-uid-display');
const cardBalanceDisplay = document.getElementById('card-balance-display');

// Role selection elements
const roleOverlay = document.getElementById('role-selection-overlay');
const roleCards = document.querySelectorAll('.role-card');

// Marketplace elements
const productGrid = document.getElementById('product-grid');
const cartItemsEl = document.getElementById('cart-items');
const cartSummaryEl = document.getElementById('cart-summary');
const cartTotalItemsEl = document.getElementById('cart-total-items');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const cartBadgeEl = document.getElementById('cart-badge');
const cartCountEl = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutHint = document.getElementById('checkout-hint');
const paymentStatusMsg = document.getElementById('payment-status-msg');

// History elements
const topupHistory = document.getElementById('topup-history');
const purchaseHistory = document.getElementById('purchase-history');
const topupCountEl = document.getElementById('topup-count');
const purchaseCountEl = document.getElementById('purchase-count');

// System status elements
const mqttStatus = document.getElementById('mqtt-status');
const mqttStatusText = document.getElementById('mqtt-status-text');
const backendStatus = document.getElementById('backend-status');
const backendStatusText = document.getElementById('backend-status-text');
const dbStatus = document.getElementById('db-status');
const dbStatusText = document.getElementById('db-status-text');
const connectionIndicator = document.getElementById('connection-indicator');

// Stats elements
const totalCardsEl = document.getElementById('total-cards');
const todayTransactionsEl = document.getElementById('today-transactions');
const totalVolumeEl = document.getElementById('total-volume');
const totalPaymentsEl = document.getElementById('total-payments');
const uptimeEl = document.getElementById('uptime');

// Settings page elements
const settingsMqttIndicator = document.getElementById('settings-mqtt-indicator');
const settingsMqttStatus = document.getElementById('settings-mqtt-status');
const settingsBackendIndicator = document.getElementById('settings-backend-indicator');
const settingsBackendStatus = document.getElementById('settings-backend-status');
const settingsDbIndicator = document.getElementById('settings-db-indicator');
const settingsDbStatus = document.getElementById('settings-db-status');
const settingsWsIndicator = document.getElementById('settings-ws-indicator');
const settingsWsStatus = document.getElementById('settings-ws-status');
const settingsUptimeEl = document.getElementById('settings-uptime');
const settingsBackendUrl = document.getElementById('settings-backend-url');
const settingsTotalCards = document.getElementById('settings-total-cards');
const settingsTotalTransactions = document.getElementById('settings-total-transactions');
const settingsTopupVolume = document.getElementById('settings-topup-volume');
const settingsPurchaseVolume = document.getElementById('settings-purchase-volume');
const settingsTodayTx = document.getElementById('settings-today-tx');
const settingsNetBalance = document.getElementById('settings-net-balance');

// ==================== State ====================
let lastScannedUid = null;
let currentCardData = null;
let startTime = Date.now();
let cart = []; // Shopping cart: [{product, qty}]
let allProducts = [];
let userRole = null; // 'admin' or 'user'

// ==================== Role Selection ====================
roleCards.forEach(card => {
  card.addEventListener('click', () => {
    const role = card.dataset.role;
    selectRole(role);
  });
  
  // Also handle button click
  const btn = card.querySelector('.role-select-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const role = card.dataset.role;
    selectRole(role);
  });
});

function selectRole(role) {
  userRole = role;
  
  // Hide the overlay
  roleOverlay.classList.add('hidden');
  
  // If normal user, hide settings navigation and section
  if (role === 'user') {
    const settingsNavItem = document.querySelector('.nav-item[data-section="settings"]');
    if (settingsNavItem) {
      settingsNavItem.style.display = 'none';
    }
    
    const settingsSection = document.getElementById('section-settings');
    if (settingsSection) {
      settingsSection.style.display = 'none';
    }
  }
  
  // Store role in sessionStorage (optional, for persistence during session)
  sessionStorage.setItem('userRole', role);
}

// Check if role was previously selected in this session
window.addEventListener('DOMContentLoaded', () => {
  const savedRole = sessionStorage.getItem('userRole');
  if (savedRole) {
    selectRole(savedRole);
  }
});

// ==================== Navigation ====================
const statsGrid = document.querySelector('.stats-grid');
// Hide stats grid by default (only visible on settings)
if (statsGrid) statsGrid.style.display = 'none';

document.querySelectorAll('.nav-item[data-section]').forEach(navItem => {
  navItem.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = navItem.dataset.section;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navItem.classList.add('active');

    // Show/hide sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.classList.add('active-section');
      // Re-trigger animation
      target.style.animation = 'none';
      target.offsetHeight; // force reflow
      target.style.animation = '';
    }

    // Show stats grid only on settings section
    if (statsGrid) {
      statsGrid.style.display = sectionId === 'settings' ? 'grid' : 'none';
    }
  });
});

// ==================== Quick Amount Buttons ====================
document.querySelectorAll('.quick-amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    amountInput.value = btn.dataset.amount;
  });
});

amountInput.addEventListener('input', () => {
  document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
});

// ==================== Uptime ====================
setInterval(() => {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  uptimeEl.textContent = timeStr;
  if (settingsUptimeEl) settingsUptimeEl.textContent = timeStr;
}, 1000);

// Set backend URL in settings
if (settingsBackendUrl) settingsBackendUrl.textContent = BACKEND_URL;

// ==================== Product Grid (Marketplace) ====================
async function loadProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/products`);
    if (!response.ok) throw new Error('Failed to load products');
    allProducts = await response.json();
  } catch (err) {
    console.error('Failed to load products:', err);
    allProducts = [
      { id: 'coffee', name: 'Coffee', price: 2.50, icon: '☕' },
      { id: 'sandwich', name: 'Sandwich', price: 5.00, icon: '🥪' },
      { id: 'water', name: 'Water Bottle', price: 1.00, icon: '💧' },
      { id: 'snack', name: 'Snack Pack', price: 3.00, icon: '🍿' },
      { id: 'juice', name: 'Fresh Juice', price: 3.50, icon: '🧃' },
      { id: 'salad', name: 'Salad Bowl', price: 6.00, icon: '🥗' }
    ];
  }
  renderProducts();
}

function renderProducts() {
  productGrid.innerHTML = '';
  allProducts.forEach(product => {
    const inCart = cart.find(item => item.product.id === product.id);
    const card = document.createElement('div');
    card.className = 'product-card' + (inCart ? ' in-cart' : '');
    card.innerHTML = `
      <span class="product-icon">${product.icon}</span>
      <div class="product-name">${product.name}</div>
      <div class="product-price">$${product.price.toFixed(2)}</div>
      <div class="product-add-hint">${inCart ? `${inCart.qty} in cart` : 'Click to add'}</div>
    `;
    card.addEventListener('click', () => addToCart(product));
    productGrid.appendChild(card);
  });
}

// ==================== Shopping Cart ====================
function addToCart(product) {
  const existing = cart.find(item => item.product.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ product, qty: 1 });
  }
  updateCartUI();
  renderProducts(); // Update "in-cart" states
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  updateCartUI();
  renderProducts();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCartUI();
  renderProducts();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
  const count = getCartItemCount();
  const total = getCartTotal();

  // Badge
  if (count > 0) {
    cartBadgeEl.style.display = 'flex';
    cartCountEl.textContent = count;
  } else {
    cartBadgeEl.style.display = 'none';
  }

  // Cart items
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Your cart is empty</p>
        <p class="cart-empty-hint">Click products to add them</p>
      </div>
    `;
    cartSummaryEl.style.display = 'none';
  } else {
    let html = '';
    cart.forEach(item => {
      html += `
        <div class="cart-item">
          <span class="cart-item-icon">${item.product.icon}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.product.name}</div>
            <div class="cart-item-price">$${item.product.price.toFixed(2)} each</div>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="changeQty('${item.product.id}', -1)">−</button>
            <span class="cart-item-qty">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.product.id}', 1)">+</button>
          </div>
          <span class="cart-item-total">$${(item.product.price * item.qty).toFixed(2)}</span>
          <button class="cart-item-remove" onclick="removeFromCart('${item.product.id}')">✕</button>
        </div>
      `;
    });
    cartItemsEl.innerHTML = html;

    cartSummaryEl.style.display = 'block';
    cartTotalItemsEl.textContent = count;
    cartTotalPriceEl.textContent = `$${total.toFixed(2)}`;
  }

  updateCheckoutState();
}

function updateCheckoutState() {
  const hasCard = !!lastScannedUid;
  const hasItems = cart.length > 0;
  checkoutBtn.disabled = !(hasCard && hasItems);

  if (!hasCard) {
    checkoutHint.textContent = 'Scan your RFID card first to enable checkout';
    checkoutHint.style.display = 'block';
  } else if (!hasItems) {
    checkoutHint.textContent = 'Add products to your cart to proceed';
    checkoutHint.style.display = 'block';
  } else {
    checkoutHint.style.display = 'none';
  }
}

// ==================== Checkout / Payment ====================
checkoutBtn.addEventListener('click', async () => {
  if (!lastScannedUid || cart.length === 0) return;

  const total = getCartTotal();

  // Client-side balance check
  if (currentCardData && currentCardData.balance < total) {
    showPaymentStatus(
      `Insufficient balance! You need $${total.toFixed(2)} but only have $${currentCardData.balance.toFixed(2)}`,
      'error'
    );
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';

  // Build description from cart
  const descriptions = cart.map(item =>
    item.qty > 1 ? `${item.product.name} x${item.qty}` : item.product.name
  );
  const description = `Purchase: ${descriptions.join(', ')}`;

  try {
    const response = await fetch(`${BACKEND_URL}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: lastScannedUid,
        amount: total,
        description: description
      })
    });

    const result = await response.json();

    if (result.success) {
      // Update card data
      currentCardData = result.card;
      cardBalanceDisplay.textContent = `$${result.card.balance.toFixed(2)}`;
      cardUidDisplay.textContent = result.card.holderName;

      // Red glow on card visual
      cardVisual.style.boxShadow = '0 15px 45px 0 rgba(239, 68, 68, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.3)';
      setTimeout(() => { cardVisual.style.boxShadow = ''; }, 800);

      showPaymentStatus(
        `✅ Payment of $${result.transaction.amount.toFixed(2)} successful! New balance: $${result.card.balance.toFixed(2)}`,
        'success'
      );

      // Clear cart
      cart = [];
      updateCartUI();
      renderProducts();

      // Reload stats and history
      await loadStats();
      await loadTransactionHistories();
    } else {
      showPaymentStatus(`❌ ${result.error}`, 'error');
    }
  } catch (err) {
    console.error('Checkout failed:', err);
    showPaymentStatus('❌ Checkout failed. Could not connect to server.', 'error');
  } finally {
    checkoutBtn.innerHTML = '<span class="btn-icon">💳</span> Checkout & Pay';
    updateCheckoutState();
  }
});

function showPaymentStatus(message, type) {
  paymentStatusMsg.textContent = message;
  paymentStatusMsg.className = `payment-status-msg show ${type}`;
  setTimeout(() => {
    paymentStatusMsg.className = 'payment-status-msg';
  }, 6000);
}

// ==================== Socket Events ====================
socket.on('connect', () => {
  console.log('Connected to backend server');
  updateSystemStatus('backend', true);
  updateSystemStatus('mqtt', true);
  updateSystemStatus('ws', true);
  connectionIndicator.classList.add('connected');

  loadStats();
  loadProducts();
  loadTransactionHistories();
});

socket.on('disconnect', () => {
  console.log('Disconnected from backend server');
  updateSystemStatus('backend', false);
  updateSystemStatus('mqtt', false);
  updateSystemStatus('ws', false);
  connectionIndicator.classList.remove('connected');
});

socket.on('card-status', async (data) => {
  lastScannedUid = data.uid;
  uidInput.value = data.uid;
  topupBtn.disabled = false;
  updateCheckoutState();

  try {
    const response = await fetch(`${BACKEND_URL}/card/${data.uid}`);
    if (response.ok) {
      currentCardData = await response.json();
      holderNameInput.value = currentCardData.holderName;
      holderNameInput.readOnly = true;

      cardVisual.classList.add('active');
      cardUidDisplay.textContent = currentCardData.holderName;
      cardBalanceDisplay.textContent = `$${currentCardData.balance.toFixed(2)}`;

      statusDisplay.innerHTML = `
        <div class="data-row">
            <span class="data-label">UID:</span>
            <span class="data-value">${currentCardData.uid}</span>
        </div>
        <div class="data-row">
            <span class="data-label">Holder:</span>
            <span class="data-value">${currentCardData.holderName}</span>
        </div>
        <div class="data-row">
            <span class="data-label">Balance:</span>
            <span class="data-value" style="color: #6366f1;">$${currentCardData.balance.toFixed(2)}</span>
        </div>
        <div class="data-row">
            <span class="data-label">Status:</span>
            <span class="data-value" style="color: #4ade80;">Active</span>
        </div>
      `;

      await loadTransactionHistories();
      updateSystemStatus('db', true);
    } else {
      currentCardData = null;
      holderNameInput.value = '';
      holderNameInput.readOnly = false;
      holderNameInput.focus();

      cardVisual.classList.add('active');
      cardUidDisplay.textContent = data.uid;
      cardBalanceDisplay.textContent = `$${data.balance.toFixed(2)}`;

      statusDisplay.innerHTML = `
        <div class="data-row">
            <span class="data-label">UID:</span>
            <span class="data-value">${data.uid}</span>
        </div>
        <div class="data-row">
            <span class="data-label">Balance:</span>
            <span class="data-value" style="color: #6366f1;">$${data.balance.toFixed(2)}</span>
        </div>
        <div class="data-row">
            <span class="data-label">Status:</span>
            <span class="data-value" style="color: #fbbf24;">New Card - Enter Name</span>
        </div>
      `;
    }
  } catch (err) {
    console.error('Failed to fetch card data:', err);
    updateSystemStatus('db', false);
    currentCardData = null;
    holderNameInput.value = '';
    holderNameInput.readOnly = false;

    cardVisual.classList.add('active');
    cardUidDisplay.textContent = data.uid;
    cardBalanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
  }
});

socket.on('card-balance', (data) => {
  if (data.uid === lastScannedUid) {
    cardBalanceDisplay.textContent = `$${data.new_balance.toFixed(2)}`;
    if (currentCardData) {
      currentCardData.balance = data.new_balance;
    }

    cardVisual.style.boxShadow = '0 15px 45px 0 rgba(99, 102, 241, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.3)';
    setTimeout(() => { cardVisual.style.boxShadow = ''; }, 500);
  }

  statusDisplay.innerHTML += `
    <div class="data-row">
        <span class="data-label">New Balance:</span>
        <span class="data-value" style="color: #6366f1;">$${data.new_balance.toFixed(2)}</span>
    </div>
  `;
});

// Real-time payment updates via WebSocket
socket.on('payment-success', (data) => {
  console.log('Payment notification:', data);

  if (data.uid === lastScannedUid) {
    cardBalanceDisplay.textContent = `$${data.balanceAfter.toFixed(2)}`;
    if (currentCardData) {
      currentCardData.balance = data.balanceAfter;
    }

    cardVisual.style.boxShadow = '0 15px 45px 0 rgba(239, 68, 68, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.3)';
    setTimeout(() => { cardVisual.style.boxShadow = ''; }, 800);
  }

  loadStats();
  loadTransactionHistories();
});

// ==================== Top Up ====================
topupBtn.addEventListener('click', async () => {
  const amount = parseFloat(amountInput.value);
  const holderName = holderNameInput.value.trim();

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  if (!currentCardData && !holderName) {
    alert('Please enter the card holder name for new cards');
    holderNameInput.focus();
    return;
  }

  topupBtn.disabled = true;
  topupBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';

  try {
    const requestBody = { uid: lastScannedUid, amount };
    if (!currentCardData && holderName) {
      requestBody.holderName = holderName;
    }

    const response = await fetch(`${BACKEND_URL}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    if (result.success) {
      currentCardData = result.card;
      holderNameInput.value = result.card.holderName;
      holderNameInput.readOnly = true;
      cardUidDisplay.textContent = result.card.holderName;
      cardBalanceDisplay.textContent = `$${result.card.balance.toFixed(2)}`;
      amountInput.value = '';
      document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));

      await loadTransactionHistories();
      await loadStats();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (err) {
    console.error('Failed to connect to backend for top-up:', err);
    alert('Failed to connect to backend');
  } finally {
    topupBtn.innerHTML = '<span class="btn-icon">💳</span> Confirm Top Up';
    topupBtn.disabled = !lastScannedUid;
  }
});

// ==================== System Status ====================
function updateSystemStatus(system, isOnline) {
  let statusDot, statusTextEl;
  let settingsIndicator, settingsStatusEl;
  let statusLabel = '';

  switch (system) {
    case 'mqtt':
      statusDot = mqttStatus;
      statusTextEl = mqttStatusText;
      settingsIndicator = settingsMqttIndicator;
      settingsStatusEl = settingsMqttStatus;
      statusLabel = isOnline ? 'Connected' : 'Disconnected';
      break;
    case 'backend':
      statusDot = backendStatus;
      statusTextEl = backendStatusText;
      settingsIndicator = settingsBackendIndicator;
      settingsStatusEl = settingsBackendStatus;
      statusLabel = isOnline ? 'Online' : 'Offline';
      break;
    case 'db':
      statusDot = dbStatus;
      statusTextEl = dbStatusText;
      settingsIndicator = settingsDbIndicator;
      settingsStatusEl = settingsDbStatus;
      statusLabel = isOnline ? 'Connected' : 'Error';
      break;
    case 'ws':
      settingsIndicator = settingsWsIndicator;
      settingsStatusEl = settingsWsStatus;
      statusLabel = isOnline ? 'Connected' : 'Disconnected';
      break;
  }

  // Update sidebar status
  if (statusTextEl) statusTextEl.textContent = statusLabel;
  if (statusDot) {
    statusDot.className = 'status-dot ' + (isOnline ? 'online' : 'offline');
  }

  // Update settings page status
  if (settingsIndicator) {
    settingsIndicator.className = 'settings-status-icon ' + (isOnline ? 'online' : 'offline');
  }
  if (settingsStatusEl) {
    settingsStatusEl.textContent = statusLabel;
  }
}

// ==================== Stats ====================
async function loadStats() {
  try {
    const cardsResponse = await fetch(`${BACKEND_URL}/cards`);
    let cardCount = 0;
    let netBalance = 0;
    if (cardsResponse.ok) {
      const cards = await cardsResponse.json();
      cardCount = cards.length;
      netBalance = cards.reduce((sum, card) => sum + card.balance, 0);

      totalCardsEl.textContent = cardCount;
      totalVolumeEl.textContent = `$${netBalance.toFixed(2)}`;

      // Settings page
      if (settingsTotalCards) settingsTotalCards.textContent = cardCount;
      if (settingsNetBalance) settingsNetBalance.textContent = `$${netBalance.toFixed(2)}`;
    }

    const transactionsResponse = await fetch(`${BACKEND_URL}/transactions?limit=1000`);
    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      const today = new Date().toDateString();
      const todayTx = transactions.filter(tx =>
        new Date(tx.timestamp).toDateString() === today
      );
      todayTransactionsEl.textContent = todayTx.length;

      const totalPayments = transactions
        .filter(tx => tx.type === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      totalPaymentsEl.textContent = `$${totalPayments.toFixed(2)}`;

      const topupVolume = transactions
        .filter(tx => tx.type === 'topup')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Settings page stats
      if (settingsTotalTransactions) settingsTotalTransactions.textContent = transactions.length;
      if (settingsTodayTx) settingsTodayTx.textContent = todayTx.length;
      if (settingsTopupVolume) settingsTopupVolume.textContent = `$${topupVolume.toFixed(2)}`;
      if (settingsPurchaseVolume) settingsPurchaseVolume.textContent = `$${totalPayments.toFixed(2)}`;
    }

    updateSystemStatus('db', true);
  } catch (err) {
    console.error('Failed to load stats:', err);
    updateSystemStatus('db', false);
  }
}

// ==================== Transaction Histories (Separate) ====================
async function loadTransactionHistories() {
  try {
    // Determine which transactions to load
    let url = `${BACKEND_URL}/transactions?limit=100`;
    if (lastScannedUid) {
      url = `${BACKEND_URL}/transactions/${lastScannedUid}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch transactions');

    const transactions = await response.json();

    // Split by type
    const topups = transactions.filter(tx => tx.type === 'topup');
    const debits = transactions.filter(tx => tx.type === 'debit');

    // Render top-up history
    topupCountEl.textContent = `${topups.length} records`;
    if (topups.length === 0) {
      topupHistory.innerHTML = '<p class="empty-history">No top-up transactions yet</p>';
    } else {
      renderTransactionList(topupHistory, topups);
    }

    // Render purchase history
    purchaseCountEl.textContent = `${debits.length} records`;
    if (debits.length === 0) {
      purchaseHistory.innerHTML = '<p class="empty-history">No purchase transactions yet</p>';
    } else {
      renderTransactionList(purchaseHistory, debits);
    }

    updateSystemStatus('db', true);
  } catch (err) {
    console.error('Failed to load transaction histories:', err);
    topupHistory.innerHTML = '<p class="empty-history" style="color: #ef4444;">Failed to load</p>';
    purchaseHistory.innerHTML = '<p class="empty-history" style="color: #ef4444;">Failed to load</p>';
  }
}

function renderTransactionList(container, transactions) {
  let html = '<div class="transaction-items">';

  transactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const typeClass = tx.type === 'topup' ? 'topup' : 'debit';
    const typeIcon = tx.type === 'topup' ? '↑' : '↓';

    html += `
      <div class="transaction-item ${typeClass}">
        <div class="transaction-icon">${typeIcon}</div>
        <div class="transaction-details">
          <div class="transaction-desc">${tx.holderName || 'Unknown'} - ${tx.description || tx.type}</div>
          <div class="transaction-time">${dateStr} ${timeStr}</div>
        </div>
        <div class="transaction-amount">
          <div class="amount-value ${tx.type === 'topup' ? 'positive' : 'negative'}">
            ${tx.type === 'topup' ? '+' : '-'}$${tx.amount.toFixed(2)}
          </div>
          <div class="balance-after">Balance: $${tx.balanceAfter.toFixed(2)}</div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// ==================== Initialization ====================
loadStats();
loadProducts();
loadTransactionHistories();
