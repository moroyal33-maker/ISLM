import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaBook, 
  FaCalendarAlt, 
  FaLock, 
  FaQuestionCircle, 
  FaSave, 
  FaSignOutAlt, 
  FaBars,  
  FaTimes,
  FaShieldAlt,
  FaArrowRight,
  FaGraduationCap,
  FaFilePdf
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi'; 
import html2pdf from 'html2pdf.js';

function TeacherDashboard({ loggedInUser, setLoggedInUser, logout, showNotification }) {
  // ----------------------------------------------------
  // 1. البيانات الثابتة باللغة العربية
  // ----------------------------------------------------
  const timeSlots = [
    { id: '1', label: 'الفترة الأولى', time: '07:00 - 08:45', start: '07:00' },
    { id: '2', label: 'الفترة الثانية', time: '09:00 - 10:45', start: '09:00' },
    { id: '3', label: 'الفترة الثالثة', time: '11:15 - 01:00', start: '11:15' },
    { id: '4', label: 'الفترة الرابعة', time: '01:15 - 03:00', start: '13:15' }
  ];

  const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  const questionsList = [
    'ما هو اسم أول مدرسة درست بها؟',
    'ما هو اسم مدينتك المفضلة؟',
    'ما هو اسم حيوانك الأليف الأول؟',
    'ما هو اسم كتابك المفصل؟',
    'ما هو اسم صديق طفولتك المقرب؟'
  ];

  // ----------------------------------------------------
  // 2. الحالات والبيانات المحلية (States & Effects)
  // ----------------------------------------------------
  const [teacherLectures, setTeacherLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [securitySubView, setSecuritySubView] = useState('overview');

  const [profileForm, setProfileForm] = useState({
    name: loggedInUser?.name || ''
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    securityQuestion: loggedInUser?.security_question || questionsList[0],
    securityAnswer: ''
  });

  useEffect(() => {
    if (loggedInUser) {
      setProfileForm({
        name: loggedInUser.name || ''
      });
      setSecurityForm(prev => ({
        ...prev,
        securityQuestion: loggedInUser.security_question || questionsList[0]
      }));
      fetchTeacherLectures(loggedInUser.id);
    }
  }, [loggedInUser]);

  // ----------------------------------------------------
  // 🛠️ 3. دوال مطابقة الأيام والأوقات للجدول الشبكي
  // ----------------------------------------------------
  const normalizeDay = (dayStr) => {
    if (!dayStr) return '';
    const clean = String(dayStr).trim().toLowerCase();

    const dayMap = {
      'السبت': 'saturday', 'saturday': 'saturday', 'sat': 'saturday',
      'الأحد': 'sunday', 'الاحد': 'sunday', 'sunday': 'sunday', 'sun': 'sunday',
      'الإثنين': 'monday', 'الاثنين': 'monday', 'monday': 'monday', 'mon': 'monday',
      'الثلاثاء': 'tuesday', 'tuesday': 'tuesday', 'tue': 'tuesday',
      'الأربعاء': 'wednesday', 'الاربعاء': 'wednesday', 'wednesday': 'wednesday', 'wed': 'wednesday',
      'الخميس': 'thursday', 'thursday': 'thursday', 'thu': 'thursday'
    };

    return dayMap[clean] || clean;
  };

  const parseTo24Hour = (timeStr) => {
    if (!timeStr) return null;
    const str = String(timeStr).trim().toLowerCase();

    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const isPM = str.includes('pm') || str.includes('م');
    const isAM = str.includes('am') || str.includes('ص');

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return hour;
  };

  const getLectureForSlot = (dayName, timeSlot) => {
    const targetDayNormalized = normalizeDay(dayName);
    const slotStartHour = parseTo24Hour(timeSlot.start);

    return teacherLectures.find(lec => {
      const rawDay = lec.lecture_day || lec.day || lec.day_name;
      const lecDayNormalized = normalizeDay(rawDay);
      if (lecDayNormalized !== targetDayNormalized) return false;

      const rawTime = lec.start_time || lec.time || lec.from_time || lec.slot_start;
      const lecStartHour = parseTo24Hour(rawTime);

      if (lecStartHour !== null && slotStartHour !== null) {
        return lecStartHour === slotStartHour;
      }

      return false;
    });
  };

  // ----------------------------------------------------
  // 📄 4. دالة استخراج جدول المحاضرات إلى ملف PDF
  // ----------------------------------------------------
  const exportScheduleToPDF = () => {
    const element = document.getElementById('schedule-table-container');
    if (!element) return;

    setIsExportingPdf(true);

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `جدول_${loggedInUser?.name || 'الأستاذ'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsExportingPdf(false);
      if (showNotification) showNotification("تم تصدير جدول المحاضرات إلى PDF بنجاح", "success");
    }).catch((err) => {
      console.error(err);
      setIsExportingPdf(false);
      if (showNotification) showNotification("حدث خطأ أثناء تصدير ملف الـ PDF", "error");
    });
  };

  // ----------------------------------------------------
  // 5. دوال التعامل مع الاتصال والخادم (API Methods)
  // ----------------------------------------------------
  const fetchTeacherLectures = async (teacherId) => {
    try {
      setLoadingLectures(true);
      setIsRefreshing(true); 
      const response = await fetch(`http://localhost:5000/api/lectures/teacher/${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setTeacherLectures(data);
      } else {
        if (showNotification) showNotification("فشل تحميل الجدول الدراسي الخاص بك", "error");
      }
    } catch (error) {
      if (showNotification) showNotification("خطأ أثناء جلب الجدول الدراسي الخاص بك", "error");
    } finally {
      setLoadingLectures(false);
      setIsRefreshing(false); 
    }
  };

  const handleUpdateTeacherProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loggedInUser.id,
          role: 'teacher',
          name: profileForm.name,
          email: loggedInUser.email,
          degree: loggedInUser.degree || ''
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        if (showNotification) showNotification("تم تحديث الاسم الشخصي بنجاح", "success");
        const updatedUser = { ...loggedInUser, name: profileForm.name };
        localStorage.setItem('user', JSON.stringify(updatedUser)); 
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser); 
      } else {
        if (showNotification) showNotification(data.message || "فشل تحديث البيانات الشخصية للأستاذ", "error");
      }
    } catch (error) {
      if (showNotification) showNotification("حدث خطأ أثناء الاتصال بالسيرفر", "error");
    }
  };

  const handleUpdateTeacherSecurity = async (e) => {
    e.preventDefault();

    if (securitySubView === 'change_password') {
      if (!securityForm.currentPassword) {
        if (showNotification) showNotification("يرجى إدخال كلمة المرور الحالية لتتمكن من التحديث", "error");
        return;
      }
      if (!securityForm.newPassword) {
        if (showNotification) showNotification("يرجى إدخال كلمة المرور الجديدة", "error");
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        if (showNotification) showNotification("كلمة المرور الجديدة وتأكيدها غير متطابقين!", "error");
        return;
      }
    }

    if (securitySubView === 'change_security_question') {
      if (!securityForm.securityAnswer.trim()) {
        if (showNotification) showNotification("يرجى كتابة إجابة سؤال الأمان الجديدة", "error");
        return;
      }
    }

    try {
      const payload = {
        id: loggedInUser.id,
        role: 'teacher',
        name: loggedInUser.name,
        email: loggedInUser.email,
        degree: loggedInUser.degree || '',
        current_password: securityForm.currentPassword
      };

      if (securitySubView === 'change_password') {
        payload.password = securityForm.newPassword;
      }

      if (securitySubView === 'change_security_question') {
        payload.security_question = securityForm.securityQuestion;
        payload.security_answer = securityForm.securityAnswer.trim();
      }

      const response = await fetch(`http://localhost:5000/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        if (showNotification) showNotification("🔒 تم تحديث البيانات الأمنية بنجاح", "success");
        
        const updatedUser = { 
          ...loggedInUser, 
          security_question: payload.security_question || loggedInUser.security_question 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser)); 
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser); 
        
        setSecurityForm(prev => ({ 
          ...prev, 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '', 
          securityAnswer: '' 
        }));

        setSecuritySubView('overview');
      } else {
        if (showNotification) showNotification(data.message || "فشل تحديث البيانات الأمنية لحسابك", "error");
      }
    } catch (error) {
      if (showNotification) showNotification("حدث خطأ أثناء الاتصال بالسيرفر", "error");
    }
  };

  return (
    <div className="modern-dashboard-layout" style={{ direction: 'rtl', display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#f7fafc' }}>
      
      {/* زر المزامنة الفوري العائم */}
      <button
        onClick={() => fetchTeacherLectures(loggedInUser.id)}
        disabled={isRefreshing || loadingLectures}
        style={{
          position: 'fixed', bottom: '25px', left: '25px',
          zIndex: 999,
          backgroundColor: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '50px',
          padding: '12px 20px', cursor: isRefreshing ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(43, 108, 176, 0.4)', display: 'flex', alignItems: 'center',
          gap: '8px', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s ease',
        }}
        title="تحديث الجدول ↻"
      >
        <FiRefreshCw style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', fontSize: '16px' }} />
        {isRefreshing ? "جاري المزامنة..." : "تحديث الجدول ↻"}
      </button>

      {/* القائمة الجانبية */}
      <aside 
        className="modern-sidebar"
        style={{
          width: isSidebarOpen ? '260px' : '0px', overflow: 'hidden', transition: 'all 0.3s ease',
          display: 'flex', flexDirection: 'column', backgroundColor: '#1a202c', color: '#fff',
          height: '100vh', position: 'fixed', right: 0, top: 0, zIndex: 1000
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '18px' }}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-brand" style={{ padding: '10px 20px' }}>
          <h3>بوابة أعضاء التدريس</h3>
          <p style={{ marginTop: '5px' }}>أهلاً بك: د. {loggedInUser?.name?.split(' ')[0]}</p>
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1, padding: '10px 20px' }}>
          <button className={activeTab === 'schedule' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('schedule')}>
            <FaCalendarAlt style={{ marginLeft: '8px' }} /> جدول محاضراتي
          </button>
          <button className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>
            <FaUser style={{ marginLeft: '8px' }} /> إعدادات الملف الشخصي
          </button>
          <button className={activeTab === 'security' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('security'); setSecuritySubView('overview'); }}>
            <FaShieldAlt style={{ marginLeft: '8px', color: '#e53e3e' }} /> إعدادات الأمان والحماية
          </button>
        </nav>
        
        <div className="sidebar-footer" style={{ padding: '20px' }}>
          <button className="btn btn-danger btn-block" onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <FaSignOutAlt /> تسجيل خروج
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main 
        className="modern-main-content" 
        style={{ 
          marginRight: isSidebarOpen ? '260px' : '0px',
          transition: 'all 0.3s ease',
          width: '100%', padding: '20px 40px' 
        }}
      >
        {/* شريط علوي يحتوي على فتح القائمة */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '50px', marginBottom: '20px' }}>
          <div>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#ffffff', color: '#2d3748', border: '1px solid #e2e8f0', 
                  borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                <FaBars />
              </button>
            )}
          </div>
        </div>
        
        {/* 1. 📅 جدول المحاضرات */}
        {activeTab === 'schedule' && (
          <div className="modern-table-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2d3748' }}>جدول المحاضرات الأسبوعي للأستاذ</h3>
                <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '13px' }}>
                  الأستاذ: <strong>{loggedInUser?.name}</strong> | {loggedInUser?.email}
                </p>
              </div>

              {/* 📄 زر تصدير PDF */}
              <button
                type="button"
                onClick={exportScheduleToPDF}
                disabled={isExportingPdf || loadingLectures}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: '#e53e3e', color: '#ffffff', border: 'none',
                  padding: '9px 16px', borderRadius: '6px', fontWeight: 'bold',
                  cursor: isExportingPdf ? 'not-allowed' : 'pointer', fontSize: '13px',
                  boxShadow: '0 2px 5px rgba(229, 62, 62, 0.3)', transition: 'all 0.2s ease'
                }}
              >
                <FaFilePdf style={{ fontSize: '16px' }} />
                <span>{isExportingPdf ? "جاري إنتاج PDF..." : "تصدير الجدول PDF"}</span>
              </button>
            </div>

            {loadingLectures ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#2b6cb0' }}>جاري استخراج ومزامنة جدول المحاضرات الأكاديمي الخاص بك...</p>
            ) : (
              <div id="schedule-table-container" style={{ overflowX: 'auto', padding: '10px', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2b6cb0', color: '#fff' }}>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e0', width: '130px' }}>
                        اليوم
                      </th>
                      {timeSlots.map((slot) => (
                        <th key={slot.id} style={{ padding: '12px', border: '1px solid #cbd5e0' }}>
                          <div>{slot.label}</div>
                          <div style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>{slot.time}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day} style={{ backgroundColor: '#fff' }}>
                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', fontWeight: 'bold', fontSize: '14px' }}>
                          {day}
                        </td>

                        {timeSlots.map((slot) => {
                          const lecture = getLectureForSlot(day, slot);
                          return (
                            <td key={slot.id} style={{ padding: '10px', border: '1px solid #e2e8f0', verticalAlign: 'top', height: '90px' }}>
                              {lecture ? (
                                <div style={{ backgroundColor: '#ebf8ff', borderRight: '4px solid #3182ce', padding: '8px', borderRadius: '4px', textAlign: 'right', fontSize: '12px' }}>
                                  <div style={{ fontWeight: 'bold', color: '#2b6cb0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaBook style={{ fontSize: '11px' }} /> {lecture.subject_name || lecture.subject || lecture.title || "مادة غير مسمة"}
                                  </div>
                                  <div style={{ color: '#4a5568', marginBottom: '2px' }}>
                                    <FaGraduationCap style={{ fontSize: '10px', marginLeft: '2px' }} /> القسم: {lecture.department || "عام"} (الدفعة: {lecture.batch || "كل الدفعات"})
                                  </div>
                                  <div style={{ display: 'inline-block', backgroundColor: '#cbd5e0', color: '#2d3748', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
                                    قاعة: {lecture.hall_name}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#a0aec0', fontSize: '12px' }}>---</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. إعدادات الملف الشخصي */}
        {activeTab === 'profile' && (
          <div className="modern-table-card">
            <h3>📂 إدارة الملف الأكاديمي للأستاذ</h3>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>يمكنك من هنا تعديل الاسم الشخصي والعلني التابع لك بداخل واجهات ومنظومة الجداول للطلاب.</p>
            
            <form onSubmit={handleUpdateTeacherProfile}>
              <div className="modern-grid-form">
                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                  <label><FaUser style={{ marginLeft: '6px' }} /> الاسم الكامل (كما يظهر للطلاب):</label>
                  <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px' }}>
                <FaSave style={{ marginLeft: '6px' }} /> حفظ بيانات الملف الأكاديمي
              </button>
            </form>
          </div>
        )}

        {/* 3. 🔐 إعدادات الأمان والحماية */}
        {activeTab === 'security' && (
          <div className="modern-table-card" style={{ borderRight: '4px solid #e53e3e', padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            
            {/* 🛡️ أ. واجهة الأمان الرئيسية */}
            {securitySubView === 'overview' && (
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748', margin: 0 }}>
                  <FaShieldAlt style={{ color: '#e53e3e' }} /> إعدادات الحماية والأمان الحالية
                </h3>
                <p style={{ color: '#718096', fontSize: '13px', marginTop: '5px', marginBottom: '25px' }}>
                  إدارة حماية الحساب الأكاديمي الخاص بك، يرجى اختيار الإجراء المطلوب تنفيذه أدناه:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button 
                    onClick={() => setSecuritySubView('change_password')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', 
                      backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', 
                      cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s', width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    <FaLock style={{ color: '#e53e3e', fontSize: '18px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#2d3748', display: 'block' }}>تغيير كلمة المرور الخاصة بالحساب</strong>
                      <span style={{ color: '#718096', fontSize: '12px' }}>قم بتحديث كلمة المرور الدورية لتعزيز مستوى حماية الحساب.</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSecuritySubView('change_security_question')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', 
                      backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', 
                      cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s', width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3182ce'; e.currentTarget.style.backgroundColor = '#ebf8ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    <FaQuestionCircle style={{ color: '#3182ce', fontSize: '18px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#2d3748', display: 'block' }}>تعديل وتعيين سؤال الأمان الاحتياطي</strong>
                      <span style={{ color: '#718096', fontSize: '12px' }}>يستخدم سؤال الأمان للتحقق من هويتك في حالة نسيان كلمة المرور.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 🔑 ب. صفحة تغيير كلمة المرور */}
            {securitySubView === 'change_password' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setSecuritySubView('overview')}
                    style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}
                  >
                    <FaArrowRight /> العودة للرئيسية
                  </button>
                </div>

                <h3 style={{ color: '#e53e3e', margin: '0 0 5px 0' }}>🔐 واجهة تغيير كلمة المرور الحالية</h3>
                <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>لتأمين العملية، يجب تعبئة كافة الحقول بما في ذلك كلمة المرور القديمة وتأكيد الجديدة بدقة.</p>

                <form onSubmit={handleUpdateTeacherSecurity}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
                        <FaLock style={{ marginLeft: '6px', color: '#e53e3e' }} /> كلمة المرور القديمة (الحالية):
                      </label>
                      <input 
                        type="password" 
                        placeholder="أدخل كلمة المرور الحالية المستخدمة الآن" 
                        value={securityForm.currentPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
                        <FaLock style={{ marginLeft: '6px', color: '#38a169' }} /> كلمة المرور الجديدة:
                      </label>
                      <input 
                        type="password" 
                        placeholder="أدخل كلمة المرور الجديدة القوية" 
                        value={securityForm.newPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
                        <FaLock style={{ marginLeft: '6px', color: '#38a169' }} /> تأكيد كلمة المرور الجديدة المكتوبة:
                      </label>
                      <input 
                        type="password" 
                        placeholder="أعد كتابة كلمة المرور الجديدة لتطابقها" 
                        value={securityForm.confirmPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                  </div>

                  <button 
                    type="submit" 
                    style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <FaSave style={{ marginLeft: '6px' }} /> حفظ وتحديث كلمة المرور الجديدة فوراً
                  </button>
                </form>
              </div>
            )}

            {/* ❓ ج. صفحة تحديث سؤال الأمان */}
            {securitySubView === 'change_security_question' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setSecuritySubView('overview')}
                    style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}
                  >
                    <FaArrowRight /> العودة للرئيسية
                  </button>
                </div>

                <h3 style={{ color: '#3182ce', margin: '0 0 5px 0' }}>💡 واجهة تحديث سؤال الأمان</h3>
                <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>اختر سؤالاً يسهل عليك تذكره ويصعب على الآخرين حزره لتأمين عمليات استرجاع الحساب المستقبلية.</p>

                <form onSubmit={handleUpdateTeacherSecurity}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
                        <FaQuestionCircle style={{ marginLeft: '6px', color: '#3182ce' }} /> اختر سؤال الأمان الاحتياطي لحسابك:
                      </label>
                      <select 
                        value={securityForm.securityQuestion} 
                        onChange={(e) => setSecurityForm({ ...securityForm, securityQuestion: e.target.value })}
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff' }}
                      >
                        {questionsList.map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>إجابة سؤال الأمان السرية الجديدة:</label>
                      <input 
                        type="text" 
                        value={securityForm.securityAnswer} 
                        onChange={(e) => setSecurityForm({ ...securityForm, securityAnswer: e.target.value })} 
                        required 
                        placeholder="اكتب إجابتك السرية بدقة هنا لتسجيلها" 
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                  </div>

                  <button 
                    type="submit" 
                    style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <FaSave style={{ marginLeft: '6px' }} /> تحديث سؤال الأمان والإجابة الآن
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;