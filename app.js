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
const DEFAULT_TEMPLATES = [];
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

function submitDefinedForm() {
  const formTitle = document.getElementById('definedFormTypeSelect').value;
  const employeeId = document.getElementById('formEmpSelect').value;

  if (!formTitle) return showToast('اختر نوع النموذج', true);
  if (!employeeId) return showToast('اختر الموظف', true);

  const emp = APP_DATA.employees.find(e => String(e.id) === String(employeeId));
  const outgoing = generateNextOutgoingNumber();
  const todayStr = new Date().toLocaleDateString('ar-SA');

  const startDate = document.getElementById('formStartDate')?.value || '';
  const endDate = document.getElementById('formEndDate')?.value || '';
  const extraType = document.getElementById('formExtraType')?.value || '';

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: formTitle,
    subject: formTitle + ' - ' + (emp ? emp.name : ''),
    employeeName: emp ? emp.name : '',
    employeeId: employeeId,
    startDate: startDate,
    endDate: endDate,
    extraType: extraType,
    empDetails: emp || {},
    status: 'قيد التنفيذ',
    bodyText: document.getElementById('formEmpNotes').value
  };

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

  if (!subject || !bodyText) return showToast('ادخل موضوع ونص الخطاب', true);

  const emp = APP_DATA.employees.find(e => String(e.id) === String(employeeId));
  const outgoing = generateNextOutgoingNumber();
  const todayStr = new Date().toLocaleDateString('ar-SA');

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: 'خطاب حر',
    subject: subject,
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
    if (r.status === 'تم التنفيذ') badgeClass = 'badge-done';

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
            <option value="مرفوض" ${r.status==='مرفوض'?'selected':''}>مرفوض</option>
          </select>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openPrintModalByIndex(${idx})">👁️ معاينة وطباعة</button>
        </td>
      </tr>`;
  });
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
  tbody.innerHTML = APP_DATA.templates.length ? '' : '<tr><td colspan="5" style="text-align:center;">لا توجد قوالب مضافة</td></tr>';

  APP_DATA.templates.forEach((t, i) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${t.description || '—'}</td>
        <td>${t.date || '—'}</td>
        <td><a href="${t.fileUrl || '#'}" target="_blank" class="btn btn-outline btn-sm">رابط المستند</a></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeTemplate(${i})">حذف</button></td>
      </tr>`;
  });
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

  if (item.type === 'طلب تعيين' && d.name) {
    const nid = String(d.nationalId || '').padStart(10, '0');
    let boxesHtml = '<div class="id-boxes-container" style="justify-content:center; margin:16px 0;">';
    for (let i = 0; i < 10; i++) boxesHtml += `<div class="id-box">${nid.charAt(i)}</div>`;
    boxesHtml += '</div>';

    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">طلب تعيين جديد بالحلقات</h3>
      <p><strong>اسم المرشح:</strong> ${d.name}</p>
      <p><strong>رقم الهوية:</strong> ${d.nationalId} | <strong>الجنسية:</strong> ${d.nationality} | <strong>العمر:</strong> ${d.age}</p>
      ${boxesHtml}
      <p><strong>المسمى الوظيفي المطلوب:</strong> ${d.job} | <strong>الوحدة:</strong> ${d.unit} | <strong>القسم:</strong> ${d.section}</p>
      <p><strong>الفترات المطلوبة:</strong> ${d.periods || 'غير محدد'}</p>
      <p><strong>مبررات التعيين:</strong> ${d.r1 || ''} - ${d.r2 || ''}</p>
    `;
  } else if (item.type === 'إنهاء تكليف') {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">قرار / نموذج إنهاء تكليف</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom:15px; font-size:0.95rem;" border="1" cellpadding="6">
        <tr style="background:#f4f4f4;">
          <th>الاسم</th>
          <th>الرقم الوظيفي</th>
          <th>مسمى التكليف</th>
          <th>فترات التكليف</th>
          <th>تاريخ بداية ونهاية التكليف</th>
        </tr>
        <tr>
          <td>${item.employeeName}</td>
          <td>${item.employeeId}</td>
          <td>${emp.job || item.extraType || 'مكلف'}</td>
          <td>${emp.period || 'فترة التكليف الرسمية'}</td>
          <td>من ${item.startDate || '—'} إلى ${item.endDate || 'الآن'}</td>
        </tr>
      </table>
      <p><strong>المهام والتوجيه خلال التكليف:</strong> ${item.bodyText || 'إكمال كافة الالتزامات والمهام المسندة.'}</p>
      <div style="margin-top:15px; padding:10px; border:1px dashed #ccc; background:#fafafa;">
        <p><strong>توجيه رئيس وحدة الشؤون المالية والإدارية:</strong> [ ☑ موافق ] [ ☐ غير موافق ]</p>
        <p><strong>اعتماد تنفيذ طلب التكليف:</strong> تم التنفيذ بموجب الاعتماد المالي والإداري.</p>
      </div>
    `;
  } else if (item.type === 'إشعار مباشرة عمل') {
    const nid = String(emp.nationalId || '').padStart(10, '0');
    let boxesHtml = '<div class="id-boxes-container" style="justify-content:center; margin:12px 0;">';
    for (let i = 0; i < 10; i++) boxesHtml += `<div class="id-box">${nid.charAt(i)}</div>`;
    boxesHtml += '</div>';

    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">إشعار مباشرة عمل (عودة من إجازة / قطع إجازة)</h3>
      <p><strong>فضيلة رئيس وحدة الشؤون المالية والإدارية سلمه الله</strong></p>
      <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
      <p>نأمل منكم اعتماد مباشرة المذكور أدناه من تاريخ قطعه لإجازته ومباشرته وإكمال اللازم:</p>
      <p><strong>الاسم:</strong> ${item.employeeName} | <strong>الرقم الوظيفي:</strong> ${item.employeeId}</p>
      ${boxesHtml}
      <p><strong>الوحدة:</strong> الشؤون التعليمية | <strong>المسمى الوظيفي:</strong> ${emp.job || 'معلم/موظف'}</p>
      <p><strong>نوع الإجازة:</strong> ${item.extraType || 'سنوية / مرخص بها'} | <strong>تاريخ المباشرة الفعلي:</strong> ${item.startDate || item.date}</p>
      <p style="margin-top:15px;"><strong>ملاحظات الإدارة:</strong> ${item.bodyText || 'تمت المباشرة وإكمال الإجراءات النظامية.'}</p>
    `;
  } else if (item.type === 'طلب / منح إجازة') {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">طلب / منح إجازة إدارية</h3>
      <p><strong>فضيلة رئيس وحدة الموارد البشرية والمالية سلمه الله</strong></p>
      <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
      <p>فنسأل الله لكم دوام التوفيق والسداد، نأمل منكم منح إجازة (<strong>${item.extraType || 'اعتيادية'}</strong>) للمذكور أدناه:</p>
      <table style="width:100%; border-collapse:collapse; margin:15px 0;" border="1" cellpadding="6">
        <tr style="background:#f4f4f4;"><th>الاسم</th><th>الرقم الوظيفي</th><th>الفترة المحددة</th></tr>
        <tr><td>${item.employeeName}</td><td>${item.employeeId}</td><td>من ${item.startDate || '—'} إلى ${item.endDate || '—'}</td></tr>
      </table>
      <p><strong>البيان والسبب:</strong> ${item.bodyText || 'حسب الأنظمة واللوائح المعتمدة.'}</p>
    `;
  } else if (item.type === 'استثناء دوام') {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">طلب / قرار استثناء دوام وتعديل فترة</h3>
      <p><strong>سعادة رئيس وحدة الشؤون المالية والإدارية حفظه الله</strong></p>
      <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
      <p>نفيدكم بأن الموظف/المعلم المذكور أدناه يطلب اعتماد استثناء الدوام وتعديل الفترة وفق البيانات التالية:</p>
      <p><strong>اسم الموظف:</strong> ${item.employeeName} | <strong>الرقم الوظيفي:</strong> ${item.employeeId}</p>
      <p><strong>فترة الاستثناء:</strong> من ${item.startDate || '—'} إلى ${item.endDate || '—'}</p>
      <p><strong>مبررات التفريغ / الاستثناء:</strong> ${item.bodyText || 'لحاجة العمل الميداني والتعليمي.'}</p>
    `;
  } else if (item.type === 'إسقاط عهدة') {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">نموذج إسقاط عهدة أو نقل للمستودع</h3>
      <p><strong>المكرم رئيس وحدة الموارد البشرية والمالية سلمه الله</strong></p>
      <p>نفيدكم بأن لدينا عدة أصناف تم الاستغناء عنها / غير صالحة للاستخدام وهي كالآتي:</p>
      <table style="width:100%; border-collapse:collapse; margin:15px 0;" border="1" cellpadding="6">
        <tr style="background:#f4f4f4;"><th>م</th><th>نوع الصنف والبيان</th><th>المقدم / العهدة</th><th>الحالة الإدارية</th></tr>
        <tr><td>1</td><td>${item.extraType || 'أجهزة ومعدات مكتبية'}</td><td>${item.employeeName} (${item.employeeId})</td><td>غير صالح للاستخدام / نقل للمستودع</td></tr>
      </table>
      <p><strong>ملاحظات الطلب:</strong> ${item.bodyText || 'إسقاط عهدة ونقل للمستودع.'}</p>
      <div style="margin-top:20px; display:flex; justify-content:space-between; text-align:center; font-size:0.85rem;">
        <div><strong>اعتماد اللجنة</strong><br><br>...................</div>
        <div><strong>مسؤول المستودع</strong><br><br>...................</div>
        <div><strong>رئيس وحدة الموارد البشرية</strong><br>منير بن معلا العمري</div>
      </div>
    `;
  } else if (item.type === 'منح صلاحيات') {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">طلب منح وإضافة صلاحيات إلكترونية (نظام وقار)</h3>
      <p><strong>سعادة مسؤول شعبة التقنية سلمه الله</strong></p>
      <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
      <p>فنسأل الله لكم دوام التوفيق والسداد، نفيدكم بطلب منح صلاحية (<strong>${item.extraType || 'إضافة الحلقات والدرجات'}</strong>) في نظام وقار للمذكور أدناه لحاجة العمل:</p>
      <p><strong>اسم الموظف:</strong> ${item.employeeName} | <strong>الرقم الوظيفي:</strong> ${item.employeeId}</p>
      <p><strong>تفاصيل ومبررات الطلب:</strong> ${item.bodyText || 'منح الصلاحيات اللازمة لمتابعة الحلقات.'}</p>
    `;
  } else {
    bodyHtml = `
      <h3 style="text-align:center; margin-bottom:20px; color:var(--primary-900);">${item.subject || item.type}</h3>
      <p><strong>المعني بالطلب:</strong> ${item.employeeName || 'عام'}</p>
      <div style="margin-top:20px; font-size:1.1rem; min-height:150px; background:#fafafa; padding:15px; border-radius:8px;">
        ${item.bodyText || 'لا توجد تفاصيل إضافية'}
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
        <strong>التاريخ:</strong> ${item.date}
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
