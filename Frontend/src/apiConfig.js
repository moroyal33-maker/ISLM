// إعداد عنوان API الخاص بالسيرفر
// إذا كان متغير البيئة محدداً يستخدمه، وإلا يستخدم localhost تلقائياً
const envUrl = process.env.REACT_APP_API_URL;

// التحقق من أن متغير البيئة صالح (غير فارغ وغير undefined)
export const API_BASE_URL = (envUrl && envUrl.trim() !== '')
  ? envUrl.trim()
  : `http://${window.location.hostname || 'localhost'}:5000`;
