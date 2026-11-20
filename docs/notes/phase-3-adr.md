# ADR — nhiên liệu và bình minh (Phase 3)

Nguồn: Ticket-03/v1.2 tại `docs/requirements/ticket-03.txt`.

Quyết định: lưu fuel bằng số nguyên đơn vị 1/60. Mỗi tick hao 1 đơn vị;
mỗi shade drain hao thêm 5. Snapshot mới làm tròn 1 chữ số. `ever_lit` không
bị xóa khi cạn dầu; `relit_count` và `successful_lights` chỉ tăng do hành động
thắp thật, không tăng bởi scenario. Nhờ vậy reset/score/capacity không dựa vào
số đèn đang sáng và không bị sai khi đèn tắt rồi được thắp lại.

Tiêu chí kiểm chứng: decay 60 tick =1 fuel; drain cộng dồn; threshold30 inclusive;
out reset deposited; relight cần5 và tăng capacity; refuel theo ceil, bỏ qua đèn đầy;
không thắng sớm; ngưỡng3/5,4/6,5/7 khi hết giờ; out và chết tick cuối vẫn áp dụng
trước xét thắng. Bonus drain pulse +15 tổng, không +20; thắng cộng fuel/lamp/flames.

Thay đổi phá tương thích: all_lit bỏ; thời lượng240/270/300; score mới hoàn toàn,
capacity động10..20; đèn sáng có thể nhận dầu, mất safe khi fuel<30; drain state.
Scenario thắng sớm của verify được thay bằng scenario chạy tới bình minh. Bằng chứng
ở phase-2 giữ nguyên, không sửa lại để khớp luật mới; không skip test âm thầm.
