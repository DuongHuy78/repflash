import { useState } from 'react';
import { BookOpen } from 'lucide-react';

const HELP_CONTENT = {
  vi: {
    title: 'Hướng Dẫn Sử Dụng & Phương Pháp Học',
    btnGotIt: 'Đã hiểu, bắt đầu học ngay!',
    introTitle: '🌟 1. Giới thiệu & Mục tiêu Dự án',
    introDesc: (
      <>
        Chào mừng bạn đến với <strong>Flashcard App</strong>! Ứng dụng giúp bạn <strong>học ít hơn - nhớ lâu hơn</strong> nhờ phương pháp <strong>Spaced Repetition (Lặp lại ngắt quãng)</strong>. Hệ thống sẽ tự động tính toán thời điểm bạn sắp quên để nhắc bạn ôn tập!
      </>
    ),
    sm2Title: '🧠 2. Thuật toán Spaced Repetition (SM-2)',
    sm2Desc: 'Khi lật mặt sau của thẻ, hãy tự đánh giá mức độ ghi nhớ của bạn qua 4 lựa chọn:',
    q1: {
      badge: '1 - Lại (Again)',
      desc: (
        <>
          Quên từ này. Thẻ sẽ đưa vào tab <strong>Bò nhai cỏ</strong> để học lại trong ngày.
        </>
      ),
    },
    q2: {
      badge: '2 - Khó (Hard)',
      desc: 'Nhớ chật vật. Thẻ sẽ lặp lại sau một khoảng thời gian ngắn.',
    },
    q3: {
      badge: '3 - Tốt (Good)',
      desc: 'Nhớ bình thường. Khoảng thời gian lặp lại tăng tiêu chuẩn (1 ngày ➔ 6 ngày ➔ 15 ngày...).',
    },
    q4: {
      badge: '4 - Dễ (Easy)',
      desc: 'Thuộc lòng. Khoảng thời gian lặp lại tăng mạnh để bạn không tốn thời gian ôn lại sớm.',
    },
    retryTitle: '🐮 3. Chế độ "Bò nhai cỏ" (Same-Day Retry)',
    retryDesc: (
      <>
        Những từ vựng bạn đánh dấu <strong>Lại (1)</strong> sẽ được tập hợp trong tab <strong>Bò nhai cỏ</strong>. Bạn có thể "nhai đi nhai lại" các từ này nhiều lần trong ngày cho đến khi nhớ hẳn!
      </>
    ),
    streakTitle: '🔥 4. Hệ thống Chuỗi ngày học (Streak)',
    streakDesc: (
      <>
        Chỉ cần học ít nhất 1 thẻ mỗi ngày, bạn sẽ duy trì chuỗi <strong>Streak 🔥</strong>. Tích lũy chuỗi ngày liên tục để nâng cấp danh hiệu lửa và mở khóa các mốc thành tựu!
      </>
    ),
    shortcutTitle: '⌨️ 5. Phím tắt thao tác nhanh (Keyboard Shortcuts)',
    shortcutDesc: 'Tăng tốc độ học gấp 3 lần mà không cần dùng chuột:',
    shortcuts: [
      { key: 'Space', desc: 'Lật mặt trước / mặt sau thẻ' },
      { key: 'G', desc: 'Bật / tắt hiển thị cách đọc ở mặt trước (trước khi lật thẻ)' },
      { key: 'A', desc: 'Đánh giá 1 - Lại (Again) (sau khi đã lật thẻ)' },
      { key: 'S', desc: 'Đánh giá 2 - Khó (Hard) (sau khi đã lật thẻ, chỉ vòng chính)' },
      { key: 'D', desc: 'Đánh giá 3 - Tốt (Good) (sau khi đã lật thẻ, chỉ vòng chính)' },
      { key: 'F', desc: 'Đánh giá 4 - Dễ (Easy) / Đã nhớ (sau khi đã lật thẻ)' },
      { key: 'V', desc: 'Phát âm từ vựng / câu ví dụ (Voice)' },
      { key: 'R', desc: 'Đổi câu danh ngôn cổ vũ' },
      { key: 'Esc', desc: 'Thoát chế độ sửa thẻ' },
    ],
    shortcutNotes: [
      'Phím đánh giá (A, S, D, F) chỉ có tác dụng sau khi bạn đã lật sang mặt sau của thẻ.',
      'Ở chế độ "Bò nhai cỏ", chỉ dùng 2 phím: A (Lại - 1) và F (Đã nhớ - 3).',
      'Tất cả phím tắt sẽ tự động bị vô hiệu hóa khi con trỏ đang ở trong ô nhập liệu (input, textarea).',
    ],
  },
  en: {
    title: 'User Guide & Learning Method',
    btnGotIt: 'Got it, start learning now!',
    introTitle: '🌟 1. Introduction & Project Goal',
    introDesc: (
      <>
        Welcome to <strong>Flashcard App</strong>! Learn <strong>less - remember longer</strong> with the <strong>Spaced Repetition</strong> method. The system automatically calculates when you are about to forget so you can review at the right time!
      </>
    ),
    sm2Title: '🧠 2. Spaced Repetition Algorithm (SM-2)',
    sm2Desc: 'When flipping the back of the card, rate your recall performance with 4 options:',
    q1: {
      badge: '1 - Again',
      desc: (
        <>
          Forgot this word. Moved to the <strong>Same-Day Retry</strong> tab to re-learn today.
        </>
      ),
    },
    q2: {
      badge: '2 - Hard',
      desc: 'Remembered with effort. Card repeats after a short interval.',
    },
    q3: {
      badge: '3 - Good',
      desc: 'Normal recall. Standard interval scaling (1 day ➔ 6 days ➔ 15 days...).',
    },
    q4: {
      badge: '4 - Easy',
      desc: 'Perfect recall. Interval increases significantly so you don\'t waste time reviewing too early.',
    },
    retryTitle: '🐮 3. "Same-Day Retry" Mode',
    retryDesc: (
      <>
        Words marked as <strong>Again (1)</strong> are gathered in the <strong>Same-Day Retry</strong> tab. Review them multiple times throughout the day until fully memorized!
      </>
    ),
    streakTitle: '🔥 4. Daily Streak System',
    streakDesc: (
      <>
        Study at least 1 card daily to maintain your <strong>Streak 🔥</strong>. Accumulate consecutive days to upgrade fire badges and unlock achievements!
      </>
    ),
    shortcutTitle: '⌨️ 5. Quick Keyboard Shortcuts',
    shortcutDesc: 'Speed up your learning 3x without using the mouse:',
    shortcuts: [
      { key: 'Space', desc: 'Flip front / back of card' },
      { key: 'G', desc: 'Toggle pronunciation on front (before flipping card)' },
      { key: 'A', desc: 'Rate 1 - Again (after flipping card)' },
      { key: 'S', desc: 'Rate 2 - Hard (after flipping card, main session only)' },
      { key: 'D', desc: 'Rate 3 - Good (after flipping card, main session only)' },
      { key: 'F', desc: 'Rate 4 - Easy / Remembered (after flipping card)' },
      { key: 'V', desc: 'Pronounce word / example (Voice)' },
      { key: 'R', desc: 'Change motivational quote' },
      { key: 'Esc', desc: 'Exit edit mode' },
    ],
    shortcutNotes: [
      'Rating shortcuts (A, S, D, F) only work after flipping to the back of the card.',
      'In "Same-Day Retry" mode, only 2 keys are active: A (Again - 1) and F (Remembered - 3).',
      'All shortcuts are automatically disabled while typing in text inputs or textareas.',
    ],
  },
  ja: {
    title: '使い方ガイド ＆ 学習メソッド',
    btnGotIt: '理解しました。今すぐ学習を始める！',
    introTitle: '🌟 1. 概要とプロジェクトの目的',
    introDesc: (
      <>
        <strong>Flashcard App</strong>へようこそ！<strong>間隔反復（Spaced Repetition）</strong>メソッドにより、「<strong>効率的に学んで長期間記憶する</strong>」ことをサポートします。忘れる直前のタイミングをシステムが自動計算して復習を促します！
      </>
    ),
    sm2Title: '🧠 2. 間隔反復アルゴリズム (SM-2)',
    sm2Desc: 'カードの裏面を開いたら、記憶度合いを4つの選択肢から評価してください：',
    q1: {
      badge: '1 - もう一度 (Again)',
      desc: (
        <>
          忘れた単語。本日の「<strong>当日復習</strong>」タブに移動し、学び直します。
        </>
      ),
    },
    q2: {
      badge: '2 - 難しい (Hard)',
      desc: '思い出すのが難しかった単語。短い間隔で再出題されます。',
    },
    q3: {
      badge: '3 - 良好 (Good)',
      desc: '普通に覚えていた単語。標準的な間隔で伸びます（1日 ➔ 6日 ➔ 15日...）。',
    },
    q4: {
      badge: '4 - 簡単 (Easy)',
      desc: '完璧に覚えている単語。間隔が大幅に伸び、早すぎる復習を省きます。',
    },
    retryTitle: '🐮 3. 当日復習モード (Same-Day Retry)',
    retryDesc: (
      <>
        「<strong>もう一度 (1)</strong>」と評価した単語は「<strong>当日復習</strong>」タブに集まります。完全に覚えるまで1日に何度も繰り返し復習できます！
      </>
    ),
    streakTitle: '🔥 4. 連続学習ストリーク (Streak)',
    streakDesc: (
      <>
        毎日少なくとも1枚カードを学習して <strong>Streak 🔥</strong> を維持しましょう。連続日数を増やして炎バッジをグレードアップ！
      </>
    ),
    shortcutTitle: '⌨️ 5. ショートカットキー',
    shortcutDesc: 'マウスを使わずに学習スピードを3倍にアップ：',
    shortcuts: [
      { key: 'Space', desc: 'カードをめくる（表 / 裏）' },
      { key: 'G', desc: '表面の読み方を表示 / 非表示（めくる前）' },
      { key: 'A', desc: '評価 1 - もう一度 (Again)（裏面表示後）' },
      { key: 'S', desc: '評価 2 - 難しい (Hard)（裏面表示後・通常復習のみ）' },
      { key: 'D', desc: '評価 3 - 良好 (Good)（裏面表示後・通常復習のみ）' },
      { key: 'F', desc: '評価 4 - 簡単 (Easy) / 覚えた（裏面表示後）' },
      { key: 'V', desc: '単語・例文の発音 (Voice)' },
      { key: 'R', desc: '名言を変更' },
      { key: 'Esc', desc: '編集モードを終了' },
    ],
    shortcutNotes: [
      '評価キー（A, S, D, F）はカードを裏返した後にのみ動作します。',
      '「当日復習」モードでは、A（もう一度 - 1）と F（覚えた - 3）の2キーのみ使用します。',
      '入力フォーム（input, textarea）にフォーカスがある間は、ショートカットは自動的に無効化されます。',
    ],
  },
};

const HelpModal = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState('vi');

  if (!isOpen) return null;

  const content = HELP_CONTENT[lang] || HELP_CONTENT.vi;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <BookOpen size={24} color="var(--primary-color)" /> {content.title}
          </h2>
          <div className="modal-header-actions">
            <div className="help-lang-switcher">
              <button
                className={`help-lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => setLang('vi')}
                title="Tiếng Việt"
              >
                🇻🇳 VI
              </button>
              <button
                className={`help-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                title="English"
              >
                🇬🇧 EN
              </button>
              <button
                className={`help-lang-btn ${lang === 'ja' ? 'active' : ''}`}
                onClick={() => setLang('ja')}
                title="日本語"
              >
                🇯🇵 JA
              </button>
            </div>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Section 1: Intro */}
          <section className="help-section">
            <h3>{content.introTitle}</h3>
            <p>{content.introDesc}</p>
          </section>

          {/* Section 2: SM-2 Algorithm */}
          <section className="help-section">
            <h3>{content.sm2Title}</h3>
            <p>{content.sm2Desc}</p>
            <div className="quality-guide-grid">
              <div className="quality-box q1">
                <span className="q-badge">{content.q1.badge}</span>
                <p>{content.q1.desc}</p>
              </div>
              <div className="quality-box q2">
                <span className="q-badge">{content.q2.badge}</span>
                <p>{content.q2.desc}</p>
              </div>
              <div className="quality-box q3">
                <span className="q-badge">{content.q3.badge}</span>
                <p>{content.q3.desc}</p>
              </div>
              <div className="quality-box q4">
                <span className="q-badge">{content.q4.badge}</span>
                <p>{content.q4.desc}</p>
              </div>
            </div>
          </section>

          {/* Section 3: Retry mode */}
          <section className="help-section">
            <h3>{content.retryTitle}</h3>
            <p>{content.retryDesc}</p>
          </section>

          {/* Section 4: Streak System */}
          <section className="help-section">
            <h3>{content.streakTitle}</h3>
            <p>{content.streakDesc}</p>
          </section>

          {/* Section 5: Keyboard Shortcuts */}
          <section className="help-section">
            <h3>{content.shortcutTitle}</h3>
            <p>{content.shortcutDesc}</p>
            <div className="shortcuts-grid">
              {content.shortcuts.map((sc, index) => (
                <div className="shortcut-item" key={index}>
                  <kbd>{sc.key}</kbd> <span>{sc.desc}</span>
                </div>
              ))}
            </div>
            {content.shortcutNotes && (
              <ul className="help-shortcut-notes">
                {content.shortcutNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>{content.btnGotIt}</button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;

