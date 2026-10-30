import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Login from './pages/Login';
import Register from './pages/Register'; // شاشة تسجيل الطالب الجديد
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import './Login.css';

function App() {
  const [screen, setScreen] = useState('login'); 
  const [userType, setUserType] = useState('student'); 
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // استعادة الجلسة من التخزين المؤقت أو المحلي لضمان عدم الخروج عند الـ Refresh
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    const savedType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
    
    if (savedUser && savedType) {
      try {
        const parsed = JSON.parse(savedUser);
        setLoggedInUser(parsed);
        setUserType(savedType);
        
        if (savedType === 'admin') setScreen('dashboard_admin');
        else if (savedType === 'teacher') setScreen('dashboard_teacher');
        else setScreen('dashboard_student');
      } catch (e) {
        console.error("Error parsing saved session", e);
      }
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // دالة تسجيل الخروج المركزية: تنظيف الجلسة والتخزين المحلي بأمان
  const logout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userType');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setLoggedInUser(null);
    setScreen('login');
    showNotification("تم تسجيل خروجك من النظام بأمان", "success");
  };

  const formatTime12H = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      let hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'مساًء (PM)' : 'صباحاً (AM)';
      hour = hour % 12;
      hour = hour ? hour : 12; 
      return `${hour}:${minutes} ${ampm}`;
    } catch (e) { return timeString; }
  };

  const formatDateArabic = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', options);
    } catch (e) { return dateString; }
  };

  return (
    <div className="app-main-wrapper">
      {/* التنبيهات المخصصة */}
      {toast.show && (
        <div className={`custom-system-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle className="toast-icon" /> : <FaTimesCircle className="toast-icon" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* شاشات النظام */}
      {screen === 'login' && (
        <Login 
          setScreen={setScreen} userType={userType} setUserType={setUserType} 
          setLoggedInUser={setLoggedInUser} showNotification={showNotification} 
        />
      )}

      {/* التعديل هنا: تم توحيد المسمى إلى 'register_student' ليطابق القيمة المرسلة من شاشة Login */}
      {screen === 'register_student' && (
        <Register setScreen={setScreen} showNotification={showNotification} />
      )}

      {screen === 'forgot_password' && (
        <ForgotPassword 
          setScreen={setScreen} userType={userType} 
          setUserType={setUserType} showNotification={showNotification} 
        />
      )}

      {screen === 'dashboard_admin' && (
        <AdminDashboard 
          loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} userType={userType}
          logout={logout} showNotification={showNotification} 
          formatDateArabic={formatDateArabic} formatTime12H={formatTime12H} 
        />
      )}

      {screen === 'dashboard_teacher' && loggedInUser && (
        <TeacherDashboard 
          loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} userType={userType}
          logout={logout} showNotification={showNotification} 
          formatDateArabic={formatDateArabic} formatTime12H={formatTime12H} 
        />
      )}

      {screen === 'dashboard_student' && loggedInUser && (
        <StudentDashboard 
          loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} userType={userType}
          logout={logout} showNotification={showNotification} 
          formatDateArabic={formatDateArabic} formatTime12H={formatTime12H} 
        />
      )}
    </div>
  );
}

export default App;