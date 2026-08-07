import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/user';

const getResetTokenFromUrl = () => {
  if (window.location.pathname !== '/reset-password') return '';
  return new URLSearchParams(window.location.search).get('token') || '';
};

const getErrorMessage = (error) => {
  const responseData = error.response?.data;
  if (typeof responseData === 'string') return responseData;
  return responseData?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

const AuthPage = ({ onLoginSuccess }) => {
  const [resetToken] = useState(getResetTokenFromUrl);
  const [authMode, setAuthMode] = useState(() =>
    window.location.pathname === '/reset-password' ? 'reset' : 'login'
  );
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Token chỉ cần tồn tại trong state khi user đang đặt lại mật khẩu.
  useEffect(() => {
    if (authMode === 'reset' && resetToken) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [authMode, resetToken]);

  const changeAuthMode = (nextMode) => {
    setAuthMode(nextMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');

    if (nextMode !== 'reset') {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const response = await axios.post(`${API_URL}/login`, {
          username,
          password,
          timezone: userTimezone,
        });

        onLoginSuccess(response.data.token);
        return;
      }

      if (authMode === 'register') {
        await axios.post(`${API_URL}/register`, {
          username,
          password,
          email,
          timezone: userTimezone,
        });

        setSuccessMessage('Đăng ký thành công! Hãy đăng nhập nhé.');
        setAuthMode('login');
        setPassword('');
        return;
      }

      if (authMode === 'forgot') {
        await axios.post(`${API_URL}/forgot-password`, { email });
        setSuccessMessage(
          'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.'
        );
        return;
      }

      if (!resetToken) {
        throw new Error('Link đặt lại mật khẩu không hợp lệ.');
      }

      if (password !== confirmPassword) {
        throw new Error('Hai mật khẩu mới chưa khớp nhau.');
      }

      await axios.put(`${API_URL}/reset-password`, {
        token: resetToken,
        newPassword: password,
      });

      window.history.replaceState(null, '', '/');
      setAuthMode('login');
      setPassword('');
      setConfirmPassword('');
      setSuccessMessage('Đặt lại mật khẩu thành công. Hãy đăng nhập lại.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginTab = authMode === 'login';
  const isRegisterTab = authMode === 'register';
  const isForgotPassword = authMode === 'forgot';
  const isResetPassword = authMode === 'reset';

  const title = isForgotPassword
    ? 'Quên mật khẩu'
    : isResetPassword
      ? 'Đặt lại mật khẩu'
      : 'Flashcard App';

  const subtitle = isForgotPassword
    ? 'Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.'
    : isResetPassword
      ? 'Tạo mật khẩu mới cho tài khoản của bạn.'
      : 'Học từ vựng hiệu quả vào đúng thời điểm';

  const submitLabel = isLoading
    ? 'Đang xử lý...'
    : isForgotPassword
      ? 'Gửi link đặt lại mật khẩu'
      : isResetPassword
        ? 'Đặt lại mật khẩu'
        : isLoginTab
          ? 'Vào Học Ngay 🚀'
          : 'Tạo Tài Khoản Mới ✨';

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {!isForgotPassword && !isResetPassword && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`}
              onClick={() => changeAuthMode('login')}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${isRegisterTab ? 'active' : ''}`}
              onClick={() => changeAuthMode('register')}
            >
              Đăng Ký
            </button>
          </div>
        )}

        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {successMessage && (
          <div className="auth-success">
            <span>✓</span> {successMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isForgotPassword && !isResetPassword && (
            <div className="auth-form-group">
              <label>Tên đăng nhập</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập username..."
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
          )}

          {(isRegisterTab || isForgotPassword) && (
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          )}

          {!isForgotPassword && (
            <div className="auth-form-group">
              <label>{isResetPassword ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
              <input
                type="password"
                className="form-control"
                placeholder={isResetPassword ? 'Ít nhất 8 ký tự...' : 'Nhập mật khẩu...'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isResetPassword ? 8 : undefined}
                required
              />
            </div>
          )}

          {isResetPassword && (
            <div className="auth-form-group">
              <label>Nhập lại mật khẩu mới</label>
              <input
                type="password"
                className="form-control"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength="8"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {submitLabel}
          </button>

          {isLoginTab && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => changeAuthMode('forgot')}
            >
              Quên mật khẩu?
            </button>
          )}

          {(isForgotPassword || isResetPassword) && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => changeAuthMode('login')}
            >
              Quay lại đăng nhập
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
