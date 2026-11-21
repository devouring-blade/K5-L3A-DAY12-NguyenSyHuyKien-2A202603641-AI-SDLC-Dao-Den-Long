# Ghi nguồn

- Nhân vật Mây, Bóng Mực, Đảo Bến, tên Đảo Đèn Lồng và khung yêu cầu:
  nội dung gốc của bài lab Day 12. Tài liệu gốc README được giữ ở `docs/lab/README.md`;
  RULES, GUIDE, SUBMISSION, CHECKPOINTS và RUBRIC giữ nguyên tại gốc.
- Mã ứng dụng, hình học 3D (nhân vật, nón lá, đèn, cây, nhà, đảo, mây),
  texture glow vẽ bằng canvas, minimap và hiệu ứng: tạo bằng mã cho bài này
  với hỗ trợ OpenAI Codex. Không dùng mô hình, ảnh, nhạc hoặc nhân vật bên ngoài.
- Âm thanh: sóng sine tạo tại runtime bằng Web Audio API; không dùng file nhạc.
- Three.js 0.187.0: https://github.com/mrdoob/three.js — MIT, bản quyền tác giả Three.js.
  Giấy phép được giữ trong npm package và chép vào `dist/vendor/LICENSE-three.txt` khi build.
- Font hệ thống của máy người dùng; không tải font từ dịch vụ bên ngoài.
- Electron45.4.1 (MIT): https://www.electronjs.org/ — chỉ làm cửa sổ/runtime benchmark
  và ghi demo cho cùng bản web. Binary tải từ GitHub electron/electron và đối chiếu
  SHA-256 với checksums.json của package npm; không đưa binary vào Git.
- FFmpeg qua imageio-ffmpeg0.8.1: dùng chuyển bản ghi gameplay WebM sang MP4;
  binary/công cụ nằm ở .tools (gitignored), không phân phối trong bản game.
- Video demo ghi renderer/gameplay thật bằng MediaRecorder. Controller tự động
  phát input hợp lệ, được ghi rõ trên video; không mô tả như người chơi thủ công.

MIT ở LICENSE chỉ cấp phép phần mã ứng dụng được thêm trong bài này;
không chuyển quyền đối với đề lab hoặc tên/nhân vật thuộc tài liệu gốc.
