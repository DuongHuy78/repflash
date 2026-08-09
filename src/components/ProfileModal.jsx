import { useEffect, useId, useRef, useState } from 'react';
import { KeyRound, LogOut, Save, UserRound, X } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const ProfileModal = ({ user, onClose, onSave, onChangePassword, onLogout, returnFocusRef }) => {
  const [mode, setMode] = useState('profile');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [initialProfile, setInitialProfile] = useState({
    username: user.username || '',
    email: user.email || '',
  });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [passwordSubmitError, setPasswordSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef(null);
  const usernameInputRef = useRef(null);
  const currentPasswordInputRef = useRef(null);
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
  const currentPasswordId = useId();
  const currentPasswordErrorId = useId();
  const newPasswordId = useId();
  const newPasswordHintId = useId();
  const newPasswordErrorId = useId();
  const confirmPasswordId = useId();
  const confirmPasswordErrorId = useId();

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const isDirty =
    normalizedUsername !== initialProfile.username.trim() ||
    normalizedEmail !== initialProfile.email.trim().toLowerCase();
  const isPasswordFormReady =
    passwordForm.currentPassword &&
    passwordForm.newPassword.length >= 8 &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    const returnFocusElement = returnFocusRef?.current;

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

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      if (mode === 'password') currentPasswordInputRef.current?.focus();
      else usernameInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [mode]);

  const validateProfileForm = () => {
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

  const validatePasswordForm = () => {
    const nextErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Hãy nhập mật khẩu hiện tại.';
    }

    if (!passwordForm.newPassword) {
      nextErrors.newPassword = 'Hãy nhập mật khẩu mới.';
    } else if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    }

    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Hãy nhập lại mật khẩu mới.';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Mật khẩu mới chưa khớp.';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validateProfileForm() || !isDirty) return;

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

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSubmitError('');

    if (!validatePasswordForm()) return;

    setIsSubmitting(true);

    try {
      await onChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
    } catch (error) {
      const message = error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';

      if (message === 'Mật khẩu hiện tại không đúng.') {
        setPasswordErrors({ currentPassword: message });
      } else if (message === 'Mật khẩu mới phải khác mật khẩu hiện tại.') {
        setPasswordErrors({ newPassword: message });
      } else {
        setPasswordSubmitError(message);
      }
      setIsSubmitting(false);
    }
  };

  const clearProfileFieldFeedback = (fieldName) => {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
    }));
    setSubmitError('');
    setSuccessMessage('');
  };

  const handlePasswordFieldChange = (fieldName, value) => {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setPasswordErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
      ...(fieldName === 'newPassword' ? { confirmPassword: '' } : {}),
    }));
    setPasswordSubmitError('');
  };

  const openPasswordMode = () => {
    setSubmitError('');
    setSuccessMessage('');
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
    setPasswordSubmitError('');
    setIsPasswordVisible({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setMode('password');
  };

  const returnToProfile = () => {
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
    setPasswordSubmitError('');
    setMode('profile');
  };

  const togglePasswordVisibility = (fieldName) => {
    setIsPasswordVisible((currentVisibility) => ({
      ...currentVisibility,
      [fieldName]: !currentVisibility[fieldName],
    }));
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

  const isPasswordMode = mode === 'password';
  const headerTitle = isPasswordMode ? 'Đổi mật khẩu' : 'Thông tin tài khoản';
  const headerDescription = isPasswordMode
    ? 'Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.'
    : 'Cập nhật tên đăng nhập và email của bạn.';

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
              {isPasswordMode ? <KeyRound size={22} /> : <UserRound size={22} />}
            </span>
            <div>
              <h2 id={titleId}>{headerTitle}</h2>
              <p id={descriptionId}>{headerDescription}</p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn profile-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={isPasswordMode ? 'Đóng cửa sổ đổi mật khẩu' : 'Đóng cửa sổ thông tin tài khoản'}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {!isPasswordMode ? (
          <form className="profile-form" onSubmit={handleProfileSubmit} noValidate>
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
                    clearProfileFieldFeedback('username');
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
                    clearProfileFieldFeedback('email');
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

              <section className="profile-security" aria-labelledby="profile-security-title">
                <h3 id="profile-security-title">Bảo mật</h3>
                <p>Đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
                <button
                  type="button"
                  className="btn btn-secondary profile-security__button"
                  onClick={openPasswordMode}
                  disabled={isSubmitting}
                >
                  <KeyRound size={18} aria-hidden="true" />
                  Đổi mật khẩu
                </button>
              </section>

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
        ) : (
          <form className="profile-form" onSubmit={handlePasswordSubmit} noValidate>
            <div className="profile-form__body">
              {passwordSubmitError && (
                <div className="profile-feedback profile-feedback--error" role="alert">
                  <span aria-hidden="true">!</span>
                  <p>{passwordSubmitError}</p>
                </div>
              )}

              <div className="profile-password-notice">
                <span aria-hidden="true">!</span>
                <p>
                  <strong>Bạn sẽ được đăng xuất sau khi đổi mật khẩu.</strong>
                  <br />
                  Hãy đăng nhập lại bằng mật khẩu mới.
                  {isDirty && (
                    <><br />Các thay đổi hồ sơ chưa lưu sẽ không được lưu.</>
                  )}
                </p>
              </div>

              <div className="profile-field">
                <label htmlFor={currentPasswordId}>Mật khẩu hiện tại</label>
                <div className="profile-password-input">
                  <input
                    ref={currentPasswordInputRef}
                    id={currentPasswordId}
                    type={isPasswordVisible.currentPassword ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.currentPassword}
                    onChange={(event) => handlePasswordFieldChange('currentPassword', event.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                    aria-describedby={passwordErrors.currentPassword ? currentPasswordErrorId : undefined}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    disabled={isSubmitting}
                    aria-label={isPasswordVisible.currentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                  >
                    {isPasswordVisible.currentPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p id={currentPasswordErrorId} className="profile-field__error">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="profile-field">
                <label htmlFor={newPasswordId}>Mật khẩu mới</label>
                <div className="profile-password-input">
                  <input
                    id={newPasswordId}
                    type={isPasswordVisible.newPassword ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.newPassword}
                    onChange={(event) => handlePasswordFieldChange('newPassword', event.target.value)}
                    autoComplete="new-password"
                    minLength="8"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    aria-describedby={passwordErrors.newPassword ? `${newPasswordHintId} ${newPasswordErrorId}` : newPasswordHintId}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    disabled={isSubmitting}
                    aria-label={isPasswordVisible.newPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  >
                    {isPasswordVisible.newPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <p id={newPasswordHintId} className="profile-field__hint">
                  Dùng ít nhất 8 ký tự.
                </p>
                {passwordErrors.newPassword && (
                  <p id={newPasswordErrorId} className="profile-field__error">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="profile-field">
                <label htmlFor={confirmPasswordId}>Nhập lại mật khẩu mới</label>
                <div className="profile-password-input">
                  <input
                    id={confirmPasswordId}
                    type={isPasswordVisible.confirmPassword ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => handlePasswordFieldChange('confirmPassword', event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    aria-describedby={passwordErrors.confirmPassword ? confirmPasswordErrorId : undefined}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    disabled={isSubmitting}
                    aria-label={isPasswordVisible.confirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                  >
                    {isPasswordVisible.confirmPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p id={confirmPasswordErrorId} className="profile-field__error">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <footer className="profile-form__actions profile-password-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={returnToProfile}
                disabled={isSubmitting}
              >
                Quay lại hồ sơ
              </button>
              <button
                type="submit"
                className="btn btn-primary profile-save-btn"
                disabled={isSubmitting || !isPasswordFormReady}
              >
                <KeyRound size={18} aria-hidden="true" />
                {isSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
};

export default ProfileModal;
