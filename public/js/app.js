// ==========================================================
// ANTIGRAVITIY & SAI CHANDRIKA - EMPLOYEE PAYROLL MANAGEMENT
// Frontend Application JavaScript (ES6)
// ==========================================================

// Global state
let currentEmployees = [];
let currentSalaries = [];
let currentPayroll = [];
let allDepartments = new Set();

// Currency Formatter
const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ----------------------------------------------------------
// Navigation & Tab Switching
// ----------------------------------------------------------
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const panes = document.querySelectorAll('.tab-pane');
    const pageTitle = document.getElementById('pageTitle');
    const pageDesc = document.getElementById('pageDesc');
    const headerActionBtn = document.getElementById('headerActionBtn');

    const tabConfig = {
        dashboard: {
            title: 'Dashboard Overview',
            desc: 'Real-time overview of employee metrics, recent payroll disbursements, and department distributions',
            btnText: '+ Add Employee',
            btnAction: () => openAddEmployeeModal()
        },
        employees: {
            title: 'Employee Directory',
            desc: 'Manage staff profiles, contact information, designations, and corporate departments',
            btnText: '+ Add Employee',
            btnAction: () => openAddEmployeeModal()
        },
        salaries: {
            title: 'Salary Details & Breakdown',
            desc: 'Configure basic salary, allowances, and deductions to compute net pay accurately',
            btnText: '+ Assign Salary',
            btnAction: () => openSelectEmployeeForSalaryModal()
        },
        payroll: {
            title: 'Monthly Payroll Processing',
            desc: 'Generate, track, and update monthly employee salary payments and disbursals',
            btnText: '+ New Payroll',
            btnAction: () => openNewPayrollModal()
        },
        reports: {
            title: 'Salary Reports & Statement',
            desc: 'Generate monthly payroll sheets, department summaries, printable salary slips, and CSV exports',
            btnText: 'Print Report',
            btnAction: () => printSalaryReport()
        }
    };

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            navItems.forEach(b => b.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${tab}`);
            if (targetPane) targetPane.classList.add('active');

            if (tabConfig[tab]) {
                pageTitle.textContent = tabConfig[tab].title;
                pageDesc.textContent = tabConfig[tab].desc;
                headerActionBtn.querySelector('span').textContent = tabConfig[tab].btnText;
                headerActionBtn.onclick = tabConfig[tab].btnAction;
            }

            // Refresh tab data
            if (tab === 'dashboard') loadDashboardData();
            if (tab === 'employees') loadEmployees();
            if (tab === 'salaries') loadSalaries();
            if (tab === 'payroll') loadPayroll();
            if (tab === 'reports') loadReportData();
        });
    });

    // Default action button setup
    headerActionBtn.onclick = () => openAddEmployeeModal();
}

// ----------------------------------------------------------
// Database Status & Settings
// ----------------------------------------------------------
async function checkDbStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        const headerPill = document.getElementById('headerDbMode');
        const sidebarText = document.getElementById('sidebarDbText');
        const sidebarDot = document.getElementById('sidebarDbDot');
        const modalBanner = document.getElementById('dbModalStatusBanner');

        if (data.isDbConnected) {
            headerPill.textContent = 'MySQL Connected';
            headerPill.parentElement.style.color = '#065f46';
            headerPill.parentElement.style.borderColor = '#a7f3d0';
            sidebarText.textContent = `MySQL: ${data.database}`;
            sidebarDot.className = 'status-indicator connected';
            modalBanner.className = 'db-status-banner';
            modalBanner.style.backgroundColor = '#ecfdf5';
            modalBanner.style.borderColor = '#a7f3d0';
            modalBanner.style.color = '#065f46';
            modalBanner.innerHTML = `✅ <strong>Connected:</strong> Active MySQL 8.0 on <code>${data.host}:${data.port}</code> (${data.database})`;
        } else {
            headerPill.textContent = 'Fallback Mode (Ready)';
            headerPill.parentElement.style.color = '#92400e';
            headerPill.parentElement.style.borderColor = '#fde68a';
            sidebarText.textContent = 'Mode: In-Memory Demo';
            sidebarDot.className = 'status-indicator fallback';
            modalBanner.className = 'db-status-banner';
            modalBanner.innerHTML = `⚠️ <strong>Notice:</strong> MySQL server offline or unconfigured. Running in <strong>Smart Simulation Mode</strong> with mock data so you can test all features seamlessly.`;
        }

        if (data.host) document.getElementById('dbHost').value = data.host;
        if (data.port) document.getElementById('dbPort').value = data.port;
        if (data.user) document.getElementById('dbUser').value = data.user;
        if (data.database) document.getElementById('dbName').value = data.database;

    } catch (err) {
        console.warn('Status check failed:', err);
    }
}

// ----------------------------------------------------------
// 1. Dashboard Logic
// ----------------------------------------------------------
async function loadDashboardData() {
    try {
        const res = await fetch('/api/reports/summary');
        const data = await res.json();
        if (!data.success) return;

        document.getElementById('statTotalEmployees').textContent = data.total_employees;
        document.getElementById('statTotalPaid').textContent = formatCurrency(data.metrics.total_paid_amount);
        document.getElementById('statTotalPending').textContent = formatCurrency(data.metrics.total_pending_amount);
        document.getElementById('statAvgSalary').textContent = formatCurrency(data.metrics.avg_net_salary);

        // Render Department List
        const deptList = document.getElementById('deptBreakdownList');
        if (data.department_breakdown && data.department_breakdown.length > 0) {
            deptList.innerHTML = data.department_breakdown.map(d => `
                <div class="dept-row">
                    <div>
                        <div class="dept-name">${d.department}</div>
                        <div class="dept-count">${d.employee_count} Employee${d.employee_count > 1 ? 's' : ''}</div>
                    </div>
                    <div class="dept-amount">${formatCurrency(d.department_total_payroll)}</div>
                </div>
            `).join('');
        } else {
            deptList.innerHTML = '<div class="text-center py-4 text-muted">No department records yet.</div>';
        }

        // Fetch recent payroll
        const payRes = await fetch('/api/payroll?month=11&year=2026');
        const payData = await payRes.json();
        const tbody = document.getElementById('recentPayrollTableBody');
        
        if (payData.success && payData.data.length > 0) {
            tbody.innerHTML = payData.data.slice(0, 5).map(p => `
                <tr>
                    <td><strong>${p.employee_name}</strong></td>
                    <td><span class="dept-tag">${p.department}</span> <small class="text-light">${p.designation}</small></td>
                    <td>${getMonthName(p.month)} ${p.year}</td>
                    <td class="currency-highlight">${formatCurrency(p.net_salary)}</td>
                    <td><span class="badge badge-${p.payment_status.toLowerCase()}">${p.payment_status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="openPayslipModal(${p.payroll_id})">
                            Payslip
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No recent payroll runs.</td></tr>';
        }

    } catch (err) {
        console.error('Error loading dashboard summary:', err);
    }
}

// ----------------------------------------------------------
// 2. Employees Management Logic
// ----------------------------------------------------------
async function loadEmployees() {
    try {
        const res = await fetch('/api/employees');
        const result = await res.json();
        if (!result.success) return;

        currentEmployees = result.data;
        updateDepartmentFilters();
        renderEmployeesTable(currentEmployees);
    } catch (err) {
        showToast('Failed to load employees', 'error');
    }
}

function updateDepartmentFilters() {
    allDepartments.clear();
    currentEmployees.forEach(e => {
        if (e.department) allDepartments.add(e.department);
    });

    const populateSelect = (selectId) => {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        const currentVal = sel.value;
        const defaultText = sel.options[0]?.text || 'All Departments';
        sel.innerHTML = `<option value="">${defaultText}</option>`;
        allDepartments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            if (dept === currentVal) opt.selected = true;
            sel.appendChild(opt);
        });
    };

    populateSelect('employeeDeptFilter');
    populateSelect('reportDeptSelect');
}

function renderEmployeesTable(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!employees || employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No employees found.</td></tr>';
        return;
    }

    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td><code>EMP-${emp.employee_id}</code></td>
            <td><strong>${emp.name}</strong></td>
            <td><span class="dept-tag">${emp.department}</span></td>
            <td>${emp.designation}</td>
            <td>
                <div>📞 ${emp.phone}</div>
                <small class="text-light">✉️ ${emp.email}</small>
            </td>
            <td>${emp.joining_date}</td>
            <td class="currency-highlight">${formatCurrency(emp.net_salary)}</td>
            <td class="text-right">
                <button class="btn-action-icon" title="Edit Employee" onclick="openEditEmployeeModal(${emp.employee_id})">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-action-icon" title="Salary Structure" onclick="openSalaryModalForEmployee(${emp.employee_id})">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </button>
                <button class="btn-action-icon text-danger" title="Delete Employee" onclick="deleteEmployee(${emp.employee_id}, '${emp.name.replace(/'/g, "\\'")}')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// ----------------------------------------------------------
// 3. Salary Management Logic
// ----------------------------------------------------------
async function loadSalaries() {
    try {
        const res = await fetch('/api/salaries');
        const result = await res.json();
        if (!result.success) return;

        currentSalaries = result.data;
        renderSalariesTable(currentSalaries);
    } catch (err) {
        showToast('Failed to load salary structures', 'error');
    }
}

function renderSalariesTable(salaries) {
    const tbody = document.getElementById('salariesTableBody');
    if (!salaries || salaries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No salary records found.</td></tr>';
        return;
    }

    tbody.innerHTML = salaries.map(sal => `
        <tr>
            <td><code>SAL-${sal.salary_id}</code></td>
            <td><code>EMP-${sal.employee_id}</code></td>
            <td><strong>${sal.employee_name}</strong></td>
            <td><span class="dept-tag">${sal.department}</span></td>
            <td class="currency-cell">${formatCurrency(sal.basic_salary)}</td>
            <td class="currency-cell text-green">+${formatCurrency(sal.allowance)}</td>
            <td class="currency-cell text-red">-${formatCurrency(sal.deduction)}</td>
            <td class="currency-highlight">${formatCurrency(sal.net_salary)}</td>
            <td class="text-right">
                <button class="btn btn-sm btn-outline" onclick="openSalaryModalForEmployee(${sal.employee_id})">
                    Configure Salary
                </button>
            </td>
        </tr>
    `).join('');
}

// ----------------------------------------------------------
// 4. Monthly Payroll Logic
// ----------------------------------------------------------
async function loadPayroll() {
    const month = document.getElementById('payrollMonthFilter')?.value || '';
    const year = document.getElementById('payrollYearFilter')?.value || '';
    const status = document.getElementById('payrollStatusFilter')?.value || '';

    let url = `/api/payroll?year=${year}`;
    if (month) url += `&month=${month}`;
    if (status) url += `&payment_status=${status}`;

    try {
        const res = await fetch(url);
        const result = await res.json();
        if (!result.success) return;

        currentPayroll = result.data;
        renderPayrollTable(currentPayroll);
    } catch (err) {
        showToast('Failed to load payroll', 'error');
    }
}

function renderPayrollTable(payrollList) {
    const tbody = document.getElementById('payrollTableBody');
    if (!payrollList || payrollList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No payroll entries found for this selection.</td></tr>';
        return;
    }

    tbody.innerHTML = payrollList.map(p => `
        <tr>
            <td><code>PAY-${p.payroll_id}</code></td>
            <td>
                <strong>${p.employee_name}</strong>
                <div class="text-light" style="font-size:0.75rem;">EMP-${p.employee_id}</div>
            </td>
            <td><span class="dept-tag">${p.department}</span></td>
            <td><strong>${getMonthName(p.month)}</strong> ${p.year}</td>
            <td style="font-size:0.8rem;">
                ${formatCurrency(p.basic_salary)} + ${formatCurrency(p.allowance)} - ${formatCurrency(p.deduction)}
            </td>
            <td class="currency-highlight">${formatCurrency(p.net_salary)}</td>
            <td>${p.payment_date}</td>
            <td>
                <select class="select-input" style="padding:3px 8px; font-size:0.78rem;" onchange="updatePayrollStatus(${p.payroll_id}, this.value)">
                    <option value="Paid" ${p.payment_status === 'Paid' ? 'selected' : ''}>🟢 Paid</option>
                    <option value="Pending" ${p.payment_status === 'Pending' ? 'selected' : ''}>🟡 Pending</option>
                    <option value="Processing" ${p.payment_status === 'Processing' ? 'selected' : ''}>🔵 Processing</option>
                </select>
            </td>
            <td class="text-right">
                <button class="btn btn-sm btn-outline" title="Print/View Payslip" onclick="openPayslipModal(${p.payroll_id})">
                    Slip
                </button>
                <button class="btn-action-icon text-danger" title="Delete record" onclick="deletePayroll(${p.payroll_id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updatePayrollStatus(payrollId, status) {
    try {
        const res = await fetch(`/api/payroll/${payrollId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: status })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Payroll #${payrollId} marked as ${status}`, 'success');
            loadDashboardData();
        } else {
            showToast(data.message || 'Status update failed', 'error');
        }
    } catch (err) {
        showToast('Network error updating status', 'error');
    }
}

async function deletePayroll(payrollId) {
    if (!confirm(`Are you sure you want to delete Payroll record #${payrollId}?`)) return;
    try {
        const res = await fetch(`/api/payroll/${payrollId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Payroll record deleted', 'success');
            loadPayroll();
            loadDashboardData();
        }
    } catch (err) {
        showToast('Failed to delete payroll record', 'error');
    }
}

// ----------------------------------------------------------
// 5. Reports & Statement Logic
// ----------------------------------------------------------
async function loadReportData() {
    const month = document.getElementById('reportMonthSelect')?.value || '';
    const year = document.getElementById('reportYearSelect')?.value || '';
    const dept = document.getElementById('reportDeptSelect')?.value || '';
    const status = document.getElementById('reportStatusSelect')?.value || '';

    let url = `/api/payroll?year=${year}`;
    if (month) url += `&month=${month}`;
    if (dept) url += `&department=${encodeURIComponent(dept)}`;
    if (status) url += `&payment_status=${status}`;

    try {
        const res = await fetch(url);
        const result = await res.json();
        if (!result.success) return;

        const records = result.data;
        const tbody = document.getElementById('reportsTableBody');

        let totalBasic = 0;
        let totalAllowance = 0;
        let totalDeduction = 0;
        let totalNet = 0;

        records.forEach(r => {
            totalBasic += parseFloat(r.basic_salary) || 0;
            totalAllowance += parseFloat(r.allowance) || 0;
            totalDeduction += parseFloat(r.deduction) || 0;
            totalNet += parseFloat(r.net_salary) || 0;
        });

        document.getElementById('reportCount').textContent = records.length;
        document.getElementById('reportTotalBasic').textContent = formatCurrency(totalBasic);
        document.getElementById('reportTotalAllowance').textContent = `+${formatCurrency(totalAllowance)}`;
        document.getElementById('reportTotalDeduction').textContent = `-${formatCurrency(totalDeduction)}`;
        document.getElementById('reportTotalNet').textContent = formatCurrency(totalNet);

        const monthName = month ? getMonthName(month) : 'All Months';
        document.getElementById('reportPrintSubtitle').textContent = `Statement for ${monthName} ${year} • Generated by Sai Chandrika Sirigireddy`;

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4">No records match the selected report filter.</td></tr>';
            return;
        }

        tbody.innerHTML = records.map((r, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><code>EMP-${r.employee_id}</code></td>
                <td><strong>${r.employee_name}</strong></td>
                <td><span class="dept-tag">${r.department}</span></td>
                <td>${getMonthName(r.month)} ${r.year}</td>
                <td class="currency-cell">${formatCurrency(r.basic_salary)}</td>
                <td class="currency-cell text-green">+${formatCurrency(r.allowance)}</td>
                <td class="currency-cell text-red">-${formatCurrency(r.deduction)}</td>
                <td class="currency-highlight">${formatCurrency(r.net_salary)}</td>
                <td><span class="badge badge-${r.payment_status.toLowerCase()}">${r.payment_status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="openPayslipModal(${r.payroll_id})">View Slip</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        showToast('Error generating report data', 'error');
    }
}

function exportReportToCSV() {
    const table = document.querySelector('#printableReportArea table');
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        // Exclude the last action column (Payslip button)
        for (let i = 0; i < cols.length - 1; i++) {
            let text = cols[i].innerText.replace(/"/g, '""').trim();
            rowData.push(`"${text}"`);
        }
        if (rowData.length > 0) csv.push(rowData.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Salary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV exported successfully!', 'success');
}

function printSalaryReport() {
    window.print();
}

// ----------------------------------------------------------
// 6. Modal Handlers
// ----------------------------------------------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function setupModalClosers() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
        });
    });

    // Close on clicking backdrop outside dialog
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

// Open Add Employee Modal
function openAddEmployeeModal() {
    document.getElementById('empFormMode').value = 'create';
    document.getElementById('empFormId').value = '';
    document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('empJoiningDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('empSalarySection').style.display = 'block';
    updateLiveEmployeeNetSalary();
    openModal('employeeModal');
}

// Open Edit Employee Modal
async function openEditEmployeeModal(empId) {
    try {
        const res = await fetch(`/api/employees/${empId}`);
        const result = await res.json();
        if (!result.success) return;

        const emp = result.data;
        document.getElementById('empFormMode').value = 'edit';
        document.getElementById('empFormId').value = emp.employee_id;
        document.getElementById('employeeModalTitle').textContent = `Edit Employee: ${emp.name}`;
        document.getElementById('empName').value = emp.name;
        document.getElementById('empDepartment').value = emp.department;
        document.getElementById('empDesignation').value = emp.designation;
        document.getElementById('empPhone').value = emp.phone;
        document.getElementById('empEmail').value = emp.email;
        document.getElementById('empJoiningDate').value = emp.joining_date;

        // Hide initial salary fields in basic edit (managed via salary modal)
        document.getElementById('empSalarySection').style.display = 'none';

        openModal('employeeModal');
    } catch (err) {
        showToast('Error loading employee info', 'error');
    }
}

// Open Salary Modal for specific employee
async function openSalaryModalForEmployee(empId) {
    const emp = currentEmployees.find(e => e.employee_id === empId);
    if (!emp) return;

    document.getElementById('salEmployeeId').value = emp.employee_id;
    document.getElementById('salEmpDisplay').innerHTML = `
        <strong>${emp.name}</strong> (EMP-${emp.employee_id}) &bull; 
        <span class="dept-tag">${emp.department}</span> &bull; ${emp.designation}
    `;

    document.getElementById('salBasic').value = emp.basic_salary || 0;
    document.getElementById('salAllowance').value = emp.allowance || 0;
    document.getElementById('salDeduction').value = emp.deduction || 0;
    updateLiveNetSalaryPreview();

    openModal('salaryModal');
}

function openSelectEmployeeForSalaryModal() {
    if (currentEmployees.length === 0) {
        showToast('No employees found. Please add an employee first.', 'warning');
        return;
    }
    openSalaryModalForEmployee(currentEmployees[0].employee_id);
}

// Live calculation in salary modal
function updateLiveNetSalaryPreview() {
    const basic = parseFloat(document.getElementById('salBasic').value) || 0;
    const allow = parseFloat(document.getElementById('salAllowance').value) || 0;
    const ded = parseFloat(document.getElementById('salDeduction').value) || 0;
    const net = basic + allow - ded;
    document.getElementById('salNetPreview').textContent = formatCurrency(net);
}

// Live calculation in employee modal
function updateLiveEmployeeNetSalary() {
    const basic = parseFloat(document.getElementById('empBasicSalary')?.value) || 0;
    const allow = parseFloat(document.getElementById('empAllowance')?.value) || 0;
    const ded = parseFloat(document.getElementById('empDeduction')?.value) || 0;
    const net = basic + allow - ded;
    const label = document.getElementById('empCalculatedNet');
    if (label) label.textContent = formatCurrency(net);
}

// Open New Single Payroll Modal
function openNewPayrollModal() {
    const sel = document.getElementById('payEmployeeSelect');
    sel.innerHTML = '<option value="">-- Choose Employee --</option>';
    currentEmployees.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp.employee_id;
        opt.textContent = `${emp.name} (${emp.department} - EMP-${emp.employee_id})`;
        sel.appendChild(opt);
    });

    const now = new Date();
    document.getElementById('payMonth').value = now.getMonth() + 1;
    document.getElementById('payYear').value = now.getFullYear();
    document.getElementById('payDate').value = now.toISOString().split('T')[0];
    document.getElementById('payStatus').value = 'Paid';

    openModal('payrollModal');
}

// Open Batch Generate Payroll Modal
function openBatchPayrollModal() {
    const now = new Date();
    document.getElementById('batchMonth').value = now.getMonth() + 1;
    document.getElementById('batchYear').value = now.getFullYear();
    document.getElementById('batchDate').value = now.toISOString().split('T')[0];
    document.getElementById('batchStatus').value = 'Pending';
    openModal('batchPayrollModal');
}

// Open Printable Payslip Modal
async function openPayslipModal(payrollId) {
    try {
        const res = await fetch(`/api/payroll/payslip/${payrollId}`);
        const result = await res.json();
        if (!result.success) {
            showToast('Payslip not found', 'error');
            return;
        }

        const p = result.data;
        document.getElementById('psPeriod').textContent = `${getMonthName(p.month)} ${p.year}`;
        document.getElementById('psEmpId').textContent = `EMP-${p.employee_id}`;
        document.getElementById('psEmpName').textContent = p.name;
        document.getElementById('psDepartment').textContent = p.department;
        document.getElementById('psDesignation').textContent = p.designation;
        document.getElementById('psEmail').textContent = p.email;
        document.getElementById('psPhone').textContent = p.phone;
        document.getElementById('psJoiningDate').textContent = p.joining_date;
        document.getElementById('psPaymentInfo').textContent = `${p.payment_date} (${p.payment_status})`;

        const basic = parseFloat(p.basic_salary) || 0;
        const allowance = parseFloat(p.allowance) || 0;
        const deduction = parseFloat(p.deduction) || 0;
        const gross = basic + allowance;
        const net = parseFloat(p.net_salary) || (gross - deduction);

        document.getElementById('psBasic').textContent = formatCurrency(basic);
        document.getElementById('psAllowance').textContent = formatCurrency(allowance);
        document.getElementById('psGross').textContent = formatCurrency(gross);

        document.getElementById('psDeduction').textContent = formatCurrency(deduction);
        document.getElementById('psTotalDeductions').textContent = formatCurrency(deduction);

        document.getElementById('psNetSalary').textContent = formatCurrency(net);

        openModal('payslipModal');
    } catch (err) {
        showToast('Failed to load payslip data', 'error');
    }
}

// Delete Employee
async function deleteEmployee(empId, empName) {
    if (!confirm(`Are you sure you want to delete employee "${empName}" (EMP-${empId})? This will also remove associated salary and payroll history.`)) return;

    try {
        const res = await fetch(`/api/employees/${empId}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showToast(`Employee ${empName} deleted successfully`, 'success');
            loadEmployees();
            loadDashboardData();
        } else {
            showToast(result.message || 'Error deleting employee', 'error');
        }
    } catch (err) {
        showToast('Failed to delete employee', 'error');
    }
}

// ----------------------------------------------------------
// Form Submit Event Handlers
// ----------------------------------------------------------
function setupFormListeners() {
    // 1. Employee Form
    const empForm = document.getElementById('employeeForm');
    empForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = document.getElementById('empFormMode').value;
        const empId = document.getElementById('empFormId').value;

        const payload = {
            name: document.getElementById('empName').value.trim(),
            department: document.getElementById('empDepartment').value,
            designation: document.getElementById('empDesignation').value.trim(),
            phone: document.getElementById('empPhone').value.trim(),
            email: document.getElementById('empEmail').value.trim(),
            joining_date: document.getElementById('empJoiningDate').value,
            basic_salary: document.getElementById('empBasicSalary')?.value || 0,
            allowance: document.getElementById('empAllowance')?.value || 0,
            deduction: document.getElementById('empDeduction')?.value || 0
        };

        const url = mode === 'create' ? '/api/employees' : `/api/employees/${empId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Employee saved successfully!', 'success');
                closeModal('employeeModal');
                loadEmployees();
                loadDashboardData();
            } else {
                showToast(data.message || 'Operation failed', 'error');
            }
        } catch (err) {
            showToast('Network error saving employee', 'error');
        }
    });

    // 2. Salary Form
    const salForm = document.getElementById('salaryForm');
    salForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeId = document.getElementById('salEmployeeId').value;
        const payload = {
            employee_id: employeeId,
            basic_salary: document.getElementById('salBasic').value,
            allowance: document.getElementById('salAllowance').value,
            deduction: document.getElementById('salDeduction').value
        };

        try {
            const res = await fetch('/api/salaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Salary structure updated successfully', 'success');
                closeModal('salaryModal');
                loadSalaries();
                loadEmployees();
                loadDashboardData();
            } else {
                showToast(data.message || 'Failed to update salary', 'error');
            }
        } catch (err) {
            showToast('Network error updating salary', 'error');
        }
    });

    // 3. Single Payroll Form
    const payForm = document.getElementById('payrollForm');
    payForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            employee_id: document.getElementById('payEmployeeSelect').value,
            month: document.getElementById('payMonth').value,
            year: document.getElementById('payYear').value,
            payment_date: document.getElementById('payDate').value,
            payment_status: document.getElementById('payStatus').value
        };

        try {
            const res = await fetch('/api/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Monthly payroll recorded successfully!', 'success');
                closeModal('payrollModal');
                loadPayroll();
                loadDashboardData();
            } else {
                showToast(data.message || 'Failed to record payroll', 'error');
            }
        } catch (err) {
            showToast('Network error processing payroll', 'error');
        }
    });

    // 4. Batch Payroll Form
    const batchForm = document.getElementById('batchPayrollForm');
    batchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            month: document.getElementById('batchMonth').value,
            year: document.getElementById('batchYear').value,
            payment_date: document.getElementById('batchDate').value,
            payment_status: document.getElementById('batchStatus').value
        };

        try {
            const res = await fetch('/api/payroll/generate-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Batch payroll generated successfully!', 'success');
                closeModal('batchPayrollModal');
                loadPayroll();
                loadDashboardData();
            } else {
                showToast(data.message || 'Failed to generate batch payroll', 'error');
            }
        } catch (err) {
            showToast('Network error in batch processing', 'error');
        }
    });

    // 5. Database Configuration Form
    const dbForm = document.getElementById('dbConfigForm');
    dbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            host: document.getElementById('dbHost').value.trim(),
            port: document.getElementById('dbPort').value.trim(),
            user: document.getElementById('dbUser').value.trim(),
            password: document.getElementById('dbPassword').value,
            database: document.getElementById('dbName').value.trim()
        };

        showToast('Testing & applying MySQL connection...', 'info');
        try {
            const res = await fetch('/api/db/reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Reconnection attempt submitted. Verifying...', 'info');
                setTimeout(checkDbStatus, 1500);
            }
        } catch (err) {
            showToast('Error communicating with backend', 'error');
        }
    });

    // Live calculation listeners
    ['salBasic', 'salAllowance', 'salDeduction'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLiveNetSalaryPreview);
    });

    ['empBasicSalary', 'empAllowance', 'empDeduction'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLiveEmployeeNetSalary);
    });

    // Search and filters
    document.getElementById('employeeSearchInput')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const dept = document.getElementById('employeeDeptFilter')?.value || '';
        filterAndRenderEmployees(term, dept);
    });

    document.getElementById('employeeDeptFilter')?.addEventListener('change', (e) => {
        const dept = e.target.value;
        const term = document.getElementById('employeeSearchInput')?.value.toLowerCase() || '';
        filterAndRenderEmployees(term, dept);
    });

    document.getElementById('salarySearchInput')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentSalaries.filter(s => 
            s.employee_name.toLowerCase().includes(term) ||
            s.department.toLowerCase().includes(term)
        );
        renderSalariesTable(filtered);
    });

    document.getElementById('payrollMonthFilter')?.addEventListener('change', loadPayroll);
    document.getElementById('payrollYearFilter')?.addEventListener('change', loadPayroll);
    document.getElementById('payrollStatusFilter')?.addEventListener('change', loadPayroll);

    document.getElementById('btnApplyReportFilter')?.addEventListener('click', loadReportData);
    document.getElementById('btnExportCSV')?.addEventListener('click', exportReportToCSV);
    document.getElementById('btnPrintReport')?.addEventListener('click', printSalaryReport);

    // Quick action buttons
    document.getElementById('btnAddNewEmployee')?.addEventListener('click', openAddEmployeeModal);
    document.getElementById('btnCreateSinglePayroll')?.addEventListener('click', openNewPayrollModal);
    document.getElementById('btnBulkGeneratePayroll')?.addEventListener('click', openBatchPayrollModal);
    document.getElementById('btnQuickRunPayroll')?.addEventListener('click', openBatchPayrollModal);
    document.getElementById('dbSettingsBtn')?.addEventListener('click', () => openModal('dbModal'));
    document.getElementById('btnPrintSlip')?.addEventListener('click', () => window.print());
}

function filterAndRenderEmployees(term, dept) {
    let filtered = currentEmployees;
    if (dept) filtered = filtered.filter(e => e.department === dept);
    if (term) {
        filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(term) ||
            e.designation.toLowerCase().includes(term) ||
            e.email.toLowerCase().includes(term) ||
            e.phone.includes(term)
        );
    }
    renderEmployeesTable(filtered);
}

function getMonthName(m) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(m)] || `Month ${m}`;
}

// ----------------------------------------------------------
// Initialization on DOM Ready
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Current date display in header
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    setupNavigation();
    setupModalClosers();
    setupFormListeners();

    // Initial data fetch
    checkDbStatus();
    loadDashboardData();
    loadEmployees();
});
