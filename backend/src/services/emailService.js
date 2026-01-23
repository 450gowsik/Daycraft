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

// Send welcome email after registration
exports.sendWelcomeEmail = async (email, name, role) => {
    const subject = `🎉 Welcome to DayCraft, ${name}!`
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #14a800;">Welcome to DayCraft!</h2>
            <p>Hi ${name},</p>
            <p>Your account has been created successfully as a <strong>${role}</strong>.</p>
            ${role === 'worker'
            ? '<p>You can now browse available jobs and apply to opportunities that match your skills.</p>'
            : '<p>You can now post jobs and find skilled workers in your area.</p>'
        }
            <a href="https://daycraft.com/${role === 'worker' ? 'jobs' : 'dashboard'}" 
               style="background: #14a800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
            </a>
            <p style="color: #666; margin-top: 20px;">
                Thank you for joining DayCraft - Connecting daily-wage workers with employers!
            </p>
        </div>
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
            <p style="color: #666; font-size: 12px;">
                If you didn't request this code, please ignore this email.
            </p>
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
