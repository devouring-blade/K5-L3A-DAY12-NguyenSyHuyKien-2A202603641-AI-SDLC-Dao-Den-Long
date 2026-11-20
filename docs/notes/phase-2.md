# Phase 2 — acceptance criteria và thay đổi

Nguồn: `docs/requirements/ticket-02.txt`, lấy trực tiếp sau đăng nhập Claude.

| Nhóm | Tiêu chí nghiệm thu | Kiểm chứng |
|---|---|---|
| Số chuẩn | Tuning khớp toàn bộ Ticket-02; score nạp +10, không điểm nhặt | Test tuning và interaction |
| 3 bản đồ | Đúng tâm/radius/đèn/mote points/spawn points; vách, dốc và cầu rơi được | Test terrain/pad và nhìn 3D |
| Dash | 14m/s,12tick,CD90tick từ lúc bắt đầu, cạnh nhấn, giữ độ cao | Scenario dash |
| Pulse/hit | Khoảng cách 3D tâm+0.8, stun120/push15tick, hit/recoil/fall theo luật | Scenario combat/fall |
| AI/spawn | FSM đúng tên; detect12/forget18; lịch300+interval, cap; thực thể mới tương tác tick sau | Scenario spawn/FSM |
| Gió Lạc | idle/chase/flee/removed, steal/drop, max2/spawn1200 | Scenario drifter |
| Bùa | pickup,600tick,run7.2,dashnoCD,respawn2700 | Scenario charm |
| Pause | tick tăng,sim_tick/timer/CD/spawn đứng; không kẹt nút khi resume | Test pause |
| Chuỗi đêm | Intro/kết quả/đêm tiếp theo/bình minh; thua retry; total chỉ đêm thắng | Browser flow và shared logic |
| Settings/audio | Volume/sensitivity lưu; nhạc và cue; HUD chuẩn, mũi tên offscreen | Browser và storage |
| Màu/ánh sáng | RGB theo bảng; ambient 0.15+0.55*progress | Đối chiếu source và ảnh |
| CLI v1.1 | night1..3, snapshot đầy đủ, scenario mới và tính tất định | CLI subprocess |

Thay thế test Phase 1 dùng tuning tự chọn: capacity18→10, lamp6→10, pickup1.5→1,
pulse2/7m→3/5m, safe5→6, shade2.5→4, gravity18→20, scorepickup→scoredeposit.
Rìa đảo không còn chặn: thay test clamp bằng test fall/respawn.
Không skip test; giữ bằng chứng và mã cũ ở tag phase-1.

Giả định khi ticket chưa nói rõ: shade spawning 30 tick; wander đi 2m/s về đèn tắt
gần nhất; điểm sinh chọn bằng RNG seed, tránh điểm đang có shade. Đêm 2/3 cũng bắt đầu
với 2 shade tại tick300. Drifter idle hướng tuần hoàn quanh điểm sinh, pulse đo cùng
quy tắc tâm 3D. Pause khóa gameplay input đang giữ tới khi thả; không dồn hành động.
