// =========================================
// إعدادات الاتصال بقاعدة بيانات Supabase
// =========================================
// وين تلاقي هاي القيم:
// 1. سجلي دخول على supabase.com وافتحي مشروعك
// 2. من القائمة الجانبية: Project Settings > API
// 3. انسخي "Project URL" وحطيه بمكان SUPABASE_URL
// 4. انسخي "anon public" key وحطيه بمكان SUPABASE_ANON_KEY
// (لا تستخدمي أبداً الـ "service_role" key هون — هاد سري وخطير تحطيه بكود الموقع)
// =========================================

const SUPABASE_URL = 'https://iruuyhnczqhfkylodrsj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Qje-3RFEmOXNTp4IghXK-g_SM3JssdK';

const supabaseClient = (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith('http'))
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabaseClient) {
    console.warn('⚠️ ما تم الاتصال بقاعدة البيانات — تأكدي إنك عبّيتي SUPABASE_URL و SUPABASE_ANON_KEY بملف js/supabase-config.js');
}
