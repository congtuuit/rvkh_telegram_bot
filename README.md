# RVKH Telegram Bot

Bot Telegram để quản lý người dùng thông qua API webhook.

## 🚀 Hướng dấn Setup

### 1. Tạo Bot Telegram
1. Mở Telegram, tìm kiếm `@BotFather`.
2. Gửi lệnh `/newbot`, sau đó đặt tên cho bot.
3. Nhận **API Token** (`BOT_TOKEN`).

### 2. Thiết lập Biến Môi trường (.env)
Tạo file `.env` (hoặc cấu hình trên nền tảng deploy như Vercel) với các biến sau:
- `BOT_TOKEN`: Token lấy từ BotFather.
- `API_DOMAIN`: Domain REST API WordPress của bạn (ví dụ: `https://your-site.com/wp-json/rvkh/v1`).
- `API_USERNAME`: Username admin WordPress.
- `API_PASSWORD`: **Application Password** (vào User -> Profile -> Application Passwords để tạo).

### 3. Cài đặt phía WordPress
1. Copy code từ file `wordpress-api-snippet.php` dán vào file `functions.php` của theme hoặc tạo plugin mới.
2. Code này sẽ tạo ra các endpoint:
   - `GET /user/{id_or_email}`
   - `POST /lock/{id_or_email}`
   - `POST /unlock/{id_or_email}`
3. Nó cũng bao gồm filter `wp_authenticate_user` để thực sự chặn user nếu bị "locked".

### 4. Cài đặt Webhook
Để Telegram gửi tin nhắn tới bot của bạn, hãy chạy URL sau trên trình duyệt (thay thế bằng token và URL thực của bạn):
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_APP_URL>/api/bot`

Ví dụ: `https://api.telegram.org/bot123:abc/setWebhook?url=https://mybot.vercel.app/api/bot`

## 🛠️ Các lệnh của Bot
- `/user <id>`: Lấy thông tin user bằng ID.
- `/lock <id>`: Khóa tài khoản user.
- `/unlock <id>`: Mở khóa tài khoản user.

## 📦 Công nghệ sử dụng
- Node.js (Serverless Functions)
- Webhook API
- Basic Authentication
