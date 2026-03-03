# Quick Start Guide - TAP & PAY Authentication

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment

Create `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_random_secret_key_here
RESEND_API=re_your_resend_api_key
```

**Get Resend API Key:**
1. Go to https://resend.com
2. Sign up for free account
3. Create API key
4. Copy to `.env` file

### Step 3: Start Services

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

Backend runs on: `http://localhost:8208`
Frontend runs on: `http://localhost:9208`

### Step 4: Login as Agent

Open browser to `http://localhost:9208`

**Default Agent Credentials:**
- Username: `agent`
- Password: `agent123`

### Step 5: Create Your First User

1. Click "User Management" in sidebar
2. Enter full name and email
3. Click "Create & Send Link"
4. Check console for setup link (also sent to email)

### Step 6: Setup New User Account

1. Copy the setup link from console
2. Open in new browser/incognito window
3. Set password (min 6 characters)
4. Click "Set Password & Continue"
5. Auto-redirects to login

### Step 7: Login as New User

1. Enter username or email
2. Enter password you created
3. See salesperson dashboard

## 🎯 Key Features

### ✅ What Works Now

- **Agent Registration**: Agents can create salesperson accounts
- **Email Delivery**: Beautiful emails sent via Resend
- **Password Setup**: New users set password via email link
- **Login**: Users can login with username OR email
- **Password Reset**: Forgot password flow with email
- **Security**: Bcrypt hashing, JWT tokens, role-based access

### 📧 Email Flow

**Setup Email:**
- Sent when agent creates user
- Contains username + setup link
- Valid for 72 hours
- Beautiful TAP & PAY branding

**Reset Email:**
- Sent when user forgets password
- Contains reset link
- Valid for 1 hour
- Security warnings included

## 🔧 Common Tasks

### Create New Salesperson

```javascript
// Agent dashboard → User Management
Full Name: "John Doe"
Email: "john.doe@company.com"
→ Click "Create & Send Link"
```

### Test Email Delivery

```bash
# Check backend console for:
✅ Setup email sent to john.doe@company.com
📧 SETUP LINK for John Doe (john.doe@company.com):
http://localhost:9208?setup=TOKEN
```

### Reset Password

```javascript
// Login page → "Forgot Password?"
Username: "johndoe"
→ Click "Send Reset Link"
→ Check console for reset link
→ Open link and set new password
```

### Login with Email

```javascript
// Login page
Username or Email: "john.doe@company.com"  // ← Email works!
Password: "yourpassword"
→ Click "Sign In"
```

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check MongoDB connection
# Verify .env file exists
# Check port 8208 is available
```

### Emails not sending?
```bash
# Verify RESEND_API in .env
# Check Resend dashboard
# Look for errors in backend console
```

### Can't login?
```bash
# Verify password was set
# Try password reset flow
# Check backend console for errors
```

### Setup link expired?
```bash
# Agent can delete user and recreate
# New link will be generated
```

## 📚 Documentation

- **AUTHENTICATION_GUIDE.md** - Complete authentication documentation
- **SETUP_SUMMARY.md** - Implementation summary
- **EMAIL_TEMPLATES.md** - Email design and customization
- **README.md** - Project overview

## 🎨 Customization

### Change Email Sender

Edit `backend/server.js`:

```javascript
from: 'TAP & PAY <noreply@yourdomain.com>'
```

### Modify Email Design

Edit HTML templates in `backend/server.js`:
- Setup email: `POST /auth/register`
- Reset email: `POST /auth/forgot-password`

### Change Token Expiry

```javascript
// Setup token (72 hours)
const setupTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

// Reset token (1 hour)
user.resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
```

## 🔐 Security Notes

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire in 24 hours
- Setup tokens expire in 72 hours
- Reset tokens expire in 1 hour
- Tokens are single-use
- Role-based access control enforced

## 🚀 Production Deployment

1. **Verify Domain in Resend**
   - Add your domain
   - Update DNS records
   - Verify ownership

2. **Update Email Sender**
   ```javascript
   from: 'TAP & PAY <noreply@yourdomain.com>'
   ```

3. **Set Strong JWT Secret**
   ```env
   JWT_SECRET=use_a_very_long_random_string_here
   ```

4. **Enable HTTPS**
   - Use SSL certificate
   - Update CORS settings
   - Update frontend URLs

5. **Configure Rate Limiting**
   - Limit login attempts
   - Limit password reset requests
   - Prevent brute force attacks

## 💡 Tips

- Use incognito window to test new user flow
- Check Resend dashboard for email delivery
- Console logs show all email links
- Test password reset before production
- Keep JWT_SECRET secure and random

## 🎉 You're Ready!

Your TAP & PAY system now has:
- ✅ Complete authentication flow
- ✅ Email verification with Resend
- ✅ Beautiful email templates
- ✅ Secure password management
- ✅ Role-based access control

Start creating users and processing payments! 🚀
