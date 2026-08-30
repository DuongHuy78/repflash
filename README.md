# Flashcard App - Frontend

Frontend React 19 + Vite cho ứng dụng học flashcard theo Spaced Repetition
(SM-2 tùy biến). Ứng dụng hỗ trợ tài khoản, học phần đa ngôn ngữ, TTS, import
hàng loạt, quản lý thẻ và hai vòng học Main/Retry (Bò nhai cỏ).

## Yêu cầu

- Node.js phù hợp với Vite 8.
- `pnpm`; repository này dùng `pnpm-lock.yaml`, không dùng npm/yarn.
- Backend chạy ở cổng 6000 khi phát triển.

## Chạy dự án

```powershell
pnpm install
pnpm dev
```

Vite chạy ở `http://localhost:7000` và proxy request `/api` tới
`http://127.0.0.1:6000`.

## Kiểm tra

```powershell
pnpm test
pnpm lint
pnpm build
```

- `pnpm test`: chạy 19 unit test thuần bằng `node:test`.
- `pnpm lint`: kiểm tra ESLint.
- `pnpm build`: tạo bản production trong `dist/`; backend có thể phục vụ thư
  mục này để chạy cả ứng dụng trên một cổng.

## Cấu trúc chính

- `src/App.jsx`: state, gọi API và điều phối phiên học.
- `src/components/`: app shell, auth/profile, quản lý deck/thẻ và giao diện học.
- `src/hooks/`: focus dialog và state phiên học.
- `src/utils/`: chuẩn hóa nội dung, import, TTS, streak và reducer phiên học.
- `test/`: test cho nội dung/import và phiên Main/Retry.

Tài liệu kiến trúc đầy đủ nằm ở `../SystemDesign.txt`; quy trình làm việc nằm ở
`../Chat.txt`. Khi tài liệu lệch code, ưu tiên code rồi cập nhật lại tài liệu.
