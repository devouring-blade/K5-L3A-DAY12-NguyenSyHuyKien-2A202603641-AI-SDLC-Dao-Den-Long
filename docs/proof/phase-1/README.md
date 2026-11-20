# Bằng chứng Phase 1

Tạo lại bằng `npm run verify`. Script lưu TAP/output thực tế và thoát khác 0
nếu test, build, scenario hoặc so sánh tính tất định thất bại. `report.json`
ghi thời gian chạy, cấu hình máy và SHA-256 của mã nguồn đã kiểm tra.

| Yêu cầu | Bằng chứng | Kết quả đã quan sát |
|---|---|---|
| Logic tick, input, movement, pickup/deposit, combat, safe zone, terminal | `tests.tap`, nguồn `tests/*.test.mjs` | 21 test, không skip, 0 fail |
| Scenario không cộng điểm/event ban đầu | Snapshot tick 0 trong `collect-deposit.jsonl`; test constructor | Score 0, chưa nhặt; bước 1 mới có 6 pickup, deposit và lantern_lit |
| Pulse và hit | `pulse-hit.jsonl`, input/scenario trong `tests/scenarios/` | Shade gần bị stun; sau đó có event hit thật |
| Bình minh | `dawn.jsonl` | Lost/dawn ở tick 3 |
| Chơi từ đầu đến thắng trên thế giới mặc định | `default-win-inputs.json`, `default-win-a.jsonl` | Won tick 2461, đủ 5 đèn, score 1786 |
| Tất định giữa hai tiến trình độc lập | `default-win-a.jsonl`, `default-win-b.jsonl`, hash trong `report.json` | Hai file giống từng byte |
| Cài lại trong thư mục trống | `clean-install.json`, script `smoke:clean` | Offline npm ci, build và headless 60 tick đều thoát 0 trên Windows |
| Game 3D và HUD | `intro.jpg`, `gameplay.jpg` | Cảnh đảo, đèn, đom đóm, Mây/nón/đèn nhỏ; HUD có tài nguyên/thời gian |
| Input bản chơi, restart, pause | Kiểm tra qua trình duyệt tích hợp | Bắt đầu → giữ D 700 ms → nhặt 1 đom đóm; pause hiển thị và giữ thời gian; chơi lại từ trạng thái thua được |
| Thua trên giao diện | Quan sát trực tiếp bản chơi khi đứng yên | Hết lửa → hiện “Hẹn Mây một đêm khác”, điểm và nút chơi lại |

`default-win-inputs.json` do controller ở `scripts/verify.mjs` sinh bằng cách
đi tới đom đóm/đèn và dùng các nút hợp lệ. CLI phát lại với **seed 12, không có
scenario override**. Không có teleport, tăng máu hay bơm đom đóm để tạo lượt thắng.
Đây là bằng chứng full gameplay headless; không mô tả nó như video chơi trực tiếp.

Ảnh chụp giao diện nguyên gốc ở viewport thực tế của trình duyệt tích hợp,
không chỉnh sửa nội dung ảnh. Ban đầu đã xem desktop 1280×720; sau khi người dùng
thu nhỏ panel, kiểm tra thêm layout hẹp khoảng 505×729 và sửa lỗi topbar.

## Giới hạn

- Đã chạy local trên Windows; bản web/Node không dùng API riêng của Windows.
  Workflow Ubuntu/macOS đã viết, chưa có lần CI trên GitHub để xác nhận.
- Chưa kiểm tra bằng bộ test ẩn của giảng viên.
- Chưa có walkthrough thắng đầy đủ bằng thao tác người chơi trong trình duyệt;
  thắng đầy đủ được xác minh bằng shared simulation + CLI replay.
- Chưa có reviewer độc lập, video MP4, Release cuối hoặc ticket Phase 2–4.
- Không tuyên bố tag đúng giờ buổi lab; không sửa timestamp của commit/tag.
