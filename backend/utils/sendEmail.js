const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Strip spaces from password (common copy-paste issue with App Passwords)
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: emailPass,
        },
    });

    const mailOptions = {
        from: `House Rental App <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        console.log(`[Email] Attempting to send email to: ${options.email} | Subject: ${options.subject}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Success! Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email] FAILED to send email to ${options.email}:`, error);
        throw error; // Re-throw to handle in controller if needed
    }
};

module.exports = sendEmail;
