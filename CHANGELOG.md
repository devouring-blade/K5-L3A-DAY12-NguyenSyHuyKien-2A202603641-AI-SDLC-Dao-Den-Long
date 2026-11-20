# Thay đổi

## 0.3.0 — Phase 3 (breaking changes)

- Đèn có dầu, refuel/out/relight, ever_lit/relit_count và capacity10..20.
- Safe zone chỉ khi fuel>=30, shade drain, pulse thưởng15 khi đánh drain.
- Bỏ all_lit và thắng sớm; xét ceil60% đèn sáng tại bình minh. Thời lượng240/270/300.
- Thay toàn bộ điểm và snapshot/scenario v1.2; ADR và test biên tick cuối.

## 0.2.0 — Phase 2

- Chuẩn hóa tuning, 3 bản đồ, terrain/bridge/ramp/pad, dash, fall/respawn.
- FSM Bóng Mực, spawn lịch chuẩn, Gió Lạc, Bùa Gió và pause tick/sim_tick.
- Chuỗi đêm, HUD, nhạc/cue, cài đặt lưu giữa các lần mở; renderer instancing.
- Contract v1.1, test thay các giả định Phase 1 có ghi lý do; thêm kiểm tra CLI pause.
- Sửa CLI dừng nhầm khi state=paused, phát hiện bằng scenario pause/resume thực tế.

## 0.1.0 — Phase 1

- Game 3D Đêm 1, Mây đội nón lá có đèn nhỏ, đảo tròn và 5 đèn lớn.
- Nhặt/nạp đom đóm, pulse, Bóng Mực đuổi, hit, vùng an toàn, thắng/thua và chơi lại.
- HUD, bản đồ nhỏ, camera xoay, âm thanh tùy chọn, tạm dừng trên bản chơi.
- Simulation 60 Hz dùng chung với CLI Test Contract v1.0, JSONL tất định.
- Test, scenario, full default-world replay, CI macOS/Linux và script lưu bằng chứng.
- Chưa có Ticket-02/03/04; chưa phát hành v1.0.0.
