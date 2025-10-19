// Custom Email Templates for Talk to My Lawyer
// These templates have been converted to HTML files and configured in supabase/config.toml
//
// ✅ COMPLETED SETUP:
// - supabase/templates/confirmation.html
// - supabase/templates/recovery.html
// - supabase/templates/invite.html
// - supabase/templates/email_change.html
//
// See EMAIL_TEMPLATES_SETUP_GUIDE.md for deployment instructions

export const EMAIL_TEMPLATES = {
  // Email Confirmation Template
  CONFIRM_SIGNUP: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Talk to My Lawyer</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { color: #e2e8f0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-text { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .description { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .cta-button:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        .features { margin: 30px 0; }
        .feature-item { display: flex; align-items: center; margin: 15px 0; }
        .feature-icon { width: 24px; height: 24px; background: #667eea; border-radius: 50%; color: white; text-align: center; line-height: 24px; margin-right: 15px; }
        .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚖️ Talk to My Lawyer</div>
            <div class="header-subtitle">Professional Legal Communication Made Simple</div>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">Welcome to Talk to My Lawyer!</h1>

            <p class="description">
                Thank you for joining TalkToMyLawyer.com, the premier platform for creating professional legal correspondence with AI assistance. You're now part of a community that's revolutionizing legal communication and making it more accessible to everyone.
            </p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Confirm Your Email Address
                </a>
            </div>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div>AI-powered letter generation with multiple templates</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <div>Instant professional formatting and legal language</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📄</div>
                    <div>PDF export and email delivery options</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🔒</div>
                    <div>Secure and confidential document handling</div>
                </div>
            </div>
            
            <p class="description">
                Once you confirm your email, you'll have access to our full suite of legal letter templates and AI-powered generation tools.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                If you didn't create this account, you can safely ignore this email.<br>
                © 2024 Talk to My Lawyer. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `,

  // Password Reset Template
  RESET_PASSWORD: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Talk to My Lawyer</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { color: #e2e8f0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .reset-text { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .description { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .security-note { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .security-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; }
        .security-text { color: #7f1d1d; font-size: 14px; }
        .footer { background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚖️ Talk to My Lawyer</div>
            <div class="header-subtitle">Secure Password Reset</div>
        </div>
        
        <div class="content">
            <h1 class="reset-text">Reset Your Password</h1>
            
            <p class="description">
                We received a request to reset the password for your TalkToMyLawyer.com account. If you made this request, click the button below to set a new password.
            </p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Reset Password
                </a>
            </div>
            
            <div class="security-note">
                <div class="security-title">🔐 Security Notice</div>
                <div class="security-text">
                    This password reset link will expire in 60 minutes for your security. If you didn't request this reset, please ignore this email and your password will remain unchanged.
                </div>
            </div>
            
            <p class="description">
                For your security, this link will only work once. If you need to reset your password again, please request a new reset email.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
                <span style="word-break: break-all; color: #4a5568;">{{ .ConfirmationURL }}</span>
            </p>
            <p class="footer-text">
                © 2024 Talk to My Lawyer. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `,
};

// SMTP Configuration Guide
export const SMTP_CONFIG_GUIDE = `
To setup custom email sending from your domain:

1. Go to Supabase Dashboard → Project Settings → Auth → SMTP Settings

2. Configure your email provider:

For Gmail/Google Workspace:
- Host: smtp.gmail.com
- Port: 587
- Username: your-email@yourdomain.com
- Password: Your app-specific password
- Sender Name: Talk to My Lawyer
- Sender Email: noreply@yourdomain.com

For SendGrid:
- Host: smtp.sendgrid.net
- Port: 587
- Username: apikey
- Password: Your SendGrid API key
- Sender Name: Talk to My Lawyer
- Sender Email: noreply@yourdomain.com

3. Upload the custom templates above to:
   - Auth → Email Templates → Confirm signup
   - Auth → Email Templates → Reset password

4. Test the configuration with a test signup
`;
