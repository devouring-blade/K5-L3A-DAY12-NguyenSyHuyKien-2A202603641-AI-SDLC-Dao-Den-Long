# Đảo Đèn Lồng — hướng dẫn cho agent

- Đọc README.md, RULES.md, GUIDE.md, CHECKPOINTS.md, RUBRIC.md và SUBMISSION.md.
- Đề chi tiết nằm tại lab board được dẫn trong README; các tệp hướng dẫn không thay thế PRD-0 hoặc Test Contract.
- Trước khi triển khai một phase, phải có tài liệu phase đã phát hành. Không tự đặt schema JSON, tên lệnh headless hoặc yêu cầu của ticket chưa đọc được.
- Ghi nguồn yêu cầu, giả định, tiêu chí nghiệm thu và kế hoạch kiểm chứng vào docs/notes/implementation-plan.md trước khi code.
- Tách logic game khỏi rendering để cùng logic chạy trong game 3D và chế độ headless.
- Cài/build: `npm ci` và `npm run build`. Chạy game: `npm start` (http://127.0.0.1:4173).
- Test: `npm test`. Kiểm chứng đầy đủ và lưu bằng chứng: `npm run verify`; lệnh này phải thoát khác 0 nếu bất cứ bước nào sai.
- Headless: `node src/cli.mjs --seed 12 --night 1 --ticks 600 --out out.jsonl`.
- Đọc `docs/notes/phase-1.md` cho giả định hiện hành; kiểm tra trực tiếp giao diện sau khi thay rendering hoặc CSS.
- Chạy kiểm chứng thật, lưu đầu vào và output nguyên gốc; không đánh dấu đạt cho phần chưa kiểm chứng.
- Khi ticket thay luật cũ, ghi lý do sửa test và chạy lại các kiểm chứng còn hiệu lực.
- Giữ tài liệu gốc và harness; không ghi token, API key hoặc .env vào Git.
- Không tạo tag phase hay Release cho phần chưa hoàn thành. Không viết lại lịch sử hoặc sửa thời gian để giả bằng chứng.
- Phase 2: dùng số chuẩn Ticket-02, world.mjs là nguồn terrain/map cho CLI và renderer. Khi pause, CLI vẫn phải đọc đủ wall ticks để nhận resume; chỉ won/lost mới dừng sớm.
- Không sửa bằng chứng phase cũ. verify tự chọn thư mục theo contract_version; thay luật cũ phải ghi lý do ở ghi chú phase.
- Phase 3: fuelUnits là số nguyên 1/60; không làm tròn simulation. Chỉ xét bình minh sau decay/drain/out/hit; no_flames luôn ưu tiên. Không dùng all_lit ở v1.2+.
