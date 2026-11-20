# Kế hoạch thực hiện lab

> Cập nhật: đã mở và đọc được PRD-0/Test Contract trong tab trình duyệt ở lượt sau.
> Phần dưới giữ lại ghi nhận lần chuẩn bị ban đầu. Kế hoạch và giả định hiện hành:
> [Phase 1](phase-1.md). Bằng chứng thực thi: [report.json](../proof/phase-1/report.json).

## Trạng thái ban đầu

Đã đọc sáu tài liệu gốc: README, GUIDE, CHECKPOINTS, SUBMISSION, RULES và RUBRIC.
Repo ban đầu chỉ có sáu tệp này, chưa có mã nguồn, PRD-0, Test Contract hoặc ticket.

Nguồn đề chi tiết: https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW

Đã thử đọc bằng công cụ web, trình duyệt và HTTP. HTTP tải được HTML khung trang,
nhưng yêu cầu lấy dữ liệu hiển thị trả về 403. Chưa đọc được nội dung đề chi tiết.
Không coi HTML khung trang là bằng chứng đã có PRD-0.

## Phạm vi đã xác định từ tài liệu gốc

- Game 3D góc nhìn thứ ba, chạy trên macOS hoặc Linux.
- Nhân vật Mây gom đom đóm, thắp Đèn Lồng Lớn, né Bóng Mực trong sương đen.
- Bốn phase, mỗi phase có yêu cầu riêng và tag tương ứng.
- Logic hỗ trợ headless theo Test Contract của giảng viên.
- Bằng chứng thật, có truy vết yêu cầu; kiểm tra hồi quy sau thay đổi.
- Bàn giao mã nguồn, harness, ghi chép, CREDITS, LICENSE, bản chạy được,
  Release v1.0.0 và video MP4 dưới 5 phút.

## Thông tin còn thiếu để triển khai

| Tài liệu | Cần lấy | Ảnh hưởng |
|---|---|---|
| PRD-0 | Luật màn đầu, điều khiển, điều kiện thắng/thua, yêu cầu bàn giao | Chưa thể xác nhận tiêu chí nghiệm thu Phase 1 |
| Test Contract | Lệnh chạy, khai báo cấu hình, schema input/output, thời gian, seed | Chưa thể thiết kế giao diện tương thích bộ chấm |
| Ticket-02 | Yêu cầu mới đã được phát hành | Chưa triển khai Phase 2 |
| Ticket-03 | Luật mới và luật bị thay thế | Chưa triển khai Phase 3 |
| Ticket-04 | Yêu cầu hoàn thiện, ngưỡng hiệu năng và lệnh đo | Chưa triển khai Phase 4 |

Không tự đoán nội dung các tài liệu này. Chỉ xử lý phase đã được phát hành.

## Thứ tự thực hiện khi có đề

1. Lưu đề được cung cấp và lập bảng yêu cầu → tiêu chí nghiệm thu → cách kiểm chứng.
2. Ghi các giả định chỉ cho chi tiết đề cho phép tự quyết; chọn công nghệ phù hợp contract.
3. Xây logic thuần và CLI headless trước, kiểm tra các giá trị biên và tính tất định nếu contract yêu cầu.
4. Dùng cùng logic cho bản chơi 3D; kiểm tra điều khiển, camera, HUD và kết thúc lượt chơi.
5. Lưu test, scenario, output nguyên gốc và bằng chứng giao diện; ghi các phần chưa đạt.
6. Đánh giá phase, cập nhật harness và ghi thay đổi; tạo commit/tag khi phase hoàn thành.
7. Với mỗi ticket mới, cập nhật thiết kế và test, ghi lý do đổi luật rồi kiểm tra hồi quy.
8. Thử chạy từ bản sao sạch trên môi trường đích, đo hiệu năng theo ticket,
   quay demo và chuẩn bị bản phát hành.

## Tình trạng kiểm chứng

Chưa có mã nguồn để chạy test. Chưa xác nhận phase nào đạt. Chưa tạo tag hoặc Release.
Chưa có video hoặc số đo hiệu năng. Không có bằng chứng runtime để nộp ở thời điểm chuẩn bị.
