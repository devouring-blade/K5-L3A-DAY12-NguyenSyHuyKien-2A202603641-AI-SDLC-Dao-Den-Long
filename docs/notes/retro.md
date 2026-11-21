# Evaluation và retro — bốn phase

## Kết quả và thay đổi

| Phase | Quyết định chính | Bằng chứng và giới hạn |
|---|---|---|
| 1 | Một simulation thuần cho CLI và Three.js; tuning tự khai báo | 21 test; lượt thắng mặc định2461tick; bằng chứng giữ nguyên tại tagphase-1 |
| 2 | Chuẩn hóa số liệu; tách world/terrain; FSM, dash, pad, drifter, charm, pause | 31 test, scenario cho từng cơ chế; browser chọn/đi/lướt ở Đêm2/3; settings lưu/tải lại. FPS chưa đo ở tag này |
| 3 | Fuel bằng đơn vị nguyên1/60; ever_lit tách khỏi lit; xét thắng tại bình minh | 43 test; ngưỡng30, drain cộng dồn, capacity, score và ưu tiên chết tick cuối. ADR ghi test bị thay |
| 4 | Renderer instancing; benchmark thật; soak RSS; leaderboard/remap; gói và video | 51 test; bench/soak/video.json/smoke-clean. Không có test ẩn hoặc reviewer độc lập |

Các phase cũ không bị viết lại để làm đẹp lịch sử; commit/tag dùng thời gian thực.
Thời gian bắt đầu buổi lab và gia hạn của Coach chưa được cung cấp, nên không tuyên bố
các mốc này đủ điều kiện đúng hạn. Trạng thái GitHub phải kiểm tra riêng sau publication.

## AI sai ở đâu, phát hiện bằng gì

- Tab lab ẩn danh hiện khóa, trong khi tài khoản người dùng mở được. AI đã kết luận
  quá sớm rằng đề chưa phát hành. Đăng nhập cùng tài khoản giúp đọc đủ ticket. Bài học:
  trạng thái của một phiên không đủ để kết luận trạng thái của mọi người dùng.
- Test pulse cũ quên rằng lần đẩy đầu làm mục tiêu ra ngoài tầm lần thứ hai. Test đỏ
  giúp sửa kỳ vọng; không đổi game để ép test xanh. Phase2 tiếp tục thêm kiểm tra3D.
- Khối đá nhô lên che nhân vật và CSS topbar bị căn giữa ở viewport hẹp chỉ được phát
  hiện khi xem ảnh thật. Harness yêu cầu kiểm tra rendering sau mỗi thay đổi giao diện.
- Simulation pause đúng nhưng CLI lại dừng vòng lặp khi state!=playing. Scenario
  pause/resume thật phát hiện lỗi; thêm test subprocess và chỉ dừng khi won/lost.
- Benchmark đầu p1low24,36FPS và viewport1282×722. Đã giữ nguyên output thất bại.
  Sửa kích thước cửa sổ, DPR1 nhất quán và giảm lọc/sort/bounding-sphere trong vòng
  lặp; đo lại đạt101,21FPS, p1low46,89,load1,52s. Không chỉnh file số đo bằng tay.
- Soak mặc định tăng RSS quá20% dù không crash. Chọn V8jitless và nursery1MB cho
  soak, chấp nhận chậm hơn để ổn định bộ nhớ. Lượt cuối35,90→38,50MB,0crash.

## Harness và cách tiết kiệm

AGENTS.md ghi contract từng phase, lệnh thật và điều cấm làm giả bằng chứng. `verify`
tự dừng khi test/build/scenario sai; ghi TAP, JSONL và hash vào thư mục phase hiện tại,
không đè bằng chứng cũ. CI chạy Ubuntu/macOS khi push; chưa có kết quả từ xa thì không
ghi CI xanh. Smoke test cài lại trong thư mục trống; bộ test độc lập về số học/tick và
subprocess đáng tin hơn việc agent tự mô tả “đã xong”. Không dùng subagent.

Không có telemetry token/chi phí billing trong phiên. Ước tính thủ công: Phase1
25–40nghìn, Phase2 15–25nghìn, Phase3 5–10nghìn, Phase4 20–45nghìn token; tổng
khoảng65–120nghìn. Đây là ước lượng rộng, không phải hóa đơn. Tiết kiệm bằng cùng
simulation cho web/headless, asset/âm thanh procedural, test theo contract trước,
và chỉ chạy lại phép đo khi có lỗi/thay đổi liên quan. Không thể quy đổi chính xác ra tiền.

Nếu làm lại: xác minh phiên đăng nhập sớm; ưu tiên pause/CLI trong ca kiểm tra đầu;
dựng cảnh chuẩn và đo DPI sớm hơn; tối ưu cấp phát trước khi thêm chi tiết đồ họa;
dành một khoảng riêng cho authentication, video và Release. Bản quay ghi rõ controller
tự động, không mô tả thành playtest thủ công hoặc hoàn thành cả chiến dịch.
