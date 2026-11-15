# Website tri ân thầy cô 20/11

Website cho phép nhiều thiết bị truy cập cùng một đường link, gửi lời chúc và xem các lời chúc tạo thành hình trái tim. Dữ liệu được lưu trên máy chủ trong `messages.json`.

## Chạy thử trên máy tính

Cần cài Node.js 18 trở lên.

```bash
npm install
npm start
```

Mở http://localhost:3000 để xem. Để thử trên điện thoại cùng Wi-Fi, dùng địa chỉ LAN của máy tính, ví dụ `http://192.168.1.10:3000` (thay bằng IP thật).

## Đưa lên Internet để tạo QR dùng chung

1. Tạo một repository GitHub và tải toàn bộ thư mục này lên.
2. Tạo một dịch vụ web Node trên nền tảng hosting có hỗ trợ Node.js (ví dụ Render).
3. Chọn lệnh cài đặt `npm install`, lệnh chạy `npm start`.
4. Đặt biến môi trường `ADMIN_PIN` thành mã riêng do bạn tự chọn.
5. Bật ổ đĩa lưu trữ bền vững (persistent disk) và đặt `DATA_DIR` thành thư mục mount của ổ đĩa. Nếu không có ổ đĩa bền vững, dữ liệu JSON có thể mất khi dịch vụ khởi động lại hoặc triển khai phiên bản mới.
6. Sau khi deploy, mở URL công khai. Mã QR trên trang sẽ tự sinh từ URL đó. Chia sẻ QR/link này cho các lớp và thầy cô.

## Lưu ý

- Không thể tạo một URL Internet công khai chỉ từ máy tính cá nhân nếu chưa triển khai lên máy chủ/hosting.
- Mã quản trị mặc định trong mã nguồn là `2011`; hãy đặt `ADMIN_PIN` riêng trước khi chia sẻ công khai.
- Trang có khu vực quản trị để ẩn lời chúc không phù hợp.
- Bản mẫu giới hạn 500 lời chúc; mỗi tên tối đa 32 ký tự và lời chúc tối đa 180 ký tự.
- QR dùng thư viện QRCode.js từ CDN, nên trình duyệt cần Internet để tải thư viện này.
