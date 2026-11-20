# Kiểm chứng Phase 2

`npm run verify` ở tag phase-2 tái tạo TAP, scenario/input và JSONL cho dash,
charm, drifter steal/drop, pause, jump pad, fall, wind, win và 3 đêm đủ thời lượng.
`report.json` chứa hash source, tính tất định và thời gian thực của các lượt headless.

31 test đạt, không skip. Kiểm tra CLI pause phát hiện vòng lặp cũ chỉ cho state playing;
đã sửa để tick vẫn tiến trong paused và thêm test subprocess chống tái phát.
Test Phase 1 thay do số chuẩn xem `docs/notes/phase-2.md`; mã/bằng chứng cũ giữ ở phase-1.

Browser 1280×720: đã chọn/đi/lướt/pause tại Đảo Cau, xem và di chuyển trên Đảo Chuông;
ảnh `night2.jpg`, `night3.jpg` là screenshot thật. Settings volume 25→30, lưu/tải lại,
DOM xác nhận 30 ở `settings-after-reload.txt`.

Chưa đo FPS trung bình cho tag này; sẽ đo renderer thật với cảnh chuẩn trong Phase 4.
Không tự ghi đạt ngưỡng 30 FPS. Không có test ẩn giảng viên hoặc reviewer độc lập.
