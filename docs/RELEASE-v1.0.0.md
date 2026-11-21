# Đảo Đèn Lồng v1.0.0

Game3D ba đêm với đom đóm, đèn cạn dầu, Bóng Mực và Gió Lạc. Giữ đủ đèn sáng tới
bình minh; có dash/pad/charm, leaderboardlocal, remap phím và tùy chọn dễ tiếp cận.

## Chơi bản ZIP

Giải nén `dao-den-long-v1.0.0-web.zip`, vào thư mục, chạy:

```bash
node scripts/serve.mjs
```

Mở http://127.0.0.1:4173. Node22+ và WebGL2; không cần cài thư viện để chơi bản prebuilt.
Để build/bench từ source: npmci,npmrunbuild,lệnh trong README. macOS/Linux dùng bản web/Node.

## Kiểm chứng

- 51test,0fail,0skip; cleaninstall/build/headless đã chạy thật trên Windows.
- Benchmark1280×720:101,21FPS,p1low46,89,load1,52s; raw bench.json kèm cấu hình GPU.
- Soak10đêm:0crash,RSS35,90→38,50MB; runtime flags ghi trong README/contract.
- VideoMP4 dưới1phút, gameplay thật với controller tự động được ghi nhãn rõ.
- Giữ các mốc phase-1/2/3; không thay timestamp hay sửa output cũ.

Số đo trên máy hiện tại là tham khảo, không thay bộ test ẩn hoặc máy chấm.
