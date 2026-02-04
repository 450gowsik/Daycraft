/**
 * Email Service for notifications
 * 
 * Uses Nodemailer for sending emails
 * Configure EMAIL_USER and EMAIL_PASS in .env for production
 */

const nodemailer = require('nodemailer')

// Create transporter (configure in production)
const createTransporter = () => {
    // For development/testing without credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('[Email] No email credentials configured. Emails will be logged only.')
        return null
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
}

let transporter = null

// Initialize transporter on first use
const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter()
    }
    return transporter
}

// Send email (logs if no credentials)
const sendEmail = async (to, subject, html) => {
    const transport = getTransporter()

    if (!transport) {
        // Mock mode - just log
        console.log('\n==================================')
        console.log(`📧 [EMAIL] To: ${to}`)
        console.log(`   Subject: ${subject}`)
        console.log(`   Body: ${html.substring(0, 100)}...`)
        console.log('==================================\n')
        return { success: true, message: 'Email logged (mock mode)' }
    }

    try {
        await transport.sendMail({
            from: `DayCraft <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        })
        return { success: true, message: 'Email sent successfully' }
    } catch (error) {
        console.error('[Email] Error sending email:', error.message)
        return { success: false, message: error.message }
    }
}

// Send job notification to worker
exports.sendJobNotification = async (email, job, workerName) => {
    const subject = `🔔 New ${job.category} job near you - ₹${job.wage}/day`
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #14a800;">New Job Alert!</h2>
            <p>Hi ${workerName},</p>
            <p>A new job matching your skills is available:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0;">${job.title?.en || job.title}</h3>
                <p style="margin: 5px 0;"><strong>Category:</strong> ${job.category}</p>
                <p style="margin: 5px 0;"><strong>Pay:</strong> ₹${job.wage}/day</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${job.duration}</p>
            </div>
            <a href="https://daycraft.com/jobs/${job._id}" 
               style="background: #14a800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View & Apply
            </a>
            <p style="color: #666; margin-top: 20px; font-size: 12px;">
                You received this because you're registered on DayCraft as a worker.
            </p>
        </div>
    `
    return await sendEmail(email, subject, html)
}

// Helper for highlighted text style
const highlight = (text) => `<span style="background-color: #fff2cc; padding: 2px 5px; border-radius: 2px;">${text}</span>`

// Send account approval email (Welcome) - Startup Style with Features
exports.sendWelcomeEmail = async (email, name, role) => {
    const subject = `Welcome aboard, ${name}! 🎉`

    // Format role for display
    const displayRole = role === 'worker' ? 'Employee' : 'Job Provider'

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Welcome to DayCraft</title>
</head>
<body style="margin:0; padding:0; background:linear-gradient(135deg,#eef2ff,#f0fdf4); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" align="center">
<tr>
<td align="center" style="padding:60px 20px;">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.08); overflow:hidden;">

    <!-- Header -->
    <tr>
        <td style="background:linear-gradient(90deg,#0f172a,#1e293b); padding:30px; text-align:center;">
            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">
                DayCraft Platform
            </h1>
        </td>
    </tr>

    <!-- Body -->
    <tr>
        <td style="padding:50px 45px;">

            <h2 style="margin:0 0 20px 0; font-size:26px; color:#111827; font-weight:700;">
                Welcome aboard, ${name}! 🎉
            </h2>

            <p style="font-size:16px; color:#4b5563; line-height:1.7;">
                Your DayCraft account has been successfully approved and is now fully active as a <strong>${displayRole}</strong>.
            </p>

            <p style="font-size:16px; color:#4b5563; line-height:1.7;">
                <strong>DayCraft</strong> is a smart workforce platform designed to connect skilled workers and employers seamlessly.
                We help users discover local job opportunities, manage work efficiently, and grow their professional network.
            </p>

            <!-- Features Section -->
            <div style="margin:30px 0; padding:20px; background:#f9fafb; border-radius:12px;">
                <p style="margin:8px 0; font-size:15px; color:#374151;">✔ Discover verified job opportunities</p>
                <p style="margin:8px 0; font-size:15px; color:#374151;">✔ Connect directly with employers</p>
                <p style="margin:8px 0; font-size:15px; color:#374151;">✔ Track applications & manage your profile</p>
                <p style="margin:8px 0; font-size:15px; color:#374151;">✔ Secure and transparent hiring process</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center; margin:40px 0;">
                <a href="https://daycraft.com/login"
                   style="background:linear-gradient(90deg,#16a34a,#22c55e);
                          color:#ffffff;
                          padding:16px 36px;
                          border-radius:12px;
                          font-size:16px;
                          font-weight:600;
                          text-decoration:none;
                          display:inline-block;
                          box-shadow:0 10px 20px rgba(34,197,94,0.3);">
                   Access Your Dashboard
                </a>
            </div>

            <p style="font-size:14px; color:#9ca3af;">
                If you did not create this account, please contact our support team immediately.
            </p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="background:#f9fafb; padding:25px; text-align:center;">
            <p style="margin:0; font-size:13px; color:#9ca3af;">
                © 2026 DayCraft Inc. All rights reserved.
            </p>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `
    return await sendEmail(email, subject, html)
}

// Send login notification - Startup Style
exports.sendLoginNotification = async (email, name) => {
    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const subject = `New Login Detected 🛡️`

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Login Alert</title>
</head>
<body style="margin:0; padding:0; background:linear-gradient(135deg,#eef2ff,#f0fdf4); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" align="center">
<tr>
<td align="center" style="padding:60px 20px;">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.08); overflow:hidden;">

    <!-- Gradient Header -->
    <tr>
        <td style="background:linear-gradient(90deg,#0f172a,#1e293b); padding:30px; text-align:center;">
            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600; letter-spacing:0.5px;">
                DayCraft
            </h1>
        </td>
    </tr>

    <!-- Body -->
    <tr>
        <td style="padding:50px 45px;">

            <h2 style="margin:0 0 20px 0; font-size:26px; color:#111827; font-weight:700;">
                New Login Detected 🛡️
            </h2>

            <p style="font-size:16px; color:#4b5563; line-height:1.7; margin-bottom:20px;">
                Hi ${name},
            </p>

            <p style="font-size:16px; color:#4b5563; line-height:1.7;">
                We noticed a new login to your DayCraft account.
            </p>

            <!-- Info Box -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:25px 0;">
                <p style="margin:5px 0; font-size:15px; color:#334155;"><strong>Time:</strong> ${time}</p>
                <p style="margin:5px 0; font-size:15px; color:#334155;"><strong>Status:</strong> Successful</p>
                <p style="margin:5px 0; font-size:15px; color:#334155;"><strong>Device:</strong> New Session</p>
            </div>

            <p style="font-size:16px; color:#4b5563; line-height:1.7;">
                If this was you, you can safely ignore this email.
            </p>

            <!-- CTA -->
             <div style="text-align:center; margin:40px 0;">
                <a href="https://daycraft.com/account"
                   style="background:linear-gradient(90deg,#3b82f6,#2563eb);
                          color:#ffffff;
                          padding:16px 36px;
                          border-radius:12px;
                          font-size:16px;
                          font-weight:600;
                          text-decoration:none;
                          display:inline-block;
                          box-shadow:0 10px 20px rgba(37,99,235,0.3);">
                   View Account Activity
                </a>
            </div>

            <!-- Divider -->
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;">

            <p style="font-size:14px; color:#9ca3af; line-height:1.6;">
                If you did not authorize this login, please change your password immediately.
            </p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="background:#f9fafb; padding:25px; text-align:center;">
            <p style="margin:0; font-size:13px; color:#9ca3af;">
                © 2026 DayCraft Inc. All rights reserved.
            </p>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `
    return await sendEmail(email, subject, html)
}

// Send OTP via email (for email verification)
exports.sendOTPEmail = async (email, otp, name) => {
    const subject = `Your DayCraft verification code: ${otp}`
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #14a800;">Verify Your Email</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 15px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #14a800;">${otp}</span>
            </div>
            <p>This code will expire in 5 minutes.</p>
        </div>
    `
    return await sendEmail(email, subject, html)
}

// Notify nearby workers about new job
exports.notifyNearbyWorkers = async (workers, job) => {
    const results = []
    for (const worker of workers) {
        if (worker.email) {
            const result = await exports.sendJobNotification(worker.email, job, worker.name)
            results.push({ workerId: worker._id, ...result })
        }
    }
    return results
}
