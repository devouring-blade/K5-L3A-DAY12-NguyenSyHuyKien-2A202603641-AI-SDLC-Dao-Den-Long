# Nhật ký AI và retro

## Phase 1

Yêu cầu người dùng: đọc repo và thực hiện lab. Công cụ hỗ trợ: OpenAI Codex,
PowerShell/Node.js, npm, trình duyệt tích hợp. Không dùng subagent.

Quy trình: đọc sáu tài liệu gốc → thử mở lab board → ghi nhận thiếu spec →
đọc được PRD-0/Test Contract trên tab đang mở → ghi giả định và kế hoạch
→ simulation/CLI → test → web 3D → kiểm chứng và ghi bằng chứng.

Các lời nhắc điều phối chính: không tự đặt contract khi chưa đọc được;
dùng một simulation cho web/headless; kiểm tra input sparse và cạnh nhấn;
chạy kiểm chứng thật trước khi đánh dấu đạt; không đoán ticket đang khóa.

### Sai sót và cách phát hiện

1. Truy cập web ban đầu lỗi; đã nhờ người dùng sao chép quá sớm. Sau đó đọc được
   tab hiện có. Bài học: thử lại kết nối tab và kiểm tra trạng thái hiện tại trước khi nhờ người dùng.
2. Test pulse kỳ vọng shade vẫn bị stun sau tick 180. Test đỏ cho thấy pulse thứ hai
   không trúng con đã bị đẩy ra ngoài bán kính. Sửa kỳ vọng đúng thời lượng; không sửa
   game để ép test xanh. Thêm kiểm tra riêng cooldown và biên bán kính.
3. Khối đá trang trí nhô lên mặt đất, che nhân vật. Chỉ phát hiện khi xem screenshot.
   Hạ xuống dưới đảo, giữ nguyên logic. Harness yêu cầu kiểm tra giao diện sau sửa rendering.
4. CSS mobile dùng inset bốn phía khiến topbar bị căn giữa dọc. Quan sát viewport hẹp
   phát hiện; sửa bottom thành auto. Không coi test logic là bằng chứng layout.

### Token và chi phí

Không có bộ đếm token/hoá đơn API được cấp trong phiên. Ước tính thủ công Phase 1:
khoảng 25.000–40.000 token gồm đọc đề, code, test và kiểm tra UI; không phải số đo billing.
Không xác nhận chi phí tiền. Phase 2–4 chưa thực hiện nên chưa có số liệu.
Tiết kiệm bằng logic dùng chung, không tạo ảnh/mô hình ngoài, test nhỏ theo contract,
giữ tuning tập trung, chỉ chạy lại sau thay đổi liên quan.

### Đánh giá

Logic và CLI có kiểm chứng tự động thực tế tại `docs/proof/phase-1/`.
Một controller tạo input bình thường cho thế giới mặc định, sau đó phát lại bằng CLI
và so hai output theo byte; không teleport hoặc chỉnh tài nguyên để tạo lượt thắng.
Kết quả, máy đo và hash mã nguồn nằm trong report.json, không ghi đè output bằng tay.

Chưa có kiểm tra ẩn giảng viên. CI macOS/Linux đã cấu hình nhưng chưa được chạy
trên GitHub ở thời điểm chuẩn bị local. Không có reviewer độc lập; không tuyên bố đạt
tiêu chí đánh giá độc lập. Video, Release và các phase sau còn chờ đề/đợt phát hành.

Nếu làm lại: kiểm tra tab trình duyệt sớm, dựng mặt đất/nhân vật tối thiểu và chụp ảnh
trước khi thêm trang trí; thêm test CLI đầu tiên ngay sau khi chốt schema.
