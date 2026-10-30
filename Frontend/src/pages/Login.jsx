import React, { useState } from 'react';
import { 
  FaUser, 
  FaEye, 
  FaEyeSlash, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaUserShield, 
  FaArrowRight
} from 'react-icons/fa';
import { API_BASE_URL } from '../apiConfig';

function Login({ setScreen, userType, setUserType, setLoggedInUser, showNotification }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🕵️ حالة التحكم في ظهور بوابة الإشراف المخفية
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // دالة التعامل مع نقرات العنوان للوصول السرّي للمشرف
  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    if (newCount === 3) {
      if (!isAdminVisible) {
        setIsAdminVisible(true);
        setUserType('admin'); 
        setEmail('');
        setPassword('');
        showNotification("🔒 تم تفعيل بوابة المشرف السرية بنجاح", "success");
      } else {
        closeAdminPortal();
      }
      setClickCount(0);
    } else {
      setClickCount(newCount);
      setTimeout(() => setClickCount(0), 1500);
    }
  };

  // دالة إغلاق بوابة المشرف
  const closeAdminPortal = () => {
    setIsAdminVisible(false);
    setUserType('student');
    setEmail('');
    setPassword('');
    showNotification("🔓 تم إغلاق وتأمين بوابة المشرف والعودة للواجهة العامة", "success");
  };

  // دالة التعامل مع تقديم نموذج تسجيل الدخول
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userType, email: email.trim(), password })
      });
      const result = await response.json();
      if (result.success) {
        showNotification("تم تسجيل الدخول بنجاح، مرحباً بك", "success");
        
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userType', userType);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        sessionStorage.setItem('userType', userType);
        
        setLoggedInUser(result.user);
        if (userType === 'admin') setScreen('dashboard_admin');
        else if (userType === 'teacher') setScreen('dashboard_teacher');
        else setScreen('dashboard_student');
      } else {
        showNotification(`فشل الدخول: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("🔴 خطأ في الاتصال بالسيرفر:", error);
      showNotification("تعذّر الاتصال بالخادم، تأكد من تشغيل السيرفر ثم حاول مجدداً", "error");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="modern-auth-container" dir="rtl">
      <div className="modern-auth-card" style={{ position: 'relative' }}>

        {/* ترويسة النموذج */}
        <div className="auth-header" style={{ textAlign: 'center', marginTop: '10px' }}>
          <h2 
            onClick={handleTitleClick} 
            style={{ cursor: 'default', userSelect: 'none' }} 
            title="المنظومة الأكاديمية"
          >
            ISALMS
          </h2>
          <p>
            {isAdminVisible 
              ? "منطقة الوصول الخاص - يرجى إدخال بيانات الاعتماد الإدارية للمشرف"
              : "أهلاً بك مجدداً، اختر صلاحيتك وسجل الدخول لإدارة ومتابعة شؤونك التعليمية"
            }
          </p>
        </div>
        
        {/* أزرار التبديل بين الأدوار (طالب / أستاذ / مشرف) */}
        <div className="role-switcher">
          {!isAdminVisible ? (
            <>
              <button 
                type="button" 
                className={userType === 'student' ? 'role-tab active' : 'role-tab'} 
                onClick={() => { setUserType('student'); setEmail(''); setPassword(''); }}
              >
                <FaGraduationCap style={{ marginLeft: '5px' }} />  
                طالب
              </button>

              <button 
                type="button" 
                className={userType === 'teacher' ? 'role-tab active' : 'role-tab'} 
                onClick={() => { setUserType('teacher'); setEmail(''); setPassword(''); }}
              >
                <FaChalkboardTeacher style={{ marginLeft: '5px' }} />  
                أستاذ
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="role-tab active admin-btn" 
                style={{ flex: 1, backgroundColor: '#e53e3e', color: '#fff', cursor: 'default' }}
              >
                <FaUserShield style={{ marginLeft: '5px' }} /> 
                لوحة المشرف العام
              </button>
              
              <button
                type="button"
                onClick={closeAdminPortal}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#edf2f7',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="العودة للواجهة العامة"
              >
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>

        {/* نموذج أدخال البيانات */}
        <form onSubmit={handleLoginSubmit} style={{ marginTop: '10px' }}>
          
          {/* حقل اسم المستخدم / البريد */}
          <div className="input-field">
            <label>
              {userType === 'student' 
                ? "الرقم الجامعي :" 
                : userType === 'teacher' 
                ? "البريد الإلكتروني للأستاذ :" 
                : "البريد الإلكتروني للمشرف :"}
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder={
                  userType === 'student' 
                    ? "أدخل الرقم الجامعي" 
                    : userType === 'teacher'
                    ? "أدخل البريد الإلكتروني الخاص بالأستاذ"
                    : "أدخل البريد الإلكتروني الخاص بالمشرف"
                } 
                style={{ paddingLeft: '45px' }}
              />
              <FaUser style={{
                position: 'absolute', 
                left: '15px', 
                top: '15px', 
                color: '#a0aec0'
              }} />
            </div>
          </div>
          
          {/* حقل كلمة المرور */}
          <div className="input-field">
            <label>ادخل كلمة المرور:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                style={{ paddingLeft: '45px' }} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#a0aec0' 
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* روابط النسيان والتسجيل */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            {userType !== 'admin' ? (
              <a 
                href="#forgot" 
                onClick={(e) => { e.preventDefault(); setScreen('forgot_password'); }} 
                className="forgot-password-link" 
                style={{ fontSize: '14px' }}
              >
                نسيت كلمة السر
              </a>
            ) : <div />} 
            
            {(userType === 'student' && !isAdminVisible) && (
              <button 
                type="button" 
                onClick={() => setScreen('register_student')} 
                className="register-account-link" 
                style={{ background: 'none', border: 'none', fontSize: '14px', color: '#3182ce', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                إنشاء حساب جديد
              </button>
            )}
          </div>

          {/* زر تسجيل الدخول */}
          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            style={{ backgroundColor: userType === 'admin' ? '#e53e3e' : '#3182ce' }}
            disabled={loading}
          >
            {loading 
              ? "جاري الدخول..." 
              : userType === 'admin' 
              ? "دخول بوابة الحماية" 
              : "تسجيل الدخول"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;