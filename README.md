# Đảo Đèn Lồng

**Phase 3 — Test Contract v1.2.** Game 3D góc nhìn thứ ba: cùng Mây gom
đom đóm, thắp đèn trên ba hòn đảo và tránh Bóng Mực trước bình minh.

**Demo:** chạy bản chơi theo hướng dẫn dưới. Chưa có video MP4; video và Release
v1.0.0 thuộc bàn giao cuối, sau khi các ticket được phát hành.

Học viên: **Nguyễn Sỹ Huy Kiên · 2A202603641 · K5-L3A**.
Đề Phase 1 đã đọc tại [lab board](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW).
Đã đọc đủ Ticket-02/03/04 sau đăng nhập Claude; đang thực hiện lần lượt.

## Cài và chơi — 3 lệnh

Cần Node.js 22+ và trình duyệt hỗ trợ WebGL trên Windows, macOS hoặc Linux.

```bash
npm ci
npm run build
npm start
```

Mở **http://127.0.0.1:4173**. Bấm **Bắt đầu đêm 1**. Sau khi cài và build,
game dùng thư viện/asset local, không cần CDN hoặc tài khoản. Không mở index.html bằng file://.
Thư mục `dist/` có thể phục vụ bằng một HTTP static server khác.

| Phím | Hành động |
|---|---|
| WASD hoặc phím mũi tên | Di chuyển theo camera |
| Space | Nhảy |
| Shift | Lướt |
| E | Nạp đom đóm vào đèn gần nhất |
| F | Tỏa sáng, tốn 3 đom đóm |
| Q / C hoặc kéo chuột | Xoay camera |
| P / Esc | Tạm dừng / tiếp tục |
| H hoặc nút ? | Hướng dẫn |

Nhặt đom đóm trong XZ 1 m và chênh cao <=1,5 m; túi chứa 10 con. Mỗi đèn cần 10 con,
nạp nhiều lần. Đèn sáng có vùng an toàn 6 m. Pulse 3D 5 m, stun 120 tick và đẩy 4 m.
Thắp hết đèn thì thắng; hết 3 ngọn lửa hoặc hết giờ thì thua. Rơi khỏi đảo mất một lửa
và toàn bộ đom đóm, hồi sinh sau 60 tick. Đêm 1/2/3 có 5/6/7 đèn và 300/330/360 giây.

## Giữ đảo sáng tới bình minh

Đèn có 100 dầu, hao1/s, có thể châm 10 dầu/đom đóm. Dầu<30 mất vùng an toàn;
Bóng Mực wander có thể hút thêm5/s. Đèn hết dầu tắt, thắp lại cần5 đom đóm.
Thắp thành công tăng sức chứa thêm2, tối đa20. Không thắng sớm: hết giờ cần còn sống
và có ít nhất3/5,4/6,5/7 đèn sáng. Thời lượng mới240/270/300 giây.

## Điểm số

- Mỗi đom đóm nạp/châm: +5; thắp lần đầu +100, thắp lại +40. Nhặt không cộng điểm.
- Mỗi Bóng Mực trúng pulse: +5 tổng; +15 tổng nếu nó đang hút dầu.
- Khi thắng: mỗi đèn sáng +50+floor(dầu), mỗi lửa còn lại +50; không thưởng thời gian.
- Dựng scenario không cộng điểm và không phát event.

Tất cả tuning dùng thật nằm trong [game.contract.json](game.contract.json).
Giả định và thứ tự xử lý được ghi ở [ghi chú Phase 1](docs/notes/phase-1.md).

## Test và kiểm chứng

```bash
npm test
npm run verify
npm run smoke:clean
```

`verify` chạy test, build, các scenario tính năng, so replay từng byte và chạy đủ thời lượng
ba đêm. Sai bất cứ bước nào trả mã khác 0. Bằng chứng phase hiện tại ở
[docs/proof/phase-3](docs/proof/phase-3/), gồm report/hash, TAP, scenario, input và JSONL.
Lượt thắng thế giới mặc định của Phase 1 giữ nguyên ở docs/proof/phase-1 và tag phase-1.
`smoke:clean` cài lại từ cache npm trong thư mục tạm trống, build và chạy headless;
cần đã chạy `npm ci` ít nhất một lần để có cache, không cần tải mạng thêm.

Đã cấu hình GitHub Actions trên Ubuntu và macOS; trạng thái CI chỉ được xác nhận
khi workflow thực sự chạy. Số đo local hiện lấy trên Windows, không thay thế test ẩn.

## Headless — Test Contract v1.2

CLI chỉ cần Node.js; không khởi tạo Three.js, cửa sổ hoặc GPU.

```bash
node src/cli.mjs --seed 12 --night 1 --ticks 600 --out out.jsonl
node src/cli.mjs --seed 12 --night 1 --scenario tests/scenarios/collect-deposit.json --inputs tests/scenarios/collect-deposit-inputs.json --ticks 20 --out collect.jsonl --snapshot-every 10
```

Các cờ: `--seed`, `--night 1|2|3`, `--scenario` (tùy chọn), `--inputs` (tùy chọn),
`--ticks`, `--out`, `--snapshot-every` (mặc định 10). Logic cố định 60 Hz;
snapshot tick 0 trước input, bước input k tạo trạng thái/event k+1.
Không có input thì đứng yên; field vắng mặt giữ giá trị cũ; nút chỉ kích hoạt
khi false → true. Tọa độ làm tròn 3 chữ số. Dòng cuối luôn là `end`.

Chạy đủ ticks hoặc đến thắng/thua thì thoát 0. JSON/schema input hoặc scenario
không hợp lệ trả 2 và thông báo ra stderr. Lỗi ghi file do quyền/dung lượng trả 1.
Seed âm được chấp nhận; PRNG dùng 32 bit của seed. Không có dashboard hay debug log
trộn vào JSONL. Snapshot có thêm danh sách `motes` như khuyến nghị contract.

## Sáng tạo của tôi

Đảo giữa biển mây, căn nhà của người giữ đèn, vòng đường nhỏ nối các đèn;
minimap, âm thanh sine tùy chọn, đom đóm nhấp nháy và vòng sáng lan khi pulse.
Hình học/âm thanh tạo bằng code. Trang trí không thêm thực thể gameplay,
không dùng RNG simulation, nên không thay đổi đầu ra headless.

## Hồ sơ SDLC và bàn giao

- [AGENTS.md](AGENTS.md): hướng dẫn và lệnh cho agent.
- [Kế hoạch, giả định, tiêu chí nghiệm thu](docs/notes/phase-1.md).
- [Nhật ký AI, lỗi phát hiện, ước tính token và retro](docs/notes/ai-log-and-retro.md).
- [Bằng chứng, giới hạn và truy vết](docs/proof/phase-1/README.md).
- [CHANGELOG](CHANGELOG.md), [CREDITS](CREDITS.md), [LICENSE](LICENSE).
- [README đề lab gốc](docs/lab/README.md), [GUIDE](GUIDE.md), [RULES](RULES.md),
  [CHECKPOINTS](CHECKPOINTS.md), [RUBRIC](RUBRIC.md), [SUBMISSION](SUBMISSION.md).

Phase 4 và Release/video còn đang triển khai. Không sửa tag cũ hoặc ghi đạt
cho số đo chưa thực hiện. Ghi chú hiện hành: docs/notes/phase-3-adr.md.
