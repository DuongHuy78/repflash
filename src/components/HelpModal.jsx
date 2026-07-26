import React from 'react';
import { BookOpen, Crown } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <BookOpen size={24} color="var(--primary-color)" /> Hướng Dẫn Sử Dụng & Phương Pháp Học
          </h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Section 1: Intro */}
          <section className="help-section">
            <h3>🌟 1. Giới thiệu & Mục tiêu Dự án</h3>
            <p>
              Chào mừng bạn đến với <strong>Flashcard App</strong>! Ứng dụng giúp bạn <strong>học ít hơn - nhớ lâu hơn</strong> nhờ phương pháp <strong>Spaced Repetition (Lặp lại ngắt quãng)</strong>. Hệ thống sẽ tự động tính toán thời điểm bạn sắp quên để nhắc bạn ôn tập!
            </p>
          </section>

          {/* Section 2: SM-2 Algorithm */}
          <section className="help-section">
            <h3>🧠 2. Thuật toán Spaced Repetition (SM-2)</h3>
            <p>Khi lật mặt sau của thẻ, hãy tự đánh giá mức độ ghi nhớ của bạn qua 4 lựa chọn:</p>
            <div className="quality-guide-grid">
              <div className="quality-box q1">
                <span className="q-badge">1 - Lại (Again)</span>
                <p>Quên từ này. Thẻ sẽ đưa vào tab <strong>Bò nhai cỏ</strong> để học lại trong ngày.</p>
              </div>
              <div className="quality-box q2">
                <span className="q-badge">2 - Khó (Hard)</span>
                <p>Nhớ chật vật. Thẻ sẽ lặp lại sau một khoảng thời gian ngắn.</p>
              </div>
              <div className="quality-box q3">
                <span className="q-badge">3 - Tốt (Good)</span>
                <p>Nhớ bình thường. Khoảng thời gian lặp lại tăng tiêu chuẩn (1 ngày ➔ 6 ngày ➔ 15 ngày...).</p>
              </div>
              <div className="quality-box q4">
                <span className="q-badge">4 - Dễ (Easy)</span>
                <p>Thuộc lòng. Khoảng thời gian lặp lại tăng mạnh để bạn không tốn thời gian ôn lại sớm.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Retry mode */}
          <section className="help-section">
            <h3>🐮 3. Chế độ "Bò nhai cỏ" (Same-Day Retry)</h3>
            <p>
              Những từ vựng bạn đánh dấu <strong>Lại (1)</strong> sẽ được tập hợp trong tab <strong>Bò nhai cỏ</strong>. Bạn có thể "nhai đi nhai lại" các từ này nhiều lần trong ngày cho đến khi nhớ hẳn!
            </p>
          </section>

          {/* Section 4: Streak System */}
          <section className="help-section">
            <h3>🔥 4. Hệ thống Chuỗi ngày học (Streak)</h3>
            <p>
              Chỉ cần học ít nhất 1 thẻ mỗi ngày, bạn sẽ duy trì chuỗi <strong>Streak 🔥</strong>. Tích lũy chuỗi ngày liên tục để nâng cấp danh hiệu lửa và mở khóa các mốc thành tựu!
            </p>
          </section>

          {/* Section 5: Keyboard Shortcuts */}
          <section className="help-section">
            <h3>⌨️ 5. Phím tắt thao tác nhanh (Keyboard Shortcuts)</h3>
            <p>Tăng tốc độ học gấp 3 lần mà không cần dùng chuột:</p>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <kbd>Space</kbd> <span>Lật mặt trước / mặt sau thẻ</span>
              </div>
              <div className="shortcut-item">
                <kbd>A</kbd> <span>Đánh giá 1 - Lại (Again)</span>
              </div>
              <div className="shortcut-item">
                <kbd>S</kbd> <span>Đánh giá 2 - Khó (Hard)</span>
              </div>
              <div className="shortcut-item">
                <kbd>D</kbd> <span>Đánh giá 3 - Tốt (Good)</span>
              </div>
              <div className="shortcut-item">
                <kbd>F</kbd> <span>Đánh giá 4 - Dễ (Easy)</span>
              </div>
              <div className="shortcut-item">
                <kbd>V</kbd> <span>Phát âm từ vựng (Voice)</span>
              </div>
              <div className="shortcut-item">
                <kbd>R</kbd> <span>Đổi câu danh ngôn cổ vũ</span>
              </div>
              <div className="shortcut-item">
                <kbd>Esc</kbd> <span>Thoát chế độ sửa thẻ</span>
              </div>
            </div>
          </section>


          {/* Section 5: VIP Note
          <section className="help-section vip-note">
            <h3><Crown size={20} color="#f59e0b" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 5. Lời nhắn & Bản VIP Thân Thiện</h3>
            <p>
              Ứng dụng được xây dựng với tinh thần học tập hết mình! Hãy duy trì thói quen mỗi ngày. Bạn cũng có thể tích lũy các popup cổ vũ sau mỗi bài học để nhận ngày <strong>VIP Miễn phí</strong> và trải nghiệm thêm các tính năng độc quyền nhé! 👑
            </p>
          </section> */}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Đã hiểu, bắt đầu học ngay!</button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
