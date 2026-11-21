# Demo

`demo.mp4`: bản ghi thật59,23giây,1280×720,30FPS,H.264,không tiếng.
Controller tự động được ghi rõ trên video; game vẫn dùng simulation/tuning bình thường.
Các số test/bench/soak phủ trên video lấy từ output chạy thật. Đây không phải video
chơi thắng cả3đêm bằng tay. `frame.jpg` trích ở giây15 để kiểm tra hình ảnh.

Tạo lại bản ghi:

```bash
npm run build
npm run verify
npm run demo
ffmpeg -i docs/demo/demo.webm -vf fps=30 -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart -an docs/demo/demo.mp4
```

Chạy benchmark/soak trước để video có số đo. File WebM gốc và công cụ chuyển mã
không commit; MP4 và metadata SHA256/duration ở docs/proof/phase-4/video.json được giữ.
