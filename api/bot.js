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

      const apiRes = await fetch(`${apiDomain}/user/${id}`, {
        headers: commonHeaders
      });
      const data = await apiRes.json();

      reply = `User ${id}: ${JSON.stringify(data)}`;
    }

    // /lock 123
    else if (text.startsWith("/lock")) {
      const id = text.split(" ")[1];

      await fetch(`${apiDomain}/lock/${id}`, {
        method: "POST",
        headers: commonHeaders
      });

      reply = `🔒 Đã khóa user ${id}`;
    }

    // /unlock 123
    else if (text.startsWith("/unlock")) {
      const id = text.split(" ")[1];

      await fetch(`${apiDomain}/unlock/${id}`, {
        method: "POST",
        headers: commonHeaders
      });

      reply = `🔓 Đã mở khóa user ${id}`;
    }

  } catch (err) {
    console.error("API Error:", err);
    reply = "Lỗi gọi API";
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