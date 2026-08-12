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
  COUNTERS: 'AGY_UNIT_COUNTERS'
};

// ------------------------------------------------------------------
// البيانات الأولية للتجربة السريعة (Initial Demo Data Seeding)
// ------------------------------------------------------------------
const DEFAULT_EMPLOYEES = [
  { id: '1001', name: 'أحمد بن عبد الله الصالح', nationalId: '1089234567', nationality: 'سعودي', job: 'معلم قرآن كريم', period: 'المغرب والعشاء', unit: 'حلقات القرآن الكريم', section: 'الفرع الأول', phone: '0501234567', age: '34', task: 'تدريس الحلقة النموذجية', note: 'ممتاز' },
  { id: '1002', name: 'محمد بن إبراهيم الحسين', nationalId: '1098765432', nationality: 'سعودي', job: 'مشرف تعليمي', period: 'العصر', unit: 'حلقات القرآن الكريم', section: 'الفرع الثاني', phone: '0559876543', age: '40', task: 'الإشراف على الحلقات', note: '' },
  { id: '1003', name: 'خالد بن عبدالرحمن الغامدي', nationalId: '1076543210', nationality: 'سعودي', job: 'معلم متون علمية', period: 'الفجر', unit: 'حلقات القرآن الكريم', section: 'قسم المتون', phone: '0543210987', age: '38', task: 'شرح منظومة الجزرية', note: '' }
];

const DEFAULT_TEMPLATES = [
  { name: 'نموذج طلب تعيين مرشح', description: 'اعتماد وتعيين مدرس جديد بالحلقات', date: '2026/01/15', fileUrl: '#' },
  { name: 'نموذج طلب تحويل فترة', description: 'تغيير فترة التكليف الحالية', date: '2026/02/01', fileUrl: '#' }
];

const DEFAULT_TASKS = [
  { title: 'إعداد تقرير الحلقات الإحصائي الشهرية', assignedTo: 'مكتب رئيس الوحدة', priority: 'مهمة عاجلة', dueDate: '2026-08-20', status: 'قيد التنفيذ' },
  { title: 'مراجعة طلبات التعيين الجديدة', assignedTo: 'الشؤون التعليمية', priority: 'مهمة غير عاجلة', dueDate: '2026-08-25', status: 'قيد التنفيذ' }
];

const DEFAULT_MEETINGS = [
  { title: 'اجتماع المشرفين التعليميين الدوري', date: '2026-08-15', time: '10:00', location: 'قاعة الاجتماعات الرئيسية', notes: 'مناقشة خطة الفصل الدراسي' }
];

const DEFAULT_ARCHIVE = [
  { outgoingNumber: 'ت / 000001 / 26', date: '2026/08/10', type: 'طلب تعيين', subject: 'طلب تعيين - عبد الرحمن بن سعيد', employeeName: 'عبد الرحمن بن سعيد', employeeId: 'مرشح جديد', status: 'قيد التنفيذ', bodyText: 'طلب تعيين مرشح في حلقات المغرب' }
];

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

let APP_DATA = {
  employees: getStorage(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES),
  templates: getStorage(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES),
  tasks: getStorage(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  meetings: getStorage(STORAGE_KEYS.MEETINGS, DEFAULT_MEETINGS),
  archive: getStorage(STORAGE_KEYS.ARCHIVE, DEFAULT_ARCHIVE),
  counter: getStorage(STORAGE_KEYS.COUNTERS, { year: 2026, lastNumber: 1 })
};

function saveData() {
  setStorage(STORAGE_KEYS.EMPLOYEES, APP_DATA.employees);
  setStorage(STORAGE_KEYS.TEMPLATES, APP_DATA.templates);
  setStorage(STORAGE_KEYS.TASKS, APP_DATA.tasks);
  setStorage(STORAGE_KEYS.MEETINGS, APP_DATA.meetings);
  setStorage(STORAGE_KEYS.ARCHIVE, APP_DATA.archive);
  setStorage(STORAGE_KEYS.COUNTERS, APP_DATA.counter);
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

  renderAllViews();
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

  // حفظ تلقائي للمرشح في سجل الموظفين إن تطلب الأمر
  if (document.getElementById('saveCandidateToDbCheck').checked) {
    APP_DATA.employees.push({
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
    });
  }

  // إضافة إلى الأرشيف
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

  showToast('تم اعتماد طلب التعيين بنجاح برقم صادر: ' + outgoing.fullHeader);
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

  const archiveItem = {
    outgoingNumber: outgoing.fullHeader,
    date: todayStr,
    type: formTitle,
    subject: formTitle + ' - ' + (emp ? emp.name : ''),
    employeeName: emp ? emp.name : '',
    employeeId: employeeId,
    status: 'قيد التنفيذ',
    bodyText: document.getElementById('formEmpNotes').value
  };

  APP_DATA.archive.unshift(archiveItem);
  saveData();

  showToast('تم اعتماد النموذج برقم: ' + outgoing.fullHeader);
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

  showToast('تم إعداد الخطاب بنجاح برقم: ' + outgoing.fullHeader);
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
    showToast('تمت إضافة الموظف الجديد بنجاح');
  }

  saveData();
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

  APP_DATA.meetings.push({
    title: title,
    date: document.getElementById('meetingDate').value,
    time: document.getElementById('meetingTime').value,
    location: document.getElementById('meetingLocation').value,
    notes: document.getElementById('meetingNotes').value
  });

  saveData();
  document.getElementById('meetingTitle').value = '';
  showToast('تم حفظ الموعد بنجاح');
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

  APP_DATA.tasks.push({
    title: title,
    assignedTo: document.getElementById('taskAssignee').value || 'مكتب رئيس الوحدة',
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDue').value,
    status: 'قيد التنفيذ'
  });

  saveData();
  document.getElementById('taskTitle').value = '';
  showToast('تمت إضافة المهمة بنجاح');
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

  APP_DATA.tasks.push({
    title: text,
    assignedTo: 'مكتب رئيس الوحدة',
    priority: 'مهمة عاجلة',
    dueDate: new Date().toISOString().slice(0,10),
    status: 'قيد التنفيذ'
  });

  saveData();
  document.getElementById('quickDecisionText').value = '';
  showToast('تم حفظ القرارات والتوجيهات الفورية كمهمة عاجلة');
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

  if (item.type === 'طلب تعيين' && item.details) {
    const d = item.details;
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
      <div>ختم الجهة</div>
      <div style="text-align:center;">
        <strong>رئيس وحدة الشؤون التعليمية</strong><br><br>
        ...................................
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

function syncFromGoogleSheet() {
  const url = document.getElementById('sheetUrlInput').value.trim();
  if (!url) return showToast('أدخل رابط نشر الشيت CSV', true);

  showToast('جاري قراءة بيانات Google Sheet...');
  fetch(url)
    .then(res => res.text())
    .then(text => {
      parseCSVAndImport(text);
      closeSyncModal();
    })
    .catch(err => {
      showToast('تعذر الجلب. تأكد من نشر الشيت كـ CSV Public', true);
    });
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

function parseCSVAndImport(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return showToast('الملف لا يحتوي بيانات كافية', true);

  const importedEmps = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols[0] || cols[1]) {
      importedEmps.push({
        id: cols[0] || String(i),
        name: cols[1] || 'بدون اسم',
        nationalId: cols[2] || '',
        nationality: cols[3] || 'سعودي',
        job: cols[4] || '',
        period: cols[5] || '',
        unit: cols[6] || 'حلقات القرآن الكريم',
        section: cols[7] || '',
        phone: cols[8] || '',
        age: cols[9] || '',
        task: cols[10] || '',
        note: cols[11] || ''
      });
    }
  }

  if (importedEmps.length) {
    APP_DATA.employees = importedEmps;
    saveData();
    showToast(`تم استيراد ${importedEmps.length} موظف بنجاح إلى النظام`);
  }
}
