import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaLock, 
  FaSave, 
  FaSignOutAlt, 
  FaGraduationCap, 
  FaLayerGroup, 
  FaQuestionCircle, 
  FaIdCard,
  FaBars,  
  FaTimes, 
  FaChalkboardTeacher, 
  FaBook,
  FaShieldAlt,
  FaArrowRight,
  FaUniversity,
  FaFilePdf
} from 'react-icons/fa';

// 🔹 استيراد مكتبات تصدير الـ PDF والشاشة
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_BASE_URL } from '../apiConfig';

function StudentDashboard({ loggedInUser, setLoggedInUser, logout, showNotification, formatDateArabic, formatTime12H }) {
  
  // حالة لتحديد ما إذا كان جاري تصدير الملف لمنع الضغط المكرر
  const [isExporting, setIsExporting] = useState(false);

  // 🏛️ هيكل البيانات الأكاديمية (الكليات والتخصصات والدفع)
  const academicStructure = {
    'تقنية المعلومات': {
      'علوم الحاسب': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
      'الأمن السيبراني': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
      'الذكاء الاصطناعي': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
    },
    'تخصصات طبية': {
      'طب بشري': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
      'صيدلة': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
      'مختبرات طبية': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة'],
    },
    'محاسبة وإدارة': {
      'محاسبة': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة'],
      'إدارة أعمال': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة']
    }
  };

  const yearsList = ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة", "السنة السادسة"];
  
  const securityQuestionsList = [
    'ما هو اسم أول مدرسة درست بها؟',
    'ما هو اسم حيوانك الأليف الأول؟',
    'في أي مدينة ولد والدك؟',
    'ما هي سيارتك المفضلة؟',
    'ما هو اسم صديق طفولتك المقرب؟'
  ];

  const daysList = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  
  const timeSlots = [
    { id: '1', label: 'الفترة الأولى', time: '07:00 - 08:45', start: '07:00', end: '08:45' },
    { id: '2', label: 'الفترة الثانية', time: '09:00 - 10:45', start: '09:00', end: '10:45' },
    { id: '3', label: 'الفترة الثالثة', time: '11:15 - 01:00', start: '11:15', end: '13:00' },
    { id: '4', label: 'الفترة الرابعة', time: '01:15 - 03:00', start: '13:15', end: '15:00' }
  ];

  // ----------------------------------------------------
  // تحديد الكلية والتخصص الافتراضي
  // ----------------------------------------------------
  const defaultFaculty = Object.keys(academicStructure)[0];
  const defaultDepartment = Object.keys(academicStructure[defaultFaculty])[0];
  const defaultBatch = academicStructure[defaultFaculty][defaultDepartment][0];

  // ----------------------------------------------------
  // الحالات والبيانات
  // ----------------------------------------------------
  const [myLectures, setMyLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [securitySubView, setSecuritySubView] = useState('overview');

  const [profileForm, setProfileForm] = useState({
    name: loggedInUser?.name || '',
    faculty: loggedInUser?.faculty || defaultFaculty,
    department: loggedInUser?.department || defaultDepartment,
    batch: loggedInUser?.batch || defaultBatch,
    academicYear: loggedInUser?.academic_year || 'السنة الأولى', 
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    securityQuestion: loggedInUser?.security_question || securityQuestionsList[0],
    securityAnswer: ''
  });

  useEffect(() => {
    if (loggedInUser) {
      const userFaculty = loggedInUser.faculty && academicStructure[loggedInUser.faculty] ? loggedInUser.faculty : defaultFaculty;
      const availableDepts = academicStructure[userFaculty] || {};
      const userDept = loggedInUser.department && availableDepts[loggedInUser.department] ? loggedInUser.department : Object.keys(availableDepts)[0];
      const availableBatches = availableDepts[userDept] || [];
      const userBatch = loggedInUser.batch && availableBatches.includes(loggedInUser.batch) ? loggedInUser.batch : availableBatches[0];

      setProfileForm({
        name: loggedInUser.name || '',
        faculty: userFaculty,
        department: userDept,
        batch: userBatch,
        academicYear: loggedInUser.academic_year || 'السنة الأولى',
      });

      setSecurityForm(prev => ({
        ...prev,
        securityQuestion: loggedInUser.security_question || securityQuestionsList[0]
      }));
      
      fetchStudentSchedule();
    }
  }, [loggedInUser]);

  // 🔹 معالجة تغيير الكلية
  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    const availableDepts = academicStructure[selectedFaculty] || {};
    const firstDept = Object.keys(availableDepts)[0] || '';
    const firstBatch = availableDepts[firstDept] ? availableDepts[firstDept][0] : '';

    setProfileForm({
      ...profileForm,
      faculty: selectedFaculty,
      department: firstDept,
      batch: firstBatch
    });
  };

  // 🔹 معالجة تغيير التخصص (القسم)
  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    const availableBatches = academicStructure[profileForm.faculty]?.[selectedDept] || [];

    setProfileForm({
      ...profileForm,
      department: selectedDept,
      batch: availableBatches[0] || ''
    });
  };

  // ----------------------------------------------------
  // دالة تصدير الجدول بصيغة PDF
  // ----------------------------------------------------
  const exportScheduleToPDF = async () => {
    const input = document.getElementById('student-schedule-table');
    if (!input) return;

    try {
      setIsExporting(true);

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(16);
      pdf.text("المحاضرات والمقررات الأسبوعية", pdfWidth / 2, 15, { align: 'center' });

      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);

      const fileName = `جدول_${loggedInUser?.name || 'الطالب'}.pdf`;
      pdf.save(fileName);

      if (showNotification) {
        showNotification("تم تصدير الجدول بصيغة PDF بنجاح!", "success");
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      if (showNotification) {
        showNotification("حدث خطأ أثناء تصدير ملف PDF", "error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // ----------------------------------------------------
  // دوال التواصل مع الخادم (API)
  // ----------------------------------------------------
  const fetchStudentSchedule = async () => {
    try {
      setLoadingLectures(true);
      const response = await fetch(`${API_BASE_URL}/api/lectures/student?department=${encodeURIComponent(loggedInUser.department)}&batch=${encodeURIComponent(loggedInUser.batch)}&academicYear=${encodeURIComponent(loggedInUser.academic_year || '')}`);
      if (response.ok) {
        const data = await response.json();
        setMyLectures(data);
      } else {
        showNotification("فشل تحميل الجدول الدراسي الخاص بك", "error");
      }
    } catch (error) {
      showNotification("حدث خطأ في الاتصال بالسيرفر أثناء جلب الجدول", "error");
    } finally {
      setLoadingLectures(false);
    }
  };

  const getLectureForSlot = (dayName, slot) => {
    return myLectures.find(lec => {
      const lecDay = (lec.lecture_day || '').trim();
      const targetDay = dayName.trim();
      
      const isDayMatch = lecDay === targetDay;
      const isTimeMatch = lec.start_time >= slot.start && lec.start_time < slot.end;

      return isDayMatch && isTimeMatch;
    });
  };

  const handleUpdateStudentProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: loggedInUser.id,
        role: 'student',
        name: profileForm.name,
        faculty: profileForm.faculty,
        academic_id: loggedInUser.academic_id || loggedInUser.email, 
        department: profileForm.department,
        batch: profileForm.batch,
        academic_year: profileForm.academicYear, 
        password: '',
        security_question: loggedInUser.security_question,
        security_answer: loggedInUser.security_answer
      };

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && (result.success || !result.error)) {
        showNotification("تم تحديث ملفك الشخصي بنجاح!", "success");
        const updatedUser = {
          ...loggedInUser,
          name: profileForm.name,
          faculty: profileForm.faculty,
          department: profileForm.department,
          batch: profileForm.batch,
          academic_year: profileForm.academicYear,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser);
      } else {
        showNotification(result.message || "فشل تحديث البيانات، يرجى المحاولة لاحقاً", "error");
      }
    } catch (error) {
      showNotification("خطأ في الاتصال بالخادم", "error");
    }
  };

  const handleUpdateSecuritySettings = async (e) => {
    e.preventDefault();

    if (securitySubView === 'change_password') {
      if (!securityForm.currentPassword) {
        showNotification("يرجى إدخال كلمة المرور الحالية لتتمكن من التحديث", "error");
        return;
      }
      if (!securityForm.newPassword) {
        showNotification("يرجى إدخال كلمة المرور الجديدة لتسجيلها", "error");
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        showNotification("كلمة المرور الجديدة وتأكيدها غير متطابقين!", "error");
        return;
      }
    }

    if (securitySubView === 'change_security_question') {
      if (!securityForm.securityAnswer.trim()) {
        showNotification("يرجى كتابة إجابة سؤال الأمان السرية الجديدة", "error");
        return;
      }
    }

    try {
      const payload = {
        id: loggedInUser.id,
        role: 'student',
        name: loggedInUser.name,
        academic_id: loggedInUser.academic_id || loggedInUser.email, 
        department: loggedInUser.department,
        batch: loggedInUser.batch,
        academic_year: loggedInUser.academic_year, 
        security_question: securitySubView === 'change_security_question' ? securityForm.securityQuestion : loggedInUser.security_question,
        security_answer: securitySubView === 'change_security_question' ? securityForm.securityAnswer : loggedInUser.security_answer
      };

      if (securitySubView === 'change_password') {
        payload.password = securityForm.newPassword;
        payload.currentPassword = securityForm.currentPassword;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && (result.success || !result.error)) {
        showNotification("تم تحديث بيانات الحماية بنجاح!", "success");
        const updatedUser = {
          ...loggedInUser,
          security_question: payload.security_question,
          security_answer: payload.security_answer || loggedInUser.security_answer
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
        showNotification(result.message || "فشل تحديث إعدادات الحماية والبيانات الأمنية", "error");
      }
    } catch (error) {
      showNotification("خطأ في الاتصال بالخادم", "error");
    }
  };

  return (
    <div className="modern-dashboard-layout" dir="rtl" style={{ display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#f7fafc' }}>
      
      {/* القائمة الجانبية */}
      <aside 
        className="modern-sidebar" 
        style={{ 
          width: isSidebarOpen ? '260px' : '0px', overflow: 'hidden', transition: 'all 0.3s ease',
          display: 'flex', flexDirection: 'column', backgroundColor: '#1a202c', color: '#fff',
          height: '100vh', position: 'fixed', right: 0, top: 0, zIndex: 1000
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px' }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#8b96a4', cursor: 'pointer', fontSize: '20px' }}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-brand" style={{ padding: '10px 20px' }}>
          <div className="brand-icon-wrapper" style={{ marginBottom: '10px', fontSize: '24px', color: '#4299e1' }}>
            <FaIdCard />
          </div>
          <h3>سجل الطالب الأكاديمي</h3>
          <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            الرقم الجامعي: {loggedInUser?.academic_id || 'غير متوفر'}
          </p>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
          <p>أهلاً بك: <strong>{loggedInUser?.name?.split(' ')[0]}</strong></p>
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1, padding: '10px 20px' }}>
          <button className={activeTab === 'schedule' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('schedule')}>
            <FaCalendarAlt style={{ marginLeft: '8px' }} /> جدول المحاضرات
          </button>
          <button className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>
            <FaUser style={{ marginLeft: '8px' }} /> إعدادات الملف الشخصي
          </button>
          <button className={activeTab === 'security' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab('security'); setSecuritySubView('overview'); }}>
            <FaShieldAlt style={{ marginLeft: '8px', color: '#e53e3e' }} /> إعدادات الأمان والحماية
          </button>
        </nav>
        
        <div className="sidebar-footer" style={{ padding: '20px' }}>
          <button className="btn btn-danger btn-block" onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
            <FaSignOutAlt /> تسجيل الخروج من النظام
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '50px', marginBottom: '20px' }}>
          <div>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#ffffff', color: '#2d3748', border: '1px solid #e2e8f0', 
                  borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '18px'
                }}
              >
                <FaBars />
              </button>
            )}
          </div>
        </div>

        {/* 1. 📅 تبويب الجدول */}
        {activeTab === 'schedule' && (
          <div className="modern-table-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2d3748' }}>المحاضرات والمقررات الأسبوعية</h3>
                <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '13px' }}>
                  القسم: <strong>{loggedInUser.department}</strong> ({loggedInUser.batch}) - <span style={{ color: '#3182ce', fontWeight: 'bold' }}>{loggedInUser.academic_year || 'لم تُحدد بعد'}</span>
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-danger" 
                  onClick={exportScheduleToPDF}
                  disabled={isExporting || loadingLectures}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <FaFilePdf />
                  <span>{isExporting ? "جاري التصدير..." : "تصدير الجدول (PDF)"}</span>
                </button>
                <button className="btn btn-success" onClick={fetchStudentSchedule}>تحديث الجدول ↻</button>
              </div>
            </div>

            {loadingLectures ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#3182ce' }}>جاري مطابقة ومزامنة جدولك الأكاديمي...</p>
            ) : (
              <div id="student-schedule-table" style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '10px' }}>
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
                    {daysList.map((day) => (
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
                                    <FaBook style={{ fontSize: '11px' }} /> {lecture.subject_name}
                                  </div>
                                  <div style={{ color: '#4a5568', marginBottom: '2px' }}>
                                    <FaChalkboardTeacher style={{ fontSize: '10px', margin: '0 2px' }} /> {lecture.teacher_name || "غير محدد"}
                                  </div>
                                  <div style={{ display: 'inline-block', backgroundColor: '#cbd5e0', color: '#2d3748', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>
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

        {/* 2. 📂 تبويب الملف الشخصي */}
        {activeTab === 'profile' && (
          <div className="modern-table-card">
            <h3>تعديل بيانات الملف الشخصي</h3>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>تعديل بياناتك الأكاديمية سيؤثر بشكل فوري ومباشر على المحاضرات المعروضة لك.</p>
            
            <form onSubmit={handleUpdateStudentProfile}>
              <div className="modern-grid-form">
                
                {/* اسم الطالب */}
                <div className="input-field">
                  <label><FaUser style={{ marginLeft: '6px' }} /> الاسم رباعي بالكامل:</label>
                  <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                </div>

                {/* قائمة الكليات */}
                <div className="input-field">
                  <label><FaUniversity style={{ marginLeft: '6px' }} /> الكلية / المجال الأكاديمي:</label>
                  <select 
                    value={profileForm.faculty} 
                    onChange={handleFacultyChange} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff' }}
                  >
                    {Object.keys(academicStructure).map((facKey) => (
                      <option key={facKey} value={facKey}>{facKey}</option>
                    ))}
                  </select>
                </div>
                
                {/* قائمة التخصصات المرتبطة بالكلية المختارة */}
                <div className="input-field">
                  <label><FaGraduationCap style={{ marginLeft: '6px' }} /> التخصص الأكاديمي (القسم):</label>
                  <select 
                    value={profileForm.department} 
                    onChange={handleDepartmentChange} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff' }}
                  >
                    {Object.keys(academicStructure[profileForm.faculty] || {}).map((deptKey) => (
                      <option key={deptKey} value={deptKey}>{deptKey}</option>
                    ))}
                  </select>
                </div>

                {/* قائمة الدفعات المرتبطة بالتخصص المختار مباشرة */}
                <div className="input-field">
                  <label><FaLayerGroup style={{ marginLeft: '6px' }} /> الدفعة الدراسية المقيد بها:</label>
                  <select 
                    value={profileForm.batch} 
                    onChange={(e) => setProfileForm({ ...profileForm, batch: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff' }}
                  >
                    {(academicStructure[profileForm.faculty]?.[profileForm.department] || []).map((batchItem, idx) => (
                      <option key={idx} value={batchItem}>{batchItem}</option>
                    ))}
                  </select>
                </div>

                {/* قائمة السنة الدراسية */}
                <div className="input-field">
                  <label><FaCalendarAlt style={{ marginLeft: '6px' }} /> السنة الدراسية الحالية:</label>
                  <select value={profileForm.academicYear} onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff' }}>
                    {yearsList.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px' }}>
                <FaSave style={{ marginLeft: '6px' }} /> حفظ بيانات الملف الأكاديمي
              </button>
            </form>
          </div>
        )}

        {/* 3. 🛡️ إعدادات الأمان والحماية */}
        {activeTab === 'security' && (
          <div className="modern-table-card" style={{ borderRight: '4px solid #e53e3e', padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            
            {securitySubView === 'overview' && (
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d3748', margin: 0 }}>
                  <FaShieldAlt style={{ color: '#e53e3e' }} /> إعدادات الحماية والأمان الحالية للحساب
                </h3>
                <p style={{ color: '#718096', fontSize: '13px', marginTop: '5px', marginBottom: '25px' }}>
                  إدارة حماية حسابك الجامعي وتحديث كلمات المرور، يرجى اختيار الإجراء المطلوب تنفيذه أدناه:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button 
                    onClick={() => setSecuritySubView('change_password')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', 
                      backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', 
                      cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s', width: '100%'
                    }}
                  >
                    <FaLock style={{ color: '#e53e3e', fontSize: '18px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#2d3748', display: 'block' }}>تغيير كلمة المرور الخاصة بالحساب</strong>
                      <span style={{ color: '#718096', fontSize: '12px' }}>قم بتحديث كلمة المرور الدورية لتعزيز مستوى حماية حسابك الجامعي.</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSecuritySubView('change_security_question')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', 
                      backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', 
                      cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s', width: '100%'
                    }}
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

                <h3 style={{ color: '#e53e3e', margin: '0 0 5px 0' }}>واجهة تغيير كلمة المرور الحالية</h3>
                <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>لتأمين العملية، يجب تعبئة كافة الحقول بما في ذلك كلمة المرور القديمة وتأكيد الجديدة بدقة.</p>

                <form onSubmit={handleUpdateSecuritySettings}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>كلمة المرور القديمة (الحالية):</label>
                      <input 
                        type="password" 
                        placeholder="أدخل كلمة المرور الحالية المستخدمة الآن" 
                        value={securityForm.currentPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>كلمة المرور الجديدة:</label>
                      <input 
                        type="password" 
                        placeholder="أدخل كلمة المرور الجديدة القوية" 
                        value={securityForm.newPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>تأكيد كلمة المرور الجديدة المكتوبة:</label>
                      <input 
                        type="password" 
                        placeholder="أعد كتابة كلمة المرور الجديدة لتطابقها" 
                        value={securityForm.confirmPassword} 
                        onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                        required
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
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

                <h3 style={{ color: '#3182ce', margin: '0 0 5px 0' }}>واجهة تحديث سؤال الأمان</h3>
                <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>اختر سؤالاً يسهل عليك تذكره ويصعب على الآخرين حزره لتأمين عمليات استرجاع الحساب المستقبلية.</p>

                <form onSubmit={handleUpdateSecuritySettings}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>اختر سؤال الأمان الاحتياطي لحسابك:</label>
                      <select 
                        value={securityForm.securityQuestion} 
                        onChange={(e) => setSecurityForm({ ...securityForm, securityQuestion: e.target.value })}
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%', backgroundColor: '#fff' }}
                      >
                        {securityQuestionsList.map((q, idx) => (
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
                        style={{ padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
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

export default StudentDashboard;