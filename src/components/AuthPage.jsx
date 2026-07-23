import React, { useState } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/user';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  // Lấy múi giờ thiết bị (VD: "Asia/Ho_Chi_Minh")
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Các biến State (Trạng thái) lưu trữ dữ liệu người dùng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Chỉ dùng khi đăng ký
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Bạn hãy viết logic kết nối API vào hàm này
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginTab) {
        // [MẪU LOGIC ĐĂNG NHẬP]
        // 1. Gọi API gửi username, password
        const res = await axios.post(`${API_URL}/login`, { username, password, timezone: userTimezone });
        
        // 2. Lấy token từ kết quả trả về (trong res.data có chứa userInfo.token)
        const token = res.data.token;
        
        // 3. Gọi hàm báo cáo lên App.jsx kèm theo cái token đó
        onLoginSuccess(token);

      } else {
        console.log("Vào đăng ký");
        // [MẪU LOGIC ĐĂNG KÝ]
        // 1. Gọi API gửi username, password, email
        await axios.post(`${API_URL}/register`, { username, password, email, timezone: userTimezone  });
        
        // 2. Báo thành công và chuyển sang form đăng nhập
        alert('Đăng ký thành công! Hãy đăng nhập nhé.');
        setIsLoginTab(true);
        setIsLoading(false);
      }
    } catch (err) {
      // 3. Nếu API báo lỗi, lấy thông báo lỗi từ Backend để hiển thị
      setError(err.response?.data || 'Có lỗi xảy ra, vui lòng thử lại.');
      console.log(err.response?.data || err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        
        {/* Phần Tiêu đề */}
        <div className="auth-header">
          <h2>Flashcard App</h2>
          <p>Học từ vựng hiệu quả vào đúng thời điểm</p>
        </div>

        {/* Nút Chuyển đổi Đăng nhập / Đăng ký */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(true);
              setError('');
            }}
          >
            Đăng Nhập
          </button>
          <button 
            className={`auth-tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(false);
              setError('');
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* Hiển thị lỗi (nếu có) */}
        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form nhập liệu */}
        <form className="auth-form" onSubmit={handleSubmit}>
          
          <div className="auth-form-group">
            <label>Tên đăng nhập</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {!isLoginTab && (
            <div className="auth-form-group">
              <label>Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Đang xử lý...' 
              : (isLoginTab ? 'Vào Học Ngay 🚀' : 'Tạo Tài Khoản Mới ✨')
            }
          </button>

        </form>

      </div>
    </div>
  );
};

export default AuthPage;
