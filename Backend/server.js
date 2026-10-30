const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: function(origin, callback) {
        // السماح بالطلبات بدون origin (Postman، curl) أو من localhost أو الشبكة المحلية
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.')) {
            callback(null, true);
        } else {
            callback(null, true); // اقبل الكل حالياً في مرحلة التطوير
        }
    },
    credentials: true
}));
app.use(express.json()); // تفعيل التعامل مع بيانات JSON القادمة في الطلبات

// -------------------------------------------------------------
// 1. الاتصال المجمع بقاعدة بيانات phpMyAdmin (university_db)
// -------------------------------------------------------------
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'university_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// فحص الاتصال الأولي بالخادم
db.getConnection((err, connection) => {
    if (err) {
        console.error("🚨 فشل الاتصال بقاعدة البيانات!:", err.message);
    } else {
        console.log("Connected to MySQL Server Successfully via Connection Pool.");
        connection.release();
    }
});

// -------------------------------------------------------------
// 2. مسار تسجيل الدخول الموحد (المشرف، الأساتذة، الطلاب)
// -------------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { role, email, password } = req.body; 

    if (!role || !email || !password) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال جميع البيانات المطلوبة (الدور، المعرف/البريد، كلمة المرور)' });
    }

    let query = '';
    if (role === 'admin') {
        query = `SELECT * FROM \`admin\` WHERE \`email\` = ?`;
    } else if (role === 'teacher') {
        query = `SELECT * FROM \`teachers\` WHERE \`email\` = ?`;
    } else if (role === 'student') {
        query = `SELECT * FROM \`students\` WHERE \`acadmic_id\` = ?`;
    } else {
        return res.status(400).json({ success: false, message: 'صلاحية مستخدم غير معروفة' });
    }

    db.query(query, [String(email).trim()], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + err.message });
        
        if (results && results.length === 1) {
            const user = results[0];
            
            if (password === user.password) {
                return res.json({
                    success: true,
                    message: `🔓 تم تسجيل الدخول بنجاح كـ [${role}]`,
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: role === 'student' ? (user.acadmic_id || '') : (user.email || ''), 
                        role: role,
                        academic_id: user.acadmic_id || '', 
                        department: user.department || '',
                        batch: user.batch || '', 
                        academic_year: user.academic_year || 'غير محدد', 
                        security_question: user.security_question || '',
                        security_answer: user.security_answer || '',
                        degree: user.degree || ''
                    }
                });
            } else {
                return res.json({ success: false, message: '❌ كلمة المرور التي أدخلتها غير صحيحة' });
            }
        } else {
            return res.json({ success: false, message: '❌ الحساب غير مسجل أو الصلاحية خاطئة' });
        }
    });
});

// -------------------------------------------------------------
// 3. مسارات جلب البيانات والجدولة
// -------------------------------------------------------------
app.get('/api/lectures', (req, res) => {
    db.query('SELECT * FROM lectures', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

app.get('/api/lectures/student', (req, res) => {
    const { department, batch } = req.query;

    if (!department || department === 'undefined' || String(department).trim() === '') {
        return res.status(200).json([]); 
    }

    let query = '';
    let params = [];

    if (batch && batch !== 'undefined' && String(batch).trim() !== '') {
        query = `
            SELECT lectures.*, teachers.name AS teacher_name 
            FROM lectures 
            LEFT JOIN teachers ON lectures.teacher_id = teachers.id 
            WHERE lectures.department = ? AND lectures.batch = ?
        `;
        params = [String(department).trim(), String(batch).trim()];
    } else {
        query = `
            SELECT lectures.*, teachers.name AS teacher_name 
            FROM lectures 
            LEFT JOIN teachers ON lectures.teacher_id = teachers.id 
            WHERE lectures.department = ?
        `;
        params = [String(department).trim()];
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("🚨 خطأ في استعلام الجدول الدراسي:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json(results); 
    });
});

app.get('/api/lectures/teacher/:teacherId', (req, res) => {
    db.query('SELECT * FROM lectures WHERE teacher_id = ?', [req.params.teacherId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

app.get('/api/teachers', (req, res) => {
    db.query('SELECT * FROM teachers', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

app.get('/api/students', (req, res) => {
    db.query('SELECT * FROM students', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

// -------------------------------------------------------------
// 4. مسارات إضافة وتحديث البيانات
// -------------------------------------------------------------
app.post('/api/lectures', (req, res) => {
    const { teacher_id, subject_name, lecture_day, start_time, end_time, hall_name, department, batch } = req.body;
    const query = 'INSERT INTO lectures (teacher_id, subject_name, lecture_day, start_time, end_time, hall_name, department, batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [teacher_id, subject_name, lecture_day, start_time, end_time, hall_name, department, batch], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// تصحيح: تحديث start_time و end_time للمحاضرة
app.put('/api/lectures/:id', (req, res) => {
    const { id } = req.params;
    const { subject_name, teacher_id, hall_name, department, batch, lecture_day, start_time, end_time } = req.body;

    let query = '';
    let params = [];

    if (start_time && end_time) {
        query = `UPDATE lectures SET subject_name = ?, teacher_id = ?, hall_name = ?, department = ?, batch = ?, lecture_day = ?, start_time = ?, end_time = ? WHERE id = ?`;
        params = [subject_name, teacher_id, hall_name, department, batch, lecture_day, start_time, end_time, id];
    } else {
        query = `UPDATE lectures SET subject_name = ?, teacher_id = ?, hall_name = ?, department = ?, batch = ?, lecture_day = ? WHERE id = ?`;
        params = [subject_name, teacher_id, hall_name, department, batch, lecture_day, id];
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error("🚨 فشل تحديث بيانات المحاضرة:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

app.post('/api/students', (req, res) => {
    const { name, acadmic_id, email, password, department, batch, academic_year, security_question, security_answer } = req.body; 
    const final_academic_id = acadmic_id || email; 

    if (!name || !final_academic_id || !password || !department) {
        return res.status(400).json({ success: false, message: 'يرجى تعبئة الحقول الأساسية المطلوبة' });
    }

    const query = 'INSERT INTO students (name, acadmic_id, password, department, batch, academic_year, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [name, final_academic_id, password, department, batch, academic_year || 'غير محدد', security_question || null, security_answer || null], (err, result) => {
        if (err) {
            console.error("🚨 فشل تسجيل الطالب في قاعدة البيانات:", err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "الرقم الجامعي مسجل مسبقاً في النظام، يرجى تسجيل الدخول أو استخدام رقم آخر" });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true });
    });
});

app.post('/api/teachers', (req, res) => {
    const { name, email, password, specialization, degree, teaching_subjects, security_question, security_answer } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال اسم الأستاذ والبريد وكلمة المرور' });
    }

    const query = `INSERT INTO teachers (name, email, password, specialization, degree, teaching_subjects, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [name, String(email).trim(), password, specialization || '', degree || '', teaching_subjects || '', security_question || null, security_answer || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "البريد الإلكتروني مسجل مسبقاً لأستاذ آخر" });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json({ success: true });
    });
});

// -------------------------------------------------------------
// 5. مسار تحديث الملف الشخصي وإعدادات الأمان
// -------------------------------------------------------------
app.post('/api/profile/update', (req, res) => {
    const { id, role, name, academic_id, department, batch, academic_year, password, current_password, security_question, security_answer, email, degree } = req.body;
    
    if (!id) return res.status(400).json({ success: false, message: "معرف المستخدم مفقود" });

    // 👨‍🎓 تحديث بيانات الطالب
    if (role === 'student') {
        const rawId = academic_id || email;
        const finalAcademicId = rawId ? String(rawId).trim() : '';

        // إذا كان هناك تحديث لكلمة المرور
        if (password && String(password).trim() !== '') {
            // التحقق من كلمة المرور الحالية إن أرسلت
            db.query(`SELECT password FROM students WHERE id = ?`, [id], (chkErr, chkRes) => {
                if (!chkErr && chkRes.length > 0 && current_password && chkRes[0].password !== current_password) {
                    return res.status(400).json({ success: false, message: "❌ كلمة المرور الحالية غير صحيحة" });
                }

                let query = `UPDATE students SET \`name\` = ?, \`acadmic_id\` = ?, \`department\` = ?, \`batch\` = ?, \`academic_year\` = ?, \`password\` = ?`;
                let params = [name, finalAcademicId, department, batch, academic_year, password];

                if (security_question && security_answer && String(security_answer).trim() !== '') {
                    query += `, \`security_question\` = ?, \`security_answer\` = ?`;
                    params.push(security_question, String(security_answer).trim());
                }

                query += ` WHERE \`id\` = ?`;
                params.push(id);

                db.query(query, params, (err, result) => {
                    if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات الطالب: " + err.message });
                    return res.json({ success: true, message: "تم تحديث بيانات الطالب بنجاح" });
                });
            });
        } else {
            let query = `UPDATE students SET \`name\` = ?, \`acadmic_id\` = ?, \`department\` = ?, \`batch\` = ?, \`academic_year\` = ?`;
            let params = [name, finalAcademicId, department, batch, academic_year];

            if (security_question && security_answer && String(security_answer).trim() !== '') {
                query += `, \`security_question\` = ?, \`security_answer\` = ?`;
                params.push(security_question, String(security_answer).trim());
            }

            query += ` WHERE \`id\` = ?`;
            params.push(id);

            db.query(query, params, (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات الطالب: " + err.message });
                return res.json({ success: true, message: "تم تحديث بيانات الطالب بنجاح" });
            });
        }
    } 
    // 👨‍🏫 تحديث بيانات الأستاذ
    else if (role === 'teacher') {
        const safeEmail = email ? String(email).trim() : '';

        // إذا كان هناك تغيير لكلمة المرور
        if (password && String(password).trim() !== '') {
            db.query(`SELECT password FROM teachers WHERE id = ?`, [id], (chkErr, chkRes) => {
                if (!chkErr && chkRes.length > 0 && current_password && chkRes[0].password !== current_password) {
                    return res.status(400).json({ success: false, message: "❌ كلمة المرور الحالية غير صحيحة" });
                }

                let query = `UPDATE teachers SET name = ?`;
                let params = [name];

                if (safeEmail) { query += `, email = ?`; params.push(safeEmail); }
                if (degree !== undefined) { query += `, degree = ?`; params.push(degree || ''); }
                query += `, password = ?`; params.push(password);

                if (security_question && security_answer && String(security_answer).trim() !== '') {
                    query += `, security_question = ?, security_answer = ?`;
                    params.push(security_question, String(security_answer).trim());
                }

                query += ` WHERE id = ?`;
                params.push(id);

                db.query(query, params, (err, result) => {
                    if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات الأستاذ: " + err.message });
                    return res.json({ success: true, message: "تم تحديث بيانات الأستاذ بنجاح" });
                });
            });
        } else {
            let query = `UPDATE teachers SET name = ?`;
            let params = [name];

            if (safeEmail) { query += `, email = ?`; params.push(safeEmail); }
            if (degree !== undefined) { query += `, degree = ?`; params.push(degree || ''); }

            if (security_question && security_answer && String(security_answer).trim() !== '') {
                query += `, security_question = ?, security_answer = ?`;
                params.push(security_question, String(security_answer).trim());
            }

            query += ` WHERE id = ?`;
            params.push(id);

            db.query(query, params, (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات الأستاذ: " + err.message });
                return res.json({ success: true, message: "تم تحديث بيانات الأستاذ بنجاح" });
            });
        }
    } 
    // 🛡️ تحديث بيانات المشرف (Admin) - مع الحفاظ على إجابة الأمان وعدم مسحها
    else if (role === 'admin') {
        const safeEmail = email ? String(email).trim() : 'admin@test.com';

        if (password && String(password).trim() !== '') {
            db.query(`SELECT password FROM \`admin\` WHERE id = ?`, [id], (chkErr, chkRes) => {
                if (!chkErr && chkRes.length > 0 && current_password && chkRes[0].password !== current_password) {
                    return res.status(400).json({ success: false, message: "❌ كلمة المرور القديمة غير صحيحة" });
                }

                let query = `UPDATE \`admin\` SET \`name\` = ?, \`email\` = ?, \`password\` = ?`;
                let params = [name || 'المشرف', safeEmail, password];

                // تحديث سؤال الأمان فقط إذا أرسلت إجابة غير فارغة
                if (security_question && security_answer && String(security_answer).trim() !== '') {
                    query += `, \`security_question\` = ?, \`security_answer\` = ?`;
                    params.push(security_question, String(security_answer).trim());
                }

                query += ` WHERE \`id\` = ?`;
                params.push(id);

                db.query(query, params, (err, result) => {
                    if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات المشرف: " + err.message });
                    return res.json({ success: true, message: "تم تحديث كلمة المرور للمشرف بنجاح" });
                });
            });
        } else {
            let query = `UPDATE \`admin\` SET \`name\` = ?, \`email\` = ?`;
            let params = [name || 'المشرف', safeEmail];

            if (security_question && security_answer && String(security_answer).trim() !== '') {
                query += `, \`security_question\` = ?, \`security_answer\` = ?`;
                params.push(security_question, String(security_answer).trim());
            }

            query += ` WHERE \`id\` = ?`;
            params.push(id);

            db.query(query, params, (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "فشل تحديث بيانات المشرف: " + err.message });
                return res.json({ success: true, message: "تم تحديث إعدادات المشرف بنجاح" });
            });
        }
    }
    else {
        return res.status(400).json({ success: false, message: "صلاحية مستخدم غير صالحة" });
    }
});

// -------------------------------------------------------------
// 6. استعادة كلمة المرور عبر أسئلة الأمان
// -------------------------------------------------------------
app.post('/api/forgot-password/verify', (req, res) => {
    const { role, identifier } = req.body;
    if (!role || !identifier) return res.status(400).json({ success: false, message: "الرجاء إدخال البيانات" });

    const table = (role === 'student') ? 'students' : (role === 'admin' ? 'admin' : 'teachers');
    const column = (role === 'student') ? 'acadmic_id' : 'email'; 
    const query = `SELECT \`security_question\` FROM \`${table}\` WHERE \`${column}\` = ?`;
    
    db.query(query, [String(identifier).trim()], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results && results.length > 0) {
            const question = results[0].security_question;
            if (question && question.trim() !== '') {
                return res.status(200).json({ success: true, question });
            } else {
                return res.status(200).json({ success: false, message: "الحساب موجود ولكن لا يوجد سؤال أمان مسجل له" });
            }
        } else {
            return res.status(200).json({ success: false, message: "البيانات المدخلة غير مسجلة بالنظام" });
        }
    });
});

app.post('/api/forgot-password/check-answer', (req, res) => {
    const { role, identifier, answer } = req.body;
    if (!role || !identifier || !answer) {
        return res.status(400).json({ success: false, message: "الرجاء إكمال البيانات" });
    }

    const table = (role === 'student') ? 'students' : (role === 'admin' ? 'admin' : 'teachers');
    const column = (role === 'student') ? 'acadmic_id' : 'email';
    const query = `SELECT \`security_answer\` FROM \`${table}\` WHERE \`${column}\` = ?`;
    
    db.query(query, [String(identifier).trim()], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results && results.length > 0) {
            const dbAnswer = results[0].security_answer ? results[0].security_answer.trim().toLowerCase() : "";
            if (dbAnswer !== "" && dbAnswer === String(answer).trim().toLowerCase()) {
                return res.status(200).json({ success: true, message: "إجابة التحقق متطابقة" });
            } else {
                return res.status(400).json({ success: false, message: "إجابة التحقق الأمني غير صحيحة" });
            }
        } else {
            return res.status(404).json({ success: false, message: "المستخدم غير موجود بالنظام" });
        }
    });
});

app.post('/api/forgot-password/reset', (req, res) => {
    const { role, identifier, newPassword } = req.body;
    if (!role || !identifier || !newPassword) {
        return res.status(400).json({ success: false, message: "البيانات غير مكتملة" });
    }

    const table = (role === 'student') ? 'students' : (role === 'admin' ? 'admin' : 'teachers');
    const column = (role === 'student') ? 'acadmic_id' : 'email';
    const query = `UPDATE \`${table}\` SET \`password\` = ? WHERE \`${column}\` = ?`;
    
    db.query(query, [newPassword, String(identifier).trim()], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "فشل تحديث كلمة المرور في الخادم" });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "لم يتم العثور على الحساب لتحديثه" });
        }
        return res.status(200).json({ success: true, message: "تم تحديث كلمة المرور بنجاح" });
    });
});

// -------------------------------------------------------------
// 7. حذف السجلات
// -------------------------------------------------------------
app.delete('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const allowedTables = ['lectures', 'teachers', 'students'];

    if (!allowedTables.includes(type)) {
        return res.status(400).json({ success: false, message: 'نوع السجل غير صالح للحذف' });
    }

    db.query(`DELETE FROM \`${type}\` WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "تم حذف السجل بنجاح" });
    });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} and accessible on network at http://192.168.137.1:${PORT}`);
});