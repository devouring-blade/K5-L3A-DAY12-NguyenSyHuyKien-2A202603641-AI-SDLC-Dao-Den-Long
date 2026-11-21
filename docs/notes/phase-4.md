# Phase 4 — kế hoạch nghiệm thu

Nguồn Ticket-04/v1.3 trong docs/requirements. Giữ nguyên luật v1.2.

- Benchmark: scene thật ở1280×720,200 wander shade,100 motes,3 lamp100fuel;
  không spawn/pickup/damage/fuel decay/terminal. Warmup3s, đo30s bằng dt rAF thực,
  p1 từ1% khung chậm nhất, p95,loadms; web RSS null và vsync_off=false trung thực.
  CLI phục vụ localhost, thu JSON từ chính renderer, không dùng tốc độ simulation thay FPS.
- Soak: cùng tiến trình,10 đêm xoay vòng,seed7+i, random direction mỗi30tick,
  jump5%/dash3%/pulse2%/interact10%; reset và đo RSS đúng hai mốc. Không bịa results.
- Leaderboard: tênASCII3..12,score/nights_won/ISOtimezone/seed,top10/tieearliest,
  local disk qua serverAPI, export từ run_cmd. Tests có save/reload/sort/invalid/export.
- Accessibility: lưu remap mọi action, báo trùng/resetdefault; giảmchuyểnđộng/chữlớn,
  cuevisual spawn/wind/countdown/lowfuel; text>=18px tại1280×720.
- Build sạch<=3lệnh,README ảnh và lệnh;changelog4phase/license/credits/retro.
- Quay canvasgameplay thật và hiển thị bằng chứng trong video; chuyển MP4 bằngFFmpeg.
  Bản webzip/video/release-note chuẩn bị local trước; GitHub publication cần kết nối tài khoản.
