# 💼 Antigravity - Employee Payroll Management System
**Developer:** Sai Chandrika Sirigireddy & Antigravity AI  
**Technology Stack:** HTML5, CSS3, JavaScript (ES6+), Node.js, Express.js, MySQL 8.0  
**License:** MIT  

---

## 📌 Project Overview

The **Employee Payroll Management System** is a full-stack web application designed to streamline organization-wide salary administration, employee information tracking, monthly payroll disbursals, and automated salary reporting.

Admins can maintain employee master records, calculate basic salary, allowances, and statutory deductions in real time, generate and disburse monthly payrolls, and print corporate-grade payslips.

---

## 🗄️ Database Architecture (MySQL 8.0)

The system utilizes a relational schema with foreign key cascades and integrity constraints.

### **Table 1: `employees`**
Stores employee master records and demographic details.
| Field Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `employee_id` | `INT` | Primary Key, Auto Increment | Unique Employee Identifier |
| `name` | `VARCHAR(100)` | NOT NULL | Full Name of Employee |
| `department` | `VARCHAR(100)` | NOT NULL | Department (e.g. Engineering, HR) |
| `designation` | `VARCHAR(100)` | NOT NULL | Job Role / Title |
| `phone` | `VARCHAR(15)` | NOT NULL | Contact Phone Number |
| `email` | `VARCHAR(100)` | NOT NULL | Corporate Email Address |
| `joining_date` | `DATE` | NOT NULL | Date of Joining the Organization |

---

### **Table 2: `salary_details`**
Maintains salary structure components and net pay calculation.
| Field Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `salary_id` | `INT` | Primary Key, Auto Increment | Unique Salary Structure ID |
| `employee_id` | `INT` | Foreign Key (`employees.employee_id`) | References Employee (Unique) |
| `basic_salary` | `DECIMAL(10,2)`| NOT NULL, Default `0.00` | Base Salary |
| `allowance` | `DECIMAL(10,2)`| NOT NULL, Default `0.00` | Total Allowances (HRA, DA, etc.) |
| `deduction` | `DECIMAL(10,2)`| NOT NULL, Default `0.00` | Deductions (PF, Tax, TDS, etc.) |
| `net_salary` | `DECIMAL(10,2)`| NOT NULL, Default `0.00` | Calculated: `basic + allow - ded` |

$$\text{Net Salary} = \text{Basic Salary} + \text{Allowance} - \text{Deduction}$$

---

### **Table 3: `payroll`**
Tracks monthly salary generation, payment dates, and settlement status.
| Field Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `payroll_id` | `INT` | Primary Key, Auto Increment | Unique Payroll Transaction ID |
| `employee_id` | `INT` | Foreign Key (`employees.employee_id`) | References Employee |
| `salary_id` | `INT` | Foreign Key (`salary_details.salary_id`) | References Salary Details |
| `month` | `INT` | NOT NULL (1 to 12) | Pay Period Month |
| `year` | `INT` | NOT NULL (e.g. 2026) | Pay Period Year |
| `payment_date` | `DATE` | NOT NULL | Date of Disbursement |
| `payment_status`| `VARCHAR(30)` | NOT NULL, Default `'Pending'` | Status (`Paid`, `Pending`, `Processing`) |

---

## 🚀 Key Features

1. **Executive Dashboard**:
   - Live KPI cards: Total Active Employees, Total Disbursed Salaries, Pending Payouts, Average Net Salary.
   - Department-wise salary budget breakdown.
   - Recent payroll transaction logs.

2. **Employee Directory (CRUD)**:
   - Add new employees with instant initial salary breakdown.
   - Real-time search by name, role, email, and phone.
   - Filter by department.
   - Edit employee information and cascade deletion.

3. **Salary Structure Configuration**:
   - Interactive live calculation preview ($Net = Basic + Allowance - Deduction$).
   - Granular adjustment of allowances and tax deductions.

4. **Monthly Payroll Processing**:
   - Generate single employee payroll or **Batch Generate** monthly payroll for all active employees with 1 click.
   - Instant payment status updates (`Paid` 🟢, `Pending` 🟡, `Processing` 🔵).

5. **Printable Corporate Payslips**:
   - Standardized salary advice slip with earnings, deductions breakdown, net payout, and authorized sign block.
   - Clean `@media print` layout ready for PDF export or paper printing.

6. **Salary Reports & Statement**:
   - Comprehensive filtering by Month, Year, Department, and Payment Status.
   - Dynamic aggregated totals (Total Basic, Allowances, Deductions, Net Payout).
   - Instant **CSV Export** and Print Report.

7. **Dual-Mode Backend (Zero-Downtime Guarantee)**:
   - Automatically connects to **MySQL Server** and initializes tables & sample data.
   - If MySQL is offline during examination or demonstration, it seamlessly runs in **Smart In-Memory Simulation Mode** so the UI never crashes!

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **MySQL Server 8.0+** (Optional, automatic fallback included)

### 2. Configure Database in MySQL (Optional)
Open MySQL Workbench or your terminal:
```sql
CREATE DATABASE payroll_db;
USE payroll_db;
-- Source database.sql:
source database.sql;
```

### 3. Start the Server
Navigate to the project root directory:
```bash
cd employee_payroll_management
node server.js
```
*Or double click `start_server.bat` on Windows.*

### 4. Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Database connection status |
| `POST` | `/api/db/reconnect` | Update MySQL credentials on the fly |
| `GET` | `/api/employees` | Fetch all employees with salary info |
| `POST` | `/api/employees` | Add new employee and salary structure |
| `PUT` | `/api/employees/:id` | Update employee information |
| `DELETE` | `/api/employees/:id` | Delete employee & cascade records |
| `GET` | `/api/salaries` | List all salary configurations |
| `POST` | `/api/salaries` | Upsert salary structure for an employee |
| `GET` | `/api/payroll` | Filter payrolls by month, year, dept, status |
| `POST` | `/api/payroll` | Record a single payroll entry |
| `POST` | `/api/payroll/generate-bulk` | Batch generate monthly payroll for all |
| `PUT` | `/api/payroll/:id/status`| Update payroll status & payment date |
| `DELETE`| `/api/payroll/:id` | Delete payroll transaction |
| `GET` | `/api/payroll/payslip/:id`| Fetch printable payslip data |
| `GET` | `/api/reports/summary` | Dashboard analytics and KPIs |

---

## 📤 Git Repository & Upload Instructions

To upload this project to your GitHub/GitLab account:

1. **Initialize Git (Already done)**:
   ```bash
   git status
   ```

2. **Create a new repository** on GitHub (e.g. `employee-payroll-management-system`).

3. **Link and Push**:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## 👨‍💻 Author Information
- **Student / Developer:** Sai Chandrika Sirigireddy
- **AI Pair Programmer:** Antigravity AI (Google DeepMind)
- **Course / Topic:** Mini Project - Web Technologies & Database Systems
