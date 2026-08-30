const nodemailer = require('nodemailer');
const Settings   = require('../models/Settings');

class EmailService {
  constructor() {
    const port = Number(process.env.EMAIL_PORT || 587);
    this.transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  getFrontendUrl() {
    return (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      'https://zertexkey-2orq.vercel.app'
    ).replace(/\/$/, '');
  }

  getFromAddress() {
    const address = process.env.EMAIL_FROM || 'noreply@arenstore.com';
    if (address.includes('<')) return address;
    const name = process.env.EMAIL_FROM_NAME || 'Aren Store';
    return `${name} <${address}>`;
  }

  /* ── core send ──────────────────────────────────────────────────────────── */
  async send({ to, subject, html }) {
    // Prefer Resend when configured; keep SMTP as a fallback for local/dev setups.
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.getFromAddress(),
          to: [to],
          subject,
          html
        })
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Resend email failed (${response.status}): ${details}`);
      }
      return;
    }

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('SMTP email configuration is incomplete (EMAIL_HOST, EMAIL_USER and EMAIL_PASS are required)');
    }

    try {
      await this.transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        html
      });
    } catch (error) {
      // Keep the original SMTP properties in the server log; callers receive a
      // stable error while the controller can still report the useful code.
      error.message = `SMTP invitation delivery failed: ${error.message}`;
      throw error;
    }
  }

  /* ── helper: fetch email settings (cached loosely) ─────────────────────── */
  async getEmailSettings() {
    try {
      const settings = await Settings.findOne().select('emailNotifications').lean();
      return {
        orderConfirmation: settings?.emailNotifications?.orderConfirmation ?? true,
        welcomeEmail:      settings?.emailNotifications?.welcomeEmail      ?? true,
        lowStockAlert:     settings?.emailNotifications?.lowStockAlert     ?? true,
        adminNewOrder:     settings?.emailNotifications?.adminNewOrder     ?? false,
      };
    } catch {
      // fallback: all on
      return { orderConfirmation: true, welcomeEmail: true, lowStockAlert: true, adminNewOrder: false };
    }
  }

  /* ── 1. Welcome email ──────────────────────────────────────────────────── */
  async sendWelcomeEmail(user) {
    const cfg = await this.getEmailSettings();
    if (!cfg.welcomeEmail) return;
    const frontendUrl = this.getFrontendUrl();

    await this.send({
      to:      user.email,
      subject: 'Welcome to Aren Store!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;font-size:28px;margin:0;">Aren Store</h1>
          </div>
          <h2 style="color:#fff;">Welcome, ${user.name}! 🎉</h2>
          <p style="color:#a0a0b8;line-height:1.6;">
            Your account has been created successfully. You now have access to thousands of digital products including game codes, gift cards, and e-books.
          </p>
          <div style="background:#1a1a2e;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #6366f1;">
            <p style="margin:0;color:#a0a0b8;">Account Email: <strong style="color:#fff;">${user.email}</strong></p>
          </div>
          <a href="${frontendUrl}/products" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Start Shopping →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">© 2024 Aren Store. All rights reserved.</p>
        </div>
      `
    });
  }

  /* ── 2. Order confirmation to customer ─────────────────────────────────── */
  async sendOrderConfirmation(user, order) {
    const cfg = await this.getEmailSettings();
    if (!cfg.orderConfirmation) return;
    const frontendUrl = this.getFrontendUrl();

    const codesHtml = order.items.map(item => {
      const codes = item.codes.map(c => `
        <div style="background:#0f0f1a;border:1px solid #333;border-radius:6px;padding:12px;margin:8px 0;font-family:monospace;font-size:16px;color:#6366f1;letter-spacing:2px;text-align:center;">
          ${c.code || c}
        </div>
      `).join('');

      return `
        <div style="margin-bottom:20px;">
          <h3 style="color:#fff;margin-bottom:8px;">${item.name} × ${item.quantity}</h3>
          <p style="color:#a0a0b8;margin:0 0 8px;">Your activation code(s):</p>
          ${codes}
        </div>
      `;
    }).join('');

    await this.send({
      to:      user.email,
      subject: `✅ Order Confirmed - ${order.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;font-size:28px;margin:0;">Aren Store</h1>
          </div>
          <div style="background:#1a2a1a;border:1px solid #22c55e;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <p style="color:#22c55e;font-size:18px;margin:0;">✅ Payment Successful!</p>
          </div>
          <h2 style="color:#fff;">Hi ${user.name}, here are your codes!</h2>
          <p style="color:#a0a0b8;">Order #: <strong style="color:#6366f1;">${order.orderNumber}</strong></p>
          <p style="color:#a0a0b8;">Total: <strong style="color:#fff;">$${order.totalAmount.toFixed(2)}</strong></p>
          <div style="border-top:1px solid #333;margin:20px 0;padding-top:20px;">
            ${codesHtml}
          </div>
          <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="color:#a0a0b8;margin:0;font-size:14px;">⚠️ Keep these codes safe. Each code can only be used once.</p>
          </div>
          <a href="${frontendUrl}/orders/${order._id}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            View Order Details →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">© 2024 Aren Store. All rights reserved.</p>
        </div>
      `
    });
  }

  /* ── 3. Admin new order alert ───────────────────────────────────────────── */
  async sendAdminNewOrderAlert(order, user) {
    const cfg = await this.getEmailSettings();
    if (!cfg.adminNewOrder) return;
    const frontendUrl = this.getFrontendUrl();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    await this.send({
      to:      adminEmail,
      subject: `🛒 New Order #${order.orderNumber} — $${order.totalAmount?.toFixed(2)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#6366f1;font-size:24px;margin-bottom:4px;">Aren Store</h1>
          <p style="color:#71717a;font-size:12px;margin-bottom:30px;">Admin Notification</p>
          <div style="background:#1a2a1a;border:1px solid #22c55e;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="color:#22c55e;font-size:16px;margin:0;font-weight:bold;">🛒 New Order Received</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#71717a;padding:8px 0;">Order</td><td style="color:#fff;font-weight:bold;">#${order.orderNumber}</td></tr>
            <tr><td style="color:#71717a;padding:8px 0;">Customer</td><td style="color:#fff;">${user?.name || 'Unknown'} (${user?.email || '—'})</td></tr>
            <tr><td style="color:#71717a;padding:8px 0;">Amount</td><td style="color:#22c55e;font-weight:bold;font-size:18px;">$${order.totalAmount?.toFixed(2)}</td></tr>
            <tr><td style="color:#71717a;padding:8px 0;">Items</td><td style="color:#fff;">${order.items?.length || 0} item(s)</td></tr>
          </table>
          <a href="${frontendUrl}/admin/orders" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Review Order →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">This is an automated alert. © 2024 Aren Store.</p>
        </div>
      `
    });
  }

  /* ── 4. Low stock alert to admin ───────────────────────────────────────── */
  async sendLowStockAlert(products) {
    const cfg = await this.getEmailSettings();
    if (!cfg.lowStockAlert) return;
    const frontendUrl = this.getFrontendUrl();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || !products?.length) return;

    const rows = products.map(p => `
      <tr>
        <td style="color:#fff;padding:10px 0;border-bottom:1px solid #222;">${p.name}</td>
        <td style="padding:10px;border-bottom:1px solid #222;text-align:right;">
          <span style="background:${p.stock === 0 ? '#7f1d1d' : '#78350f'};color:${p.stock === 0 ? '#fca5a5' : '#fcd34d'};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">
            ${p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
          </span>
        </td>
      </tr>
    `).join('');

    await this.send({
      to:      adminEmail,
      subject: `⚠️ Low Stock Alert — ${products.length} product(s) need attention`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#6366f1;font-size:24px;margin-bottom:4px;">Aren Store</h1>
          <p style="color:#71717a;font-size:12px;margin-bottom:30px;">Inventory Alert</p>
          <div style="background:#2a1a1a;border:1px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="color:#ef4444;font-size:16px;margin:0;font-weight:bold;">⚠️ Low Stock Warning</p>
          </div>
          <p style="color:#a0a0b8;">The following products are running low or out of stock:</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            ${rows}
          </table>
          <a href="${frontendUrl}/admin/products" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Manage Inventory →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">This is an automated alert. © 2026 Aren Store.</p>
        </div>
      `
    });
  }

  /* ── 5. Password Reset Email ───────────────────────────────────────────── */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${this.getFrontendUrl()}/reset-password/${resetToken}`;

    await this.send({
      to:      user.email,
      subject: '🔒 Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;font-size:28px;margin:0;">Aren Store</h1>
          </div>
          <h2 style="color:#fff;">Password Reset Request</h2>
          <p style="color:#a0a0b8;line-height:1.6;">
            We received a request to reset the password for your Aren Store account associated with this email address. 
            If you made this request, please click the button below to reset your password. This link is valid for 10 minutes.
          </p>
          <div style="text-align:center; margin: 30px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
              Reset Password
            </a>
          </div>
          <p style="color:#a0a0b8;font-size:14px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <span style="color:#6366f1;word-break:break-all;">${resetUrl}</span>
          </p>
          <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="color:#a0a0b8;margin:0;font-size:14px;">⚠️ If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <p style="color:#666;font-size:12px;margin-top:30px;">© 2024 Aren Store. All rights reserved.</p>
        </div>
      `
    });
  }

  async sendEmployeeInvitation(user, password) {
    const frontendUrl = this.getFrontendUrl();
    await this.send({
      to: user.email,
      subject: 'Your Aren Store employee account',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#6366f1;font-size:28px;margin:0 0 24px;">Aren Store</h1>
          <h2>Welcome to the team, ${user.name}!</h2>
          <p style="color:#a0a0b8;line-height:1.6;">An employee account has been created for you.</p>
          <div style="background:#1a1a2e;border-radius:8px;padding:20px;margin:20px 0;line-height:2;">
            <div>Email: <strong>${user.email}</strong></div>
            <div>Role: <strong>${user.role}</strong></div>
            <div>Temporary password: <strong style="font-family:monospace;color:#a78bfa;">${password}</strong></div>
          </div>
          <p style="color:#fbbf24;">Please change this temporary password after your first login.</p>
          <a href="${frontendUrl}/login" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Login to Aren Store</a>
        </div>
      `
    });
  }
}

module.exports = new EmailService();
