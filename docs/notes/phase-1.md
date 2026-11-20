# Phase 1 — yêu cầu và quyết định trước triển khai

Nguồn: PRD-0 và Test Contract v1.0 đọc từ lab board ngày 20/11/2026 (ICT):
https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW
Phase 2–4 đang khóa “Chưa phát hành”; không đoán yêu cầu tương lai.

## Thiết kế và tiêu chí nghiệm thu

JavaScript ES modules, Node.js 22+, Three.js cho bản web. Một simulation thuần
dùng chung giữa bản chơi và CLI. `game.contract.json` là nguồn tuning duy nhất.
Web không cần CDN; Node headless không cần DOM, cửa sổ hoặc GPU.

| Yêu cầu | Kiểm chứng dự kiến |
|---|---|
| Đêm 1, đảo tròn 3D, 5 đèn, Mây đội nón lá có đèn | Kiểm tra bằng trình duyệt và screenshot |
| Đi, nhảy, camera góc nhìn thứ ba | Test movement và thao tác trình duyệt |
| Nhặt/nạp, giới hạn túi, điểm số | Test khoảng cách, capacity, partial deposit, event |
| Bóng Mực đuổi, hit, pulse, đèn an toàn | Test chase, invulnerability, cost, stun/push, safe radius |
| Thắng/thua và chơi lại, HUD | Test terminal; thao tác nút bắt đầu/chơi lại |
| Tick 0, 60 Hz, event tick k+1, đủ N bước | Test số học và CLI subprocess |
| Input sparse, nút theo cạnh, xoay camera, normalize | Test giữ trường, nhấn/giữ/thả, góc 90°, vector chéo |
| Scenario override, không điểm/event khi dựng | Test snapshot tick 0 và merge L1..L5 |
| JSONL, lỗi trả 2, tất định | Test subprocess và so byte output hai lượt |

## Giả định đã chọn

- Tất cả tuning trong `game.contract.json` là số dùng thật trong simulation.
- Đảo bán kính 34 m, chân Mây chặn ở 32 m, không phạt rơi (`fall_enabled=false`).
  Nhảy vận tốc 7 m/s, trọng lực 18 m/s². Khoảng cách luôn đo trên XZ.
- Mặc định 65 đom đóm, 3 Bóng Mực; sinh thêm đom đóm mỗi 120 tick (tối đa 90),
  Bóng Mực mỗi 480 tick (tối đa 8). `random_*:false` tắt cả sinh ban đầu và về sau.
- Mỗi cạnh nhấn E nạp tối đa phần còn thiếu vào đèn chưa sáng gần nhất.
- Pulse tốn đom đóm trong túi, kể cả không trúng ai. Mỗi shade trúng cho điểm per_stun.
  Bấm khi thiếu tài nguyên/cooldown không có event.
- Hit làm rơi floor(carried × hit_drop_ratio); đom đóm rơi nhặt lại sau 30 tick.
- Bóng Mực được đẩy ra biên nếu ở trong vùng đèn vừa sáng; vùng an toàn tính trên XZ.
- Chỉ thắng mới thưởng floor(giây còn lại) × per_second_left + flames × per_flame_left.
- Thứ tự bước: move/jump → pickup → deposit → pulse → spawn → shade/hit → timer → terminal.
  Ưu tiên kết thúc: hết lửa, đủ 5 đèn, bình minh. Một lần kết thúc, không cộng điểm tiếp.
- `time_left_s` scenario là thời gian ban đầu, sau đó trừ số bước/60.
- Dựng scenario không phát event/điểm; trạng thái kết thúc xét ở bước đầu.
- Snapshot theo lịch, bắt đầu tick 0; không bắt buộc thêm snapshot ở tick kết thúc ngoài lịch.
- Input `dash` chấp nhận boolean nhưng Phase 1 chưa có cơ chế dash.

## Các bước

1. Khai báo contract, simulation thuần và CLI.
2. Test độc lập theo hành vi contract, đặc biệt giá trị biên và tính tất định.
3. Bản chơi 3D dùng chung simulation; chạy và quan sát thật.
4. Lưu output, báo cáo kiểm chứng và ghi chú; ghi rõ giới hạn chưa đạt.
5. Cập nhật README, harness và chuẩn bị phase-1. Không tạo tag tương lai.
