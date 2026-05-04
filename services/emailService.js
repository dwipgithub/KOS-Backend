import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (
    to,
    subject,
    html,
    attachments = [] // 🔥 tambahan (optional)
) => {
    try {
        const mailOptions = {
            from: `"Sistem Kos" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        // kalau ada lampiran
        if (attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email terkirim:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Gagal kirim email:", error);
        throw error;
    }
};