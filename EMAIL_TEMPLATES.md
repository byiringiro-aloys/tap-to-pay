# Email Templates

## Setup Email (New User Registration)

**Subject:** Welcome to TAP & PAY - Complete Your Account Setup

**Sent when:** Agent creates a new salesperson account

**Contains:**
- Welcome message with user's full name
- Auto-generated username
- Setup link button (valid 72 hours)
- Expiration warning
- TAP & PAY branding

**Preview:**
```
┌─────────────────────────────────────────┐
│   TAP & PAY                             │
│   Secure RFID Payment System            │
├─────────────────────────────────────────┤
│                                         │
│   Welcome, John Doe! 👋                 │
│                                         │
│   Your TAP & PAY salesperson account    │
│   has been created by an agent. To get  │
│   started, you need to complete your    │
│   account setup by creating a secure    │
│   password.                             │
│                                         │
│   ┌───────────────────────────────┐    │
│   │ Your Username                 │    │
│   │ johndoe                       │    │
│   └───────────────────────────────┘    │
│                                         │
│   Click the button below to set your   │
│   password and activate your account:  │
│                                         │
│   ┌─────────────────────────────┐      │
│   │ Complete Account Setup →    │      │
│   └─────────────────────────────┘      │
│                                         │
│   ⚠️ This setup link will expire in    │
│   72 hours. If it expires, please      │
│   contact your agent to generate a     │
│   new one.                             │
│                                         │
│   After setting your password, you'll  │
│   be able to log in and start          │
│   processing payments using your RFID  │
│   card reader.                         │
│                                         │
├─────────────────────────────────────────┤
│   © 2026 TAP & PAY. All rights reserved│
│   If you didn't request this account,  │
│   please ignore this email.            │
└─────────────────────────────────────────┘
```

---

## Password Reset Email

**Subject:** TAP & PAY - Password Reset Request

**Sent when:** User requests password reset

**Contains:**
- User's full name and username
- Reset link button (valid 1 hour)
- Security warning
- TAP & PAY branding

**Preview:**
```
┌─────────────────────────────────────────┐
│   TAP & PAY                             │
│   Secure RFID Payment System            │
├─────────────────────────────────────────┤
│                                         │
│   Password Reset Request 🔑             │
│                                         │
│   Hello John Doe,                       │
│                                         │
│   We received a request to reset your  │
│   password for your TAP & PAY account. │
│                                         │
│   ┌───────────────────────────────┐    │
│   │ Username                      │    │
│   │ johndoe                       │    │
│   └───────────────────────────────┘    │
│                                         │
│   Click the button below to reset your │
│   password:                            │
│                                         │
│   ┌─────────────────────────────┐      │
│   │ Reset Password →            │      │
│   └─────────────────────────────┘      │
│                                         │
│   ⚠️ This reset link will expire in    │
│   1 hour. If you didn't request this   │
│   reset, please ignore this email and  │
│   your password will remain unchanged. │
│                                         │
├─────────────────────────────────────────┤
│   © 2026 TAP & PAY. All rights reserved│
│   For security reasons, never share    │
│   your password with anyone.           │
└─────────────────────────────────────────┘
```

---

## Email Design Features

### Visual Design
- **Dark Theme**: Matches the dashboard aesthetic
- **Gradient Header**: Purple to indigo gradient with TAP & PAY logo
- **Glass Morphism**: Info boxes with subtle backgrounds
- **Modern Typography**: Inter font family
- **Responsive**: Works on all email clients

### Color Scheme
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Background: `#0f172a` (Dark slate)
- Text: `#e2e8f0` (Light slate)

### Components

#### Header
- Gradient background
- Large TAP & PAY logo
- Tagline: "Secure RFID Payment System"

#### Info Box
- Semi-transparent background
- Left border accent
- Label + Value layout
- Monospace font for values

#### Call-to-Action Button
- Gradient background
- Large, prominent
- Hover effect (in supported clients)
- Clear action text with arrow

#### Warning Box
- Amber accent color
- Warning icon
- Important information
- Distinct from main content

#### Footer
- Dark background
- Copyright notice
- Additional security/info text
- Subtle border separator

### Email Client Compatibility

✅ Gmail (Web, iOS, Android)
✅ Outlook (Web, Desktop)
✅ Apple Mail (macOS, iOS)
✅ Yahoo Mail
✅ ProtonMail
✅ Thunderbird
✅ Mobile email clients

### Accessibility

- Semantic HTML structure
- High contrast text
- Clear hierarchy
- Alt text for icons (when using images)
- Readable font sizes

---

## Customization

To customize the emails, edit the HTML in `backend/server.js`:

### Setup Email
Located in: `POST /auth/register` endpoint

### Reset Email
Located in: `POST /auth/forgot-password` endpoint

### Change Sender Address

For production, update the `from` field:

```javascript
from: 'TAP & PAY <noreply@yourdomain.com>'
```

### Add Logo Image

Replace the SVG logo with an image:

```html
<img src="https://yourdomain.com/logo.png" alt="TAP & PAY" style="width: 150px;">
```

### Modify Colors

Update the CSS variables in the `<style>` section:

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  --warning: #f59e0b;
}
```

---

## Testing Emails

### Using Resend Dashboard
1. Go to https://resend.com/emails
2. View sent emails
3. Check delivery status
4. Preview rendered HTML

### Using Email Testing Tools
- [Litmus](https://litmus.com) - Test across clients
- [Email on Acid](https://www.emailonacid.com) - Compatibility testing
- [Mailtrap](https://mailtrap.io) - Development email testing

### Local Testing
1. Trigger the email flow
2. Check backend console for the link
3. Copy HTML from console
4. Save as `.html` file
5. Open in browser to preview

---

## Best Practices

✅ Keep emails under 102KB for Gmail
✅ Use inline CSS (already implemented)
✅ Test on multiple email clients
✅ Include plain text alternative (optional)
✅ Use absolute URLs for links
✅ Avoid JavaScript
✅ Use table-based layouts for compatibility
✅ Include unsubscribe link (for marketing emails)
✅ Monitor bounce rates
✅ Track open rates (optional)

---

## Troubleshooting

### Email not received?
1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for delivery status
4. Look for bounce notifications

### Email looks broken?
1. Test in different email clients
2. Validate HTML
3. Check inline CSS
4. Verify image URLs (if using images)

### Links not working?
1. Verify URL format
2. Check token generation
3. Test link in browser
4. Check for URL encoding issues

---

## Future Enhancements

Potential improvements:
- [ ] Add company logo image
- [ ] Include QR code for mobile setup
- [ ] Add social media links
- [ ] Include help/support contact
- [ ] Add email preferences link
- [ ] Implement email templates library
- [ ] Add multi-language support
- [ ] Include usage statistics
- [ ] Add promotional footer
- [ ] Implement email tracking
