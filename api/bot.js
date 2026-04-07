export default async function handler(req, res) {
  const body = req.body;

  if (!body.message) {
    return res.status(200).send("ok");
  }

  const chatId = body.message.chat.id;
  const text = body.message.text;

  const apiDomain = process.env.API_DOMAIN;
  const apiUsername = process.env.API_USERNAME;
  const apiPassword = process.env.API_PASSWORD;

  const basicAuth = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');
  const commonHeaders = {
    "Authorization": `Basic ${basicAuth}`,
    "Content-Type": "application/json"
  };

  let reply = "Sai cú pháp";

  try {
    // /user 123
    if (text.startsWith("/user")) {
      const id = text.split(" ")[1];

      const apiRes = await fetch(`${apiDomain}/user?target=${id}`, {
        headers: commonHeaders
      });
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
      const data = await apiRes.json();

      reply = data.success ? `🔓 Đã mở khóa user ${id}` : `❌ Lỗi: ${data.message}`;
    }

  } catch (err) {
    console.error("API Error:", err);
    reply = "Lỗi kết nối API";
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