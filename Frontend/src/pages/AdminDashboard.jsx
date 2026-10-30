import React, { useState, useEffect } from 'react';
import {
  FaUser, FaLock, FaChalkboardTeacher, FaGraduationCap, FaBook, FaClock,
  FaPlus, FaCalendarAlt, FaChartBar, FaSignOutAlt, FaTrashAlt, FaEdit,
  FaFilePdf, FaBars, FaTimes, FaSave, FaQuestionCircle, FaShieldAlt, FaExclamationTriangle,
  FaKey, FaChevronLeft, FaCheckCircle
} from 'react-icons/fa';
import { FiHelpCircle, FiRefreshCw } from 'react-icons/fi';

// استيراد مكتبة html2pdf لتوليد الـ PDF
import html2pdf from 'html2pdf.js';

const TIME_SLOTS = [
  { id: '1', label: 'الفترة الأولى', time: '07:00 - 08:45', start: '07:00', end: '08:45' },
  { id: '2', label: 'الفترة الثانية', time: '09:00 - 10:45', start: '09:00', end: '10:45' },
  { id: '3', label: 'الفترة الثالثة', time: '11:15 - 01:00', start: '11:15', end: '13:00' },
  { id: '4', label: 'الفترة الرابعة', time: '01:15 - 03:00', start: '13:15', end: '15:00' }
];

const WEEK_DAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const HALLS_LIST = [
  'ارقين', 'اوسيف', 'علي جدو', 'اقتصاد', 'سبف', 'جودة', 'IT', 'عبدالله النيل', 'اخلاص جناوي'
];

const DEPARTMENT_DATA = {
  'تقنية المعلومات': {
    'علوم الحاسب': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
    'الأمن السيبراني':['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
    'الذكاء الاصطناعي': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
  },
  'تخصصات طبية': {
    'طب بشري': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
    'صيدلة':['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
    'مختبرات طبية': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة']
  },
  'محاسبة وإدارة': {
    'محاسبة': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة' , 'الدفعة الرابعة' , 'الدفعة الخامسة' , 'الدفعة السادسة'],
    'إدارة أعمال': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة']
  }
};

const ACADEMIC_YEARS_AR = ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة"];
const SECURITY_QUESTIONS_AR = [
  'ما هو اسم أول مدرسة درست بها؟', 'ما هو اسم حيوانك الأليف الأول؟', 'في أي مدينة ولد والدك؟', 'ما هي سيارتك المفضلة؟', 'ما هو اسم صديق طفولتك المقرب؟'
];

function AdminDashboard({ loggedInUser, setLoggedInUser, logout, showNotification }) {
  const [adminSubScreen, setAdminSubScreen] = useState('analytics'); 
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false); 

  const [allLectures, setAllLectures] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('تقنية المعلومات');
  // حالة لإدارة القسم العام (الكلية) في نموذج التعديل
  const [editingCategory, setEditingCategory] = useState('تقنية المعلومات');

  const [lectureForm, setLectureForm] = useState({ 
    subjectName: '', slotId: '', lectureDay: '', teacherId: '', hallName: '', 
    department: 'علوم الحاسب', batch: 'الدفعة الأولى', academicYear: 'السنة الأولى'
  });
  
  const [tableFilter, setTableFilter] = useState({ department: '', batch: '' });
  
  const [teacherForm, setTeacherForm] = useState({ 
    name: '', email: '', password: '', degree: ''
  });

  const [adminProfileForm, setAdminProfileForm] = useState({ name: loggedInUser?.name || '' });

  const [adminSecurityForm, setAdminSecurityForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
    securityQuestion: loggedInUser?.security_question || SECURITY_QUESTIONS_AR[0], securityAnswer: ''
  });
  
  const [securityMode, setSecurityMode] = useState('menu'); 
  const [editingItem, setEditingItem] = useState(null); 
  const [editingType, setEditingType] = useState('');   
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false);

  // حالة التحكم ببيانات ونافذة التضارب المنبثقة
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      setAdminProfileForm({ name: loggedInUser.name || '' });
      setAdminSecurityForm(prev => ({
        ...prev,
        securityQuestion: loggedInUser.security_question || SECURITY_QUESTIONS_AR[0]
      }));
    }
  }, [loggedInUser]);

  const fetchAdminData = async () => {
    try {
      setIsRefreshing(true); 
      const [lecRes, teachRes, studRes] = await Promise.all([
        fetch('http://localhost:5000/api/lectures'),
        fetch('http://localhost:5000/api/teachers'),
        fetch('http://localhost:5000/api/students')
      ]);
      const lecturesData = await lecRes.json();
      const teachersData = await teachRes.json();
      const studentsData = await studRes.json();
      
      setAllLectures(Array.isArray(lecturesData) ? lecturesData : []);
      setAllTeachers(Array.isArray(teachersData) ? teachersData : []);
      setAllStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) { 
      console.error("Error loading administration data", error); 
      if (showNotification) showNotification("فشل تحديث البيانات من السيرفر", "error");
    } finally {
      setIsRefreshing(false); 
    }
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    const firstSubDept = Object.keys(DEPARTMENT_DATA[category])[0];
    const firstBatch = DEPARTMENT_DATA[category][firstSubDept][0];
    
    setLectureForm({
      ...lectureForm,
      department: firstSubDept,
      batch: firstBatch
    });
  };

  const handleDeptChange = (e) => {
    const dept = e.target.value;
    const firstBatch = DEPARTMENT_DATA[selectedCategory][dept][0];
    
    setLectureForm({
      ...lectureForm,
      department: dept,
      batch: firstBatch
    });
  };

  // دوال التغيير المترابطة الخاصة بشاشة التعديل
  const handleEditCategoryChange = (e) => {
    const cat = e.target.value;
    setEditingCategory(cat);
    const firstDept = Object.keys(DEPARTMENT_DATA[cat])[0];
    const firstBatch = DEPARTMENT_DATA[cat][firstDept][0];
    
    setEditingItem(prev => ({
      ...prev,
      department: firstDept,
      batch: firstBatch
    }));
  };

  const handleEditDeptChange = (e) => {
    const dept = e.target.value;
    const firstBatch = DEPARTMENT_DATA[editingCategory][dept][0];
    
    setEditingItem(prev => ({
      ...prev,
      department: dept,
      batch: firstBatch
    }));
  };

  // دالة لفتح نافذة التعديل وتحديد الكلية التابع لها التخصص تلقائياً
  const startEditingLecture = (lec) => {
    let foundCategory = 'تقنية المعلومات';
    for (const [catKey, subDepts] of Object.entries(DEPARTMENT_DATA)) {
      if (subDepts[lec.department]) {
        foundCategory = catKey;
        break;
      }
    }
    
    // إيجاد الفترة الزمنية المقابلة لوقت المحاضرة بدقة
    const lectureStartTime = (lec.start_time || '').slice(0, 5);
    const matchedSlot = TIME_SLOTS.find(s => s.start === lectureStartTime) || TIME_SLOTS[0];

    setEditingCategory(foundCategory);
    setEditingItem({
      ...lec,
      slotId: matchedSlot.id,
      academic_year: lec.academic_year || 'السنة الأولى'
    });
    setEditingType('lectures');
  };

  const handleTeacherChangeInForm = (teacherId) => {
    const selectedTeacher = allTeachers.find(t => t.id === parseInt(teacherId));
    setLectureForm({
      ...lectureForm,
      teacherId: teacherId,
      subjectName: (selectedTeacher && selectedTeacher.teaching_subjects) ? selectedTeacher.teaching_subjects.split('،')[0] : '' 
    });
  };

  const exportTableToPDF = (tableId, fileNamePrefix) => {
    showNotification("جاري تصدير الجدول وتجهيز المقاسات للطباعة...", "success");
    const element = document.getElementById(tableId);
    const options = {
      margin:        [8, 8, 8, 8], 
      filename:      `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image:         { type: 'jpeg', quality: 0.98 },
      html2canvas:   { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF:         { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    const style = document.createElement('style');
    style.innerHTML = `
      .no-print { display: none !important; }
      .pdf-only-header { display: block !important; text-align: center; margin-bottom: 10px; font-size: 16px; font-weight: bold; color: #2d3748; }
      #${tableId} { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .modern-data-table { width: 100% !important; table-layout: fixed !important; }
      .modern-data-table th, .modern-data-table td { padding: 4px !important; font-size: 11px !important; }
      .lecture-card-box { padding: 4px !important; margin-bottom: 3px !important; font-size: 10px !important; }
      .lecture-card-box div { margin-bottom: 1px !important; line-height: 1.2 !important; }
    `;
    document.head.appendChild(style);

    html2pdf().set(options).from(element).save()
      .then(() => {
        style.remove(); 
        showNotification("تم تحميل ملف PDF المتناسق بنجاح!", "success");
      })
      .catch((err) => {
        console.error(err);
        style.remove();
        showNotification("حدث خطأ أثناء محاولة توليد الملف", "error");
      });
  };

  // التحقق من التضاربات وإدراج المحاضرة
  const handleAdminAddLecture = async (e) => {
    e.preventDefault();
    if (!lectureForm.department || !lectureForm.batch || !lectureForm.teacherId || !lectureForm.slotId || !lectureForm.lectureDay) {
      showNotification("يرجى ملء جميع الحقول المطلوبة لجدولة المحاضرة", "error");
      return;
    }

    const selectedSlot = TIME_SLOTS.find(s => s.id === lectureForm.slotId);
    const startTime = selectedSlot.start;
    const endTime = selectedSlot.end;
    let conflictDetails = null;

    const hasConflict = allLectures.some(lec => {
      const dayLec = (lec.lecture_day || '').trim();
      const dayForm = lectureForm.lectureDay.trim();
      if (dayLec !== dayForm) return false;
      
      const lecStart = (lec.start_time || '').slice(0, 5);
      const lecEnd = (lec.end_time || '').slice(0, 5);
      const isTimeOverlapping = (startTime < lecEnd && endTime > lecStart);

      if (isTimeOverlapping) {
        // 1. تضارب الأستاذ/المحاضر
        if (Number(lec.teacher_id) === Number(lectureForm.teacherId)) {
          const teacherObj = allTeachers.find(t => Number(t.id) === Number(lec.teacher_id));
          conflictDetails = {
            title: 'تضارب في جدول المحاضر',
            type: 'المحاضر مشغول في هذه الفترة',
            description: `الدكتور (${teacherObj ? teacherObj.name : 'غير محدد'}) مرتبط بجدول آخر في هذا الوقت.`,
            existingSubject: lec.subject_name || lec.subject,
            existingHall: lec.hall_name,
            day: dayForm,
            time: selectedSlot.time
          };
          return true;
        }
        
        // 2. تضارب القاعة
        if ((lec.hall_name || '').trim().toLowerCase() === lectureForm.hallName.trim().toLowerCase()) {
          conflictDetails = {
            title: 'تضارب في حجز القاعة',
            type: 'القاعة محجوزة مسبقاً',
            description: `القاعة (${lectureForm.hallName}) مشغولة بالفعل لمادة أخرى.`,
            existingSubject: lec.subject_name || lec.subject,
            existingTarget: `قسم ${lec.department} - ${lec.batch}`,
            day: dayForm,
            time: selectedSlot.time
          };
          return true;
        }
        
        // 3. تضارب الدفعة/الطلاب
        const deptLec = (lec.department || '').trim();
        const deptForm = lectureForm.department.trim();
        const batchLec = (lec.batch || '').trim();
        const batchForm = lectureForm.batch.trim();

        if (deptLec === deptForm && batchLec === batchForm) {
          const originalTeacher = allTeachers.find(t => Number(t.id) === Number(lec.teacher_id));
          conflictDetails = {
            title: 'تضارب في جدول الدفعة',
            type: 'الطلاب لديهم محاضرة في نفس الوقت',
            description: `دفعة (${lectureForm.batch}) بقسم (${lectureForm.department}) لديها محاضرة مسبقة.`,
            existingSubject: lec.subject_name || lec.subject,
            existingTeacher: originalTeacher ? originalTeacher.name : 'غير محدد',
            day: dayForm,
            time: selectedSlot.time
          };
          return true;
        }
      }
      return false;
    });

    if (hasConflict && conflictDetails) {
      setConflictData(conflictDetails);
      return;
    }

    setLoading(true);
    
    const payload = {
      teacher_id: parseInt(lectureForm.teacherId), 
      subject_name: lectureForm.subjectName,
      lecture_day: lectureForm.lectureDay, 
      start_time: startTime, 
      end_time: endTime, 
      hall_name: lectureForm.hallName, 
      department: lectureForm.department, 
      batch: lectureForm.batch,
      academic_year: lectureForm.academicYear 
    };

    try {
      const response = await fetch('http://localhost:5000/api/lectures', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (response.ok) {
        showNotification("تم إدراج المحاضرة بنجاح دون وجود أي تضاربات", "success");
        setLectureForm({ 
          subjectName: '', slotId: '', lectureDay: '', teacherId: '', hallName: '', 
          department: Object.keys(DEPARTMENT_DATA[selectedCategory])[0], 
          batch: DEPARTMENT_DATA[selectedCategory][Object.keys(DEPARTMENT_DATA[selectedCategory])[0]][0],
          academicYear: 'السنة الأولى'
        });
        await fetchAdminData(); 
        setAdminSubScreen('view_lectures');
      } else { 
        showNotification("فشل إدراج المحاضرة من السيرفر", "error"); 
      }
    } catch (error) { 
      showNotification("حدث خطأ أثناء الاتصال بالسيرفر", "error"); 
    } finally { setLoading(false); }
  };

  const handleAdminAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: teacherForm.name, 
      email: teacherForm.email.trim(), 
      password: teacherForm.password, 
      degree: teacherForm.degree
    };
    try {
      const response = await fetch('http://localhost:5000/api/teachers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (response.ok) {
        showNotification("تم تسجيل الأستاذ الجديد بنجاح", "success");
        setTeacherForm({ name: '', email: '', password: '', degree: '' });
        fetchAdminData();
        setAdminSubScreen('teachers'); 
      } else { showNotification("فشل الحفظ", "error"); }
    } catch (error) { showNotification("خطأ شبكة: تعذر الاتصال بالسيرفر", "error"); }
    finally { setLoading(false); }
  };

  const triggerDeleteConfirmation = (type, id, displayName) => {
    setDeleteTarget({ type, id, displayName });
  };

  const executeAdminDeleteItem = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    
    try {
      const response = await fetch(`http://localhost:5000/api/${type}/${id}`, { method: 'DELETE' });
      if(response.ok) {
        showNotification("تم حذف السجل بنجاح", "success");
        fetchAdminData();
      } else { 
        showNotification("فشل إتمام عملية الحذف", "error"); 
      }
    } catch (error) { 
      showNotification("حدث خطأ أثناء عملية الحذف", "error"); 
    } finally {
      setDeleteTarget(null); 
    }
  };

  const handleAdminUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let url = 'http://localhost:5000/api/profile/update';
    let payload = {};
    let method = 'POST';

    if (editingType === 'lectures') {
      url = `http://localhost:5000/api/lectures/${editingItem.id}`; 
      method = 'PUT'; 

      const selectedSlot = TIME_SLOTS.find(s => s.id === editingItem.slotId) || TIME_SLOTS[0];

      payload = {
        subject_name: editingItem.subject_name, 
        teacher_id: parseInt(editingItem.teacher_id), 
        hall_name: editingItem.hall_name, 
        department: editingItem.department, 
        batch: editingItem.batch, 
        academic_year: editingItem.academic_year,
        lecture_day: editingItem.lecture_day,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end
      };
    } else {
      payload = {
        id: editingItem.id, role: 'teacher', name: editingItem.name, password: editingItem.password || '', 
        security_question: editingItem.security_question || '', security_answer: editingItem.security_answer || '',
        email: editingItem.email || '', degree: editingItem.degree || ''
      };
    }

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && (result.success || !result.error)) {
        showNotification("تم تحديث البيانات بنجاح", "success");
        setEditingItem(null);
        fetchAdminData();
      } else { 
        showNotification(result.message || "فشل تحديث البيانات", "error"); 
      }
    } catch (error) { 
      showNotification("خطأ في الاتصال بالسيرفر", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
  };

  const handleUpdateAdminSecurity = (e) => {
    e.preventDefault();
    
    if (securityMode === 'password') {
      if (!adminSecurityForm.currentPassword) {
        showNotification("يجب كتابة كلمة المرور القديمة أولاً!", "error");
        return;
      }
      if (!adminSecurityForm.newPassword || !adminSecurityForm.confirmPassword) {
        showNotification("يرجى ملء حقول كلمة المرور الجديدة وتأكيدها!", "error");
        return;
      }
      if (adminSecurityForm.newPassword !== adminSecurityForm.confirmPassword) {
        showNotification("كلمة المرور الجديدة وتأكيدها غير متطابقين!", "error");
        return;
      }
    }

    setShowSecurityConfirm(true);
  };

  const executeAdminSecurityUpdate = async () => {
    setShowSecurityConfirm(false); 
    setLoading(true);

    const currentUserId = loggedInUser?.id || loggedInUser?._id || JSON.parse(localStorage.getItem('user'))?.id || JSON.parse(localStorage.getItem('user'))?._id;
    if (!currentUserId) {
      showNotification("خطأ: لم يتم العثور على معرف المستخدم، يرجى إعادة تسجيل الدخول", "error");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        id: currentUserId,
        role: 'admin',
        name: loggedInUser?.name || 'المشرف',
        email: loggedInUser?.email || 'admin@test.com',
        current_password: adminSecurityForm.currentPassword 
      };

      if (securityMode === 'password' && adminSecurityForm.newPassword) {
        payload.password = adminSecurityForm.newPassword;
      }

      if (securityMode === 'question' && adminSecurityForm.securityAnswer) {
        payload.security_question = adminSecurityForm.securityQuestion;
        payload.security_answer = adminSecurityForm.securityAnswer.trim();
      }

      const response = await fetch(`http://localhost:5000/api/profile/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        showNotification("🔒 تم تحديث إعدادات الأمان بنجاح", "success");
        const updatedUser = { 
          ...loggedInUser, 
          id: currentUserId, 
          name: loggedInUser?.name || 'المشرف', 
          email: loggedInUser?.email || 'admin@test.com',
          security_question: payload.security_question || loggedInUser?.security_question 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser)); 
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        if (setLoggedInUser) setLoggedInUser(updatedUser); 
        
        setAdminSecurityForm(prev => ({ 
          ...prev, currentPassword: '', newPassword: '', confirmPassword: '', securityAnswer: '' 
        }));
        setSecurityMode('menu');
      } else {
        showNotification(data.message || "فشل تحديث إعدادات الأمان الخاصة بالحساب", "error");
      }
    } catch (error) {
      showNotification("حدث خطأ أثناء الاتصال بالسيرفر لتحديث إعدادات الأمان", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterDepartments = Object.keys(DEPARTMENT_DATA).reduce((acc, cat) => {
    return [...acc, ...Object.keys(DEPARTMENT_DATA[cat])];
  }, []);

  return (
    <div className="modern-dashboard-layout" dir="rtl" style={{ display: 'flex', position: 'relative', minHeight: '100vh' }}>
      
      <button
        onClick={fetchAdminData}
        className="no-print"
        disabled={isRefreshing}
        style={{
          position: 'fixed', bottom: '25px', left: '25px', zIndex: 999,
          backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '50px',
          padding: '12px 20px', cursor: isRefreshing ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(49, 130, 206, 0.4)', display: 'flex',
          alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px',
          transition: 'all 0.2s ease', opacity: isRefreshing ? 0.8 : 1
        }}
        title="تحديث  ↻"
      >
        <FiRefreshCw style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', fontSize: '16px' }} />
        {isRefreshing ? "جاري التحديث..." : "تحديث  ↻"}
      </button>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
      `}</style>

      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        className="no-print"
        style={{
          position: 'fixed', top: '15px', right: isSidebarOpen ? '270px' : '20px', 
          zIndex: 1001, backgroundColor: '#2b6cb0', color: '#ede3e3', border: 'none',
          borderRadius: '6px', padding: '10px 12px', cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'all 0.3s ease'
        }}
      >
        {isSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
      </button>

      <aside className="modern-sidebar" style={{ width: '250px', position: 'fixed', top: 0, right: isSidebarOpen ? 0 : '-260px', height: '100vh', zIndex: 1000, transition: 'all 0.3s ease', boxShadow: isSidebarOpen ? '0 0 10px rgba(0,0,0,0.1)' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-brand" style={{ padding: '20px' }}>
          <h1> المشرف</h1>
          <p>أهلاً بك: المشرف</p>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          <button className={adminSubScreen === 'analytics' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('analytics')}><FaChartBar style={{margin: '0 8px'}} />  الإحصائيات الفورية</button>
          <button className={adminSubScreen === 'add_teacher' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('add_teacher')}><FaChalkboardTeacher style={{margin: '0 8px'}} /> إضافة أستاذ جديد</button>
          <button className={adminSubScreen === 'add_lecture' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('add_lecture')}><FaPlus style={{margin: '0 8px'}} /> إضافة وجدولة محاضرة</button>
          <button className={adminSubScreen === 'view_lectures' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('view_lectures')}><FaCalendarAlt style={{margin: '0 8px'}} /> إدارة المحاضرات والجدول</button>
          <button className={adminSubScreen === 'teachers' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('teachers')}><FaChalkboardTeacher style={{margin: '0 8px'}} /> الكادر التدريسي</button>
          <hr style={{ border: '0', height: '1px', background: '#2d3748', margin: '10px 20px' }} />
          <button className={adminSubScreen === 'admin_profile' ? 'nav-item active' : 'nav-item'} onClick={() => setAdminSubScreen('admin_profile')}><FaUser style={{margin: '0 8px'}} /> إعدادات الملف الشخصي</button>
          <button className={adminSubScreen === 'admin_security' ? 'nav-item active' : 'nav-item'} onClick={() => { setAdminSubScreen('admin_security'); setSecurityMode('menu'); }}><FaShieldAlt style={{margin: '0 8px', color: '#e53e3e'}} /> إعدادات الأمان والحماية</button>
        </nav>
        <div className="sidebar-footer" style={{ padding: '20px' }}>
          <button className="btn btn-danger btn-block" onClick={logout}><FaSignOutAlt style={{margin:'0 6px'}} /> خروج من النظام</button>
        </div>
      </aside>

      <main className="modern-main-content" style={{ marginRight: isSidebarOpen ? '250px' : '0px', width: '100%', transition: 'all 0.3s ease', padding: '25px', paddingTop: '70px' }}>
        
        {adminSubScreen === 'analytics' && (
          <div>
            <h2 className="page-title">الإحصائيات الفورية</h2>
            <div className="analytics-cards-grid">
              <div className="card-stat blue" style={{ cursor: 'pointer' }} onClick={() => setAdminSubScreen('view_lectures')}>
                <h3>{allLectures.length}</h3>
                <p>المحاضرات العامة النشطة ↗</p>
              </div>
              <div className="card-stat green" style={{ cursor: 'pointer' }} onClick={() => setAdminSubScreen('teachers')}>
                <h3>{allTeachers.length}</h3>
                <p>أعضاء كادر التدريس ↗</p>
              </div>
            </div>
          </div>
        )}

        {adminSubScreen === 'add_teacher' && (
          <div className="modern-table-card">
            <h3><FaChalkboardTeacher style={{margin: '0 8px', color: '#3182ce'}} /> إضافة أستاذ جديد</h3>
            <form onSubmit={handleAdminAddTeacher}>
              <div className="modern-grid-form">
                <div className="input-field"><label><FaUser style={{margin: '0 6px'}} /> اسم الأستاذ رباعي:</label><input type="text" value={teacherForm.name} onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})} required placeholder="أدخل الاسم الكامل" /></div>
                <div className="input-field"><label>البريد الإلكتروني:</label><input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})} required placeholder="teacher@univ.edu" /></div>
                <div className="input-field"><label><FaLock style={{margin: '0 6px'}} /> كلمة المرور الافتراضية:</label><input type="text" value={teacherForm.password} onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})} required placeholder="تعيين كلمة مرور" /></div>
                <div className="input-field"><label><FaGraduationCap style={{margin: '0 6px'}} /> الدرجة العلمية:</label><input type="text" value={teacherForm.degree} onChange={(e) => setTeacherForm({...teacherForm, degree: e.target.value})} required placeholder="دكتوراه، ماجستير" /></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '25px', width: '100%' }} disabled={loading}>حفظ البيانات</button>
            </form>
          </div>
        )}

        {adminSubScreen === 'add_lecture' && (
          <div className="modern-table-card">
            <h2>إنشاء جدول المحاضرات</h2>
            <form onSubmit={handleAdminAddLecture} style={{ marginTop: '25px' }}>
              <div className="modern-grid-form">
                <div className="input-field">
                  <label>المسمى التعليمي للمادة (اسم المادة):</label>
                  <input type="text" value={lectureForm.subjectName} onChange={(e) => setLectureForm({...lectureForm, subjectName: e.target.value})} required placeholder="مثال: هندسة البرمجيات" />
                </div>
                
                <div className="input-field">
                  <label>تحديد فترة المحاضرة:</label>
                  <select value={lectureForm.slotId} onChange={(e) => setLectureForm({...lectureForm, slotId: e.target.value})} required>
                    <option value="">-- اختر الفترة الزمنية --</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.label} ({slot.time})</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-field">
                  <label>تحديد أستاذ المادة:</label>
                  <select value={lectureForm.teacherId} onChange={(e) => handleTeacherChangeInForm(e.target.value)} required>
                    <option value="">-- اختر الأستاذ --</option>
                    {allTeachers.map(tItem => <option key={tItem.id} value={tItem.id}>{tItem.name}</option>)}
                  </select>
                </div>
                
                <div className="input-field">
                  <label>اسم أو رمز القاعة التدريسية:</label>
                  <select value={lectureForm.hallName} onChange={(e) => setLectureForm({...lectureForm, hallName: e.target.value})} required>
                    <option value="">-- اختر القاعة --</option>
                    {HALLS_LIST.map((hall, i) => <option key={i} value={hall}>{hall}</option>)}
                  </select>
                </div>

                <div className="input-field">
                  <label>القسم العام (الكلية):</label>
                  <select value={selectedCategory} onChange={handleCategoryChange}>
                    {Object.keys(DEPARTMENT_DATA).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field">
                  <label>التخصص الدقيق المستهدف:</label>
                  <select value={lectureForm.department} onChange={handleDeptChange} required>
                    {Object.keys(DEPARTMENT_DATA[selectedCategory]).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field">
                  <label>الدفعة الدراسية المستهدفة:</label>
                  <select value={lectureForm.batch} onChange={(e) => setLectureForm({...lectureForm, batch: e.target.value})} required>
                    {DEPARTMENT_DATA[selectedCategory][lectureForm.department]?.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field">
                  <label>السنة الدراسية المستهدفة:</label>
                  <select value={lectureForm.academicYear} onChange={(e) => setLectureForm({...lectureForm, academicYear: e.target.value})} required>
                    {ACADEMIC_YEARS_AR.map((year, idx) => (
                      <option key={idx} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                  <label>يوم المحاضرة:</label>
                  <select value={lectureForm.lectureDay} onChange={(e) => setLectureForm({...lectureForm, lectureDay: e.target.value})} required>
                    <option value="">-- اختر يوم المحاضرة --</option>
                    {WEEK_DAYS_AR.map((day, idx) => (
                      <option key={idx} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-success" style={{ marginTop: '25px', width: '100%' }} disabled={loading}>إدراج وجدولة المحاضرة</button>
            </form>
          </div>
        )}

        {adminSubScreen === 'view_lectures' && (
          <div className="modern-table-card" id="pdf-lectures-section" style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div className="pdf-only-header" style={{ display: 'none' }}>
              جدول المحاضرات الأكاديمي الأسبوعي الشامل
            </div>

            <div className="table-header-row no-print" style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: '2px solid #edf2f7', paddingBottom: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div><h2>جدول المحاضرات الأسبوعي</h2></div>
                <button type="button" onClick={() => exportTableToPDF('pdf-lectures-section', 'جدول_المحاضرات_الأسبوعي')} className="btn" style={{ backgroundColor: '#e53e3e', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontSize: '13px' }}><FaFilePdf /> تصدير الجدول إلى PDF</button>
              </div>
              <div style={{ display: 'flex', gap: '12px', backgroundColor: '#f7fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#4a5568', fontSize: '13px' }}>تصفية حسب التخصص:</label>
                  <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '13px' }} value={tableFilter.department} onChange={(e) => setTableFilter({ ...tableFilter, department: e.target.value })}>
                    <option value="">-- كل التخصصات والأقسام --</option>
                    {filterDepartments.map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#4a5568', fontSize: '13px' }}>الدفعة والمستوى:</label>
                  <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '13px' }} value={tableFilter.batch} onChange={(e) => setTableFilter({ ...tableFilter, batch: e.target.value })}>
                    <option value="">-- كل الدفعات والمستويات --</option>
                    {[...new Set(allLectures.map(l => l.batch))].map((batch, i) => (
                      <option key={i} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', overflow: 'visible' }}>
              <table className="modern-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4a5568', color: '#fff' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e0', width: '90px', fontSize: '13px' }}>اليوم</th>
                    {TIME_SLOTS.map((slot) => (
                      <th key={slot.id} style={{ padding: '6px', border: '1px solid #cbd5e0', fontSize: '12px', width: '22%' }}>
                        <div style={{ fontWeight: 'bold' }}>{slot.label}</div>
                        <div style={{ fontSize: '11px', color: '#000000', fontWeight: '500', marginTop: '2px' }}>{slot.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WEEK_DAYS_AR.map((dayAr, idx) => (
                    <tr key={dayAr}>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e0', backgroundColor: '#f7fafc', fontWeight: 'bold', color: '#2b6cb0', fontSize: '12px' }}>{dayAr}</td>
                      {TIME_SLOTS.map((slot) => {
                        const lecturesInCell = allLectures.filter(lec => {
                          const dbDay = (lec.lecture_day || '').trim();
                          const isSameDay = dbDay === dayAr.trim();
                          const isWithinSlot = lec.start_time === slot.start || (lec.start_time >= slot.start && lec.start_time < slot.end);
                          const matchesDept = tableFilter.department ? lec.department === tableFilter.department : true;
                          const matchesBatch = tableFilter.batch ? lec.batch === tableFilter.batch : true;
                          
                          return isSameDay && isWithinSlot && matchesDept && matchesBatch;
                        });

                        return (
                          <td key={slot.id} style={{ border: '1px solid #cbd5e0', padding: '4px', verticalAlign: 'top', backgroundColor: lecturesInCell.length > 0 ? '#ebf8ff' : '#fff' }}>
                            {lecturesInCell.map(lec => {
                              const teacherObj = allTeachers.find(tItem => Number(tItem.id) === Number(lec.teacher_id));

                              return (
                                <div key={lec.id} className="lecture-card-box" style={{ backgroundColor: '#fff', borderRight: '3px solid #3182ce', padding: '5px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'right', fontSize: '11px', marginBottom: '4px' }}>
                                  <div style={{ fontWeight: 'bold', color: '#2b6cb0', marginBottom: '2px' }}>{lec.subject_name}</div>
                                  <div style={{ color: '#4a5568' }}>د. {teacherObj ? teacherObj.name.split(' ')[0] : 'غير محدد'}</div>
                                  <div style={{ color: '#718096', fontSize: '10px' }}>{lec.department} ({lec.batch})</div>
                                  {lec.academic_year && <div style={{ color: '#718096', fontSize: '9px' }}>{lec.academic_year}</div>}
                                  <div style={{ color: '#e53e3e', fontWeight: 'bold' }}>{lec.hall_name}</div>
                                  
                                  <div className="lecture-actions-container no-print" style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                                    <button onClick={() => startEditingLecture(lec)} className="btn-table-edit" style={{ flex: 1, padding: '2px', fontSize: '10px', cursor:'pointer' }}><FaEdit /> تعديل</button>
                                    <button onClick={() => triggerDeleteConfirmation('lectures', lec.id, lec.subject_name)} className="btn-table-delete" style={{ flex: 1, padding: '2px', fontSize: '10px', cursor:'pointer' }}><FaTrashAlt /> حذف </button>
                                  </div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminSubScreen === 'teachers' && (
          <div className="modern-table-card" id="pdf-teachers-section" style={{padding: '20px', backgroundColor: '#fff', borderRadius: '8px'}}>
            <div className="table-header-row style-pdf-header" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3>الكادر التدريسي</h3>
              <button type="button" onClick={() => exportTableToPDF('pdf-teachers-section', 'أعضاء_التدريس')} className="btn no-print" style={{ backgroundColor: '#e53e3e', color: '#fff' }}><FaFilePdf /> تصدير الجدول إلى PDF</button>
            </div>
            <table className="modern-data-table">
              <thead><tr><th>ID</th><th>الاسم</th><th>الدرجة العلمية</th><th className="no-print">الخيارات</th></tr></thead>
              <tbody>
                {allTeachers.map(tItem => (
                  <tr key={tItem.id} style={{ cursor: 'pointer' }} className="clickable-row">
                    <td><strong>#{tItem.id}</strong></td>
                    <td style={{ color: '#8254c7e9', fontWeight: '500' }}>{tItem.name}</td>
                    <td><span className="hall-tag" style={{ backgroundColor: '#ffffff', color: '#4a5568' }}>{tItem.degree || 'عضو هيئة تدريس'}</span></td>
                    <td className="no-print" onClick={(e) => e.stopPropagation()}> 
                      <button onClick={() => { setEditingItem({...tItem}); setEditingType('teachers'); }} className="btn-table-edit"><FaEdit /> تعديل</button>
                      <button onClick={() => triggerDeleteConfirmation('teachers', tItem.id, `${tItem.name}`)} className="btn-table-delete"><FaTrashAlt /> حذف </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adminSubScreen === 'admin_profile' && (
          <div className="modern-table-card">
            <h3> إعدادات الملف الشخصي</h3>
            <form onSubmit={handleUpdateAdminProfile}>
              <div className="modern-grid-form">
                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                  <label><FaUser style={{ margin: '0 6px' }} /> الاسم الكامل للمشرف:</label>
                  <input type="text" value={loggedInUser?.name || "المشرف"} readOnly style={{ backgroundColor: '#edf2f7', cursor: 'not-allowed', color: '#4a5568', fontWeight: 'bold' }} />
                </div>
                <div className="input-field">
                  <label>البريد الإلكتروني للمشرف:</label>
                  <input type="email" value={loggedInUser?.email || "admin@test.com"} readOnly style={{ backgroundColor: '#edf2f7', cursor: 'not-allowed', color: '#4a5568', fontWeight: 'bold' }} />
                </div>
                <div className="input-field">
                  <label>رقم الهاتف 📱:</label>
                  <input type="text" value="0962538410" readOnly style={{ backgroundColor: '#edf2f7', cursor: 'not-allowed', color: '#4a5568', fontWeight: 'bold' }} />
                </div>
              </div>
              <div style={{ marginTop: '25px', padding: '12px', backgroundColor: '#ebf8ff', color: '#2b6cb0', borderRadius: '6px', fontSize: '14px', fontWeight: '500', textAlign: 'center', border: '1px solid #bee3f8' }}>
                 هذه البيانات أساسية للنظام ومثبتة من قبل الإدارة العامة.
              </div>
            </form>
          </div>
        )}

        {adminSubScreen === 'admin_security' && (
          <div className="modern-table-card" style={{ borderRight: '4px solid #e53e3e' }}>
            {securityMode === 'menu' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}><FaShieldAlt style={{ margin: '0 8px', color: '#e53e3e' }} /> إعدادات الأمان والحماية</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '25px' }}>يرجى اختيار الإجراء الأمني المطلوب تنفيذه على حساب المشرف:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button type="button" onClick={() => setSecurityMode('password')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaKey style={{ color: '#e53e3e', fontSize: '18px' }} />
                      <div><span style={{ fontWeight: 'bold', display: 'block', color: '#2d3748' }}>تغيير كلمة المرور الخاصة بحسابك</span></div>
                    </div>
                    <FaChevronLeft style={{ color: '#cbd5e0' }} />
                  </button>
                  <button type="button" onClick={() => setSecurityMode('question')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaQuestionCircle style={{ color: '#3182ce', fontSize: '18px' }} />
                      <div><span style={{ fontWeight: 'bold', display: 'block', color: '#2d3748' }}>تحديث سؤال الأمان الاحتياطي</span></div>
                    </div>
                    <FaChevronLeft style={{ color: '#cbd5e0' }} />
                  </button>
                </div>
              </div>
            )}

            {securityMode === 'password' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3><FaKey style={{ margin: '0 8px', color: '#e53e3e' }} /> تغيير كلمة المرور</h3>
                  <button type="button" onClick={() => setSecurityMode('menu')} style={{ padding: '6px 12px', backgroundColor: '#fffffffb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>رجوع</button>
                </div>
                <form onSubmit={handleUpdateAdminSecurity}>
                  <div className="modern-grid-form">
                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                      <label><FaLock style={{ margin: '0 6px', color: '#4a5568' }} /> كلمة المرور القديمة:</label>
                      <input type="password" required placeholder="أدخل كلمة المرور الحالية" value={adminSecurityForm.currentPassword} onChange={(e) => setAdminSecurityForm({ ...adminSecurityForm, currentPassword: e.target.value })} />
                    </div>
                    <div className="input-field">
                      <label><FaLock style={{ margin: '0 6px', color: '#2b6cb0' }} /> كلمة المرور الجديدة:</label>
                      <input type="password" required placeholder="••••••••" value={adminSecurityForm.newPassword} onChange={(e) => setAdminSecurityForm({ ...adminSecurityForm, newPassword: e.target.value })} />
                    </div>
                    <div className="input-field">
                      <label><FaLock style={{ margin: '0 6px', color: '#2b6cb0' }} /> تأكيد كلمة المرور:</label>
                      <input type="password" required placeholder="••••••••" value={adminSecurityForm.confirmPassword} onChange={(e) => setAdminSecurityForm({ ...adminSecurityForm, confirmPassword: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn" style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <FaSave style={{ margin: '0 6px' }} /> حفظ البيانات
                  </button>
                </form>
              </div>
            )}

            {securityMode === 'question' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3><FaQuestionCircle style={{ margin: '0 8px', color: '#3182ce' }} /> تحديث سؤال الأمان</h3>
                  <button type="button" onClick={() => setSecurityMode('menu')} style={{ padding: '6px 12px', backgroundColor: '#edf2f7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>رجوع</button>
                </div>
                <form onSubmit={handleUpdateAdminSecurity}>
                  <div className="modern-grid-form">
                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                      <label><FaQuestionCircle style={{ margin: '0 6px' }} /> اختر سؤال الأمان الاحتياطي:</label>
                      <select value={adminSecurityForm.securityQuestion} onChange={(e) => setAdminSecurityForm({ ...adminSecurityForm, securityQuestion: e.target.value })}>
                        {SECURITY_QUESTIONS_AR.map((q, idx) => <option key={idx} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                      <label>إجابة سؤال الأمان السرية:</label>
                      <input type="text" value={adminSecurityForm.securityAnswer} onChange={(e) => setAdminSecurityForm({ ...adminSecurityForm, securityAnswer: e.target.value })} required placeholder="اكتب إجابتك السرية" />
                    </div>
                  </div>
                  <button type="submit" className="btn" style={{ marginTop: '25px', width: '100%', padding: '12px', fontSize: '15px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <FaSave style={{ margin: '0 6px' }} /> حفظ البيانات
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* نافذة التعديل المحدثة لتشمل حقول الأستاذ كاملة والحفاظ على الدرجة العلمية */}
        {editingItem && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="modal-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h3> {editingType === 'lectures' ? 'تعديل بيانات المحاضرة' : 'تعديل بيانات الأستاذ'} (# {editingItem.id})</h3>
              <form onSubmit={handleAdminUpdateSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                  {editingType === 'lectures' && (
                    <>
                      <div className="input-field">
                        <label>المسمى التعليمي للمادة (اسم المادة):</label>
                        <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.subject_name || ''} onChange={(e) => setEditingItem({...editingItem, subject_name: e.target.value})} required />
                      </div>

                      <div className="input-field">
                        <label>تحديد فترة المحاضرة:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.slotId || ''} onChange={(e) => setEditingItem({...editingItem, slotId: e.target.value})} required>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot.id} value={slot.id}>{slot.label} ({slot.time})</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>تحديد أستاذ المادة:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.teacher_id || ''} onChange={(e) => setEditingItem({...editingItem, teacher_id: e.target.value})} required>
                          {allTeachers.map(tItem => <option key={tItem.id} value={tItem.id}>{tItem.name}</option>)}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>اسم أو رمز القاعة التدريسية:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.hall_name || ''} onChange={(e) => setEditingItem({...editingItem, hall_name: e.target.value})} required>
                          <option value="">-- اختر القاعة --</option>
                          {HALLS_LIST.map((hall, i) => <option key={i} value={hall}>{hall}</option>)}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>القسم العام (الكلية):</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingCategory} onChange={handleEditCategoryChange}>
                          {Object.keys(DEPARTMENT_DATA).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>التخصص الدقيق المستهدف:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.department || ''} onChange={handleEditDeptChange} required>
                          {Object.keys(DEPARTMENT_DATA[editingCategory] || {}).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>الدفعة الدراسية المستهدفة:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.batch || ''} onChange={(e) => setEditingItem({...editingItem, batch: e.target.value})} required>
                          {DEPARTMENT_DATA[editingCategory]?.[editingItem.department]?.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>السنة الدراسية المستهدفة:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.academic_year || 'السنة الأولى'} onChange={(e) => setEditingItem({...editingItem, academic_year: e.target.value})} required>
                          {ACADEMIC_YEARS_AR.map((year, idx) => (
                            <option key={idx} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-field">
                        <label>يوم المحاضرة:</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.lecture_day || ''} onChange={(e) => setEditingItem({...editingItem, lecture_day: e.target.value})} required>
                          {WEEK_DAYS_AR.map((day, idx) => <option key={idx} value={day}>{day}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {/* الحقول المضافة لتعديل بيانات الأستاذ الحالية والحفاظ على الدرجة العلمية والبريد */}
                  {editingType !== 'lectures' && (
                    <>
                      <div className="input-field">
                        <label>اسم الأستاذ رباعي:</label>
                        <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.name || ''} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} required />
                      </div>

                      <div className="input-field">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.email || ''} onChange={(e) => setEditingItem({...editingItem, email: e.target.value})} required />
                      </div>

                      <div className="input-field">
                        <label>الدرجة العلمية:</label>
                        <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} value={editingItem.degree || ''} onChange={(e) => setEditingItem({...editingItem, degree: e.target.value})} required placeholder="أدخل الدرجة العلمية (مثال: دكتوراه، أستاذ مشارك)" />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <button type="submit" className="btn btn-success" style={{ flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 'bold' }}>حفظ البيانات</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#718096', color: '#fff', border: 'none' }}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px', backdropFilter: 'blur(3px)' }}>
            <div className="modal-card" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', textAlign: 'center', borderTop: '5px solid #e53e3e' }}>
              <div style={{ color: '#e53e3e', fontSize: '36px', marginBottom: '12px' }}><FaExclamationTriangle /></div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', margin: '0 0 10px 0' }}>تأكيد عملية الحذف</h3>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                هل أنت متأكد من رغبتك في حذف <strong style={{ color: '#e53e3e' }}>{deleteTarget.displayName}</strong>؟
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="button" onClick={executeAdminDeleteItem} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  تأكيد
                </button>
                <button type="button" onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', backgroundColor: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {showSecurityConfirm && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px', backdropFilter: 'blur(3px)' }}>
            <div className="modal-card" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', textAlign: 'center', borderTop: '5px solid #3182ce' }}>
              <div style={{ color: '#3182ce', fontSize: '36px', marginBottom: '12px' }}><FaShieldAlt /></div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', margin: '0 0 10px 0' }}>تأكيد تحديث البيانات</h3>
              <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                هل تريد تأكيد حفظ إعدادات الأمان الجديدة؟
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="button" onClick={executeAdminSecurityUpdate} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', backgroundColor: '#3182ce', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  تأكيد
                </button>
                <button type="button" onClick={() => setShowSecurityConfirm(false)} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', backgroundColor: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تنبيه التضارب المنبثقة (Conflict Modal) */}
        {conflictData && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div className="modal-card" style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden', borderTop: '6px solid #e53e3e', textAlign: 'center' }}>
              
              <div style={{ padding: '25px 25px 15px 25px' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', fontSize: '30px', border: '2px solid #fed7d7' }}>
                  <FaExclamationTriangle />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748', margin: '0 0 8px 0' }}>
                  {conflictData.title}
                </h3>
                <span style={{ display: 'inline-block', backgroundColor: '#fff5f5', color: '#c53030', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #feb2b2', marginBottom: '15px' }}>
                  {conflictData.type}
                </span>
                <p style={{ fontSize: '14px', color: '#4a5568', margin: '0 0 15px 0', lineHeight: '1.5' }}>
                  {conflictData.description}
                </p>
              </div>

              {/* تفاصيل التضارب */}
              <div style={{ backgroundColor: '#f7fafc', padding: '15px 20px', borderTop: '1px solid #edf2f7', borderBottom: '1px solid #edf2f7', textAlign: 'right', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#2d3748' }}>
                  <div><strong>اليوم:</strong> {conflictData.day}</div>
                  <div><strong>التوقيت:</strong> {conflictData.time}</div>
                  {conflictData.existingSubject && <div style={{ gridColumn: 'span 2' }}><strong>المادة المحجوزة:</strong> {conflictData.existingSubject}</div>}
                  {conflictData.existingTeacher && <div style={{ gridColumn: 'span 2' }}><strong>أستاذ المادة:</strong> {conflictData.existingTeacher}</div>}
                  {conflictData.existingHall && <div><strong>القاعة:</strong> {conflictData.existingHall}</div>}
                  {conflictData.existingTarget && <div><strong>الجهة:</strong> {conflictData.existingTarget}</div>}
                </div>
              </div>

              {/* زر التأكيد لإغلاق النافذة */}
              <div style={{ padding: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setConflictData(null)} 
                  style={{ width: '100%', padding: '12px 20px', borderRadius: '8px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(229, 62, 62, 0.3)', transition: 'background-color 0.2s' }}
                >
                  <FaCheckCircle size={18} />
                  تأكيد وقراءة التنبيه
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;