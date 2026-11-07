// ==========================================================
// ANTIGRAVITY & SAI CHANDRIKA - EMPLOYEE PAYROLL MANAGEMENT SYSTEM
// Backend Server: Node.js + Express.js + MySQL 8.0
// ==========================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'YourNewPassword123', // Change as per your MySQL Workbench
    database: process.env.DB_NAME || 'payroll_db',
    multipleStatements: true
};

let dbPool = null;
let isDbConnected = false;
let dbErrorMessage = '';

// ----------------------------------------------------------
// Dual-Mode In-Memory Fallback Store (Ensures 100% uptime for demo/testing)
// ----------------------------------------------------------
let inMemoryEmployees = [
    { employee_id: 101, name: 'Sai Chandrika Sirigireddy', department: 'Engineering', designation: 'Lead Software Architect', phone: '9876543210', email: 'saichandrika@company.com', joining_date: '2023-01-15' },
    { employee_id: 102, name: 'Aditya Varma', department: 'Engineering', designation: 'Full Stack Developer', phone: '9812345678', email: 'aditya.v@company.com', joining_date: '2023-03-20' },
    { employee_id: 103, name: 'Pooja Hegde', department: 'Human Resources', designation: 'HR Manager', phone: '9845612345', email: 'pooja.h@company.com', joining_date: '2022-07-10' },
    { employee_id: 104, name: 'Rahul Sharma', department: 'Finance', designation: 'Chief Financial Analyst', phone: '9890123456', email: 'rahul.s@company.com', joining_date: '2022-11-01' },
    { employee_id: 105, name: 'Deepika Patel', department: 'Marketing', designation: 'Senior Marketing Specialist', phone: '9789012345', email: 'deepika.p@company.com', joining_date: '2023-05-18' },
    { employee_id: 106, name: 'Karthik Raja', department: 'Operations', designation: 'Operations Coordinator', phone: '9712345678', email: 'karthik.r@company.com', joining_date: '2024-02-01' }
];

let inMemorySalaries = [
    { salary_id: 1, employee_id: 101, basic_salary: 85000.00, allowance: 15000.00, deduction: 5000.00, net_salary: 95000.00 },
    { salary_id: 2, employee_id: 102, basic_salary: 60000.00, allowance: 10000.00, deduction: 3500.00, net_salary: 66500.00 },
    { salary_id: 3, employee_id: 103, basic_salary: 55000.00, allowance: 8000.00, deduction: 3000.00, net_salary: 60000.00 },
    { salary_id: 4, employee_id: 104, basic_salary: 70000.00, allowance: 12000.00, deduction: 4000.00, net_salary: 78000.00 },
    { salary_id: 5, employee_id: 105, basic_salary: 48000.00, allowance: 7000.00, deduction: 2500.00, net_salary: 52500.00 },
    { salary_id: 6, employee_id: 106, basic_salary: 42000.00, allowance: 6000.00, deduction: 2000.00, net_salary: 46000.00 }
];

let inMemoryPayroll = [
    { payroll_id: 1, employee_id: 101, salary_id: 1, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 2, employee_id: 102, salary_id: 2, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 3, employee_id: 103, salary_id: 3, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 4, employee_id: 104, salary_id: 4, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 5, employee_id: 105, salary_id: 5, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 6, employee_id: 106, salary_id: 6, month: 10, year: 2026, payment_date: '2026-10-31', payment_status: 'Paid' },
    { payroll_id: 7, employee_id: 101, salary_id: 1, month: 11, year: 2026, payment_date: '2026-11-05', payment_status: 'Paid' },
    { payroll_id: 8, employee_id: 102, salary_id: 2, month: 11, year: 2026, payment_date: '2026-11-05', payment_status: 'Paid' },
    { payroll_id: 9, employee_id: 103, salary_id: 3, month: 11, year: 2026, payment_date: '2026-11-06', payment_status: 'Paid' },
    { payroll_id: 10, employee_id: 104, salary_id: 4, month: 11, year: 2026, payment_date: '2026-11-10', payment_status: 'Pending' },
    { payroll_id: 11, employee_id: 105, salary_id: 5, month: 11, year: 2026, payment_date: '2026-11-10', payment_status: 'Pending' },
    { payroll_id: 12, employee_id: 106, salary_id: 6, month: 11, year: 2026, payment_date: '2026-11-10', payment_status: 'Processing' }
];

let nextEmployeeId = 107;
let nextSalaryId = 7;
let nextPayrollId = 13;

// Helper: Calculate Net Salary (basic_salary + allowance - deduction)
function calculateNetSalary(basic, allowance, deduction) {
    const b = parseFloat(basic) || 0;
    const a = parseFloat(allowance) || 0;
    const d = parseFloat(deduction) || 0;
    return parseFloat((b + a - d).toFixed(2));
}

// ----------------------------------------------------------
// Database Auto-Initialization
// ----------------------------------------------------------
function initDatabase() {
    console.log('🔄 Attempting connection to MySQL Server on ' + dbConfig.host + ':' + dbConfig.port + '...');
    
    // Connect without database first to ensure payroll_db exists
    const rootConnection = mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password
    });

    rootConnection.connect((err) => {
        if (err) {
            isDbConnected = false;
            dbErrorMessage = err.message;
            console.warn('⚠️ [MySQL Notice]: Could not connect to MySQL server (' + err.message + ').');
            console.warn('   ⚡ Running in Smart In-Memory Simulation Mode.');
            console.warn('   All features, calculations, and reports are fully operational!');
            return;
        }

        console.log('✅ Connected to MySQL Server! Verifying database and tables...');
        
        rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`, (createDbErr) => {
            rootConnection.end();
            if (createDbErr) {
                console.error('❌ Failed to create database:', createDbErr.message);
                isDbConnected = false;
                return;
            }

            // Create pool connected to the database
            dbPool = mysql.createPool({
                host: dbConfig.host,
                port: dbConfig.port,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                multipleStatements: true
            });

            // Create Tables Schema
            const createTablesSQL = `
                CREATE TABLE IF NOT EXISTS employees (
                    employee_id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    designation VARCHAR(100) NOT NULL,
                    phone VARCHAR(15) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    joining_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS salary_details (
                    salary_id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL UNIQUE,
                    basic_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    allowance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    deduction DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS payroll (
                    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    salary_id INT NOT NULL,
                    month INT NOT NULL,
                    year INT NOT NULL,
                    payment_date DATE NOT NULL,
                    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
                    CONSTRAINT fk_payroll_salary FOREIGN KEY (salary_id) REFERENCES salary_details(salary_id) ON DELETE CASCADE,
                    CONSTRAINT uq_employee_month_year UNIQUE (employee_id, month, year)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            dbPool.query(createTablesSQL, (schemaErr) => {
                if (schemaErr) {
                    console.error('❌ Error creating tables:', schemaErr.message);
                    isDbConnected = false;
                    return;
                }

                // Check if employees table is populated
                dbPool.query('SELECT COUNT(*) as count FROM employees', (countErr, countResults) => {
                    if (!countErr && countResults[0].count === 0) {
                        console.log('🌱 Database is empty. Seeding initial records...');
                        seedDatabase();
                    } else {
                        console.log('✅ MySQL Database ready and connected successfully!');
                    }
                    isDbConnected = true;
                    dbErrorMessage = '';
                });
            });
        });
    });
}

function seedDatabase() {
    const seedEmployees = `
        INSERT INTO employees (employee_id, name, department, designation, phone, email, joining_date) VALUES
        (101, 'Sai Chandrika Sirigireddy', 'Engineering', 'Lead Software Architect', '9876543210', 'saichandrika@company.com', '2023-01-15'),
        (102, 'Aditya Varma', 'Engineering', 'Full Stack Developer', '9812345678', 'aditya.v@company.com', '2023-03-20'),
        (103, 'Pooja Hegde', 'Human Resources', 'HR Manager', '9845612345', 'pooja.h@company.com', '2022-07-10'),
        (104, 'Rahul Sharma', 'Finance', 'Chief Financial Analyst', '9890123456', 'rahul.s@company.com', '2022-11-01'),
        (105, 'Deepika Patel', 'Marketing', 'Senior Marketing Specialist', '9789012345', 'deepika.p@company.com', '2023-05-18'),
        (106, 'Karthik Raja', 'Operations', 'Operations Coordinator', '9712345678', 'karthik.r@company.com', '2024-02-01');

        INSERT INTO salary_details (salary_id, employee_id, basic_salary, allowance, deduction, net_salary) VALUES
        (1, 101, 85000.00, 15000.00, 5000.00, 95000.00),
        (2, 102, 60000.00, 10000.00, 3500.00, 66500.00),
        (3, 103, 55000.00, 8000.00, 3000.00, 60000.00),
        (4, 104, 70000.00, 12000.00, 4000.00, 78000.00),
        (5, 105, 48000.00, 7000.00, 2500.00, 52500.00),
        (6, 106, 42000.00, 6000.00, 2000.00, 46000.00);

        INSERT INTO payroll (payroll_id, employee_id, salary_id, month, year, payment_date, payment_status) VALUES
        (1, 101, 1, 10, 2026, '2026-10-31', 'Paid'),
        (2, 102, 2, 10, 2026, '2026-10-31', 'Paid'),
        (3, 103, 3, 10, 2026, '2026-10-31', 'Paid'),
        (4, 104, 4, 10, 2026, '2026-10-31', 'Paid'),
        (5, 105, 5, 10, 2026, '2026-10-31', 'Paid'),
        (6, 106, 6, 10, 2026, '2026-10-31', 'Paid'),
        (7, 101, 1, 11, 2026, '2026-11-05', 'Paid'),
        (8, 102, 2, 11, 2026, '2026-11-05', 'Paid'),
        (9, 103, 3, 11, 2026, '2026-11-06', 'Paid'),
        (10, 104, 4, 11, 2026, '2026-11-10', 'Pending'),
        (11, 105, 5, 11, 2026, '2026-11-10', 'Pending'),
        (12, 106, 6, 11, 2026, '2026-11-10', 'Processing');
    `;
    dbPool.query(seedEmployees, (err) => {
        if (err) console.error('Error seeding data:', err.message);
        else console.log('🌱 Seed data inserted into MySQL successfully!');
    });
}

// Kickstart database connection
initDatabase();

// ==========================================================
// REST API ROUTES
// ==========================================================

// ----------------------------------------------------------
// 1. Status & Reconnect
// ----------------------------------------------------------
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        isDbConnected,
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        mode: isDbConnected ? 'MySQL Database (Connected)' : 'In-Memory Simulation (Demo Fallback)',
        error: dbErrorMessage
    });
});

app.post('/api/db/reconnect', (req, res) => {
    const { host, port, user, password, database } = req.body;
    if (host) dbConfig.host = host;
    if (port) dbConfig.port = parseInt(port) || 3306;
    if (user) dbConfig.user = user;
    if (password !== undefined) dbConfig.password = password;
    if (database) dbConfig.database = database;

    initDatabase();
    res.json({
        success: true,
        message: 'Reconnection initiated with updated credentials.',
        config: { host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, database: dbConfig.database }
    });
});

// ----------------------------------------------------------
// 2. Employees API
// ----------------------------------------------------------
app.get('/api/employees', (req, res) => {
    if (isDbConnected) {
        const query = `
            SELECT 
                e.employee_id, e.name, e.department, e.designation, e.phone, e.email, 
                DATE_FORMAT(e.joining_date, '%Y-%m-%d') AS joining_date,
                s.salary_id, s.basic_salary, s.allowance, s.deduction, s.net_salary
            FROM employees e
            LEFT JOIN salary_details s ON e.employee_id = s.employee_id
            ORDER BY e.employee_id ASC;
        `;
        dbPool.query(query, (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: results });
        });
    } else {
        const results = inMemoryEmployees.map(emp => {
            const sal = inMemorySalaries.find(s => s.employee_id === emp.employee_id) || null;
            return {
                ...emp,
                salary_id: sal ? sal.salary_id : null,
                basic_salary: sal ? sal.basic_salary : 0,
                allowance: sal ? sal.allowance : 0,
                deduction: sal ? sal.deduction : 0,
                net_salary: sal ? sal.net_salary : 0
            };
        });
        res.json({ success: true, data: results });
    }
});

app.get('/api/employees/:id', (req, res) => {
    const empId = parseInt(req.params.id);
    if (isDbConnected) {
        const query = `
            SELECT 
                e.employee_id, e.name, e.department, e.designation, e.phone, e.email, 
                DATE_FORMAT(e.joining_date, '%Y-%m-%d') AS joining_date,
                s.salary_id, s.basic_salary, s.allowance, s.deduction, s.net_salary
            FROM employees e
            LEFT JOIN salary_details s ON e.employee_id = s.employee_id
            WHERE e.employee_id = ?;
        `;
        dbPool.query(query, [empId], (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (results.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
            res.json({ success: true, data: results[0] });
        });
    } else {
        const emp = inMemoryEmployees.find(e => e.employee_id === empId);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
        const sal = inMemorySalaries.find(s => s.employee_id === empId) || null;
        res.json({
            success: true,
            data: {
                ...emp,
                salary_id: sal ? sal.salary_id : null,
                basic_salary: sal ? sal.basic_salary : 0,
                allowance: sal ? sal.allowance : 0,
                deduction: sal ? sal.deduction : 0,
                net_salary: sal ? sal.net_salary : 0
            }
        });
    }
});

app.post('/api/employees', (req, res) => {
    const { name, department, designation, phone, email, joining_date, basic_salary, allowance, deduction } = req.body;
    
    if (!name || !department || !designation || !phone || !email || !joining_date) {
        return res.status(400).json({ success: false, message: 'All employee fields are required.' });
    }

    const bSalary = parseFloat(basic_salary) || 0;
    const allow = parseFloat(allowance) || 0;
    const ded = parseFloat(deduction) || 0;
    const net = calculateNetSalary(bSalary, allow, ded);

    if (isDbConnected) {
        const empSQL = 'INSERT INTO employees (name, department, designation, phone, email, joining_date) VALUES (?, ?, ?, ?, ?, ?)';
        dbPool.query(empSQL, [name, department, designation, phone, email, joining_date], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            
            const newEmpId = result.insertId;
            const salSQL = 'INSERT INTO salary_details (employee_id, basic_salary, allowance, deduction, net_salary) VALUES (?, ?, ?, ?, ?)';
            dbPool.query(salSQL, [newEmpId, bSalary, allow, ded, net], (salErr, salResult) => {
                if (salErr) return res.status(500).json({ success: false, error: salErr.message });
                res.status(201).json({
                    success: true,
                    message: 'Employee and salary structure added successfully.',
                    data: { employee_id: newEmpId, name, department, designation, phone, email, joining_date, salary_id: salResult.insertId, basic_salary: bSalary, allowance: allow, deduction: ded, net_salary: net }
                });
            });
        });
    } else {
        const newEmpId = nextEmployeeId++;
        const newEmp = { employee_id: newEmpId, name, department, designation, phone, email, joining_date };
        inMemoryEmployees.push(newEmp);

        const newSalId = nextSalaryId++;
        const newSal = { salary_id: newSalId, employee_id: newEmpId, basic_salary: bSalary, allowance: allow, deduction: ded, net_salary: net };
        inMemorySalaries.push(newSal);

        res.status(201).json({
            success: true,
            message: 'Employee and salary structure created (In-Memory mode).',
            data: { ...newEmp, salary_id: newSalId, basic_salary: bSalary, allowance: allow, deduction: ded, net_salary: net }
        });
    }
});

app.put('/api/employees/:id', (req, res) => {
    const empId = parseInt(req.params.id);
    const { name, department, designation, phone, email, joining_date } = req.body;

    if (!name || !department || !designation || !phone || !email || !joining_date) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (isDbConnected) {
        const sql = 'UPDATE employees SET name = ?, department = ?, designation = ?, phone = ?, email = ?, joining_date = ? WHERE employee_id = ?';
        dbPool.query(sql, [name, department, designation, phone, email, joining_date, empId], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
            res.json({ success: true, message: 'Employee updated successfully.' });
        });
    } else {
        const index = inMemoryEmployees.findIndex(e => e.employee_id === empId);
        if (index === -1) return res.status(404).json({ success: false, message: 'Employee not found' });
        inMemoryEmployees[index] = { employee_id: empId, name, department, designation, phone, email, joining_date };
        res.json({ success: true, message: 'Employee updated successfully.' });
    }
});

app.delete('/api/employees/:id', (req, res) => {
    const empId = parseInt(req.params.id);

    if (isDbConnected) {
        dbPool.query('DELETE FROM employees WHERE employee_id = ?', [empId], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
            res.json({ success: true, message: 'Employee and associated records deleted successfully.' });
        });
    } else {
        const index = inMemoryEmployees.findIndex(e => e.employee_id === empId);
        if (index === -1) return res.status(404).json({ success: false, message: 'Employee not found' });
        
        inMemoryEmployees.splice(index, 1);
        inMemorySalaries = inMemorySalaries.filter(s => s.employee_id !== empId);
        inMemoryPayroll = inMemoryPayroll.filter(p => p.employee_id !== empId);

        res.json({ success: true, message: 'Employee and associated records deleted successfully.' });
    }
});

// ----------------------------------------------------------
// 3. Salary Details API
// ----------------------------------------------------------
app.get('/api/salaries', (req, res) => {
    if (isDbConnected) {
        const query = `
            SELECT 
                s.salary_id, s.employee_id, s.basic_salary, s.allowance, s.deduction, s.net_salary,
                e.name AS employee_name, e.department, e.designation
            FROM salary_details s
            JOIN employees e ON s.employee_id = e.employee_id
            ORDER BY s.salary_id ASC;
        `;
        dbPool.query(query, (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: results });
        });
    } else {
        const results = inMemorySalaries.map(sal => {
            const emp = inMemoryEmployees.find(e => e.employee_id === sal.employee_id);
            return {
                ...sal,
                employee_name: emp ? emp.name : 'Unknown',
                department: emp ? emp.department : 'N/A',
                designation: emp ? emp.designation : 'N/A'
            };
        });
        res.json({ success: true, data: results });
    }
});

app.post('/api/salaries', (req, res) => {
    const { employee_id, basic_salary, allowance, deduction } = req.body;
    const empId = parseInt(employee_id);

    if (!empId) {
        return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const bSalary = parseFloat(basic_salary) || 0;
    const allow = parseFloat(allowance) || 0;
    const ded = parseFloat(deduction) || 0;
    const net = calculateNetSalary(bSalary, allow, ded);

    if (isDbConnected) {
        const query = `
            INSERT INTO salary_details (employee_id, basic_salary, allowance, deduction, net_salary)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                basic_salary = VALUES(basic_salary),
                allowance = VALUES(allowance),
                deduction = VALUES(deduction),
                net_salary = VALUES(net_salary);
        `;
        dbPool.query(query, [empId, bSalary, allow, ded, net], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: 'Salary structure updated successfully.', net_salary: net });
        });
    } else {
        const existing = inMemorySalaries.find(s => s.employee_id === empId);
        if (existing) {
            existing.basic_salary = bSalary;
            existing.allowance = allow;
            existing.deduction = ded;
            existing.net_salary = net;
            res.json({ success: true, message: 'Salary structure updated successfully.', net_salary: net });
        } else {
            const newSalId = nextSalaryId++;
            inMemorySalaries.push({
                salary_id: newSalId,
                employee_id: empId,
                basic_salary: bSalary,
                allowance: allow,
                deduction: ded,
                net_salary: net
            });
            res.json({ success: true, message: 'Salary structure added successfully.', net_salary: net });
        }
    }
});

// ----------------------------------------------------------
// 4. Payroll API
// ----------------------------------------------------------
app.get('/api/payroll', (req, res) => {
    const { month, year, department, payment_status, search } = req.query;

    if (isDbConnected) {
        let query = `
            SELECT 
                p.payroll_id, p.employee_id, p.salary_id, p.month, p.year, 
                DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date, 
                p.payment_status,
                e.name AS employee_name, e.department, e.designation, e.phone, e.email,
                s.basic_salary, s.allowance, s.deduction, s.net_salary
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            JOIN salary_details s ON p.salary_id = s.salary_id
            WHERE 1=1
        `;
        const params = [];

        if (month) {
            query += ' AND p.month = ?';
            params.push(parseInt(month));
        }
        if (year) {
            query += ' AND p.year = ?';
            params.push(parseInt(year));
        }
        if (department) {
            query += ' AND e.department = ?';
            params.push(department);
        }
        if (payment_status) {
            query += ' AND p.payment_status = ?';
            params.push(payment_status);
        }
        if (search) {
            query += ' AND (e.name LIKE ? OR e.designation LIKE ? OR e.department LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.year DESC, p.month DESC, p.payroll_id DESC;';

        dbPool.query(query, params, (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: results });
        });
    } else {
        let list = inMemoryPayroll.map(p => {
            const emp = inMemoryEmployees.find(e => e.employee_id === p.employee_id) || {};
            const sal = inMemorySalaries.find(s => s.salary_id === p.salary_id) || {};
            return {
                ...p,
                employee_name: emp.name || 'Unknown',
                department: emp.department || 'N/A',
                designation: emp.designation || 'N/A',
                phone: emp.phone || 'N/A',
                email: emp.email || 'N/A',
                basic_salary: sal.basic_salary || 0,
                allowance: sal.allowance || 0,
                deduction: sal.deduction || 0,
                net_salary: sal.net_salary || 0
            };
        });

        if (month) list = list.filter(p => p.month === parseInt(month));
        if (year) list = list.filter(p => p.year === parseInt(year));
        if (department) list = list.filter(p => p.department === department);
        if (payment_status) list = list.filter(p => p.payment_status.toLowerCase() === payment_status.toLowerCase());
        if (search) {
            const term = search.toLowerCase();
            list = list.filter(p => 
                (p.employee_name && p.employee_name.toLowerCase().includes(term)) ||
                (p.department && p.department.toLowerCase().includes(term)) ||
                (p.designation && p.designation.toLowerCase().includes(term))
            );
        }

        list.sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month) || b.payroll_id - a.payroll_id);
        res.json({ success: true, data: list });
    }
});

app.post('/api/payroll', (req, res) => {
    const { employee_id, month, year, payment_date, payment_status } = req.body;
    const empId = parseInt(employee_id);
    const m = parseInt(month);
    const y = parseInt(year);
    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const status = payment_status || 'Pending';

    if (!empId || !m || !y) {
        return res.status(400).json({ success: false, message: 'Employee, Month, and Year are required.' });
    }

    if (isDbConnected) {
        // Find salary_id for this employee
        dbPool.query('SELECT salary_id FROM salary_details WHERE employee_id = ?', [empId], (salErr, salRows) => {
            if (salErr) return res.status(500).json({ success: false, error: salErr.message });
            if (salRows.length === 0) {
                return res.status(400).json({ success: false, message: 'Please configure salary details for this employee first.' });
            }
            const salaryId = salRows[0].salary_id;

            const insertSQL = `
                INSERT INTO payroll (employee_id, salary_id, month, year, payment_date, payment_status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    payment_date = VALUES(payment_date),
                    payment_status = VALUES(payment_status);
            `;
            dbPool.query(insertSQL, [empId, salaryId, m, y, pDate, status], (insErr, result) => {
                if (insErr) return res.status(500).json({ success: false, error: insErr.message });
                res.status(201).json({ success: true, message: 'Payroll recorded successfully.' });
            });
        });
    } else {
        const sal = inMemorySalaries.find(s => s.employee_id === empId);
        if (!sal) {
            return res.status(400).json({ success: false, message: 'Please configure salary details for this employee first.' });
        }

        const existing = inMemoryPayroll.find(p => p.employee_id === empId && p.month === m && p.year === y);
        if (existing) {
            existing.payment_date = pDate;
            existing.payment_status = status;
            res.json({ success: true, message: 'Payroll entry updated successfully.' });
        } else {
            inMemoryPayroll.push({
                payroll_id: nextPayrollId++,
                employee_id: empId,
                salary_id: sal.salary_id,
                month: m,
                year: y,
                payment_date: pDate,
                payment_status: status
            });
            res.status(201).json({ success: true, message: 'Payroll record created successfully.' });
        }
    }
});

// Bulk Generate Payroll for all active employees for given month and year
app.post('/api/payroll/generate-bulk', (req, res) => {
    const { month, year, payment_date, payment_status } = req.body;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const status = payment_status || 'Pending';

    if (isDbConnected) {
        const bulkQuery = `
            INSERT INTO payroll (employee_id, salary_id, month, year, payment_date, payment_status)
            SELECT e.employee_id, s.salary_id, ?, ?, ?, ?
            FROM employees e
            JOIN salary_details s ON e.employee_id = s.employee_id
            ON DUPLICATE KEY UPDATE 
                payment_status = VALUES(payment_status),
                payment_date = VALUES(payment_date);
        `;
        dbPool.query(bulkQuery, [m, y, pDate, status], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: `Batch payroll processed for Month ${m}/${y}.` });
        });
    } else {
        let addedCount = 0;
        inMemoryEmployees.forEach(emp => {
            const sal = inMemorySalaries.find(s => s.employee_id === emp.employee_id);
            if (sal) {
                const existing = inMemoryPayroll.find(p => p.employee_id === emp.employee_id && p.month === m && p.year === y);
                if (existing) {
                    existing.payment_status = status;
                    existing.payment_date = pDate;
                } else {
                    inMemoryPayroll.push({
                        payroll_id: nextPayrollId++,
                        employee_id: emp.employee_id,
                        salary_id: sal.salary_id,
                        month: m,
                        year: y,
                        payment_date: pDate,
                        payment_status: status
                    });
                    addedCount++;
                }
            }
        });
        res.json({ success: true, message: `Batch payroll processed for Month ${m}/${y} (${addedCount} new records).` });
    }
});

app.put('/api/payroll/:id/status', (req, res) => {
    const payrollId = parseInt(req.params.id);
    const { payment_status, payment_date } = req.body;

    if (!payment_status) {
        return res.status(400).json({ success: false, message: 'Payment status is required.' });
    }

    const pDate = payment_date || new Date().toISOString().split('T')[0];

    if (isDbConnected) {
        const sql = 'UPDATE payroll SET payment_status = ?, payment_date = ? WHERE payroll_id = ?';
        dbPool.query(sql, [payment_status, pDate, payrollId], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Payroll record not found.' });
            res.json({ success: true, message: 'Payment status updated.' });
        });
    } else {
        const item = inMemoryPayroll.find(p => p.payroll_id === payrollId);
        if (!item) return res.status(404).json({ success: false, message: 'Payroll record not found.' });
        item.payment_status = payment_status;
        item.payment_date = pDate;
        res.json({ success: true, message: 'Payment status updated.' });
    }
});

app.delete('/api/payroll/:id', (req, res) => {
    const payrollId = parseInt(req.params.id);
    if (isDbConnected) {
        dbPool.query('DELETE FROM payroll WHERE payroll_id = ?', [payrollId], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
            res.json({ success: true, message: 'Payroll record deleted.' });
        });
    } else {
        const index = inMemoryPayroll.findIndex(p => p.payroll_id === payrollId);
        if (index === -1) return res.status(404).json({ success: false, message: 'Record not found.' });
        inMemoryPayroll.splice(index, 1);
        res.json({ success: true, message: 'Payroll record deleted.' });
    }
});

// ----------------------------------------------------------
// 5. Printable Payslip API
// ----------------------------------------------------------
app.get('/api/payroll/payslip/:id', (req, res) => {
    const payrollId = parseInt(req.params.id);

    if (isDbConnected) {
        const query = `
            SELECT 
                p.payroll_id, p.month, p.year, 
                DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date, 
                p.payment_status,
                e.employee_id, e.name, e.department, e.designation, e.phone, e.email, 
                DATE_FORMAT(e.joining_date, '%Y-%m-%d') AS joining_date,
                s.salary_id, s.basic_salary, s.allowance, s.deduction, s.net_salary
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            JOIN salary_details s ON p.salary_id = s.salary_id
            WHERE p.payroll_id = ?;
        `;
        dbPool.query(query, [payrollId], (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (results.length === 0) return res.status(404).json({ success: false, message: 'Payslip not found' });
            res.json({ success: true, data: results[0] });
        });
    } else {
        const pay = inMemoryPayroll.find(p => p.payroll_id === payrollId);
        if (!pay) return res.status(404).json({ success: false, message: 'Payslip not found' });
        const emp = inMemoryEmployees.find(e => e.employee_id === pay.employee_id) || {};
        const sal = inMemorySalaries.find(s => s.salary_id === pay.salary_id) || {};

        res.json({
            success: true,
            data: {
                payroll_id: pay.payroll_id,
                month: pay.month,
                year: pay.year,
                payment_date: pay.payment_date,
                payment_status: pay.payment_status,
                employee_id: emp.employee_id,
                name: emp.name,
                department: emp.department,
                designation: emp.designation,
                phone: emp.phone,
                email: emp.email,
                joining_date: emp.joining_date,
                salary_id: sal.salary_id,
                basic_salary: sal.basic_salary || 0,
                allowance: sal.allowance || 0,
                deduction: sal.deduction || 0,
                net_salary: sal.net_salary || 0
            }
        });
    }
});

// ----------------------------------------------------------
// 6. Reports & Analytics Summary
// ----------------------------------------------------------
app.get('/api/reports/summary', (req, res) => {
    if (isDbConnected) {
        const summaryQueries = `
            SELECT COUNT(*) AS total_employees FROM employees;
            SELECT 
                COUNT(*) AS total_payrolls,
                COALESCE(SUM(s.net_salary), 0) AS total_payroll_amount,
                COALESCE(SUM(CASE WHEN p.payment_status = 'Paid' THEN s.net_salary ELSE 0 END), 0) AS total_paid_amount,
                COALESCE(SUM(CASE WHEN p.payment_status != 'Paid' THEN s.net_salary ELSE 0 END), 0) AS total_pending_amount,
                COALESCE(AVG(s.net_salary), 0) AS avg_net_salary
            FROM payroll p
            JOIN salary_details s ON p.salary_id = s.salary_id;
            SELECT e.department, COUNT(e.employee_id) AS employee_count, COALESCE(SUM(s.net_salary), 0) AS department_total_payroll
            FROM employees e
            LEFT JOIN salary_details s ON e.employee_id = s.employee_id
            GROUP BY e.department;
        `;
        dbPool.query(summaryQueries, (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({
                success: true,
                total_employees: results[0][0].total_employees,
                metrics: results[1][0],
                department_breakdown: results[2]
            });
        });
    } else {
        const totalEmployees = inMemoryEmployees.length;
        let totalPayrollAmount = 0;
        let totalPaidAmount = 0;
        let totalPendingAmount = 0;

        inMemoryPayroll.forEach(p => {
            const sal = inMemorySalaries.find(s => s.salary_id === p.salary_id);
            const net = sal ? sal.net_salary : 0;
            totalPayrollAmount += net;
            if (p.payment_status === 'Paid') {
                totalPaidAmount += net;
            } else {
                totalPendingAmount += net;
            }
        });

        const avgNet = totalEmployees > 0 ? (totalPayrollAmount / (inMemoryPayroll.length || 1)) : 0;

        const deptMap = {};
        inMemoryEmployees.forEach(emp => {
            if (!deptMap[emp.department]) {
                deptMap[emp.department] = { department: emp.department, employee_count: 0, department_total_payroll: 0 };
            }
            deptMap[emp.department].employee_count++;
            const sal = inMemorySalaries.find(s => s.employee_id === emp.employee_id);
            if (sal) {
                deptMap[emp.department].department_total_payroll += sal.net_salary;
            }
        });

        res.json({
            success: true,
            total_employees: totalEmployees,
            metrics: {
                total_payrolls: inMemoryPayroll.length,
                total_payroll_amount: totalPayrollAmount,
                total_paid_amount: totalPaidAmount,
                total_pending_amount: totalPendingAmount,
                avg_net_salary: parseFloat(avgNet.toFixed(2))
            },
            department_breakdown: Object.values(deptMap)
        });
    }
});

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`==========================================================`);
    console.log(`🚀 Antigravity Employee Payroll Management System`);
    console.log(`📡 Server running at http://localhost:${PORT}`);
    console.log(`📋 Developed by Sai Chandrika Sirigireddy & Antigravity AI`);
    console.log(`==========================================================`);
});
