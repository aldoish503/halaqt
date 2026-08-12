/**
 * =====================================================================
 *  نظام إدارة مكتب رئيس وحدة الشؤون التعليمية
 *  محلية مستقلة (Single Page App) - بدون Google Apps Script
 * =====================================================================
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'AGY_UNIT_EMPLOYEES',
  TEMPLATES: 'AGY_UNIT_TEMPLATES',
  TASKS: 'AGY_UNIT_TASKS',
  MEETINGS: 'AGY_UNIT_MEETINGS',
  ARCHIVE: 'AGY_UNIT_ARCHIVE',
  COUNTERS: 'AGY_UNIT_COUNTERS',
  GOOGLE_SHEET_URL: 'AGY_UNIT_SHEET_URL'
};

// ------------------------------------------------------------------
// إعدادات الشيت الخاص بالمستند المعين
// ------------------------------------------------------------------
const DEFAULT_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1WL7CWYfAFcYcyHVNXOSCYhpBUI_QfeY_fLIcMgJUfkc/gviz/tq?tqx=out:csv&gid=1526450297';
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzdp-uskKgV_V58jwyuF46e182lYTyz8Qco-Ek0mihI-Em3ZYdvdDrcn38sQEr9PMZa/exec';

// ------------------------------------------------------------------
// البيانات الأولية (سجل فارغ ونظيف للبدء الفعلي)
// ------------------------------------------------------------------
const DEFAULT_EMPLOYEES = [];
const DEFAULT_TEMPLATES = [
  { id: 1, name: '1. طلب تعيين (مرشح جديد)', file: '1طلب تعيين.docx', category: 'التعيين والتكليف', desc: 'نموذج طلب تعيين مرشح جديد بالحلقات وتجزئة الهوية الرقمية', typeKey: 'طلب تعيين' },
  { id: 2, name: '2. طلب تحويل فترة', file: '2تحويل فترة.docx', category: 'الفترات والمسميات', desc: 'نموذج طلب تحويل فترة العمل من صباحي إلى مسائي أو العكس', typeKey: 'تحويل فترة' },
  { id: 3, name: '3. طلب تحويل فترة (مؤقتة)', file: '3طلب تحويل فترة (مؤقتة).docx', category: 'الفترات والمسميات', desc: 'نموذج طلب تحويل فترة العمل بشكل مؤقت محدد بوقت', typeKey: 'طلب تحويل فترة (مؤقتة)' },
  { id: 4, name: '4. طلب إضافة فترة', file: '4طلب اضافة فترة.docx', category: 'الفترات والمسميات', desc: 'نموذج طلب إضافة فترة تكليف إضافية للموظف أو المعلم', typeKey: 'طلب اضافة فترة' },
  { id: 5, name: '5. طلب إضافة فترة (مؤقتة)', file: '5طلب اضافة فترة (مؤقتة).docx', category: 'الفترات والمسميات', desc: 'نموذج طلب إضافة فترة إضافية بشكل مؤقت', typeKey: 'طلب اضافة فترة (مؤقتة)' },
  { id: 6, name: '6. خطاب طلب نقل موظف/معلم', file: '6خطاب نقل موظف-معلم.docx', category: 'النقل والانتداب', desc: 'خطاب رسمي موجه لطلب نقل موظف أو معلم بين الوحدات', typeKey: 'خطاب نقل موظف-معلم' },
  { id: 7, name: '7. طلب نقل موظف/معلم', file: '7طلب نقل.docx', category: 'النقل والانتداب', desc: 'نموذج طلب نقل موظف وتحديد الوحدة والفترة الجديدة', typeKey: 'طلب نقل' },
  { id: 8, name: '8. طلب تغيير مسمى', file: '8طلب تغيير مسمى.docx', category: 'الفترات والمسميات', desc: 'نموذج طلب تغيير المسمى الوظيفي للموظف أو المعلم', typeKey: 'طلب تغيير مسمى' },
  { id: 9, name: '9. طلب تغيير مسمى (مؤقت)', file: '9طلب تغيير مسمى (مؤقت).docx', category: 'الفترات والمسميات', desc: 'نموذج تغيير مسمى وظيفي لفترة مؤقتة', typeKey: 'طلب تغيير مسمى (مؤقت)' },
  { id: 10, name: '10. طلب إلغاء فترة', file: '10طلب الغاء فترة.docx', category: 'الفترات والمسميات', desc: 'نموذج طلب إلغاء فترة من الفترات المسندة', typeKey: 'طلب الغاء فترة' },
  { id: 11, name: '11. طلب إلغاء فترة مؤقتة', file: '11طلب الغاء فترة مؤقتة.docx', category: 'الفترات والمسميات', desc: 'نموذج إلغاء إضافة/تحويل فترة مؤقتة', typeKey: 'طلب الغاء فترة مؤقتة' },
  { id: 12, name: '12. طلب إنهاء تكليف / عمل', file: '12طلب انهاء.docx', category: 'التعيين والتكليف', desc: 'نموذج طلب إنهاء تكليف موظف وتصفية المستحقات', typeKey: 'طلب انهاء' },
  { id: 13, name: '13. طلب تكليف موظف/معلم', file: '13طلب تكليف.docx', category: 'التعيين والتكليف', desc: 'نموذج طلب إصدار تكليف جديد لموظف أو مجموعة', typeKey: 'طلب تكليف' },
  { id: 14, name: '14. إنهاء تكليف موظف/معلم', file: '14انهاء تكليف.docx', category: 'التعيين والتكليف', desc: 'قرار ورسالة إنهاء تكليف رسمي مع التوجيه المالي', typeKey: 'إنهاء تكليف' },
  { id: 15, name: '15. طلب تعيين الدوام المرن في الساعة', file: '15طلب تعيين الدوام المرن في الساعة.docx', category: 'التعيين والتكليف', desc: 'نموذج التعيين بنظام ساعات الدوام المرن', typeKey: 'طلب تعيين الدوام المرن في الساعة' },
  { id: 16, name: '16. خطاب طلب تمديد تعيين (مؤقت)', file: '16خطاب طلب تمديد تعيين (مؤقت).docx', category: 'التعيين والتكليف', desc: 'خطاب طلب تمديد فترة التعيين المؤقت', typeKey: 'خطاب طلب تمديد تعيين (مؤقت)' },
  { id: 17, name: '17. قرار تحويل قسم موظف-معلم', file: '17قرار تحويل قسم موظف-معلم.docx', category: 'التعيين والتكليف', desc: 'قرار تحويل موظف بين أقسام الشؤون التعليمية', typeKey: 'قرار تحويل قسم موظف-معلم' },
  { id: 18, name: '18. مباشرة الموظف-المعلم بعد الإجازة', file: '18مباشرة الموظف-المعلم بعد الاجازة.docx', category: 'الإجازات والمباشرات', desc: 'إشعار رسمية بمباشرة العمل بعد الانتهاء من الإجازة', typeKey: 'مباشرة الموظف-المعلم بعد الاجازة' },
  { id: 19, name: '19. طلب إجازة موظف-معلم', file: '19طلب اجازة موظف-معلم.docx', category: 'الإجازات والمباشرات', desc: 'نموذج طلب إجازة اعتيادية أو مرخص بها أو زواج', typeKey: 'طلب اجازة موظف-معلم' },
  { id: 20, name: '20. طلب إلغاء إجازة موظف-معلم', file: '20طلب الغاء اجازة موظف -معلم.docx', category: 'الإجازات والمباشرات', desc: 'نموذج طلب إلغاء إجازة معتمدة للموظف', typeKey: 'طلب الغاء اجازة موظف -معلم' },
  { id: 21, name: '21. مباشرة الموظف-المعلم بعد قطع الإجازة', file: '21مباشرة الموظف - المعلم بعد قطع الإجازة.docx', category: 'الإجازات والمباشرات', desc: 'إشعار مباشرة العمل في حالة قطع الإجازة مبكراً', typeKey: 'مباشرة الموظف - المعلم بعد قطع الإجازة' },
  { id: 22, name: '22. مساءلة غياب للموظف/المعلم', file: '22مساءلة غياب للموظف المعلم.docx', category: 'المساءلات والمخالفات', desc: 'خطاب مساءلة رسمية عن أيام أو ساعات الغياب', typeKey: 'مساءلة غياب للموظف المعلم' },
  { id: 23, name: '23. إشعار مخالفة موظف', file: '23مخالفة موظف.docx', category: 'المساءلات والمخالفات', desc: 'نموذج إشعار وتسجيل مخالفة إدارية على الموظف', typeKey: 'مخالفة موظف' },
  { id: 24, name: '24. خطاب لفت نظر موظف', file: '24لفت نظر موظف.docx', category: 'المساءلات والمخالفات', desc: 'خطاب لفت نظر رسمي وتنبيه على الملاحظات', typeKey: 'لفت نظر موظف' },
  { id: 25, name: '25. خطاب لوم موظف', file: '25لوم موظف.docx', category: 'المساءلات والمخالفات', desc: 'خطاب لوم رسمي بسبب تكرار الملاحظات أو الإنذارات', typeKey: 'لوم موظف' },
  { id: 26, name: '26. الإبلاغ عن انقطاع موظف/معلم', file: '26الإبلاغ عن انقطاع موظف. معلم.docx', category: 'الإجازات والمباشرات', desc: 'نموذج الإبلاغ عن الانقطاع المفاجئ عن العمل', typeKey: 'الإبلاغ عن انقطاع موظف. معلم' },
  { id: 27, name: '27. طلب صرف مستحق موظف-معلم', file: '27صرف مستحق موظف-معلم.docx', category: 'المستحقات والحضور', desc: 'نموذج طلب صرف المستحقات المالية للموظف أو المعلم', typeKey: 'صرف مستحق موظف-معلم' },
  { id: 28, name: '28. قرار انتداب موظف/معلم', file: '28انتداب.docx', category: 'النقل والانتداب', desc: 'قرار انتداب رسمي لموظف لحاجة العمل', typeKey: 'انتداب' },
  { id: 29, name: '29. كشف الحضور والإنصراف الخاص بالتكليف', file: '29كشف الحضور والإنصراف الخاص بالتكليف.docx', category: 'المستحقات والحضور', desc: 'كشف متابعة وتوقيع الحضور والانصراف للتكليفات', typeKey: 'كشف الحضور والإنصراف الخاص بالتكليف' },
  { id: 30, name: '30. كشف حضور وانصراف الموظفين النهائي', file: '30كشف الحضور والإنصراف.docx', category: 'المستحقات والحضور', desc: 'سجل وكشف الحضور والانصراف النهائي لجميع الموظفين', typeKey: 'كشف الحضور والإنصراف' }
];
const DEFAULT_TASKS = [];
const DEFAULT_MEETINGS = [];
const DEFAULT_ARCHIVE = [];

// ------------------------------------------------------------------
// إدارة التخزين المحلي (Local Storage Helper)
// ------------------------------------------------------------------
function getStorage(key, defaultData) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    return defaultData;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('خطأ في حفظ البيانات محلياً:', e);
  }
}

function resetAllSystemData() {
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.MEETINGS);
  localStorage.removeItem(STORAGE_KEYS.ARCHIVE);
  localStorage.removeItem(STORAGE_KEYS.COUNTERS);
  
  APP_DATA.employees = [];
  APP_DATA.templates = [];
  APP_DATA.tasks = [];
  APP_DATA.meetings = [];
  APP_DATA.archive = [];
  APP_DATA.counter = { year: new Date().getFullYear(), lastNumber: 0 };
  
  saveData();
  showToast('تم مسح وتصفير كافة بيانات النظام بنجاح للبدء من جديد!');
}

let APP_DATA = {
  employees: getStorage(STORAGE_KEYS.EMPLOYEES, []),
  templates: getStorage(STORAGE_KEYS.TEMPLATES, []),
  tasks: getStorage(STORAGE_KEYS.TASKS, []),
  meetings: getStorage(STORAGE_KEYS.MEETINGS, []),
  archive: getStorage(STORAGE_KEYS.ARCHIVE, []),
  counter: getStorage(STORAGE_KEYS.COUNTERS, { year: new Date().getFullYear(), lastNumber: 0 }),
  sheetUrl: localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || DEFAULT_GOOGLE_SHEET_URL
};

// تصفير آلي عند تحديث هذه النسخة لتطهير البيانات التجريبية السابقة
if (localStorage.getItem('AGY_CLEARED_V1') !== 'TRUE') {
  localStorage.clear();
  localStorage.setItem('AGY_CLEARED_V1', 'TRUE');
  APP_DATA.employees = [];
  APP_DATA.templates = [];
  APP_DATA.tasks = [];
  APP_DATA.meetings = [];
  APP_DATA.archive = [];
  APP_DATA.counter = { year: new Date().getFullYear(), lastNumber: 0 };
}

function saveData() {
  setStorage(STORAGE_KEYS.EMPLOYEES, APP_DATA.employees);
  setStorage(STORAGE_KEYS.TEMPLATES, APP_DATA.templates);
  setStorage(STORAGE_KEYS.TASKS, APP_DATA.tasks);
  setStorage(STORAGE_KEYS.MEETINGS, APP_DATA.meetings);
  setStorage(STORAGE_KEYS.ARCHIVE, APP_DATA.archive);
  setStorage(STORAGE_KEYS.COUNTERS, APP_DATA.counter);
  localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, APP_DATA.sheetUrl);
  renderAllViews();
}

// ------------------------------------------------------------------
// التوليد التلقائي لأرقام الصادر (ت / 000001 / 26)
// ------------------------------------------------------------------
function generateNextOutgoingNumber() {
  const fullYear = new Date().getFullYear();
  const shortYear = String(fullYear).slice(-2);
  
  if (APP_DATA.counter.year !== fullYear) {
    APP_DATA.counter.year = fullYear;
    APP_DATA.counter.lastNumber = 0;
  }
  
  APP_DATA.counter.lastNumber += 1;
  const paddedNum = String(APP_DATA.counter.lastNumber).padStart(6, '0');
  saveData();
  
  return {
    rawNumber: paddedNum,
    shortYear: shortYear,
    fullHeader: `ت / ${paddedNum} / ${shortYear}`
  };
}

// ------------------------------------------------------------------
// تهيئة وإدارة التنقل بين التبويبات (Tab Navigation)
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.tab) return;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById('tab-' + btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  const urlInput = document.getElementById('sheetUrlInput');
  if (urlInput) urlInput.value = APP_DATA.sheetUrl;

  const webhookInput = document.getElementById('sheetWebhookInput');
  if (webhookInput) webhookInput.value = localStorage.getItem('AGY_UNIT_WEBHOOK_URL') || DEFAULT_WEBHOOK_URL;

  renderAllViews();

  // المزامنة التلقائية الهادئة خلف الكواليس إذا كان الشيت متاحاً للعامة
  if (APP_DATA.sheetUrl) {
    autoSyncFromGoogleSheetQuietly(APP_DATA.sheetUrl);
  }
});

function renderAllViews() {
  renderEmployeesTable();
  renderTemplatesTable();
  renderDropdowns();
  renderTasksTable();
  renderMeetingsTable();
  renderStats();
  renderArchiveTable();
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  if (isError) {
    t.classList.add('toast-error');
  } else {
    t.classList.remove('toast-error');
  }
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function showSection(id) {
  ['formSelectSection', 'openLetterSection'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.add('hidden');
  });
  if (id !== 'mainChoice') {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
}

// ------------------------------------------------------------------
// 1. المراسلات والتوليد وتجزئة رقم الهوية
// ------------------------------------------------------------------
function onFormTypeChange() {
  const type = document.getElementById('definedFormTypeSelect').value;
  const candBox = document.getElementById('newCandidateSection');
  const empBox = document.getElementById('existingEmpSection');

  if (type === 'طلب تعيين') {
    candBox.classList.remove('hidden');
    empBox.classList.add('hidden');
  } else if (type) {
    candBox.classList.add('hidden');
    empBox.classList.remove('hidden');
  } else {
    candBox.classList.add('hidden');
    empBox.classList.add('hidden');
  }
}

function renderCandNidBoxes() {
  const nid = String(document.getElementById('cand_nid').value || '').padStart(10, '0');
  const container = document.getElementById('cand-id-boxes');
  container.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const b = document.createElement('div');
    b.className = 'id-box';
    b.textContent = nid.charAt(i) || '-';
    container.appendChild(b);
  }
}

function sendToGoogleSheetWebhook(action, payload) {
  const webhookUrl = localStorage.getItem('AGY_UNIT_WEBHOOK_URL') || DEFAULT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, data: payload })
    }).catch(e => console.log('Webhook log:', e));
  } catch (e) {}
}

function submitCandidateForm() {
  const name = document.getElementById('cand_name').value.trim();
  const nid = document.getElementById('cand_nid').value.trim();
  if (!name || !nid) return showToast('يرجى إدخال اسم المرشح ورقم الهوية كاملين', true);

  const periods = Array.from(document.querySelectorAll('.cand_p:checked')).map(c => c.value).join(' / ');
  const outgoing = generateNextOutgoingNumber();
  const todayStr = new Date().toLocaleDateString('ar-SA');

  const candidateData = {
    name: name,
    nationalId: nid,
    nationality: document.getElementById('cand_nation').value,
    phone: document.getElementById('cand_phone').value,
    age: document.getElementById('cand_age').value,
    job: document.getElementById('cand_job').value || 'معلم قرآن',
    unit: document.getElementById('cand_unit').value,
    section: document.getElementById('cand_sec').value,
    periods: periods,
    r1: document.getElementById('cand_r1').value,
    r2: document.getElementById('cand_r2').value
  };

  const empObj = {
    id: 'م-' + outgoing.rawNumber.slice(-4),
    name: candidateData.name,
    nationalId: candidateData.nationalId,
    nationality: candidateData.nationality,
    phone: candidateData.phone,
    age: candidateData.age,
    job: candidateData.job,
    unit: candidateData.unit,
    section: candidateData.section,
    period: candidateData.periods,
    task: 'طلب تعيين تحت الإجراء',
    note: 'مرشح تعيين جديد'
  };

  if (document.getElementById('saveCandidateToDbCheck').checked) {
    APP_DATA.employees.push(empObj);
    sendToGoogleSheetWebhook('employee', empObj);
  }

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: 'طلب تعيين',
    subject: 'طلب تعيين - ' + name,
    employeeName: name,
    employeeId: 'مرشح جديد',
    status: 'قيد التنفيذ',
    details: candidateData
  };
  APP_DATA.archive.unshift(archiveItem);
  saveData();
  sendToGoogleSheetWebhook('archive', archiveItem);

  showToast('تم اعتماد طلب التعيين وحفظه بنجاح برقم صادر: ' + outgoing.fullHeader);
  openPrintModal(archiveItem);
}

function onEmpSelectForForm() {
  const empId = document.getElementById('formEmpSelect').value;
  const prev = document.getElementById('formEmpPreview');
  if (!empId) { prev.classList.add('hidden'); return; }

  const emp = APP_DATA.employees.find(e => String(e.id) === String(empId));
  if (!emp) return;

  document.getElementById('f-name').textContent = emp.name;
  document.getElementById('f-id').textContent = emp.id;
  document.getElementById('f-nid').textContent = emp.nationalId;
  document.getElementById('f-job').textContent = emp.job;
  document.getElementById('f-unit').textContent = emp.unit;
  document.getElementById('f-sec').textContent = emp.section;

  const nid = String(emp.nationalId || '').padStart(10, '0');
  const container = document.getElementById('f-id-boxes');
  container.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const b = document.createElement('div');
    b.className = 'id-box';
    b.textContent = nid.charAt(i) || '-';
    container.appendChild(b);
  }
  prev.classList.remove('hidden');
}

function toggleMultiEmpSelectionMode() {
  const isMulti = document.getElementById('isMultiEmpAssignmentCheck')?.checked;
  const singleCont = document.getElementById('singleEmpContainer');
  const multiCont = document.getElementById('multiEmpContainer');
  const empPrev = document.getElementById('formEmpPreview');

  if (isMulti) {
    singleCont?.classList.add('hidden');
    multiCont?.classList.remove('hidden');
    empPrev?.classList.add('hidden');
  } else {
    singleCont?.classList.remove('hidden');
    multiCont?.classList.add('hidden');
  }
}

function selectAllFormEmployees(checkedState) {
  document.querySelectorAll('.multi-emp-cb').forEach(cb => {
    cb.checked = checkedState;
  });
}

function submitDefinedForm() {
  const formTitle = document.getElementById('definedFormTypeSelect').value;
  if (!formTitle) return showToast('اختر نوع النموذج', true);

  const isMulti = document.getElementById('isMultiEmpAssignmentCheck')?.checked;
  let employeeId = '';
  let employeeName = '';
  let assignedEmployeesList = [];

  if (isMulti) {
    const checkedCbs = Array.from(document.querySelectorAll('.multi-emp-cb:checked'));
    if (!checkedCbs.length) return showToast('اختر موظفاً واحداً على الأقل للتكليف الجماعي', true);

    checkedCbs.forEach(cb => {
      const emp = APP_DATA.employees.find(e => String(e.id) === String(cb.value));
      if (emp) {
        assignedEmployeesList.push(emp);
      } else {
        assignedEmployeesList.push({ id: cb.value, name: cb.getAttribute('data-name') || cb.value });
      }
    });

    employeeId = 'تكليف جماعي (' + assignedEmployeesList.length + ' موظفين)';
    employeeName = assignedEmployeesList.map(e => e.name).join('، ');
  } else {
    employeeId = document.getElementById('formEmpSelect').value;
    if (!employeeId) return showToast('اختر الموظف المعني بالطلب', true);
    const emp = APP_DATA.employees.find(e => String(e.id) === String(employeeId));
    if (emp) {
      assignedEmployeesList.push(emp);
      employeeName = emp.name;
    }
  }

  const outgoing = generateNextOutgoingNumber();
  const todayStr = new Date().toLocaleDateString('ar-SA');

  const startDate = document.getElementById('formStartDate')?.value || '';
  const endDate = document.getElementById('formEndDate')?.value || '';
  const extraType = document.getElementById('formExtraType')?.value || '';

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: formTitle,
    subject: formTitle + ' - ' + (isMulti ? `تكليف جماعي (${assignedEmployeesList.length} موظفاً)` : employeeName),
    employeeName: employeeName,
    employeeId: employeeId,
    startDate: startDate,
    endDate: endDate,
    extraType: extraType,
    isMultiAssignment: isMulti,
    assignedEmployeesList: assignedEmployeesList,
    status: 'قيد التنفيذ',
    bodyText: document.getElementById('formEmpNotes').value
  };

  // إذا كان النموذج إنهاء تكليف صادر من سحب أرشيف سابق
  if (window._activeTerminatingArchiveIndex !== undefined && APP_DATA.archive[window._activeTerminatingArchiveIndex]) {
    APP_DATA.archive[window._activeTerminatingArchiveIndex].status = 'تم إنهاء التكليف';
    delete window._activeTerminatingArchiveIndex;
  }

  APP_DATA.archive.unshift(archiveItem);
  saveData();
  sendToGoogleSheetWebhook('archive', archiveItem);

  showToast('تم اعتماد النموذج وحفظه برقم: ' + outgoing.fullHeader);
  openPrintModal(archiveItem);
}

function submitOpenLetter() {
  const subject = document.getElementById('openLetterSubject').value.trim();
  const bodyText = document.getElementById('openLetterBody').value.trim();
  const employeeId = document.getElementById('openEmpSelect').value;
  const addressee = document.getElementById('openLetterAddressee')?.value || 'فضيلة رئيس وحدة الشؤون المالية والإدارية سلمه الله';

  if (!subject || !bodyText) return showToast('ادخل موضوع ونص الخطاب', true);

  const emp = APP_DATA.employees.find(e => String(e.id) === String(employeeId));
  const outgoing = generateNextOutgoingNumber();
  const todayStr = new Date().toLocaleDateString('ar-SA');

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: 'خطاب رسمي',
    subject: subject,
    addressee: addressee,
    employeeName: emp ? emp.name : 'عام',
    employeeId: employeeId || '—',
    status: 'قيد التنفيذ',
    bodyText: bodyText
  };

  APP_DATA.archive.unshift(archiveItem);
  saveData();
  sendToGoogleSheetWebhook('archive', archiveItem);

  showToast('تم إعداد الخطاب وحفظه بنجاح برقم: ' + outgoing.fullHeader);
  openPrintModal(archiveItem);
}

// ------------------------------------------------------------------
// 2. الأرشيف وتحديث حالة الإجراء
// ------------------------------------------------------------------
function renderArchiveTable() {
  const nameFilter = (document.getElementById('archiveFilterName')?.value || '').toLowerCase();
  const numFilter = (document.getElementById('archiveFilterNumber')?.value || '').toLowerCase();
  const tbody = document.getElementById('archiveTableBody');
  if (!tbody) return;

  const filtered = APP_DATA.archive.filter(r => {
    const matchName = !nameFilter || (r.employeeName || '').toLowerCase().includes(nameFilter) || (r.subject || '').toLowerCase().includes(nameFilter);
    const matchNum = !numFilter || (r.outgoingNumber || '').toLowerCase().includes(numFilter);
    return matchName && matchNum;
  });

  tbody.innerHTML = filtered.length ? '' : '<tr><td colspan="8" style="text-align:center;">لا توجد معاملات صادر مسجلة</td></tr>';
  
  filtered.forEach((r, idx) => {
    let badgeClass = 'badge-pending';
    if (r.status === 'مرفوض') badgeClass = 'badge-rejected';
    if (r.status === 'تم التنفيذ' || r.status === 'تم إنهاء التكليف') badgeClass = 'badge-done';

    const isAssignment = (r.type || '').includes('تكليف') || (r.type || '').includes('تعيين') || (r.type || '').includes('فترة');
    const terminateBtn = isAssignment && r.status !== 'تم إنهاء التكليف' 
      ? `<button class="btn btn-warning btn-sm" onclick="terminateAssignmentFromArchive(${idx})" style="margin-left:4px;">🛑 طلب إنهاء تكليف</button>` 
      : '';

    tbody.innerHTML += `
      <tr>
        <td><strong>${r.outgoingNumber}</strong></td>
        <td>${r.date}</td>
        <td>${r.type}</td>
        <td>${r.subject}</td>
        <td>${r.employeeName || '—'}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
        <td>
          <select class="btn-sm" onchange="changeArchiveStatus(${idx}, this.value)">
            <option value="قيد التنفيذ" ${r.status==='قيد التنفيذ'?'selected':''}>قيد التنفيذ</option>
            <option value="تم التنفيذ" ${r.status==='تم التنفيذ'?'selected':''}>تم التنفيذ</option>
            <option value="تم إنهاء التكليف" ${r.status==='تم إنهاء التكليف'?'selected':''}>تم إنهاء التكليف</option>
            <option value="مرفوض" ${r.status==='مرفوض'?'selected':''}>مرفوض</option>
          </select>
        </td>
        <td>
          ${terminateBtn}
          <button class="btn btn-outline btn-sm" onclick="openPrintModalByIndex(${idx})">👁️ معاينة وطباعة</button>
        </td>
      </tr>`;
  });
}

function terminateAssignmentFromArchive(index) {
  const item = APP_DATA.archive[index];
  if (!item) return;

  // 1. الانتقال إلى تبويب المراسلات
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const tabBtn = document.querySelector('[data-tab="correspondence"]');
  if (tabBtn) tabBtn.classList.add('active');
  const panel = document.getElementById('tab-correspondence');
  if (panel) panel.classList.add('active');

  showSection('formSelectSection');

  // 2. اختيار نموذج إنهاء تكليف
  const typeSelect = document.getElementById('definedFormTypeSelect');
  if (typeSelect) {
    typeSelect.value = 'إنهاء تكليف';
    onFormTypeChange();
  }

  // 3. تعبئة بيانات الموظف
  if (item.employeeId && item.employeeId !== 'مرشح جديد') {
    const empSelect = document.getElementById('formEmpSelect');
    if (empSelect) {
      empSelect.value = item.employeeId;
      onEmpSelectForForm();
    }
  }

  // 4. تعبئة التواريخ والبيان
  const startDateInput = document.getElementById('formStartDate');
  if (startDateInput) startDateInput.value = item.startDate || item.date || '';

  const endDateInput = document.getElementById('formEndDate');
  if (endDateInput) endDateInput.value = new Date().toISOString().slice(0, 10);

  const extraTypeInput = document.getElementById('formExtraType');
  if (extraTypeInput) extraTypeInput.value = item.subject || item.type || 'إنهاء تكليف رسمي';

  const notesInput = document.getElementById('formEmpNotes');
  if (notesInput) {
    notesInput.value = `إنهاء التكليف الصادر برقم (${item.outgoingNumber}) والمؤرخ في ${item.date}. المعني بالتكليف: ${item.employeeName || ''}.`;
  }

  window._activeTerminatingArchiveIndex = index;

  showToast(`تم سحب بيانات التكليف (${item.outgoingNumber}) وتعبئتها تلقائياً في نموذج إنهاء التكليف!`);
}

function changeArchiveStatus(index, newStatus) {
  if (APP_DATA.archive[index]) {
    APP_DATA.archive[index].status = newStatus;
    saveData();
    showToast('تم تحديث حالة المعاملة إلى: ' + newStatus);
  }
}

// ------------------------------------------------------------------
// 3. قاعدة بيانات الموظفين (الموارد البشرية)
// ------------------------------------------------------------------
function renderEmployeesTable() {
  const q = (document.getElementById('empSearchInput')?.value || '').toLowerCase();
  const tbody = document.getElementById('employeesTableBody');
  if (!tbody) return;

  const filtered = APP_DATA.employees.filter(e => 
    (e.name || '').toLowerCase().includes(q) || 
    String(e.id || '').includes(q) || 
    String(e.nationalId || '').includes(q)
  );

  tbody.innerHTML = filtered.length ? '' : '<tr><td colspan="8" style="text-align:center;">لا يوجد موظفون مطبقون للبحث</td></tr>';

  filtered.forEach((emp, index) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.id || '—'}</strong></td>
        <td>${emp.name}</td>
        <td>${emp.job || '—'}</td>
        <td>${emp.nationalId || '—'}</td>
        <td>${emp.phone || '—'}</td>
        <td>${emp.period || '—'}</td>
        <td>${emp.task || '—'}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editEmployee(${index})">✏️ تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="removeEmployee(${index})">🗑️ حذف</button>
        </td>
      </tr>`;
  });
}

function filterEmployeeTable() {
  renderEmployeesTable();
}

function openEmployeeModal() {
  document.getElementById('empModalTitle').textContent = 'إضافة موظف جديد';
  document.getElementById('empRowIndex').value = '';
  ['empNameInput', 'empIdInput', 'empNationalIdInput', 'empJobInput', 'empPeriodInput', 'empSectionInput', 'empPhoneInput', 'empAgeInput', 'empTaskInput', 'empNoteInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('empModal').classList.remove('hidden');
}

function editEmployee(index) {
  const emp = APP_DATA.employees[index];
  if (!emp) return;

  document.getElementById('empModalTitle').textContent = 'تعديل بيانات الموظف';
  document.getElementById('empRowIndex').value = index;
  document.getElementById('empNameInput').value = emp.name || '';
  document.getElementById('empIdInput').value = emp.id || '';
  document.getElementById('empNationalIdInput').value = emp.nationalId || '';
  document.getElementById('empNationalityInput').value = emp.nationality || 'سعودي';
  document.getElementById('empJobInput').value = emp.job || '';
  document.getElementById('empPeriodInput').value = emp.period || '';
  document.getElementById('empUnitInput').value = emp.unit || 'حلقات القرآن الكريم';
  document.getElementById('empSectionInput').value = emp.section || '';
  document.getElementById('empPhoneInput').value = emp.phone || '';
  document.getElementById('empAgeInput').value = emp.age || '';
  document.getElementById('empTaskInput').value = emp.task || '';
  document.getElementById('empNoteInput').value = emp.note || '';

  document.getElementById('empModal').classList.remove('hidden');
}

function closeEmployeeModal() {
  document.getElementById('empModal').classList.add('hidden');
}

function submitEmployeeForm() {
  const indexVal = document.getElementById('empRowIndex').value;
  const empData = {
    name: document.getElementById('empNameInput').value.trim(),
    id: document.getElementById('empIdInput').value.trim(),
    nationalId: document.getElementById('empNationalIdInput').value.trim(),
    nationality: document.getElementById('empNationalityInput').value,
    job: document.getElementById('empJobInput').value,
    period: document.getElementById('empPeriodInput').value,
    unit: document.getElementById('empUnitInput').value,
    section: document.getElementById('empSectionInput').value,
    phone: document.getElementById('empPhoneInput').value,
    age: document.getElementById('empAgeInput').value,
    task: document.getElementById('empTaskInput').value,
    note: document.getElementById('empNoteInput').value
  };

  if (!empData.name || !empData.id) return showToast('الاسم والرقم الوظيفي حقول إجبارية', true);

  if (indexVal !== '') {
    APP_DATA.employees[Number(indexVal)] = empData;
    showToast('تم تعديل بيانات الموظف بنجاح');
  } else {
    APP_DATA.employees.push(empData);
    showToast('تمت إضافة الموظف الجديد وحفظه بنجاح');
  }

  saveData();
  sendToGoogleSheetWebhook('employee', empData);
  closeEmployeeModal();
}

function removeEmployee(index) {
  if (confirm('هل أنت متأكد من حذف بيانات هذا الموظف؟')) {
    APP_DATA.employees.splice(index, 1);
    saveData();
    showToast('تم الحذف بنجاح');
  }
}

function exportEmployeesCSV() {
  if (!APP_DATA.employees.length) return showToast('لا توجد بيانات موظفين للتصدير', true);
  
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "الرقم الوظيفي,اسم الموظف,رقم الهوية,الجنسية,المسمى الوظيفي,الفترة,الوحدة,الشعبة,الجوال,العمر,التكليف,ملاحظات\n";

  APP_DATA.employees.forEach(e => {
    const row = [e.id, e.name, e.nationalId, e.nationality, e.job, e.period, e.unit, e.section, e.phone, e.age, e.task, e.note].map(v => `"${v || ''}"`).join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `سجل_الموظفين_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ------------------------------------------------------------------
// 4. القوالب والمواعيد والمهام
// ------------------------------------------------------------------
function renderTemplatesTable() {
  const tbody = document.getElementById('templatesTableBody');
  if (!tbody) return;

  const tpls = APP_DATA.templates.length ? APP_DATA.templates : DEFAULT_TEMPLATES;
  tbody.innerHTML = '';

  tpls.forEach((t, i) => {
    const docUrl = t.file ? `templates/${encodeURIComponent(t.file)}` : (t.fileUrl || '#');
    const typeKey = t.typeKey || t.name;

    tbody.innerHTML += `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td><span class="badge badge-normal">${t.category || 'نموذج إداري'}</span></td>
        <td>${t.desc || t.description || 'نموذج رسمى معتمد'}</td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="useTemplateToIssueForm('${typeKey}')">✏️ إصدار وتعبئة</button>
            <button class="btn btn-outline btn-sm" onclick="previewBlankTemplateModal('${typeKey}', '${t.name}')">👁️ معاينة للطباعة</button>
            <a href="${docUrl}" download class="btn btn-outline btn-sm">📥 تحميل (.docx)</a>
          </div>
        </td>
        <td><button class="btn btn-danger btn-sm" onclick="removeTemplate(${i})">حذف</button></td>
      </tr>`;
  });
}

function useTemplateToIssueForm(typeKey) {
  // الانتقال لتبويب المراسلات
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const tabBtn = document.querySelector('[data-tab="correspondence"]');
  if (tabBtn) tabBtn.classList.add('active');
  const panel = document.getElementById('tab-correspondence');
  if (panel) panel.classList.add('active');

  showSection('formSelectSection');

  const typeSelect = document.getElementById('definedFormTypeSelect');
  if (typeSelect) {
    typeSelect.value = typeKey;
    onFormTypeChange();
  }

  showToast(`تم فتح النموذج الرسمى: ${typeKey}`);
}

function previewBlankTemplateModal(typeKey, name) {
  const outgoing = generateNextOutgoingNumber();
  const dummyItem = {
    outgoingNumber: outgoing.fullHeader,
    date: new Date().toLocaleDateString('ar-SA'),
    type: typeKey,
    subject: name,
    employeeName: '[ اسم الموظف / المعلم ]',
    employeeId: '000XXXX',
    startDate: '1447/01/01هـ',
    endDate: '1447/12/30هـ',
    extraType: name,
    status: 'معاينة قالب',
    bodyText: 'هذه معاينة للقالب المعتمد برقم صادر رسمي جاهز للتعبئة والطباعة المباشرة.'
  };
  openPrintModal(dummyItem);
}

function openTemplateModal() {
  document.getElementById('tplNameInput').value = '';
  document.getElementById('tplDescInput').value = '';
  document.getElementById('tplDocIdInput').value = '';
  document.getElementById('templateModal').classList.remove('hidden');
}

function closeTemplateModal() {
  document.getElementById('templateModal').classList.add('hidden');
}

function submitNewTemplate() {
  const name = document.getElementById('tplNameInput').value.trim();
  const desc = document.getElementById('tplDescInput').value.trim();
  const docUrl = document.getElementById('tplDocIdInput').value.trim();

  if (!name) return showToast('أدخل اسم النموذج', true);

  APP_DATA.templates.push({
    name: name,
    description: desc,
    date: new Date().toLocaleDateString('ar-SA'),
    fileUrl: docUrl || '#'
  });

  saveData();
  closeTemplateModal();
  showToast('تمت إضافة القالب بنجاح');
}

function removeTemplate(index) {
  if (confirm('حذف هذا القالب؟')) {
    APP_DATA.templates.splice(index, 1);
    saveData();
  }
}

function renderDropdowns() {
  ['formEmpSelect', 'openEmpSelect'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const curr = select.value;
    select.innerHTML = '<option value="">-- اختر الموظف من السجل --</option>';
    APP_DATA.employees.forEach(e => {
      select.innerHTML += `<option value="${e.id}">${e.name} (${e.id})</option>`;
    });
    select.value = curr;
  });

  const checklist = document.getElementById('multiEmpChecklist');
  if (checklist) {
    // الاحتفاظ بالمعلمين المحددين سابقاً إن وجدوا
    const selectedIds = new Set(Array.from(document.querySelectorAll('.multi-emp-cb:checked')).map(cb => cb.value));
    
    checklist.innerHTML = '';
    if (!APP_DATA.employees.length) {
      checklist.innerHTML = '<p style="font-size:0.85rem; color:#888; text-align:center;">لا يوجد موظفون بالسجل</p>';
    } else {
      APP_DATA.employees.forEach(e => {
        const isChecked = selectedIds.has(String(e.id)) ? 'checked' : '';
        checklist.innerHTML += `
          <label class="checkbox-label" style="display:block; margin-bottom:6px; font-weight:normal; font-size:0.9rem;">
            <input type="checkbox" class="multi-emp-cb" value="${e.id}" data-name="${e.name}" ${isChecked}>
            <strong>${e.name}</strong> (${e.id}) - <span style="color:#666;">${e.job || 'موظف'}</span>
          </label>`;
      });
    }
  }
}

function filterMultiEmpChecklist() {
  const q = (document.getElementById('multiEmpSearchInput')?.value || '').toLowerCase().trim();
  const labels = document.querySelectorAll('#multiEmpChecklist label');
  
  labels.forEach(lbl => {
    const text = lbl.textContent.toLowerCase();
    if (!q || text.includes(q)) {
      lbl.style.display = 'block';
    } else {
      lbl.style.display = 'none';
    }
  });
}

function submitMeeting() {
  const title = document.getElementById('meetingTitle').value.trim();
  if (!title) return showToast('ادخل عنوان الموعد', true);

  const m = {
    title: title,
    date: document.getElementById('meetingDate').value,
    time: document.getElementById('meetingTime').value,
    location: document.getElementById('meetingLocation').value,
    notes: document.getElementById('meetingNotes').value
  };

  APP_DATA.meetings.push(m);
  saveData();
  sendToGoogleSheetWebhook('meeting', m);

  document.getElementById('meetingTitle').value = '';
  showToast('تم حفظ الموعد بنجاح في النظام وشيت جوجل');
}

function renderMeetingsTable() {
  const tbody = document.getElementById('meetingsTableBody');
  if (!tbody) return;
  tbody.innerHTML = APP_DATA.meetings.length ? '' : '<tr><td colspan="5" style="text-align:center;">لا توجد مواعيد مضافة</td></tr>';

  APP_DATA.meetings.forEach(m => {
    tbody.innerHTML += `<tr><td>${m.title}</td><td>${m.date || '—'}</td><td>${m.time || '—'}</td><td>${m.location || '—'}</td><td>${m.notes || '—'}</td></tr>`;
  });
}

function submitTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) return showToast('ادخل عنوان المهمة', true);

  const t = {
    title: title,
    assignedTo: document.getElementById('taskAssignee').value || 'مكتب رئيس الوحدة',
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDue').value,
    status: 'قيد التنفيذ'
  };

  APP_DATA.tasks.push(t);
  saveData();
  sendToGoogleSheetWebhook('task', t);

  document.getElementById('taskTitle').value = '';
  showToast('تمت إضافة المهمة وحفظها بنجاح');
}

function renderTasksTable() {
  const tbody = document.getElementById('tasksTableBody');
  if (!tbody) return;
  tbody.innerHTML = APP_DATA.tasks.length ? '' : '<tr><td colspan="6" style="text-align:center;">لا توجد مهام</td></tr>';

  APP_DATA.tasks.forEach((t, i) => {
    const isUrgent = t.priority === 'مهمة عاجلة';
    const isDone = t.status === 'مكتمل';
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.title}</strong></td>
        <td>${t.assignedTo || '—'}</td>
        <td><span class="badge ${isUrgent ? 'badge-urgent' : 'badge-normal'}">${t.priority}</span></td>
        <td>${t.dueDate || '—'}</td>
        <td>${t.status}</td>
        <td><button class="btn btn-outline btn-sm" onclick="toggleTask(${i})">${isDone?'إعادة فتح':'إنهاء المهمة'}</button></td>
      </tr>`;
  });
}

function toggleTask(index) {
  if (APP_DATA.tasks[index]) {
    APP_DATA.tasks[index].status = APP_DATA.tasks[index].status === 'مكتمل' ? 'قيد التنفيذ' : 'مكتمل';
    saveData();
  }
}

function saveQuickDecision() {
  const text = document.getElementById('quickDecisionText').value.trim();
  if (!text) return showToast('اكتب نص القرار قبل الإرسال', true);

  const t = {
    title: text,
    assignedTo: 'مكتب رئيس الوحدة',
    priority: 'مهمة عاجلة',
    dueDate: new Date().toISOString().slice(0,10),
    status: 'قيد التنفيذ'
  };

  APP_DATA.tasks.push(t);
  saveData();
  sendToGoogleSheetWebhook('task', t);

  document.getElementById('quickDecisionText').value = '';
  showToast('تم حفظ التوجيه كـ مهمة عاجلة وحفظه في شيت جوجل');
}

function renderStats() {
  const today = new Date().toLocaleDateString('ar-SA');
  if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = APP_DATA.archive.length;
  if (document.getElementById('stat-today')) document.getElementById('stat-today').textContent = APP_DATA.archive.filter(a => a.date === today).length;
  if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = APP_DATA.tasks.filter(t => t.status === 'قيد التنفيذ').length;
  if (document.getElementById('stat-done')) document.getElementById('stat-done').textContent = APP_DATA.tasks.filter(t => t.status === 'مكتمل').length;
}

// ------------------------------------------------------------------
// 5. المعاينة المعتمدة والطباعة (Print Preview Modal)
// ------------------------------------------------------------------
function openPrintModal(item) {
  const container = document.getElementById('printContent');
  let bodyHtml = '';

  const d = item.details || {};
  const emp = item.empDetails || {};
  const empName = item.employeeName || d.name || emp.name || '—';
  const empId = item.employeeId || emp.id || '—';
  const empNid = emp.nationalId || d.nationalId || '0000000000';
  const nidStr = String(empNid).padStart(10, '0');

  let nidBoxes = '<div class="id-boxes-container" style="display:inline-flex; gap:2px; vertical-align:middle; margin:0 4px;">';
  for (let i = 0; i < 10; i++) {
    nidBoxes += `<div class="id-box" style="width:18px; height:22px; border:1px solid #000; text-align:center; line-height:20px; font-weight:bold; font-size:0.8rem; background:#fff;">${nidStr.charAt(i)}</div>`;
  }
  nidBoxes += '</div>';

  // جدول البيانات الأساسية الخاص بكافة النماذج المعتمدة
  const baseEmpTableHtml = `
    <div style="margin-bottom:14px;">
      <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">البيانات الأساسية للموظف / المعلم</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:right;" border="1" cellpadding="5">
        <tr>
          <td style="background:#fafafa; width:15%;"><strong>الاســـــــم:</strong></td>
          <td style="width:35%;"><strong>${empName}</strong></td>
          <td style="background:#fafafa; width:15%;"><strong>الرقم الوظيفي:</strong></td>
          <td style="width:35%;"><strong>${empId}</strong></td>
        </tr>
        <tr>
          <td style="background:#fafafa;"><strong>رقم الهوية:</strong></td>
          <td>${nidBoxes}</td>
          <td style="background:#fafafa;"><strong>الجنسية:</strong></td>
          <td>${emp.nationality || d.nationality || 'سعودي'}</td>
        </tr>
        <tr>
          <td style="background:#fafafa;"><strong>الـوحــدة:</strong></td>
          <td>${emp.unit || d.unit || 'الشؤون التعليمية'}</td>
          <td style="background:#fafafa;"><strong>المسمى الوظيفي:</strong></td>
          <td>${emp.job || d.job || 'معلم / موظف'}</td>
        </tr>
        <tr>
          <td style="background:#fafafa;"><strong>الفترات الحالية:</strong></td>
          <td>${emp.period || d.periods || 'فترة العمل الرسمية'}</td>
          <td style="background:#fafafa;"><strong>الشعبة / القسم:</strong></td>
          <td>${emp.section || d.section || 'حلقات القرآن الكريم'}</td>
        </tr>
      </table>
    </div>
  `;

  // فحص التكليف الجماعي (أكثر من موظف)
  if (item.assignedEmployeesList && item.assignedEmployeesList.length > 1) {
    let empRowsHtml = item.assignedEmployeesList.map((e, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${e.name}</strong></td>
        <td style="text-align:center;">${e.id || '—'}</td>
        <td>${e.job || 'معلم / موظف'}</td>
        <td>${e.period || 'فترة التكليف الرسمية'}</td>
      </tr>
    `).join('');

    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:15px; color:var(--primary-900); text-decoration:underline;">( قرار / نموذج تكليف جماعي - ${item.type} )</h3>
      <p style="font-size:0.9rem;"><strong>بيانات الموظفين المعنيين بالتكليف الجماعي (عدد: ${item.assignedEmployeesList.length} موظفاً):</strong></p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:15px; font-size:0.85rem;" border="1" cellpadding="6">
        <tr style="background:#f4f4f4;">
          <th style="width:35px;">م</th>
          <th>اسم الموظف / المعلم</th>
          <th>الرقم الوظيفي</th>
          <th>المسمى الوظيفي</th>
          <th>الفترة / القسم</th>
        </tr>
        ${empRowsHtml}
      </table>
      <p style="font-size:0.9rem;"><strong>تاريخ بداية الإجراء/التكليف:</strong> ${item.startDate || item.date} ${item.endDate ? ' | <strong>تاريخ النهاية:</strong> ' + item.endDate : ''}</p>
      <p style="font-size:0.9rem;"><strong>المهام والتوجيهات:</strong> ${item.bodyText || 'إكمال كافة الالتزامات والمهام المسندة لحاجة العمل.'}</p>
      <div style="margin-top:15px; padding:10px; border:1px dashed #000; background:#fffdfa; font-size:0.85rem;">
        <p style="margin:0 0 4px 0;"><strong>توجيه رئيس وحدة الشؤون المالية والإدارية:</strong> [ ☑ موافق ] [ ☐ غير موافق ]</p>
        <p style="margin:0;"><strong>اعتماد تنفيذ التكليف الجماعي:</strong> تم الاعتماد والتنفيذ بموجب الاعتماد المالي والإداري.</p>
      </div>
    `;
  } else if (item.type === 'خطاب رسمي') {
    bodyHtml = `
      <p style="font-weight:bold; font-size:1.1rem; margin-bottom:12px;">${item.addressee || 'فضيلة رئيس وحدة الشؤون المالية والإدارية سلمه الله'}</p>
      <p style="margin-bottom:14px;">السلام عليكم ورحمة الله وبركاته، وبعد:</p>
      <p style="margin-bottom:16px;">فنسأل الله لكم دوام التوفيق والسداد، ${item.subject ? 'نفيدكم بشأن <strong>(' + item.subject + ')</strong>' : ''}</p>
      
      <div style="margin:20px 0; font-size:1.05rem; min-height:140px; background:#fff; padding:12px 0; line-height:1.9;">
        ${item.bodyText || 'نأمل من فضيلتكم التكرم بالإحاطة والعلم والتوجيه بما يلزم، شاكرين ومقدرين جهودكم.'}
      </div>

      <p style="text-align:center; font-weight:bold; margin-top:25px;">والله يحفظكم ويرعاكم،، والسلام عليكم ورحمة الله وبركاته</p>
    `;
  } else {
    // بناء جدول الجانب التفصيلي المخصص الفريد لكل نموذج لمنع تداخل المحتويات
    let actionTableHtml = '';
    const typeStr = item.type || '';

    if (typeStr.includes('تحويل فترة') || typeStr.includes('اضافة فترة') || typeStr.includes('الغاء فترة')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات الفترات والإجراء المطلوب ( ${typeStr} )</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>الفترة المراد الإجراء عليها:</strong></td>
              <td style="width:28%;"><strong>${item.extraType || 'الفترة الحالية'}</strong></td>
              <td style="background:#fafafa; width:22%;"><strong>الفترة / التعديل الجديد:</strong></td>
              <td style="width:28%;"><strong>${item.subject || 'حسب التوجيه'}</strong></td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>تاريخ بداية ونهاية الإجراء:</strong></td>
              <td>من ${item.startDate || item.date}</td>
              <td style="background:#fafafa;"><strong>التحويل / الإضافة حتى:</strong></td>
              <td>${item.endDate || 'حسب القرار'}</td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>مبررات الإجراء:</strong></td>
              <td colspan="3">${item.bodyText || '1/ حاجة العمل الميداني 2/ إعادة توزيع الفترات للحلقة 3/ استكمال النصاب.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (typeStr.includes('مسمى') || typeStr.includes('تحويل قسم')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات تعديل المسمى الوظيفي والقسم</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>المسمى / القسم الحالي:</strong></td>
              <td style="width:28%;">${emp.job || 'المسمى الحالي'}</td>
              <td style="background:#fafafa; width:22%;"><strong>المسمى / القسم الجديد:</strong></td>
              <td style="width:28%;"><strong>${item.extraType || 'المسمى المطلوب'}</strong></td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>مبررات تغيير المسمى/القسم:</strong></td>
              <td colspan="3">${item.bodyText || 'لحاجة الشؤون التعليمية وحصول الموظف على التأهيل اللازم.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (typeStr.includes('نقل')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات نقل الموظف / المعلم بين الوحدات</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>الوحدة المنقول منها:</strong></td>
              <td style="width:28%;">${emp.unit || 'الوحدة الحالية'}</td>
              <td style="background:#fafafa; width:22%;"><strong>الوحدة المنقول إليها:</strong></td>
              <td style="width:28%;"><strong>${item.extraType || 'الوحدة الجديدة'}</strong></td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>موافقة الوحدة المنقول منها:</strong></td>
              <td>[ ☑ موافق ] [ ☐ غير موافق ]</td>
              <td style="background:#fafafa;"><strong>تاريخ النقل الفعلي:</strong></td>
              <td>${item.startDate || item.date}</td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>مبررات وتوجيه النقل:</strong></td>
              <td colspan="3">${item.bodyText || 'نظرًا لحاجة الوحدة الجديدة لخدمات المذكور أعلاه وللمصلحة العامة.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (typeStr.includes('إجازة') || typeStr.includes('مباشرة') || typeStr.includes('انقطاع')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات الإجازة والمباشرة والانقطاع</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>نوع الإجازة / الإجراء:</strong></td>
              <td style="width:28%;"><strong>${item.extraType || 'اعتيادية / مرخص بها'}</strong></td>
              <td style="background:#fafafa; width:22%;"><strong>مدة الإجازة (بالأيام):</strong></td>
              <td style="width:28%;"><strong>${item.endDate ? 'محددة' : 'حسب النظام'}</strong></td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>تاريخ بداية الإجازة/الانقطاع:</strong></td>
              <td>${item.startDate || item.date}</td>
              <td style="background:#fafafa;"><strong>تاريخ المباشرة الفعلي:</strong></td>
              <td>${item.endDate || item.date}</td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>ملاحظات المباشرة والإدارة:</strong></td>
              <td colspan="3">${item.bodyText || 'تمت مباشرة العمل وإكمال الإجراءات النظامية المعتمدة.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (typeStr.includes('مساءلة') || typeStr.includes('مخالفة') || typeStr.includes('لفت نظر') || typeStr.includes('لوم')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#fee2e2; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold; color:#991b1b;">بيانات المساءلة والإنذار الإداري</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>نوع الإشعار:</strong></td>
              <td style="width:28%;"><strong style="color:#991b1b;">${typeStr}</strong></td>
              <td style="background:#fafafa; width:22%;"><strong>تاريخ الملاحظة:</strong></td>
              <td style="width:28%;">${item.startDate || item.date}</td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>تفاصيل المخالفة / الملاحظة:</strong></td>
              <td colspan="3">${item.bodyText || 'لاحظنا التغيّب أو التأخر عن وقت الدوام الرسمي بالحلقات ونلفت نظركم لضرورة الالتزام.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (typeStr.includes('صرف مستحق') || typeStr.includes('انتداب') || typeStr.includes('الدوام المرن')) {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات المستحقات / الانتداب / الدوام المرن</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:22%;"><strong>شهر الصرف / الجهة:</strong></td>
              <td style="width:28%;"><strong>${item.extraType || 'شهر المباشرة'}</strong></td>
              <td style="background:#fafafa; width:22%;"><strong>المبلغ / الساعات:</strong></td>
              <td style="width:28%;"><strong>${item.subject || 'حسب المسيرات'}</strong></td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>سبب الطلب / مبررات الانتداب:</strong></td>
              <td colspan="3">${item.bodyText || 'صرف المستحقات المالية أو بدل الانتداب المقرر لحاجة العمل.'}</td>
            </tr>
          </table>
        </div>
      `;
    } else {
      actionTableHtml = `
        <div style="margin-bottom:14px;">
          <h4 style="background:#f4f4f4; border:1px solid #000; border-bottom:none; padding:4px 8px; margin:0; font-size:0.9rem; font-weight:bold;">بيانات الإجراء والطلب التفصيلية</h4>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;" border="1" cellpadding="5">
            <tr>
              <td style="background:#fafafa; width:20%;"><strong>نوع الطلب / البيان:</strong></td>
              <td><strong>${item.extraType || item.subject || item.type}</strong></td>
              <td style="background:#fafafa; width:20%;"><strong>فترة الإجراء والتواريخ:</strong></td>
              <td>من ${item.startDate || item.date} إلى ${item.endDate || 'مستمر'}</td>
            </tr>
            <tr>
              <td style="background:#fafafa;"><strong>مبررات الإجراء / الملاحظات:</strong></td>
              <td colspan="3">${item.bodyText || 'حسب الأنظمة واللوائح والتعليمات المعتمدة بوحدة الشؤون التعليمية.'}</td>
            </tr>
          </table>
        </div>
      `;
    }

    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:15px; color:var(--primary-900); text-decoration:underline;">( ${item.type || 'نموذج إداري'} )</h3>
      ${baseEmpTableHtml}
      ${actionTableHtml}
      
      <div style="margin-top:15px; font-size:0.9rem; line-height:1.7;">
        <p style="font-weight:bold; margin-bottom:4px;">فضيلة رئيس وحدة الشؤون المالية والإدارية سلمه الله</p>
        <p style="margin-bottom:4px;">السلام عليكم ورحمة الله وبركاته، وبعد:</p>
        <p style="margin-bottom:8px;">نظرًا لحاجة العمل الميداني والتعليمي بالحلقات، نأمل اعتماد قرار المذكور أعلاه وإكمال اللازم.</p>
      </div>

      <div style="margin-top:15px; padding:8px 12px; border:1px dashed #000; background:#fafafa; font-size:0.85rem;">
        <p style="margin:0 0 4px 0;"><strong>توجيه رئيس وحدة الشؤون المالية والإدارية:</strong> [ ☑ موافق ] [ ☐ غير موافق ]</p>
        <p style="margin:0;"><strong>التوقيع:</strong> ..................................... | <strong>التاريخ:</strong> &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026م</p>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="print-header">
      <div style="font-size:0.85rem;">
        المملكة العربية السعودية<br>
        رئاسة الشؤون الدينية بالمسجد الحرام والمسجد النبوي<br>
        وحدة الشؤون التعليمية
      </div>
      <div class="print-title-box">
        <h2>نظام المراسلات والمعاملات الرسمية</h2>
      </div>
      <div class="print-meta">
        <strong>رقم الصادر:</strong> ${item.outgoingNumber}<br>
        <strong>التاريخ:</strong> ${item.date}<br>
        <strong>المرفقات:</strong> بدون
      </div>
    </div>
    
    <div class="print-body">
      ${bodyHtml}
    </div>

    <div class="print-footer">
      <div>ختم الجهة الرسمية</div>
      <div style="text-align:center;">
        <strong>رئيس وحدة الشؤون التعليمية</strong><br><br>
        يزيد بن عبد الرحمن الدويش
      </div>
    </div>
  `;

  document.getElementById('printModal').classList.remove('hidden');
}

function openPrintModalByIndex(index) {
  if (APP_DATA.archive[index]) {
    openPrintModal(APP_DATA.archive[index]);
  }
}

function closePrintModal() {
  document.getElementById('printModal').classList.add('hidden');
}

// ------------------------------------------------------------------
// 6. ربط واستيراد Google Sheets المباشر (CSV Sync & Import)
// ------------------------------------------------------------------
function openSyncModal() {
  document.getElementById('syncModal').classList.remove('hidden');
}

function closeSyncModal() {
  document.getElementById('syncModal').classList.add('hidden');
}

function loadGoogleSheetViaJSONP(sheetUrl, isQuiet = false) {
  if (!sheetUrl) return;
  
  const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) {
    if (!isQuiet) showToast('رابط Google Sheet غير صحيح', true);
    return;
  }
  
  const sheetId = sheetIdMatch[1];

  // 1. جلب الموظفين من تبويب "الموارد_البشرية"
  const cbEmps = 'gvizEmps_' + Math.floor(Math.random() * 1000000);
  window[cbEmps] = function(resp) {
    delete window[cbEmps];
    const s = document.getElementById(cbEmps);
    if (s) s.remove();
    if (resp && resp.status === 'ok' && resp.table) {
      parseJSONPTableAndImport(resp.table, isQuiet, 'employees');
    }
  };
  
  const scriptEmps = document.createElement('script');
  scriptEmps.id = cbEmps;
  scriptEmps.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cbEmps}&sheet=${encodeURIComponent('الموارد_البشرية')}`;
  document.body.appendChild(scriptEmps);

  // 2. جلب المهام من تبويب المهام (gid=0)
  const cbTasks = 'gvizTasks_' + Math.floor(Math.random() * 1000000);
  window[cbTasks] = function(resp) {
    delete window[cbTasks];
    const s = document.getElementById(cbTasks);
    if (s) s.remove();
    if (resp && resp.status === 'ok' && resp.table) {
      parseJSONPTableAndImport(resp.table, isQuiet, 'tasks');
    }
  };

  const scriptTasks = document.createElement('script');
  scriptTasks.id = cbTasks;
  scriptTasks.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cbTasks}&gid=0`;
  document.body.appendChild(scriptTasks);
}

function autoSyncFromGoogleSheetQuietly(rawUrl) {
  loadGoogleSheetViaJSONP(rawUrl, false);
}

function syncFromGoogleSheet() {
  const inputVal = document.getElementById('sheetUrlInput').value.trim();
  if (!inputVal) return showToast('أدخل رابط شيت جوجل', true);

  APP_DATA.sheetUrl = inputVal;
  saveData();

  showToast('جاري قراءة وتوليد البيانات من Google Sheet...');
  loadGoogleSheetViaJSONP(inputVal, false);
  closeSyncModal();
}

function importLocalCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    parseCSVAndImport(e.target.result);
    closeSyncModal();
  };
  reader.readAsText(file);
}

function parseJSONPTableAndImport(table, isQuiet = false, forceType = 'auto') {
  if (!table || !table.rows || !table.rows.length) return;

  const rawRows = table.rows.map(r => r.c ? r.c.map(cell => cell ? (cell.v !== null ? String(cell.v) : '') : '') : []);
  if (!rawRows.length) return;

  if (forceType === 'employees') {
    const importedEmps = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.join('').trim() === '') continue;
      if (i === 0 && (row[1] || row[0] || '').includes('اسم')) continue;

      importedEmps.push({
        id: row[0] || String(i + 1),
        name: row[1] || 'بدون اسم',
        nationalId: row[7] || row[2] || '',
        nationality: row[8] || 'سعودي',
        job: row[3] || 'معلم قرآن',
        period: row[4] || '',
        unit: 'حلقات القرآن الكريم',
        section: '',
        phone: '',
        age: '',
        task: row[5] || '',
        note: row[6] || ''
      });
    }

    if (importedEmps.length) {
      APP_DATA.employees = importedEmps;
      saveData();
      if (!isQuiet) showToast(`تم جلب وتطبيق ${importedEmps.length} موظف من Google Sheet بنجاح!`);
    }
    return;
  }

  if (forceType === 'tasks') {
    const importedTasks = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.join('').trim() === '') continue;
      if (i === 0 && (row[0] || '').includes('العنوان')) continue;

      importedTasks.push({
        title: row[0] || 'مهمة بدون عنوان',
        assignedTo: row[1] || 'مكتب رئيس الوحدة',
        priority: row[2] || 'مهمة غير عاجلة',
        dueDate: row[3] || '',
        status: row[4] || 'قيد التنفيذ'
      });
    }

    if (importedTasks.length) {
      APP_DATA.tasks = importedTasks;
      saveData();
      if (!isQuiet) showToast(`تم جلب وتحديث ${importedTasks.length} مهمة من Google Sheet بنجاح`);
    }
    return;
  }
}

function parseCSVAndImport(csvText, isQuiet = false) {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    if (!isQuiet) showToast('الملف لا يحتوي بيانات كافية', true);
    return;
  }

  const headers = lines[0].split(',').map(c => c.replace(/^"|"$/g, '').trim().toLowerCase());
  
  const findIndex = (...possibleNames) => {
    for (let p of possibleNames) {
      const idx = headers.findIndex(h => h.includes(p));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const isTasksSheet = findIndex('العنوان', 'المهمة', 'المسند') !== -1 && findIndex('الحالة', 'الاستحقاق') !== -1;

  if (isTasksSheet) {
    const titleIdx = findIndex('العنوان', 'المهمة', 'title');
    const assigneeIdx = findIndex('المسند', 'المسند_إليه', 'الأولوية');
    const priorityIdx = findIndex('الأولوية', 'priority');
    const dueIdx = findIndex('تاريخ_الاستحقاق', 'الاستحقاق', 'due');
    const statusIdx = findIndex('الحالة', 'status');

    const importedTasks = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.join('').trim() === '') continue;

      if (cols[0] || cols[1]) {
        importedTasks.push({
          title: (titleIdx !== -1 && cols[titleIdx]) ? cols[titleIdx] : cols[0],
          assignedTo: (assigneeIdx !== -1 && cols[assigneeIdx]) ? cols[assigneeIdx] : (cols[1] || 'مكتب رئيس الوحدة'),
          priority: (priorityIdx !== -1 && cols[priorityIdx]) ? cols[priorityIdx] : 'مهمة غير عاجلة',
          dueDate: (dueIdx !== -1 && cols[dueIdx]) ? cols[dueIdx] : (cols[2] || ''),
          status: (statusIdx !== -1 && cols[statusIdx]) ? cols[statusIdx] : (cols[3] || 'قيد التنفيذ')
        });
      }
    }

    if (importedTasks.length) {
      APP_DATA.tasks = importedTasks;
      saveData();
      if (!isQuiet) showToast(`تم جلب وتحديث ${importedTasks.length} مهمة من Google Sheet بنجاح`);
    }
    return;
  }

  const nameIdx = findIndex('اسم', 'الاسم', 'الموظف', 'name');
  const idIdx = findIndex('الرقم الوظيفي', 'الرقم_الوظيفي', 'id');
  const nidIdx = findIndex('هوية', 'الهوية', 'national');
  const jobIdx = findIndex('مسمى', 'المسمى', 'الوظيفة', 'job');
  const periodIdx = findIndex('فترة', 'الفترة', 'period');
  const unitIdx = findIndex('وحدة', 'الوحدة', 'unit');
  const sectionIdx = findIndex('شعبة', 'قسم', 'القسم', 'section');
  const phoneIdx = findIndex('جوال', 'الجوال', 'هاتف', 'phone');

  const importedEmps = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.join('').trim() === '') continue;

    importedEmps.push({
      id: (idIdx !== -1 && cols[idIdx]) ? cols[idIdx] : String(i),
      name: (nameIdx !== -1 && cols[nameIdx]) ? cols[nameIdx] : (cols[1] || cols[0] || 'بدون اسم'),
      nationalId: (nidIdx !== -1 && cols[nidIdx]) ? cols[nidIdx] : (cols[2] || ''),
      nationality: cols[3] || 'سعودي',
      job: (jobIdx !== -1 && cols[jobIdx]) ? cols[jobIdx] : (cols[4] || ''),
      period: (periodIdx !== -1 && cols[periodIdx]) ? cols[periodIdx] : (cols[5] || ''),
      unit: (unitIdx !== -1 && cols[unitIdx]) ? cols[unitIdx] : (cols[6] || 'حلقات القرآن الكريم'),
      section: (sectionIdx !== -1 && cols[sectionIdx]) ? cols[sectionIdx] : (cols[7] || ''),
      phone: (phoneIdx !== -1 && cols[phoneIdx]) ? cols[phoneIdx] : (cols[8] || ''),
      age: cols[9] || '',
      task: cols[10] || '',
      note: cols[11] || ''
    });
  }

  if (importedEmps.length) {
    APP_DATA.employees = importedEmps;
    saveData();
    if (!isQuiet) showToast(`تم جلب وتطبيق ${importedEmps.length} موظف من Google Sheet بنجاح`);
  }
}
