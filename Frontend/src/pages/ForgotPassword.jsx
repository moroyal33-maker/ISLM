import React, { useState } from 'react';
import { API_BASE_URL } from '../apiConfig';

function ForgotPassword({ setScreen, userType, showNotification }) {
  const [loading, setLoading] = useState(false);

  // حالة نموذج استعادة كلمة المرور
  const [forgotForm, setForgotForm] = useState({
    step: 1, 
    identifier: '', 
    fetchedQuestion: '', 
    userAnswer: '', 
    newPassword: ''
  });

  // دالة إرجاع اسم نوع المستخدم بالعربية
  const getUserRoleLabel = () => {
    switch (userType) {
      case 'student':
        return 'الطلاب';
      case 'teacher':
        return 'أعضاء هيئة التدريس';
      case 'admin':
        return 'المشرفين للنظام';
      default:
        return '';
    }
  };

  // 1. التحقق من المستخدم وجلب سؤال الأمان
  const handleForgotPasswordVerifyUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userType, identifier: forgotForm.identifier.trim() })
      });
      
      const result = await response.json();
      console.log("Verify Response Result:", result);

      if (response.ok && result.success) {
        const extractedQuestion = result.question || result.securityQuestion || result.data?.question;

        if (extractedQuestion) {
          showNotification('تم العثور على الحساب بنجاح، يرجى الإجابة على سؤال الأمان', "success");
          setForgotForm({ ...forgotForm, step: 2, fetchedQuestion: extractedQuestion });
        } else {
          showNotification('الحساب موجود ولكن لا يوجد سؤال أمان مسجل له', "error");
          setForgotForm({ ...forgotForm, step: 2, fetchedQuestion: 'لم يتم العثور على سؤال أمان مسجل لهذا الحساب. يرجى التواصل مع الدعم.' });
        }
      } else { 
        let errorMsg = 'البريد الإلكتروني المدخل غير مسجل بالنظام';
        if (userType === 'student') {
          errorMsg = 'الرقم الجامعي المدخل غير مسجل بالنظام';
        } else if (userType === 'admin') {
          errorMsg = 'البريد الإلكتروني الخاص بالمشرف غير مسجل بالنظام';
        }
        showNotification(errorMsg, "error"); 
      }
    } catch (error) { 
      console.error("Verification Error:", error);
      showNotification('خطأ أثناء استدعاء بيانات الحساب المفقود', "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  // 2. مطابقة إجابة سؤال الأمان
  const handleForgotPasswordCheckAnswer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: userType, 
          identifier: forgotForm.identifier.trim(), 
          answer: forgotForm.userAnswer.trim() 
        })
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        showNotification('إجابة أمنية متطابقة! يمكنك الآن تعيين كلمة المرور الجديدة', "success");
        setForgotForm({ ...forgotForm, step: 3 });
      } else { 
        showNotification(result.message || 'عذراً، إجابة التحقق الأمني غير صحيحة', "error"); 
      }
    } catch (error) { 
      showNotification('حدث خطأ أثناء مطابقة الإجابة السرية', "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  // 3. إعادة تعيين كلمة المرور الجديدة
  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: userType, 
          identifier: forgotForm.identifier.trim(), 
          newPassword: forgotForm.newPassword 
        })
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        showNotification('تم إعادة تعيين كلمة المرور الجديدة بنجاح', "success");
        setScreen('login');
        setForgotForm({ step: 1, identifier: '', fetchedQuestion: '', userAnswer: '', newPassword: '' });
      } else { 
        showNotification(result.message || 'فشل حفظ كلمة المرور الجديدة في الخادم', "error"); 
      }
    } catch (error) { 
      showNotification('حدث خطأ أثناء تحديث كلمة المرور الجديدة', "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="modern-auth-container" dir="rtl">
      <div className="modern-auth-card">

        {/* ترويسة النموذج */}
        <div className="auth-header text-center">
          <h2>استعادة حساب {getUserRoleLabel()}</h2>
          <p>يرجى إكمال خطوات التحقق الأمني لاسترجاع صلاحيات حسابك الأكاديمي</p>
        </div>

        {/* الخطوة الأولى: إدخال المعرف */}
        {forgotForm.step === 1 && (
          <form onSubmit={handleForgotPasswordVerifyUser}>
            <div className="input-field">
              <label>
                {userType === 'student' 
                  ? 'أدخل الرقم الجامعي الخاص بك:' 
                  : userType === 'admin' 
                    ? 'أدخل البريد الإلكتروني الرسمي للمشرف:' 
                    : 'أدخل البريد الإلكتروني المعتمد للأستاذ:'}
              </label>
              <input 
                type={userType === 'student' ? 'text' : 'email'} 
                placeholder={
                  userType === 'student' 
                    ? 'مثال: 44100234' 
                    : userType === 'admin' 
                      ? 'admin@univ.edu' 
                      : 'teacher@univ.edu'
                } 
                value={forgotForm.identifier} 
                onChange={(e) => setForgotForm({...forgotForm, identifier: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-warning btn-block" disabled={loading}>
              {loading ? 'جاري الاستدعاء...' : 'فحص سؤال الأمان'}
            </button>
          </form>
        )}

        {/* الخطوة الثانية: عرض سؤال الأمان والإجابة */}
        {forgotForm.step === 2 && (
          <form onSubmit={handleForgotPasswordCheckAnswer}>
            <div className="alert-info-box">
              <strong>سؤال التحقق المسجل لحسابك هو:</strong>
              <p style={{ marginTop: '8px', fontWeight: '500', color: '#2b6cb0' }}>
                {forgotForm.fetchedQuestion}
              </p>
            </div>
            <div className="input-field">
              <label>الإجابة الأمنية المطابقة المعتمدة:</label>
              <input 
                type="text" 
                placeholder="اكتب إجابة السؤال السرية هنا" 
                value={forgotForm.userAnswer} 
                onChange={(e) => setForgotForm({...forgotForm, userAnswer: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-success btn-block" disabled={loading}>
              {loading ? 'جاري المطابقة...' : 'تأكيد الإجابة والتحقق'}
            </button>
          </form>
        )}

        {/* الخطوة الثالثة: تعيين كلمة المرور الجديدة */}
        {forgotForm.step === 3 && (
          <form onSubmit={handleForgotPasswordReset}>
            <div className="input-field">
              <label>تعيين كلمة المرور الجديدة والمؤمنة:</label>
              <input 
                type="password" 
                placeholder="أدخل كلمة مرور قوية وجديدة" 
                value={forgotForm.newPassword} 
                onChange={(e) => setForgotForm({...forgotForm, newPassword: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'جاري التحديث...' : 'تغيير كلمة السر وحفظ البيانات'}
            </button>
          </form>
        )}

        {/* رابط العودة لشاشة الدخول */}
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <a 
            href="#back" 
            className="back-link" 
            onClick={(e) => { 
              e.preventDefault();
              setScreen('login'); 
              setForgotForm({ step: 1, identifier: '', fetchedQuestion: '', userAnswer: '', newPassword: '' }); 
            }}
          >
            العودة لشاشة الدخول
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;