const sendTelegramMessage = async (text) => {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
    }

    const res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    if (!data.ok) {
        throw new Error(`Telegram error: ${data.description ?? JSON.stringify(data)}`);
    }
};

class SupportController {
    async send(req, res, next) {
        try {
            const { name, message, phone } = req.body;
            if (!name?.trim() || !message?.trim()) {
                return res.status(400).json({ message: 'Імʼя та повідомлення обовʼязкові' });
            }

            const lines = [
                '💬 <b>Нове повідомлення підтримки</b>',
                '',
                `👤 <b>Імʼя:</b> ${name.trim()}`,
            ];
            if (phone?.trim()) lines.push(`📞 <b>Телефон:</b> ${phone.trim()}`);
            lines.push('');
            lines.push(`📝 <b>Повідомлення:</b>`);
            lines.push(message.trim());
            lines.push('');
            lines.push(`🕐 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);

            await sendTelegramMessage(lines.join('\n'));

            res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }
}

module.exports = new SupportController();
