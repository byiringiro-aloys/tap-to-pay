// ==================== SHARED UTILITIES ====================
const socket = io(BACKEND_URL);
let lastScannedUid = null;
let currentCardData = null;
let cardPresent = false;
let cardScanTime = 0;
let isNewCard = false;
let cart = [];
let allProducts = [];
let selectedCategory = 'all';
const GRACE_PERIOD = 15000;
let gracePeriodTimer = null;

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function isPaymentAllowed() {
    if (cardPresent) return true;
    if (!cardScanTime) return false;
    return (Date.now() - cardScanTime) < GRACE_PERIOD;
}

function getRemainingGraceTime() {
    if (!cardScanTime) return 0;
    const remaining = GRACE_PERIOD - (Date.now() - cardScanTime);
    return Math.max(0, Math.ceil(remaining / 1000));
}

// ==================== PASSCODE MODAL ====================
let passcodeCallback = null;

function showPasscodeModal(mode = 'verify', message = null) {
    const modal = document.getElementById('passcode-modal');
    const title = document.getElementById('passcode-modal-title');
    const msg = document.getElementById('passcode-modal-message');
    const digits = document.querySelectorAll('#passcode-modal .passcode-digit');

    title.textContent = mode === 'set' ? 'Set Passcode' : 'Enter Passcode';
    msg.textContent = message || (mode === 'set' ? 'Create a 6-digit passcode' : 'Enter your 6-digit passcode');
    digits.forEach(d => d.value = '');
    document.getElementById('passcode-error').style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => digits[0].focus(), 100);

    return new Promise((resolve, reject) => { passcodeCallback = { resolve, reject }; });
}

function hidePasscodeModal() {
    document.getElementById('passcode-modal').style.display = 'none';
}

function getPasscodeValue() {
    return Array.from(document.querySelectorAll('#passcode-modal .passcode-digit')).map(i => i.value).join('');
}

function showPasscodeError(msg) {
    const el = document.getElementById('passcode-error');
    el.textContent = msg; el.style.display = 'block';
    document.querySelectorAll('#passcode-modal .passcode-digit').forEach(i => {
        i.style.animation = 'shake 0.5s'; setTimeout(() => i.style.animation = '', 500);
    });
}

// Setup passcode digit inputs
function setupPasscodeDigits(selector) {
    const digits = document.querySelectorAll(selector);
    digits.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (!/^\d$/.test(e.target.value)) { e.target.value = ''; return; }
            if (e.target.value && index < digits.length - 1) digits[index + 1].focus();
            if (index === digits.length - 1 && Array.from(digits).every(d => d.value.length === 1)) {
                setTimeout(() => {
                    const confirmBtn = document.getElementById('passcode-confirm-btn');
                    if (confirmBtn) confirmBtn.click();
                }, 200);
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) digits[index - 1].focus();
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            d.split('').forEach((c, i) => { if (digits[i]) digits[i].value = c; });
        });
    });
}

// Init passcode modal buttons
document.addEventListener('DOMContentLoaded', () => {
    setupPasscodeDigits('#passcode-modal .passcode-digit');

    document.getElementById('passcode-confirm-btn').addEventListener('click', () => {
        const p = getPasscodeValue();
        if (p.length !== 6) { showPasscodeError('Please enter all 6 digits'); return; }
        if (passcodeCallback) { passcodeCallback.resolve(p); passcodeCallback = null; }
        hidePasscodeModal();
    });

    document.getElementById('passcode-cancel-btn').addEventListener('click', () => {
        if (passcodeCallback) { passcodeCallback.reject(new Error('Cancelled')); passcodeCallback = null; }
        hidePasscodeModal();
    });

    document.getElementById('passcode-modal-close').addEventListener('click', () => {
        document.getElementById('passcode-cancel-btn').click();
    });
});

// ==================== RECEIPT ====================
function showReceipt(transaction) {
    const modal = document.getElementById('receipt-modal');
    const content = document.getElementById('receipt-content');
    const date = new Date(transaction.timestamp);

    let itemsHtml = '';
    if (transaction.items && transaction.items.length > 0) {
        itemsHtml = `<div class="receipt-items"><h4>Items Purchased</h4>`;
        transaction.items.forEach(item => {
            itemsHtml += `<div class="receipt-item-row"><span>${item.name} x${item.qty}</span><span>$${(item.price * item.qty).toFixed(2)}</span></div>`;
        });
        itemsHtml += '</div>';
    }

    content.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h2>TAP & PAY</h2>
        <p>RFID Payment Receipt</p>
        <div class="receipt-id">${transaction.receiptId || 'N/A'}</div>
      </div>
      <div class="receipt-detail-row"><span>Date</span><span>${date.toLocaleDateString()}</span></div>
      <div class="receipt-detail-row"><span>Time</span><span>${date.toLocaleTimeString()}</span></div>
      <div class="receipt-detail-row"><span>Card Holder</span><span>${transaction.holderName || 'N/A'}</span></div>
      <div class="receipt-detail-row"><span>Card UID</span><span>${transaction.uid || 'N/A'}</span></div>
      ${itemsHtml}
      <div class="receipt-total-row"><span>TOTAL PAID</span><span>$${transaction.amount.toFixed(2)}</span></div>
      <div class="receipt-detail-row"><span>Balance Before</span><span>$${transaction.balanceBefore.toFixed(2)}</span></div>
      <div class="receipt-detail-row"><span>Balance After</span><span>$${transaction.balanceAfter.toFixed(2)}</span></div>
      <div class="receipt-footer">
        <p>Thank you for using TAP & PAY<br>Powered by Team RDF</p>
      </div>
    </div>`;
    modal.style.display = 'flex';
}

function closeReceiptModal() { document.getElementById('receipt-modal').style.display = 'none'; }
function printReceipt() { window.print(); }

// ==================== EDIT CARD MODAL ====================
let editingCardUid = null;

function openEditCardModal(card) {
    editingCardUid = card.uid;
    document.getElementById('edit-card-uid').value = card.uid;
    document.getElementById('edit-card-name').value = card.holderName;
    document.getElementById('edit-card-email').value = card.email || '';
    document.getElementById('edit-card-phone').value = card.phone || '';
    document.getElementById('edit-card-balance').value = card.balance;
    document.getElementById('edit-card-status').value = card.status || 'active';
    document.getElementById('edit-card-modal').style.display = 'flex';
}

function closeEditCardModal() { document.getElementById('edit-card-modal').style.display = 'none'; editingCardUid = null; }

async function saveCardChanges() {
    if (!editingCardUid) return;
    const btn = document.getElementById('save-card-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
        const res = await fetch(`${BACKEND_URL}/card/${editingCardUid}`, {
            method: 'PUT', headers: getAuthHeaders(),
            body: JSON.stringify({
                holderName: document.getElementById('edit-card-name').value,
                email: document.getElementById('edit-card-email').value,
                phone: document.getElementById('edit-card-phone').value,
                balance: parseFloat(document.getElementById('edit-card-balance').value),
                status: document.getElementById('edit-card-status').value
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Card updated successfully', 'success');
            closeEditCardModal();
            if (typeof loadAgentData === 'function') loadAgentData();
        } else {
            showToast(data.error || 'Failed to update', 'error');
        }
    } catch (err) {
        showToast('Failed to connect to server', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
    }
}
