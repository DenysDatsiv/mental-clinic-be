const nodemailer = require('nodemailer');

const LOGO_URL    = `${process.env.FRONTEND_URL}/logo.png`;
const BRAND_DARK  = '#003168';
const BRAND_BLUE  = '#5f75d6';

function createTransport() {
    return nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

function header(title) {
    return `
      <!-- header -->
      <div style="background:${BRAND_DARK};padding:32px 40px;text-align:center;border-radius:12px 12px 0 0">
        <img src="${LOGO_URL}" alt="Логотип"
             style="width:72px;height:72px;border-radius:50%;border:3px solid ${BRAND_BLUE};
                    object-fit:cover;background:#fff;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto" />
        <div style="color:#fff;font-size:15px;font-weight:700;line-height:1.3;margin-bottom:2px">
          Онлайн центр ментального здоров'я
        </div>
        <div style="color:rgba(255,255,255,0.55);font-size:12px">Євгена Скрипника</div>
        <div style="margin-top:20px;background:rgba(255,255,255,0.1);border-radius:8px;
                    padding:10px 20px;display:inline-block">
          <span style="color:#fff;font-size:13px;font-weight:600">${title}</span>
        </div>
      </div>`;
}

function footer() {
    return `
      <!-- footer -->
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;
                  border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6">
          Цей лист надіслано автоматично — не відповідайте на нього.<br/>
          © 2025 Онлайн центр ментального здоров'я Євгена Скрипника
        </p>
      </div>`;
}

function wrapper(content) {
    return `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;border-radius:12px;
              box-shadow:0 4px 24px rgba(0,0,0,0.10);overflow:hidden">
    ${content}
  </div>
</body>
</html>`;
}

async function sendOtpEmail(to, otp) {
    const html = wrapper(`
      ${header('Код входу')}
      <!-- body -->
      <div style="background:#fff;padding:36px 40px">
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">
          Ваш одноразовий код для входу в панель адміністратора:
        </p>
        <div style="margin:28px 0;background:#f0f3ff;border:2px dashed ${BRAND_BLUE};
                    border-radius:14px;padding:24px;text-align:center">
          <span style="font-size:46px;font-weight:800;letter-spacing:14px;
                       color:${BRAND_BLUE};font-family:monospace">${otp}</span>
        </div>
        <div style="background:#fff8ed;border-left:4px solid #f59e0b;border-radius:6px;
                    padding:12px 16px;margin-bottom:8px">
          <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5">
            ⏱ Код дійсний <strong>10 хвилин</strong>.
            Нікому не передавайте його — ми ніколи не запитуємо код у листах або дзвінках.
          </p>
        </div>
      </div>
      ${footer()}
    `);

    await createTransport().sendMail({
        from:    `"Ментальна клініка" <${process.env.SMTP_USER}>`,
        to,
        subject: `Ваш код входу: ${otp}`,
        html,
    });
}

async function sendResetEmail(to, resetUrl) {
    const html = wrapper(`
      ${header('Відновлення паролю')}
      <!-- body -->
      <div style="background:#fff;padding:36px 40px">
        <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">
          Ви отримали цей лист, бо запросили скидання паролю для вашого акаунту.
          Натисніть кнопку нижче, щоб встановити новий пароль.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetUrl}"
             style="display:inline-block;padding:16px 36px;background:${BRAND_BLUE};
                    color:#fff;text-decoration:none;border-radius:10px;font-weight:700;
                    font-size:16px;letter-spacing:0.3px;
                    box-shadow:0 4px 14px rgba(95,117,214,0.4)">
            🔑 Відновити пароль
          </a>
        </div>
        <div style="background:#fff8ed;border-left:4px solid #f59e0b;border-radius:6px;
                    padding:12px 16px">
          <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5">
            ⏱ Посилання дійсне <strong>1 годину</strong>.
            Якщо ви не запитували відновлення — просто проігноруйте цей лист.
            Ваш пароль залишиться незмінним.
          </p>
        </div>
      </div>
      ${footer()}
    `);

    await createTransport().sendMail({
        from:    `"Ментальна клініка" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Відновлення паролю — Ментальна клініка',
        html,
    });
}

module.exports = { sendOtpEmail, sendResetEmail };
