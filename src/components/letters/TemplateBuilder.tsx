'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import {
  ArrowLeft,
  Save,
  Tag,
  History,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Eye,
} from 'lucide-react';
import LetterTiptapEditor from './LetterTiptapEditor';
import { LettersService, DocumentTemplate, DocumentCategory, TemplatePlaceholder, TemplateVersion, DocumentStructure } from '@/services/lettersService';
import { toast } from 'react-hot-toast';
import { Modal, Radio, Drawer, Button } from 'antd';

interface TemplateBuilderProps {
  templateId?: string;
}

const DEFAULT_PLACEHOLDERS: Array<{ key: string; label: string; dataType: string }> = [
  { key: 'employee_name', label: 'Employee Name', dataType: 'string' },
  { key: 'work_email', label: 'Work Email', dataType: 'string' },
  { key: 'designation', label: 'Designation / Title', dataType: 'string' },
  { key: 'department', label: 'Department', dataType: 'string' },
  { key: 'date_of_joining', label: 'Date of Joining', dataType: 'date' },
  { key: 'salary_ctc', label: 'Annual Salary (CTC)', dataType: 'number' },
  { key: 'reporting_manager', label: 'Reporting Manager', dataType: 'string' },
  { key: 'current_date', label: 'Current Date', dataType: 'date' },
  { key: 'company_name', label: 'Company Name', dataType: 'string' },
  { key: 'company_address', label: 'Company Address', dataType: 'string' },
  { key: 'company_mail', label: 'Company Mail', dataType: 'string' },
  { key: 'company_phone', label: 'Company Phone', dataType: 'string' },
  { key: 'company_location', label: 'Company Location', dataType: 'string' },
];

const getSalaryStructureTableHtml = (): string => {
  return `<div data-salary-structure="true" style="margin-top: 20px; margin-bottom: 20px; font-family: 'Inter', system-ui, -apple-system, sans-serif;">` +
    `<div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Salary Structure</div>` +
    `<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 13px; text-align: left; background: #ffffff;">` +
    `<thead>` +
    `<tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; color: #475569;">` +
    `<th style="padding: 10px 14px; font-weight: 600; border: 1px solid #cbd5e1;">COMPONENT</th>` +
    `<th style="padding: 10px 14px; font-weight: 600; border: 1px solid #cbd5e1;">TYPE</th>` +
    `<th style="padding: 10px 14px; font-weight: 600; border: 1px solid #cbd5e1;">PERCENTAGE</th>` +
    `<th style="padding: 10px 14px; font-weight: 600; border: 1px solid #cbd5e1; text-align: right;">MONTHLY</th>` +
    `<th style="padding: 10px 14px; font-weight: 600; border: 1px solid #cbd5e1; text-align: right;">ANNUAL</th>` +
    `</tr>` +
    `</thead>` +
    `<tbody>` +
    `<tr>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1;">` +
    `<div style="font-weight: 600; color: #1e293b; font-size: 14px;">Basic</div>` +
    `<div style="font-size: 11px; font-weight: 600; margin-top: 2px;"><span style="color: #10b981">● Earning</span></div>` +
    `</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #475569;">% of Gross</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">40%</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹4,000</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹48,000</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1;">` +
    `<div style="font-weight: 600; color: #1e293b; font-size: 14px;">House Rent Allowance</div>` +
    `<div style="font-size: 11px; font-weight: 600; margin-top: 2px;"><span style="color: #10b981">● Earning</span></div>` +
    `</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #475569;">% of Gross</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">20%</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹2,000</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹24,000</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1;">` +
    `<div style="font-weight: 600; color: #1e293b; font-size: 14px;">Conveyance Allowance</div>` +
    `<div style="font-size: 11px; font-weight: 600; margin-top: 2px;"><span style="color: #10b981">● Earning</span></div>` +
    `</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #475569;">% of Gross</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">10%</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹1,000</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹12,000</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1;">` +
    `<div style="font-weight: 600; color: #1e293b; font-size: 14px;">Medical Allowance</div>` +
    `<div style="font-size: 11px; font-weight: 600; margin-top: 2px;"><span style="color: #10b981">● Earning</span></div>` +
    `</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #475569;">% of Gross</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">30%</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹3,000</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; text-align: right;">₹36,000</td>` +
    `</tr>` +
    `</tbody>` +
    `<tfoot>` +
    `<tr style="background-color: #f8fafc; font-weight: 600; color: #475569; border-top: 2px solid #cbd5e1;">` +
    `<td colspan="3" style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">Total Gross</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">₹10,000</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">₹1,20,000</td>` +
    `</tr>` +
    `<tr style="background-color: #f8fafc; font-weight: 600; color: #ef4444;">` +
    `<td colspan="3" style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">Total Deductions</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">₹0</td>` +
    `<td style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">₹0</td>` +
    `</tr>` +
    `<tr style="background-color: #f1f5f9; font-weight: 700; color: #0f172a;">` +
    `<td colspan="3" style="padding: 12px 14px; border: 1px solid #cbd5e1; text-align: right;">Net Pay</td>` +
    `<td style="padding: 12px 14px; border: 1px solid #cbd5e1; text-align: right;">₹10,000</td>` +
    `<td style="padding: 12px 14px; border: 1px solid #cbd5e1; text-align: right;">₹1,20,000</td>` +
    `</tr>` +
    `<tr style="background-color: #e2e8f0; font-weight: 800; color: #0f172a; border-top: 2px solid #94a3b8;">` +
    `<td colspan="3" style="padding: 14px 14px; border: 1px solid #cbd5e1; text-align: right; text-transform: uppercase;">Total CTC</td>` +
    `<td style="padding: 14px 14px; border: 1px solid #cbd5e1; text-align: right; color: #10b981;">₹10,000 / mon</td>` +
    `<td style="padding: 14px 14px; border: 1px solid #cbd5e1; text-align: right; font-size: 15px;">₹1,20,000 / yr</td>` +
    `</tr>` +
    `</tfoot>` +
    `</table>` +
    `</div>`;
};

const getSimplifiedSalaryStructureTableHtml = (): string => {
  return `<div data-salary-structure="true" style="margin-top: 20px; margin-bottom: 20px; font-family: 'Inter', system-ui, -apple-system, sans-serif;">` +
    `<table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: left; background: #ffffff; color: #000;">` +
    `<thead>` +
    `<tr style="border-bottom: 1px solid #000;">` +
    `<th style="padding: 8px 12px; font-weight: bold; border: 1px solid #000;">Compensation</th>` +
    `<th style="padding: 8px 12px; font-weight: bold; border: 1px solid #000; text-align: center;">Per Month</th>` +
    `<th style="padding: 8px 12px; font-weight: bold; border: 1px solid #000; text-align: center;">Per year</th>` +
    `</tr>` +
    `</thead>` +
    `<tbody>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Basic</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">23,565</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">2,82,780</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">House Rent Allowance (HRA)</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">11,783</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">1,41,390</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">City Compensatory Allowance (CCA)</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">5,237</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">62,840</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Conveyance</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">5,237</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">62,840</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Medical Allowance</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">2,618</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">31,420</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Special Allowance</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">3,928</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">47,130</td>` +
    `</tr>` +
    `<tr style="background-color: #dbeafe; font-weight: bold;">` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Gross Pay</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">52,367</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">6,28,400</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Provident Fund</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">1800</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">21600</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Professional Tax</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">208</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">2500</td>` +
    `</tr>` +
    `<tr style="font-weight: bold;">` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">Net Pay</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">50,358</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">6,04,300</td>` +
    `</tr>` +
    `<tr style="background-color: #dbeafe; font-weight: bold;">` +
    `<td style="padding: 8px 12px; border: 1px solid #000;">CTC (Cost to Company)</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">54,167</td>` +
    `<td style="padding: 8px 12px; border: 1px solid #000; text-align: center;">6,50,000</td>` +
    `</tr>` +
    `<tr>` +
    `<td colspan="3" style="padding: 8px 12px; border: 1px solid #000; font-weight: bold;">Other Benefits</td>` +
    `</tr>` +
    `<tr>` +
    `<td colspan="3" style="padding: 8px 12px; border: 1px solid #000;">` +
    `<ol style="margin: 0; padding-left: 20px;">` +
    `<li>You are covered under Health Insurance from the date of Joining.</li>` +
    `<li>Sum insured in Rs.3,00,000 per annum.</li>` +
    `</ol>` +
    `</td>` +
    `</tr>` +
    `<tr>` +
    `<td colspan="3" style="padding: 8px 12px; border: 1px solid #000; font-weight: bold;">Additional Notes</td>` +
    `</tr>` +
    `<tr>` +
    `<td colspan="3" style="padding: 8px 12px; border: 1px solid #000;">` +
    `<ol style="margin: 0; padding-left: 20px;">` +
    `<li>All salary components are governed by the company policies and statutory guidelines.</li>` +
    `<li>This salary sheet is strictly confidential and must not be discussed with anyone other than your Reporting Manager.</li>` +
    `<li>All personal tax liability arising out of compensation and joining expenses (if any) will be borne solely by the employee.</li>` +
    `<li>You will receive salary, and all other benefits forming part of your CTC, subject to, and after, deduction of personal Income Tax Liability at source in accordance with applicable law.</li>` +
    `</ol>` +
    `</td>` +
    `</tr>` +
    `</tbody>` +
    `</table>` +
    `</div>`;
};
const getDefaultContentForCategory = (catName?: string): string => {
  if (!catName) {
    return '<h1>Offer of Employment</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>We are excited to extend an offer for the position of <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> with <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>.</p><p>Your scheduled Date of Joining will be <span data-placeholder-key="date_of_joining" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Date of Joining}}</span>. Your total annual compensation will be <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>Sincerely,<br/><strong>Human Resources</strong></p>';
  }

  const name = catName.toLowerCase();

  if (name.includes('appointment')) {
    return '<h1>Appointment Letter</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>We are pleased to formally appoint you as <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> in the <span data-placeholder-key="department" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Department}}</span> at <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>, effective from <span data-placeholder-key="date_of_joining" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Date of Joining}}</span>.</p><p>Your reporting manager will be <span data-placeholder-key="reporting_manager" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Reporting Manager}}</span>. Your annual compensation is established at <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>We look forward to a long and successful professional relationship.</p><p>Best Regards,<br/><strong>Human Resources Department</strong></p>';
  }

  if (name.includes('experience')) {
    return '<h1>Experience Certificate</h1><p>To Whom It May Concern,</p><p>This is to certify that <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span> was employed with <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span> in the <span data-placeholder-key="department" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Department}}</span> department from <span data-placeholder-key="date_of_joining" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Date of Joining}}</span> to <span data-placeholder-key="current_date" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Current Date}}</span>.</p><p>During their tenure, their last held position was <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span>. They demonstrated professionalism, dedication, and high ethical standards throughout their employment with us.</p><p>We wish them the very best in all their future endeavors.</p><p>Sincerely,<br/><strong>For <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span></strong></p>';
  }

  if (name.includes('promotion')) {
    return '<h1>Letter of Promotion</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>In recognition of your exceptional performance and dedication to <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>, we are delighted to promote you to the position of <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> in the <span data-placeholder-key="department" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Department}}</span> department, effective immediately.</p><p>Your revised annual compensation will be <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>. You will continue reporting to <span data-placeholder-key="reporting_manager" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Reporting Manager}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>Congratulations on your well-deserved promotion!</p><p>Sincerely,<br/><strong>Human Resources & Executive Leadership</strong></p>';
  }

  if (name.includes('revision') || name.includes('salary') || name.includes('compensation') || name.includes('increment')) {
    return '<h1>Compensation Revision Notice</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>We are pleased to inform you that following our recent appraisal cycle at <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>, your annual compensation as <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> has been revised to <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>All other terms and conditions of your employment remain unchanged. We appreciate your valuable contributions to our continued success.</p><p>Best Regards,<br/><strong>Total Rewards & Human Resources</strong></p>';
  }

  if (name.includes('relieving') || name.includes('exit') || name.includes('resignation')) {
    return '<h1>Relieving & Acceptance of Resignation</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>This is with reference to your resignation from the position of <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> in the <span data-placeholder-key="department" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Department}}</span> at <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>.</p><p>We wish to inform you that your resignation has been accepted and you are formally relieved from your duties as of <span data-placeholder-key="current_date" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Current Date}}</span>.</p><p>We thank you for your service and wish you success in your future endeavors.</p><p>Sincerely,<br/><strong>Human Resources</strong></p>';
  }

  if (name.includes('offer')) {
    return '<h1>Offer of Employment</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>We are excited to extend an offer for the position of <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> with <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>.</p><p>Your scheduled Date of Joining will be <span data-placeholder-key="date_of_joining" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Date of Joining}}</span>. Your total annual compensation will be <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>Sincerely,<br/><strong>Human Resources</strong></p>';
  }

  return `<h1>${catName || 'Document Template'}</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>This document is issued regarding your role as <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> in the <span data-placeholder-key="department" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Department}}</span> department at <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>.</p><p>Please retain this document for your official records.</p><p>Sincerely,<br/><strong>Human Resources</strong></p>`;
};

export default function TemplateBuilder({ templateId }: TemplateBuilderProps) {
  const router = useRouter();
  const { user } = useAuth();
  console.log("user : ", user)
  const editorRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);

  // Template Form State
  const [templateName, setTemplateName] = useState('New Document Template');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [editorContent, setEditorContent] = useState<string>(
    '<h1>Offer of Employment</h1><p>Dear <span data-placeholder-key="employee_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Employee Name}}</span>,</p><p>We are excited to extend an offer for the position of <span data-placeholder-key="designation" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Designation / Title}}</span> with <span data-placeholder-key="company_name" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Company Name}}</span>.</p><p>Your scheduled Date of Joining will be <span data-placeholder-key="date_of_joining" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Date of Joining}}</span>. Your total annual compensation will be <span data-placeholder-key="salary_ctc" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{Annual Salary (CTC)}}</span>.</p>' + getSalaryStructureTableHtml() + '<p>Sincerely,<br/><strong>Human Resources</strong></p>'
  );
  const [currentVersion, setCurrentVersion] = useState(1);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);

  // Right Drawer Tab State
  const [activeTab, setActiveTab] = useState<'placeholders' | 'layout' | 'history'>('placeholders');
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [isHeaderReplaceModalOpen, setIsHeaderReplaceModalOpen] = useState(false);
  const [pendingHeaderHtml, setPendingHeaderHtml] = useState('');

  // Page Settings State
  const [pageConfig, setPageConfig] = useState<any>({
    marginTop: '10mm',
    marginBottom: '10mm',
    marginLeft: '20mm',
    marginRight: '20mm',
    borderWidth: '0px',
    borderStyle: 'solid',
    borderColor: '#000000',
    headerHtml: '',
    footerHtml: '<div style="border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: right; font-size: 11px; color: #64748b;">Page <span class="pageNumber" style="font-weight: bold; color: #64748b;">[Page #]</span></div>'
  });

  // Custom Placeholders State
  const [customPlaceholders, setCustomPlaceholders] = useState<{ key: string; label: string; dataType: string }[]>([]);
  const [isGlobal, setIsGlobal] = useState<boolean>(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // Version Change Note Modal
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Salary Modal State
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryTableFormat, setSalaryTableFormat] = useState<string>('detailed');
  const [pendingPlaceholder, setPendingPlaceholder] = useState<{ key: string, label: string } | null>(null);
  const [customStructures, setCustomStructures] = useState<DocumentStructure[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [cats, structs] = await Promise.all([
          LettersService.getCategories(),
          LettersService.getStructures()
        ]);
        setCategories(cats);
        setCustomStructures(structs);

        if (templateId) {
          const tpl = await LettersService.getTemplateById(templateId);
          setTemplateName(tpl.templateName);
          setCategoryId(tpl.categoryId || '');
          setDescription(tpl.description || '');

          let rawContent = tpl.editorContent;
          const configRegex = /<script\s+id="zith-page-config"\s+type="application\/json">([\s\S]*?)<\/script>/i;
          const match = configRegex.exec(rawContent);
          if (match && match[1]) {
            try {
              setPageConfig(JSON.parse(match[1]));
            } catch (e) { }
            rawContent = rawContent.replace(configRegex, '');
          }
          setEditorContent(rawContent);
          setCurrentVersion(tpl.currentVersion);
          if (tpl.versions) {
            setVersions(tpl.versions);
          }
          if (tpl.placeholders) {
            const custom = tpl.placeholders
              .filter((p) => !DEFAULT_PLACEHOLDERS.some((d) => d.key === p.placeholderKey))
              .map((p) => ({ key: p.placeholderKey, label: p.placeholderLabel, dataType: p.dataType }));
            setCustomPlaceholders(custom);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to initialize builder');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [templateId]);

  const handleInsertPlaceholder = (key: string, label: string) => {
    if (!editorRef.current) {
      toast.error('Editor is not ready yet');
      return;
    }
    if (key === 'salary_ctc') {
      setPendingPlaceholder({ key, label });
      setIsSalaryModalOpen(true);
      return;
    }
    const chipHtml = `<span data-placeholder-key="${key}" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{${label}}}</span> `;
    editorRef.current.chain().focus().insertContent(chipHtml).run();
    toast.success(`Inserted {{${label}}}`);
  };

  const handleSalaryModalConfirm = () => {
    if (!editorRef.current || !pendingPlaceholder) return;

    const { key, label } = pendingPlaceholder;
    const chipHtml = `<span data-placeholder-key="${key}" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block;">{{${label}}}</span> `;

    let insertHtml = chipHtml;
    if (salaryTableFormat === 'detailed') {
      insertHtml += '<br/>' + getSalaryStructureTableHtml() + '<p></p>';
    } else if (salaryTableFormat === 'simplified') {
      insertHtml += '<br/>' + getSimplifiedSalaryStructureTableHtml() + '<p></p>';
    } else if (salaryTableFormat === 'none') {
      insertHtml += ' '; // just space
    } else {
      const customStructure = customStructures.find(s => s.id === salaryTableFormat);
      if (customStructure) {
        insertHtml += '<br/>' + customStructure.htmlContent + '<p></p>';
      } else {
        insertHtml += ' ';
      }
    }

    editorRef.current.chain().focus().insertContent(insertHtml).run();
    toast.success(`Inserted {{${label}}}`);

    setIsSalaryModalOpen(false);
    setPendingPlaceholder(null);
  };

  const handleAddCustomPlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const formattedKey = (newKey.trim() || newLabel.trim()).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if ([...DEFAULT_PLACEHOLDERS, ...customPlaceholders].some((p) => p.key === formattedKey)) {
      toast.error('A placeholder with this key already exists');
      return;
    }
    setCustomPlaceholders([...customPlaceholders, { key: formattedKey, label: newLabel.trim(), dataType: 'string' }]);
    setNewKey('');
    setNewLabel('');
    toast.success('Custom placeholder added');
  };

  const handleInsertHeaderLayout = (type: 'left-details' | 'left-logo' | 'top-logo') => {
    let html = '';
    const logoPlaceholder = '<button data-type="logo-upload"></button>';
    const ph = (k: string, l: string) => `<span data-placeholder-key="${k}" style="background: #e0f2fe; color: #0369a1; padding: 0px 4px; border-radius: 4px; font-weight: 500; border: 1px solid #7dd3fc; display: inline-block; line-height: 1.2;">{{${l}}}</span>`;

    const companyDetails = `<p style="margin: 0 0 2px 0; font-weight: bold; line-height: 1.2;"><span style="font-size: 14px;">${ph('company_name', 'Company Name')}</span></p><p style="margin: 0 0 2px 0; line-height: 1.2;"><span style="font-size: 10px;">${ph('company_address', 'Company Address')}</span></p><p style="margin: 0; line-height: 1.2;"><span style="font-size: 10px;">${ph('company_mail', 'Company Mail')} | ${ph('company_phone', 'Company Phone')}</span></p>`;

    const companyDetailsRight = `<p style="margin: 0 0 2px 0; font-weight: bold; text-align: right; line-height: 1.2;"><span style="font-size: 14px;">${ph('company_name', 'Company Name')}</span></p><p style="margin: 0 0 2px 0; text-align: right; line-height: 1.2;"><span style="font-size: 10px;">${ph('company_address', 'Company Address')}</span></p><p style="margin: 0; text-align: right; line-height: 1.2;"><span style="font-size: 10px;">${ph('company_mail', 'Company Mail')} | ${ph('company_phone', 'Company Phone')}</span></p>`;

    const companyDetailsCenter = `<p style="margin: 0 0 2px 0; font-weight: bold; text-align: center; line-height: 1.2;"><span style="font-size: 14px;">${ph('company_name', 'Company Name')}</span></p><p style="margin: 0; text-align: center; line-height: 1.2;"><span style="font-size: 10px;">${ph('company_address', 'Company Address')} | ${ph('company_mail', 'Company Mail')} | ${ph('company_phone', 'Company Phone')}</span></p>`;

    if (type === 'left-details') {
      html = `<table style="width: 100%; border: none; margin-bottom: 0px;"><tr><td style="border: none; text-align: left; vertical-align: middle; width: 70%;">${companyDetails}</td><td style="border: none; text-align: right; vertical-align: middle; width: 30%;"><p style="margin: 0; text-align: right;">${logoPlaceholder}</p></td></tr></table>`;
    } else if (type === 'left-logo') {
      html = `<table style="width: 100%; border: none; margin-bottom: 0px;"><tr><td style="border: none; text-align: left; vertical-align: middle; width: 30%;"><p style="margin: 0;">${logoPlaceholder}</p></td><td style="border: none; text-align: right; vertical-align: middle; width: 70%;">${companyDetailsRight}</td></tr></table>`;
    } else if (type === 'top-logo') {
      html = `<div style="text-align: center; margin-bottom: 0px;"><p style="margin: 0 0 6px 0; text-align: center;">${logoPlaceholder}</p>${companyDetailsCenter}</div>`;
    }

    if (pageConfig.headerHtml && pageConfig.headerHtml.trim() !== '' && pageConfig.headerHtml.trim() !== '<p></p>') {
      setPendingHeaderHtml(html);
      setIsHeaderReplaceModalOpen(true);
      return;
    }
    setPageConfig({ ...pageConfig, headerHtml: html });
    toast.success('Header layout applied');
  };

  const handleSaveClick = () => {
    setNameError(null);
    setSaveError(null);
    if (!templateName.trim()) {
      setNameError('Please enter a template name');
      toast.error('Please enter a template name');
      return;
    }
    if (!editorContent.trim()) {
      setSaveError('Template content cannot be empty');
      toast.error('Template content cannot be empty');
      return;
    }

    if (templateId) {
      // Prompt for change notes when updating an existing template
      setIsVersionModalOpen(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    try {
      setSaving(true);
      setNameError(null);
      setSaveError(null);
      const allPlaceholders = [...DEFAULT_PLACEHOLDERS, ...customPlaceholders].map((p, idx) => ({
        placeholderKey: p.key,
        placeholderLabel: p.label,
        dataType: p.dataType,
        required: true,
        displayOrder: idx,
      }));

      if (templateId) {
        const configScript = `\n<script id="zith-page-config" type="application/json">${JSON.stringify(pageConfig)}</script>`;
        const finalContent = editorContent + configScript;

        const updated = await LettersService.updateTemplate(templateId, {
          templateName,
          categoryId: categoryId || null,
          description,
          editorContent: finalContent,
          changeNotes: changeNotes.trim() || `Updated to version ${currentVersion + 1}`,
          placeholders: allPlaceholders,
          isGlobal,
        });
        toast.success(`Template updated to v${updated.currentVersion}!`);
        setCurrentVersion(updated.currentVersion);
        if (updated.versions) {
          setVersions(updated.versions);
        }
        setIsVersionModalOpen(false);
        setChangeNotes('');
      } else {
        const configScript = `\n<script id="zith-page-config" type="application/json">${JSON.stringify(pageConfig)}</script>`;
        const finalContent = editorContent + configScript;

        const created = await LettersService.createTemplate({
          templateName,
          categoryId: categoryId || undefined,
          description,
          editorContent: finalContent,
          placeholders: allPlaceholders,
          isGlobal,
        });
        toast.success('Template created successfully!');
        router.push(`/letters-docs/templates/builder?id=${created.id}`);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save template';
      toast.error(errMsg);
      setSaveError(errMsg);
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('name') || errMsg.toLowerCase().includes('title')) {
        setNameError(errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (vNum: number) => {
    if (!templateId) return;
    try {
      toast.loading(`Restoring version v${vNum}...`, { id: 'res' });
      const restored = await LettersService.restoreVersion(templateId, vNum);
      toast.success(`Restored to version v${vNum} content`, { id: 'res' });
      setEditorContent(restored.editorContent);
      setCurrentVersion(restored.currentVersion);
      if (restored.versions) {
        setVersions(restored.versions);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore version', { id: 'res' });
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading Template Builder...</div>;
  }

  return (
    <div className="template-builder-container" style={{ padding: '12px 16px 24px' }}>
      {/* Top Navigation Bar */}
      <div
        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 16px',
          borderRadius: '12px',
          borderWidth: '1px',
          borderStyle: 'solid',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Link
            href="/letters-docs/templates"
            className="text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              padding: '4px 10px',
              borderRadius: '8px',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                if (nameError) setNameError(null);
                if (saveError) setSaveError(null);
              }}
              placeholder="Enter Template Title..."
              className={`text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${nameError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-transparent'}`}
              style={{
                width: '100%',
                fontSize: '18px',
                fontWeight: 700,
                color: nameError ? '#dc2626' : undefined,
                border: 'none',
                outline: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                borderBottom: nameError ? '2px solid #dc2626' : '2px solid transparent',
              }}
              onFocus={(e) => (e.target.style.borderBottom = nameError ? '2px solid #dc2626' : '2px solid #3b82f6')}
              onBlur={(e) => (e.target.style.borderBottom = nameError ? '2px solid #dc2626' : '2px solid transparent')}
            />
            {nameError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50" style={{ position: 'absolute', top: '100%', left: '4px', fontSize: '12px', fontWeight: 600, marginTop: '4px', padding: '4px 10px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                {nameError}
              </div>
            )}
          </div>
          {/* {(user?.role?.toUpperCase() === 'SUPER_ADMIN' || user?.role?.toLowerCase() === 'super_admin') && ( */}
          {user?.tenantId === 'b85c1b5b-77a3-4281-9147-51d6bd3ee94d' && (
            <label className="text-slate-700 dark:text-slate-300" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={(e) => setIsGlobal(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Set as Global Template
            </label>
          )}

          <Button
            type="default"
            icon={<Eye size={16} />}
            onClick={() => setIsPreviewDrawerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', height: '30px' }}
          >
            Preview
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SearchableDropdown
            value={categoryId || ''}
            onChange={(newCatId) => {
              setCategoryId(newCatId);
              if (!templateId) {
                const catObj = categories.find((c) => c.id === newCatId);
                const newContent = getDefaultContentForCategory(catObj?.categoryName);
                setEditorContent(newContent);
                editorRef.current?.commands.setContent(newContent);
              }
            }}
            placeholder="Select Category (Optional)"
            options={categories.map((c) => ({
              value: c.id,
              label: c.categoryName,
              disabled: c.status === 'INACTIVE'
            }))}
            hideAvatar={true}
          />

          {templateId && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              <Layers size={14} />
              v{currentVersion}
            </span>
          )}

          <button
            onClick={handleSaveClick}
            disabled={saving}
            style={{
              padding: '4px 22px',
              borderRadius: '6px',
              background: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : templateId ? 'Save New Version' : 'Create Template'}
          </button>
        </div>
      </div>

      {/* Global Validation Error Banner */}
      {saveError && !isVersionModalOpen && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{saveError}</span>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            style={{ background: 'transparent', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor & Sidebar Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Tiptap Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" style={{ padding: '12px 16px', borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Sparkles size={16} style={{ color: '#f59e0b' }} />
            <span>
              Tip: Use the placeholder drawer on the right to insert dynamic employee fields (like <code>{"{{Employee Name}}"}</code>).
            </span>
          </div>

          <LetterTiptapEditor
            content={editorContent}
            onChange={(html) => setEditorContent(html)}
            onEditorReady={(ed) => {
              editorRef.current = ed;
            }}
            minHeight={580}
          />
        </div>

        {/* Right: Tabbed Drawer */}
        <div className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" style={{ borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Tabs Header */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800" style={{ display: 'flex', borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
            <button
              onClick={() => setActiveTab('placeholders')}
              className={`transition-colors ${activeTab === 'placeholders' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                fontWeight: activeTab === 'placeholders' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: activeTab === 'placeholders' ? '2px solid #3b82f6' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Tag size={16} />
              Placeholders ({DEFAULT_PLACEHOLDERS.length + customPlaceholders.length})
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`transition-colors ${activeTab === 'layout' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                fontWeight: activeTab === 'layout' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: activeTab === 'layout' ? '2px solid #3b82f6' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Layers size={16} />
              Layout
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                fontWeight: activeTab === 'history' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <History size={16} />
              Versions
            </button>
          </div>

          {/* Drawer Tab: Page Layout */}
          {activeTab === 'layout' && (
            <div style={{ padding: '20px 16px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
                Configure repeating borders and headers/footers for all pages of the generated PDF.
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Page Borders
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="text-slate-600 dark:text-slate-300" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Border Width</label>
                    <input
                      type="text"
                      value={pageConfig.borderWidth}
                      onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderWidth: e.target.value }))}
                      placeholder="e.g. 4px or 0"
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-300" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Border Color</label>
                    <input
                      type="color"
                      value={pageConfig.borderColor}
                      onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderColor: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                      style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', cursor: 'pointer' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label className="text-slate-600 dark:text-slate-300" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Top Margin (for tall headers)</label>
                    <input
                      type="text"
                      value={pageConfig.marginTop || '20mm'}
                      onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginTop: e.target.value }))}
                      placeholder="e.g. 40mm"
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-300" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Bottom Margin (for tall footers)</label>
                    <input
                      type="text"
                      value={pageConfig.marginBottom || '20mm'}
                      onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginBottom: e.target.value }))}
                      placeholder="e.g. 40mm"
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Repeating Header & Footer
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Header Content (Repeats on Top)</label>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleInsertHeaderLayout('left-details')}
                      title="Company Details on Left, Logo on Right"
                      style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: '#475569', transition: 'all 0.15s' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    >
                      Details | Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHeaderLayout('left-logo')}
                      title="Logo on Left, Company Details on Right"
                      style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: '#475569', transition: 'all 0.15s' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    >
                      Logo | Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHeaderLayout('top-logo')}
                      title="Logo on Top, Company Details below"
                      style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: '#475569', transition: 'all 0.15s' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    >
                      Logo Top
                    </button>
                  </div>
                  <LetterTiptapEditor
                    content={pageConfig.headerHtml}
                    onChange={(html) => setPageConfig((prev: any) => ({ ...prev, headerHtml: html }))}
                    minHeight={150}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Footer Content (Repeats on Bottom)</label>
                  <LetterTiptapEditor
                    content={pageConfig.footerHtml}
                    onChange={(html) => setPageConfig((prev: any) => ({ ...prev, footerHtml: html }))}
                    minHeight={150}
                  />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                    Tip: Use <code>&lt;span class="pageNumber"&gt;&lt;/span&gt;</code> in HTML for auto page numbering.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drawer Tab 1: Placeholders */}
          {activeTab === 'placeholders' && (
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Click any placeholder to insert it directly at your cursor position in the editor.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Standard HR Placeholders
                </div>
                {DEFAULT_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleInsertPlaceholder(p.key, p.label)}
                    className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800/50 hover:bg-sky-100 dark:hover:bg-sky-800/50 transition-colors"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseOver={(e) => { }}
                    onMouseOut={(e) => { }}
                  >
                    <span>{p.label}</span>
                    <span style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace' }}>{"{{" + p.key + "}}"}</span>
                  </button>
                ))}
              </div>

              {customPlaceholders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Custom Placeholders
                  </div>
                  {customPlaceholders.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.key, p.label)}
                      className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{p.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace' }}>{"{{" + p.key + "}}"}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add Custom Placeholder Form */}
              <form onSubmit={handleAddCustomPlaceholder} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" style={{ padding: '14px', borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="text-slate-700 dark:text-slate-300" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Add Custom Field
                </div>
                <input
                  type="text"
                  placeholder="Label (e.g. Bonus Amount)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', fontSize: '13px', marginBottom: '6px' }}
                />
                <input
                  type="text"
                  placeholder="Key (optional, e.g. bonus_amount)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', borderWidth: '1px', borderStyle: 'solid', fontSize: '12px', fontFamily: 'monospace', marginBottom: '10px' }}
                />
                <button
                  type="submit"
                  disabled={!newLabel.trim()}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    background: '#334155',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    border: 'none',
                    cursor: !newLabel.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Add Field
                </button>
              </form>
            </div>
          )}

          {/* Drawer Tab 2: Version History */}
          {activeTab === 'history' && (
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                  No historical versions yet. Save updates to build version history.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={ver.versionNumber === currentVersion ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className={ver.versionNumber === currentVersion ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'} style={{ fontWeight: 700, fontSize: '14px' }}>
                          Version {ver.versionNumber}
                        </span>
                        {ver.versionNumber === currentVersion && (
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>
                            Current
                          </span>
                        )}
                      </div>

                      {ver.changeNotes && <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>{ver.changeNotes}</div>}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '6px' }}>
                        <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                        {ver.versionNumber !== currentVersion && (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver.versionNumber)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#2563eb',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RotateCcw size={12} />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Version Change Notes Modal */}
      {isVersionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Save New Version (v{currentVersion + 1})</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
              Enter change notes summarizing what was modified in this version.
            </p>
            {saveError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span>{saveError}</span>
              </div>
            )}
            <textarea
              rows={3}
              placeholder={`e.g. Updated salary clause and added confidentiality terms...`}
              value={changeNotes}
              onChange={(e) => {
                setChangeNotes(e.target.value);
                if (saveError) setSaveError(null);
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        title="Replace Header Content"
        open={isHeaderReplaceModalOpen}
        onOk={() => {
          setPageConfig((prev: any) => ({ ...prev, headerHtml: pendingHeaderHtml }));
          toast.success('Header layout applied');
          setIsHeaderReplaceModalOpen(false);
        }}
        onCancel={() => setIsHeaderReplaceModalOpen(false)}
        okText="Continue"
        cancelText="Cancel"
      >
        <p>This will replace your current header content. Continue?</p>
      </Modal>

      {/* Salary Format Modal */}
      <Modal
        title="Select Salary Table Format"
        open={isSalaryModalOpen}
        onOk={handleSalaryModalConfirm}
        onCancel={() => setIsSalaryModalOpen(false)}
        okText="Insert"
        cancelText="Cancel"
        destroyOnClose
        width={750}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: '16px', color: '#475569' }}>
            Choose how you want the salary structure table to appear below the Annual Salary placeholder:
          </p>
          <Radio.Group
            onChange={(e) => setSalaryTableFormat(e.target.value)}
            value={salaryTableFormat}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <Radio value="detailed">
              <strong>Detailed Salary Structure</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Shows calculation type, percentage, monthly and annual amounts.
              </div>
            </Radio>
            <Radio value="simplified">
              <strong>Simplified Salary Structure</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Shows monthly and annual amounts with highlighted Gross/Net Pay.
              </div>
            </Radio>
            <Radio value="none">
              <strong>No table</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Only insert the placeholder without any table.
              </div>
            </Radio>
            {customStructures.map(cs => (
              <Radio value={cs.id} key={cs.id}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <strong>{cs.name} (Custom)</strong>
                  {cs.tenantId === 'GLOBAL' && (
                    <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 600 }}>GLOBAL</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Custom table structure created in Settings.
                </div>
              </Radio>
            ))}
          </Radio.Group>

          {salaryTableFormat !== 'none' && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Preview
              </div>
              <div className="letter-tiptap-content" style={{ background: 'transparent' }}>
                <div
                  className="ProseMirror"
                  style={{ minHeight: 'auto', outline: 'none' }}
                  dangerouslySetInnerHTML={{
                    __html: salaryTableFormat === 'detailed'
                      ? getSalaryStructureTableHtml()
                      : salaryTableFormat === 'simplified'
                        ? getSimplifiedSalaryStructureTableHtml()
                        : (customStructures.find(s => s.id === salaryTableFormat)?.htmlContent || '')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Drawer
        title="Document Preview"
        placement="right"
        width={900}
        onClose={() => setIsPreviewDrawerOpen(false)}
        open={isPreviewDrawerOpen}
        bodyStyle={{ background: '#e2e8f0', padding: '32px 24px', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
          {editorContent.split(/<div[^>]*class="[^"]*html2pdf__page-break[^"]*"[^>]*><\/div>/gi).map((pageContent, index, arr) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {/* A4 Page Sheet — exact 210mm × 297mm */}
              <div className="preview-paper-content force-light-theme" style={{
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                paddingTop: pageConfig.marginTop || '20mm',
                paddingRight: pageConfig.marginRight || '20mm',
                paddingBottom: pageConfig.marginBottom || '20mm',
                paddingLeft: pageConfig.marginLeft || '20mm',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderWidth: pageConfig.borderWidth || '0px',
                borderStyle: pageConfig.borderStyle || 'solid',
                borderColor: pageConfig.borderColor || '#000000',
                flexShrink: 0,
              }}>
                {/* Header */}
                {pageConfig.headerHtml && (
                  <div
                    className="preview-header-zone"
                    style={{ width: '100%', marginBottom: '2px' }}
                    dangerouslySetInnerHTML={{ __html: pageConfig.headerHtml }}
                  />
                )}

                {/* Body Content */}
                <div className="letter-tiptap-content" style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    className="ProseMirror"
                    style={{ outline: 'none', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                  />
                </div>

                {/* Footer */}
                {pageConfig.footerHtml && (
                  <div
                    className="preview-header-zone"
                    style={{ width: '100%', marginTop: '2px' }}
                    dangerouslySetInnerHTML={{ __html: pageConfig.footerHtml.replace(/\[Page #\]/g, (index + 1).toString()) }}
                  />
                )}
              </div>
              {/* Page number label */}
              {arr.length > 1 && (
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Page {index + 1} of {arr.length}
                </span>
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
