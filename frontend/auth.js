// ==================== AUTH MODULE ====================
let authToken = null;
let currentUser = null;

function fillCredentials(u, p) {
    document.getElementById('login-username').value = u;
    document.getElementById('login-password').value = p;
}

function getAuthHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` };
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameOrEmail = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    const btnText = btn.querySelector('.login-btn-text');
    const btnLoader = btn.querySelector('.login-btn-loader');

    if (!usernameOrEmail || !password) {
        errorEl.textContent = 'Please enter both username/email and password';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    errorEl.style.display = 'none';

    try {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameOrEmail, password })
        });
        const data = await res.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            initializeApp();
        } else {
            if (data.needsSetup || data.setupRequired) {
                errorEl.innerHTML = 'Password not set. Please check your email for the setup link or contact your agent.';
            } else {
                errorEl.textContent = data.error || 'Login failed';
            }
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

function checkSavedSession() {
    const savedToken = sessionStorage.getItem('authToken');
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        initializeApp();
        return true;
    }
    return false;
}

// View management
function showView(view) {
    ['login-page', 'forgot-page', 'setup-page', 'reset-page'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(`${view}-page`).style.display = 'flex';
}

// Forgot password handler
async function handleForgotPassword(e) {
    e.preventDefault();
    const username = document.getElementById('forgot-username').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const btn = document.getElementById('forgot-btn');

    if (!username) {
        errorEl.textContent = 'Please enter your username';
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
        const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();

        if (data.success) {
            successEl.textContent = 'If your account exists, a password reset link has been sent to your registered email.';
            successEl.style.display = 'block';
            document.getElementById('forgot-username').value = '';
        } else {
            errorEl.textContent = data.error || 'Failed to process request';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
    }
}

// Setup password handler (for new salesperson accounts)
async function handleSetupPassword(e) {
    e.preventDefault();
    const password = document.getElementById('setup-password').value;
    const confirm = document.getElementById('setup-confirm').value;
    const errorEl = document.getElementById('setup-error');
    const successEl = document.getElementById('setup-success');
    const btn = document.getElementById('setup-btn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!password || !confirm) {
        errorEl.textContent = 'Please fill in both password fields';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.style.display = 'block';
        return;
    }

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('setup');

    if (!token) {
        errorEl.textContent = 'Invalid setup link. Please contact your agent.';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Setting Password...';

    try {
        const res = await fetch(`${BACKEND_URL}/auth/setup-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await res.json();

        if (data.success) {
            successEl.innerHTML = `✅ Password set successfully!<br><br>Your username is: <strong>${data.username}</strong><br><br>Redirecting to login...`;
            successEl.style.display = 'block';
            document.getElementById('setup-password-form').style.display = 'none';
            
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname;
            }, 3000);
        } else {
            errorEl.textContent = data.error || 'Failed to set password';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Set Password & Continue';
    }
}

// Reset password handler
async function handleResetPassword(e) {
    e.preventDefault();
    const password = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-confirm').value;
    const errorEl = document.getElementById('reset-error');
    const successEl = document.getElementById('reset-success');
    const btn = document.getElementById('reset-btn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!password || !confirm) {
        errorEl.textContent = 'Please fill in both password fields';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.style.display = 'block';
        return;
    }

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');

    if (!token) {
        errorEl.textContent = 'Invalid reset link';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Resetting...';

    try {
        const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await res.json();

        if (data.success) {
            successEl.innerHTML = `✅ Password reset successfully!<br><br>Your username is: <strong>${data.username}</strong><br><br>Redirecting to login...`;
            successEl.style.display = 'block';
            document.getElementById('reset-password-form').style.display = 'none';
            
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname;
            }, 3000);
        } else {
            errorEl.textContent = data.error || 'Failed to reset password';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Reset Password';
    }
}

// Init login listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check for setup or reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const setupToken = urlParams.get('setup');
    const resetToken = urlParams.get('reset');

    if (setupToken) {
        showView('setup');
        return;
    }

    if (resetToken) {
        showView('reset');
        return;
    }

    // Normal login flow
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }

    // Setup password form
    const setupForm = document.getElementById('setup-password-form');
    if (setupForm) {
        setupForm.addEventListener('submit', handleSetupPassword);
    }

    // Reset password form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }

    if (!checkSavedSession()) {
        document.getElementById('login-page').style.display = 'flex';
    }
});
