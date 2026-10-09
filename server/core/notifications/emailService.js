const nodemailer = require('nodemailer');
const config = require('../../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function layout(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#090711;color:#f5effa;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 22px"><div style="padding:24px;border:1px solid #3a2949;border-radius:18px;background:#151022"><div style="color:#e6a8ff;font-size:12px;letter-spacing:2px;text-transform:uppercase">CampusFix</div><h1 style="margin:14px 0 20px;font-size:25px;color:#fff">${escapeHtml(title)}</h1>${body}</div><p style="margin:18px 4px;color:#9c8daa;font-size:12px">This is an automated CampusFix notification. Please do not reply to this email.</p></div></body></html>`;
}

function paragraph(text) {
  return `<p style="color:#d7cadf;font-size:15px;line-height:1.65">${escapeHtml(text)}</p>`;
}

async function sendEmail({ to, subject, title, text, details = [] }) {
  if (!to) return { sent: false, skipped: true, reason: 'missing-recipient' };
  const mailer = getTransporter();
  if (!mailer) return { sent: false, skipped: true, reason: 'email-not-configured' };
  const rows = details.map(({ label, value }) => `<tr><td style="padding:9px 0;color:#a996b4;font-size:12px">${escapeHtml(label)}</td><td style="padding:9px 0;color:#fff;font-size:13px;text-align:right">${escapeHtml(value)}</td></tr>`).join('');
  const body = `${paragraph(text)}${rows ? `<table style="width:100%;margin-top:18px;border-top:1px solid #3a2949;border-bottom:1px solid #3a2949">${rows}</table>` : ''}`;
  void mailer.sendMail({ from: `CampusFix <${config.GMAIL_USER}>`, to, subject, text, html: layout(title, body) })
    .then(() => console.log('Email queued successfully:', to))
    .catch((error) => console.error('Email delivery failed:', error.message));
  return { sent: false, queued: true };
}

async function sendRegistrationEmail(user) {
  return sendEmail({
    to: user?.email,
    subject: 'Your CampusFix account is ready',
    title: 'Welcome to CampusFix',
    text: `Hi ${user?.name || 'there'}, your CampusFix account has been created successfully.`,
    details: [{ label: 'Account email', value: user?.email }, { label: 'Role', value: user?.role || 'student' }],
  });
}

async function sendLoginEmail(user) {
  return sendEmail({
    to: user?.email,
    subject: 'New CampusFix login',
    title: 'New login detected',
    text: `Hi ${user?.name || 'there'}, your CampusFix account was just used to sign in. If this was not you, change your password and contact an administrator.`,
    details: [{ label: 'Account', value: user?.email }, { label: 'Time', value: new Date().toLocaleString() }],
  });
}

async function sendComplaintUpdateEmail(user, complaint, title, message) {
  return sendEmail({
    to: user?.email,
    subject: `CampusFix update: ${complaint?.title || 'your report'}`,
    title,
    text: message,
    details: [
      { label: 'Report', value: complaint?.title || 'Campus issue' },
      { label: 'Status', value: complaint?.status || 'Updated' },
      { label: 'Location', value: complaint?.location || 'Not specified' },
    ],
  });
}

module.exports = { sendEmail, sendRegistrationEmail, sendLoginEmail, sendComplaintUpdateEmail };
