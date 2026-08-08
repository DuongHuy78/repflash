import { useEffect, useId, useRef, useState } from 'react';
import { LogOut, Save, UserRound, X } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileModal = ({ user, onClose, onSave, onLogout, returnFocusRef }) => {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [initialProfile, setInitialProfile] = useState({
    username: user.username || '',
    email: user.email || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef(null);
  const usernameInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);
  const titleId = useId();
  const descriptionId = useId();
  const usernameId = useId();
  const usernameErrorId = useId();
  const emailId = useId();
  const emailHintId = useId();
  const emailErrorId = useId();
  const submitStatusId = useId();

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const isDirty =
    normalizedUsername !== initialProfile.username.trim() ||
    normalizedEmail !== initialProfile.email.trim().toLowerCase();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    const returnFocusElement = returnFocusRef?.current;
    usernameInputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmittingRef.current) {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  const validateForm = () => {
    const nextErrors = {};

    if (!normalizedUsername) {
      nextErrors.username = 'Hãy nhập tên đăng nhập.';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Hãy nhập địa chỉ email.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Email chưa đúng định dạng, ví dụ: ban@example.com.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validateForm()) return;
    if (!isDirty) return;

    setIsSubmitting(true);

    try {
      const updatedUser = await onSave({
        username: normalizedUsername,
        email: normalizedEmail,
      });

      const savedProfile = {
        username: updatedUser?.username || normalizedUsername,
        email: updatedUser?.email || normalizedEmail,
      };

      setUsername(savedProfile.username);
      setEmail(savedProfile.email);
      setInitialProfile(savedProfile);
      setSuccessMessage('Thông tin tài khoản đã được cập nhật.');
    } catch (error) {
      setSubmitError(
        error.message || 'Không thể lưu thay đổi. Hãy kiểm tra lại và thử lần nữa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldFeedback = (fieldName) => {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
    }));
    setSubmitError('');
    setSuccessMessage('');
  };

  const handleLogout = () => {
    if (isDirty) {
      const shouldLogout = window.confirm(
        'Bạn có thay đổi chưa lưu. Đăng xuất ngay và bỏ các thay đổi này?'
      );

      if (!shouldLogout) return;
    }

    onLogout();
  };

  return (
    <div
      className="modal-overlay profile-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="profile-modal__header">
          <div className="profile-modal__heading">
            <span className="profile-modal__icon" aria-hidden="true">
              <UserRound size={22} />
            </span>
            <div>
              <h2 id={titleId}>Thông tin tài khoản</h2>
              <p id={descriptionId}>Cập nhật tên đăng nhập và email của bạn.</p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn profile-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ thông tin tài khoản"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="profile-form__body">
            {submitError && (
              <div className="profile-feedback profile-feedback--error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{submitError}</p>
              </div>
            )}

            {successMessage && (
              <div
                className="profile-feedback profile-feedback--success"
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">✓</span>
                <p>{successMessage}</p>
              </div>
            )}

            <div className="profile-field">
              <label htmlFor={usernameId}>Tên đăng nhập</label>
              <input
                ref={usernameInputRef}
                id={usernameId}
                type="text"
                className="form-control"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  clearFieldFeedback('username');
                }}
                autoComplete="username"
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
              />
              {fieldErrors.username && (
                <p id={usernameErrorId} className="profile-field__error">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div className="profile-field">
              <label htmlFor={emailId}>Email</label>
              <input
                id={emailId}
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldFeedback('email');
                }}
                autoComplete="email"
                inputMode="email"
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email
                    ? `${emailHintId} ${emailErrorId}`
                    : emailHintId
                }
              />
              <p id={emailHintId} className="profile-field__hint">
                Email này được dùng để khôi phục tài khoản khi bạn quên mật khẩu.
              </p>
              {fieldErrors.email && (
                <p id={emailErrorId} className="profile-field__error">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <p id={submitStatusId} className="profile-form__status" aria-live="polite">
              {!isDirty && !successMessage ? 'Bạn chưa thay đổi thông tin nào.' : ''}
            </p>
          </div>

          <footer className="profile-form__actions">
            <button
              type="button"
              className="btn profile-logout-btn"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              <LogOut size={18} aria-hidden="true" />
              Đăng xuất
            </button>

            <div className="profile-form__primary-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary profile-save-btn"
                disabled={isSubmitting || !isDirty}
                aria-describedby={submitStatusId}
              >
                <Save size={18} aria-hidden="true" />
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default ProfileModal;
