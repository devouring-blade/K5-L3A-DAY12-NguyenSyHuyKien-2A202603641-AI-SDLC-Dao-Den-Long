# Bằng chứng Phase 4

Các file dưới đây là output chạy thật, không chỉnh giá trị bằng tay.

| Hạng mục | Bằng chứng | Kết quả |
|---|---|---|
| Test và hồi quy | tests.tap | 51test đạt,0fail,0skip |
| Headless3 đêm đủ thời lượng | report.json + full-night-*.jsonl | Mỗi lượt<30s; mã/hash máy đo trong report |
| Tất định | win-a.jsonl / win-b.jsonl | So byte giống nhau |
| Tính năng và luật mới | Các input/scenario/JSONL + test sources | Dash,fall,pad,wind,pause,charm,drifter,fuel/score/dawn |
| Benchmark render | /bench.json,/bench.png | 101,21FPS trung bình; p1low46,89; p95 14,4ms;load1521,88ms |
| Cảnh bench | bench.json.scene/resolution | 200wander shade,100motes,3lamp;1280×720;warmup3s,đo30,0155s tới frame kết thúc |
| Soak | /soak.json | 10đêm cùng tiến trình,0crash;35,90→38,50MB RSS (+7,2%) |
| Cài sạch | clean-install.json | Offline npmci,build và headless trong thư mục trống đều thoát0 |
| Video | video.json + /docs/demo/demo.mp4 | 59,23s,H.264,1280×720,30FPS,3.044.251byte |
| Leaderboard,export,bindings | leaderboard.test.mjs,preferences.test.mjs | Top10/tie,save/reload/export/invalid names/remap/duplicate/reset |

Bench dùng Electron45.4.1/Three187 trên IntelIrisXe,D3D11,Windows10.0.26200.
Ảnh capture theo DPI vật lý Windows có thể lớn hơn viewport CSS; rendererbuffer và
viewport thực của phép đo đều1280×720. Vsync được cấu hình tắt bằng Chromiumflags.
RSS renderer/GPU không đo được cho bản web nên peak_mem_mb=null theo contract.

`bench-initial.json/.png` giữ nguyên lần đầu chưa đạt p1low và viewport bị lệch;
sau sửa code mới đo lại. Soak dùng đúng lệnh runtime trong game.contract.json,
không nạp ballast vào baseline. Cả10kết quả lost là đầu vào ngẫu nhiên thật, không
chèn kết quả won. CLIsoak trả1 nếu crash hoặc vượt ngưỡng RSS.

Video ghi canvas renderer thật, controller đi/nhặt/nạp/pulse bằng input hợp lệ,
không teleport hoặc thêm tài nguyên. Chữ phủ video ghi rõ controller tự động và
lấy số liệu từ TAP,bench.json,soak.json đã có; không gọi đây là thao tác người chơi thủ công.

Giới hạn: chỉ đo trên máy hiện tại; máy chấm có thể khác. Không có bộ test ẩn.
GUIPhase2 đã thao tác qua browser; Phase4 renderer được chạy thật qua bench/video,
nhưng chưa có ca thao tác browser riêng cho mọi nút mới. Logic phía sau các nút có test.
CI từ xa, quyền public và GitHub Release cần kết quả thực tế từ GitHub để xác nhận.
