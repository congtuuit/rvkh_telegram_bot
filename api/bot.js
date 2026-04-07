export default async function handler(req, res) {
  const body = req.body;

  if (!body || !body.message) {
    return res.status(200).send("ok");
  }

  const chatId = body.message.chat.id;
  const text = body.message.text;

  const apiDomain = process.env.API_DOMAIN;
  const apiUsername = process.env.API_USERNAME;
  const apiPassword = process.env.API_PASSWORD;
  const apiSecret = process.env.API_SECRET; // Optional: To bypass Cloudflare WAF

  const basicAuth = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');
  const commonHeaders = {
    "Authorization": `Basic ${basicAuth}`,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ...(apiSecret && { "X-RVKH-Secret": apiSecret })
  };

  let reply = "Sai cú pháp";

  try {
    // /user 123
    if (text.startsWith("/user")) {
      const id = text.split(" ")[1];

      const apiRes = await fetch(`${apiDomain}/user?target=${id}`, {
        headers: commonHeaders
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        console.error(`API Error ${apiRes.status}:`, errorText.substring(0, 500));
        throw new Error(`HTTP Error ${apiRes.status} from WordPress`);
      }

      const data = await apiRes.json();

      if (data.id) {
        reply = `👤 User Info:\n- ID: ${data.id}\n- Email: ${data.email}\n- Status: ${data.status === 'locked' ? '🔒 Locked' : '✅ Active'}`;
      } else {
        reply = `❌ Không tìm thấy user ${id}`;
      }
    }

    // /lock 123
    else if (text.startsWith("/lock")) {
      const id = text.split(" ")[1];

      const apiRes = await fetch(`${apiDomain}/user?target=${id}&action=lock`, {
        method: "POST",
        headers: commonHeaders
      });

      if (!apiRes.ok) throw new Error(`HTTP Error ${apiRes.status} from WordPress`);
      const data = await apiRes.json();

      reply = data.success ? `🔒 Đã khóa user ${id}` : `❌ Lỗi: ${data.message}`;
    }

    // /unlock 123
    else if (text.startsWith("/unlock")) {
      const id = text.split(" ")[1];

      const apiRes = await fetch(`${apiDomain}/user?target=${id}&action=unlock`, {
        method: "POST",
        headers: commonHeaders
      });

      if (!apiRes.ok) throw new Error(`HTTP Error ${apiRes.status} from WordPress`);
      const data = await apiRes.json();

      reply = data.success ? `🔓 Đã mở khóa user ${id}` : `❌ Lỗi: ${data.message}`;
    }

  } catch (err) {
    console.error("API Error details:", err);
    reply = `❌ Lỗi kết nối API: ${err.message || "Không xác định"}`;
  }

  // gửi lại Telegram
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply
    })
  });

  return res.status(200).send("ok");
}