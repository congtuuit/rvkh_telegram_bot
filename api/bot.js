export default async function handler(req, res) {
  const body = req.body;

  if (!body?.message?.text) {
    return res.status(200).send("ok");
  }

  const chatId = body.message.chat.id;
  const text = body.message.text.trim();

  const apiDomain = process.env.API_DOMAIN;
  const proxyUrl = process.env.PROXY_URL; // <-- thêm cái này
  const apiUsername = process.env.API_USERNAME;
  const apiPassword = process.env.API_PASSWORD;
  const apiSecret = process.env.API_SECRET;

  const basicAuth = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');

  const commonHeaders = {
    "Authorization": `Basic ${basicAuth}`,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    ...(apiSecret && { "X-RVKH-Secret": apiSecret })
  };

  let reply = "Sai cú pháp";

  // =========================
  // 🔥 Helper gọi API (có proxy)
  // =========================
  async function callAPI(url, method = "GET") {
    try {
      let apiRes;

      if (proxyUrl) {
        // dùng proxy (Cloudflare Worker)
        if (method === "GET") {
          apiRes = await fetch(
            `${proxyUrl}?url=${encodeURIComponent(url)}`,
            { headers: commonHeaders }
          );
        } else {
          apiRes = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_url: url,
              headers: commonHeaders
            })
          });
        }
      } else {
        // gọi trực tiếp (local)
        apiRes = await fetch(url, {
          method,
          headers: commonHeaders
        });
      }

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        console.error(`API Error ${apiRes.status}:`, errorText.substring(0, 500));
        throw new Error(`HTTP ${apiRes.status}`);
      }

      const text = await apiRes.text();

      // detect Cloudflare HTML
      if (text.includes("<title>Just a moment")) {
        throw new Error("Bị Cloudflare chặn (403)");
      }

      return JSON.parse(text);

    } catch (err) {
      console.error("API Error details:", err);
      throw err;
    }
  }

  try {
    const parts = text.split(" ");
    const command = parts[0];
    const id = parts[1];

    // =========================
    // /user
    // =========================
    if (command === "/user") {
      if (!id) {
        reply = "❌ Vui lòng nhập ID. Ví dụ: /user 123";
      } else {
        const data = await callAPI(`${apiDomain}/user?target=${id}`);

        if (data?.id) {
          reply =
            `👤 User Info:\n` +
            `- ID: ${data.id}\n` +
            `- Email: ${data.email}\n` +
            `- Status: ${data.status === 'locked' ? '🔒 Locked' : '✅ Active'}`;
        } else {
          reply = `❌ Không tìm thấy user ${id}`;
        }
      }
    }

    // =========================
    // /lock
    // =========================
    else if (command === "/lock") {
      if (!id) {
        reply = "❌ Vui lòng nhập ID. Ví dụ: /lock 123";
      } else {
        const data = await callAPI(
          `${apiDomain}/user?target=${id}&action=lock`,
          "POST"
        );

        reply = data?.success
          ? `🔒 Đã khóa user ${id}`
          : `❌ Lỗi: ${data?.message || "Unknown"}`;
      }
    }

    // =========================
    // /unlock
    // =========================
    else if (command === "/unlock") {
      if (!id) {
        reply = "❌ Vui lòng nhập ID. Ví dụ: /unlock 123";
      } else {
        const data = await callAPI(
          `${apiDomain}/user?target=${id}&action=unlock`,
          "POST"
        );

        reply = data?.success
          ? `🔓 Đã mở khóa user ${id}`
          : `❌ Lỗi: ${data?.message || "Unknown"}`;
      }
    }

  } catch (err) {
    reply = `❌ Lỗi: ${err.message || "Không xác định"}`;
  }

  // =========================
  // 📤 gửi lại Telegram
  // =========================
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