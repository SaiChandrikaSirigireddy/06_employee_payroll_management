-- ==========================================================
-- ANTIGRAVITIY & SAI CHANDRIKA - EMPLOYEE PAYROLL MANAGEMENT SYSTEM
-- Database Schema & Seed Data (MySQL 8.0+)
-- ==========================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS payroll_db;
USE payroll_db;

-- 2. Drop existing tables if re-running (respecting foreign key constraints)
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS salary_details;
DROP TABLE IF EXISTS employees;

-- ----------------------------------------------------------
-- Table 1: employees
-- ----------------------------------------------------------
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table 2: salary_details
-- Formula: net_salary = basic_salary + allowance - deduction
-- ----------------------------------------------------------
CREATE TABLE salary_details (
    salary_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    basic_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    allowance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deduction DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_salary_employee 
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table 3: payroll
-- Monthly payroll records with payment status & date
-- ----------------------------------------------------------
CREATE TABLE payroll (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    salary_id INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    payment_date DATE NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payroll_employee 
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payroll_salary 
        FOREIGN KEY (salary_id) REFERENCES salary_details(salary_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_employee_month_year UNIQUE (employee_id, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Seed Data: Sample Employees
-- ----------------------------------------------------------
INSERT INTO employees (employee_id, name, department, designation, phone, email, joining_date) VALUES
(101, 'Sai Chandrika Sirigireddy', 'Engineering', 'Lead Software Architect', '9876543210', 'saichandrika@company.com', '2023-01-15'),
(102, 'Aditya Varma', 'Engineering', 'Full Stack Developer', '9812345678', 'aditya.v@company.com', '2023-03-20'),
(103, 'Pooja Hegde', 'Human Resources', 'HR Manager', '9845612345', 'pooja.h@company.com', '2022-07-10'),
(104, 'Rahul Sharma', 'Finance', 'Chief Financial Analyst', '9890123456', 'rahul.s@company.com', '2022-11-01'),
(105, 'Deepika Patel', 'Marketing', 'Senior Marketing Specialist', '9789012345', 'deepika.p@company.com', '2023-05-18'),
(106, 'Karthik Raja', 'Operations', 'Operations Coordinator', '9712345678', 'karthik.r@company.com', '2024-02-01');

-- ----------------------------------------------------------
-- Seed Data: Salary Details (net_salary = basic + allowance - deduction)
-- ----------------------------------------------------------
INSERT INTO salary_details (salary_id, employee_id, basic_salary, allowance, deduction, net_salary) VALUES
(1, 101, 85000.00, 15000.00, 5000.00, 95000.00),
(2, 102, 60000.00, 10000.00, 3500.00, 66500.00),
(3, 103, 55000.00, 8000.00, 3000.00, 60000.00),
(4, 104, 70000.00, 12000.00, 4000.00, 78000.00),
(5, 105, 48000.00, 7000.00, 2500.00, 52500.00),
(6, 106, 42000.00, 6000.00, 2000.00, 46000.00);

-- ----------------------------------------------------------
-- Seed Data: Payroll Records for October & November 2026
-- ----------------------------------------------------------
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

-- ----------------------------------------------------------
-- Verification Query
-- ----------------------------------------------------------
SELECT 
    p.payroll_id,
    e.employee_id,
    e.name AS employee_name,
    e.department,
    e.designation,
    s.basic_salary,
    s.allowance,
    s.deduction,
    s.net_salary,
    p.month,
    p.year,
    p.payment_date,
    p.payment_status
FROM payroll p
JOIN employees e ON p.employee_id = e.employee_id
JOIN salary_details s ON p.salary_id = s.salary_id
ORDER BY p.year DESC, p.month DESC, p.payroll_id DESC;
