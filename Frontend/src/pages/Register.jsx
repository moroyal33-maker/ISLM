import React, { useState } from 'react';
import { 
  FaArrowRight
} from 'react-icons/fa';
import { API_BASE_URL } from '../apiConfig';

function Register({ setScreen, showNotification }) {
  const [loading, setLoading] = useState(false);

  // هيكل البيانات للتخصصات والدفع المرتبطة بها
  const departmentData = {
    'تقنية المعلومات': {
      'علوم الحاسب': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة'],
      'الأمن السيبراني': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة'],
      'الذكاء الاصطناعي': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة']
    },
    'تخصصات طبية': {
      'طب بشري': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة'],
      'صيدلة': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة'],
      'مختبرات طبية': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة']
    },
    'محاسبة وإدارة': {
      'محاسبة': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة'],
      'إدارة أعمال': ['الدفعة الأولى', 'الدفعة الثانية', 'الدفعة الثالثة', 'الدفعة الرابعة', 'الدفعة الخامسة', 'الدفعة السادسة']
    }
  };

  const securityQuestionsList = [
    'ما هو اسم أول مدرسة درست بها؟',
    'ما هو اسم حيوانك الأليف الأول؟',
    'في أي مدينة ولد والدك؟',
    'ما هي سيارتك المفضلة؟',
    'ما هو اسم صديق طفولتك المقرب؟'
  ];

  const [studentForm, setStudentForm] = useState({
    name: '',
    studentId: '',
    department: 'علوم الحاسب',
    batch: 'الدفعة الأولى',
    academicYear: 'السنة الأولى',
    password: '',
    securityQuestion: 'ما هو اسم أول مدرسة درست بها؟',
    securityAnswer: ''
  });

  const [selectedCategory, setSelectedCategory] = useState('تقنية المعلومات');

  // تحديث التخصص عند تغيير القسم العام
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    const firstSub = Object.keys(departmentData[category])[0];
    setStudentForm({ ...studentForm, department: firstSub, batch: departmentData[category][firstSub][0] });
  };

  // تحديث الدفعة عند تغيير التخصص
  const handleDeptChange = (e) => {
    const dept = e.target.value;
    setStudentForm({ ...studentForm, department: dept, batch: departmentData[selectedCategory][dept][0] });
  };

  // دالة حفظ وحساب بيانات الطالب الجديد
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: studentForm.name,
      acadmic_id: studentForm.studentId,
      password: studentForm.password,
      department: studentForm.department,
      batch: studentForm.batch,
      academic_year: studentForm.academicYear,
      security_question: studentForm.securityQuestion,
      security_answer: studentForm.securityAnswer.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        showNotification("تم إنشاء حسابك بنجاح", "success");
        setScreen('login');
      } else {
        showNotification(result.message || "فشل إنشاء الحساب", "error");
      }
    } catch (error) {
      showNotification("خطأ بالاتصال بالشبكة", "error");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="modern-auth-container" dir="rtl">
      <div className="modern-auth-card" style={{ position: 'relative' }}>

        {/* الهيدر الذي يشمل العنوان وزر العودة والخروج */}
        <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>تسجيل حساب طالب جديد</h2>
          
          {/* زر الخروج والعودة لشاشة تسجيل الدخول */}
          <button 
            type="button" 
            onClick={() => setScreen('login')} 
            className="btn-exit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e53e3e',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c53030'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e53e3e'}
          >
            <FaArrowRight /> 
            خروج
          </button>
        </div>

        <form onSubmit={handleSaveStudent}>
          <div className="modern-grid-form">
            
            {/* الاسم الكامل */}
            <div className="input-field">
              <label>الاسم رباعي بالكامل:</label>
              <input 
                type="text" 
                value={studentForm.name} 
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} 
                required 
              />
            </div>

            {/* الرقم الجامعي */}
            <div className="input-field">
              <label>الرقم الجامعي:</label>
              <input 
                type="text" 
                value={studentForm.studentId} 
                onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })} 
                required 
              />
            </div>

            {/* القوائم المنسدلة للقسم والتخصص */}
            <div className="input-field">
              <label>القسم العام:</label>
              <select value={selectedCategory} onChange={handleCategoryChange}>
                {Object.keys(departmentData).map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-field">
              <label>التخصص الدقيق:</label>
              <select value={studentForm.department} onChange={handleDeptChange}>
                {Object.keys(departmentData[selectedCategory]).map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* الدفعة الدراسية */}
            <div className="input-field" style={{ gridColumn: 'span 2' }}>
              <label>الدفعة الدراسية:</label>
              <select value={studentForm.batch} onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}>
                {departmentData[selectedCategory][studentForm.department].map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* السنة الدراسية */}
            <div className="input-field" style={{ gridColumn: 'span 2' }}>
              <label>السنة الدراسية:</label>
              <select value={studentForm.academicYear} onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}>
                {["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* كلمة السر */}
            <div className="input-field" style={{ gridColumn: 'span 2' }}>
              <label>تعيين كلمة سر:</label>
              <input 
                type="password" 
                value={studentForm.password} 
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} 
                required 
              />
            </div>

            {/* سؤال الأمان */}
            <div className="input-field" style={{ gridColumn: 'span 2' }}>
              <label>سؤال الأمان:</label>
              <select value={studentForm.securityQuestion} onChange={(e) => setStudentForm({ ...studentForm, securityQuestion: e.target.value })}>
                {securityQuestionsList.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* إجابة سؤال الأمان */}
            <div className="input-field" style={{ gridColumn: 'span 2' }}>
              <label>إجابة سؤال الأمان:</label>
              <input 
                type="text" 
                value={studentForm.securityAnswer} 
                onChange={(e) => setStudentForm({ ...studentForm, securityAnswer: e.target.value })} 
                required 
              />
            </div>

          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
            {loading ? "جاري المعالجة..." : "إتمام التسجيل"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Register;
