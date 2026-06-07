const nodemailer = require('nodemailer');

function createTransport() {
    return nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

async function sendOtpEmail(to, otp) {
    await createTransport().sendMail({
        from:    `"Ментальна клініка" <${process.env.SMTP_USER}>`,
        to,
        subject: `Код входу: ${otp}`,
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#003168;margin-bottom:8px">Код входу</h2>
              <p style="color:#374151;margin-bottom:24px">
                Ваш одноразовий код для входу в панель адміністратора:
              </p>
              <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#5f75d6;
                          background:#f0f3ff;border-radius:12px;padding:20px;text-align:center;
                          margin-bottom:24px">${otp}</div>
              <p style="color:#6b7280;font-size:13px">
                Код дійсний <strong>10 хвилин</strong>. Нікому не передавайте його.
              </p>
            </div>
        `,
    });
}

async function sendResetEmail(to, resetUrl) {
    await createTransport().sendMail({
        from:    `"Ментальна клініка" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Відновлення паролю',
        html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#003168;margin-bottom:8px">Відновлення паролю</h2>
              <p style="color:#374151;margin-bottom:24px">
                Ви отримали цей лист, бо запросили скидання паролю.
              </p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:14px 28px;background:#5f75d6;color:#fff;
                        text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
                Відновити пароль
              </a>
              <p style="color:#6b7280;font-size:13px;margin-top:24px">
                Посилання дійсне <strong>1 годину</strong>.
                Якщо ви не запитували відновлення — проігноруйте цей лист.
              </p>
            </div>
        `,
    });
}

module.exports = { sendOtpEmail, sendResetEmail };
