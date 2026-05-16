const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password — not normal password
  },
});

const sendPasswordResetEmail = async (toEmail, resetURL) => {
  await transporter.sendMail({
    from: `"StudyMate AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetURL}" 
           style="background:#4F46E5;color:white;padding:12px 24px;
                  border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px;margin-top:16px;">
          This link will expire in 10 minutes.<br/>
          If you did not request this, please ignore it.
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
