# Kiểm chứng Phase 3

`npm run verify` ở phase-3:43 test đạt,0 skip; output và hash ở report.json/TAP.
Test fuel.test.mjs kiểm tra 12 nhóm luật mới: đơn vị nguyên, ceil refuel, relight,
capacity, threshold30, drain cộng dồn, pulse drain+15, không thắng sớm, threshold
bình minh, đèn cạn ngay tick cuối, no_flames ưu tiên và khôi phục safe khi châm.
Scenario win-a/win-b chạy tới bình minh, output giống từng byte. 3 đêm chạy đủ
thời lượng đều trong30s trên máy hiện tại, xem report.

HUD đã có thanh dầu trên mô hình đèn, flash1Hz khi yếu, thông tin sức chứa thực và
target “Giữ ít nhất k đèn sáng tới bình minh”. Settings bảng màu dễ phân biệt lưu lại,
shade viền/mắt xanh #00B3FF và cảnh báo trắng; đèn tắt xẹp20% và có vết rách.
Chưa có screenshot riêng của một đèn đang sáng ở tag này; sẽ có cảnh bench3 đèn ở Phase4.
ADR và lý do thay test cũ: docs/notes/phase-3-adr.md. Không thay output của phase cũ.
