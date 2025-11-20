const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pdfMergeService = require('./pdfMergeService');
const letterheadService = require('./letterheadService');

// Professional Offer Letter Templates
const getOfferLetterTemplate = (templateType = 'professional') => {
  const templates = {
    professional: {
      name: 'Professional Corporate',
      description: 'Clean, modern design suitable for corporate environments',
      generateHTML: (data) => generateProfessionalTemplate(data)
    },
    executive: {
      name: 'Executive Level',
      description: 'Premium design for senior positions',
      generateHTML: (data) => generateExecutiveTemplate(data)
    },
    startup: {
      name: 'Modern Startup',
      description: 'Contemporary design for tech companies',
      generateHTML: (data) => generateStartupTemplate(data)
    },
    formal: {
      name: 'Formal Traditional',
      description: 'Traditional formal letter format',
      generateHTML: (data) => generateFormalTemplate(data)
    }
  };
  
  return templates[templateType] || templates.professional;
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

// Helper function to calculate CTC breakdown
const calculateCTCBreakdown = (data) => {
  const grossCTC = parseFloat(data.salary) || 0;
  
  // If detailed components are provided, use them; otherwise calculate defaults
  const basic = data.basic ? parseFloat(data.basic) : Math.round(grossCTC * 0.40);
  const hra = data.hra ? parseFloat(data.hra) : Math.round(grossCTC * 0.20);
  const allowance = data.allowance ? parseFloat(data.allowance) : Math.round(grossCTC * 0.30);
  const employerPf = data.employerPf ? parseFloat(data.employerPf) : Math.round(basic * 0.12);
  
  return {
    basic,
    hra,
    allowance,
    employerPf,
    gross: grossCTC,
    basicMonthly: Math.round(basic / 12),
    hraMonthly: Math.round(hra / 12),
    allowanceMonthly: Math.round(allowance / 12),
    employerPfMonthly: Math.round(employerPf / 12),
    grossMonthly: Math.round(grossCTC / 12)
  };
};
    
// Professional Template
const generateProfessionalTemplate = (data) => {
  // Fix typos and encoding issues - ensure clean text
  const companyName = (data.companyName || 'Cognibotz').trim();
  const candidateName = (data.candidateName || 'Candidate Name').trim();
  
  // Calculate CTC breakdown
  const ctc = calculateCTCBreakdown(data);
  
  // Calculate offer validity date (default 7 days from issue date)
  const issueDate = data.offerDate ? new Date(data.offerDate) : new Date();
  const defaultValidUntil = new Date(issueDate);
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 7);
  const validUntilDate = data.offerValidUntil ? new Date(data.offerValidUntil) : defaultValidUntil;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offer Letter - ${candidateName}</title>
  <style>
    @page { 
      size: A4; 
      margin: 0; 
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #111;
      background: #fff;
    }
    
    .page {
      width: 100%;
      padding: 180px 40px 120px 40px; /* space for letterhead header + footer */
      box-sizing: border-box;
    }
    
    .page-content {
      width: 100%;
    }
    
    .date {
      text-align: right;
      margin-bottom: 30px;
    }
    
    .candidate-address {
      margin-bottom: 40px;
    }
    
    .subject-line {
      text-align: center;
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
    }
    
    .salutation {
      margin-bottom: 20px;
    }
    
    .paragraph {
      margin: 0 0 12px 0;
      text-align: justify;
    }
    
    h2 {
      font-size: 13pt;
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    
    .section {
      margin: 25px 0;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 15px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
      font-size: 14pt;
    }
    
    .kv {
      display: flex;
      gap: 16px;
      margin-bottom: 10px;
    }
    
    .kv .label {
      width: 35%;
      font-weight: 600;
    }
    
    .kv .value {
      width: 65%;
    }
    
    .ctc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 16px 0;
    }
    
    .ctc-table th,
    .ctc-table td {
      padding: 8px;
      border: 1px solid #e6e6e6;
      text-align: left;
      font-size: 11.5pt;
    }
    
    .ctc-table th {
      background: #fafafa;
      font-weight: bold;
    }
    
    .terms-list {
      margin: 20px 0;
      padding-left: 20px;
    }
    
    .terms-list li {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    
    .signature {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    
    .signature-box {
      width: 45%;
    }
    
    .signature .hr {
      margin-bottom: 48px;
    }
    
    .signature-line {
      margin-top: 80px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }
    
    .footer {
      font-size: 10pt;
      color: #666;
      margin-top: 20px;
      font-style: italic;
      text-align: center;
    }
    
    @media print {
      .page {
        box-shadow: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <div class="date">
        <p>Date: ${issueDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div class="candidate-address">
        <p><strong>${candidateName}</strong></p>
        ${data.candidateAddress ? `<p>${data.candidateAddress}</p>` : ''}
        <p>${data.candidateEmail || 'candidate@example.com'}</p>
      </div>

      <div class="subject-line">
        <p>Subject: OFFER OF EMPLOYMENT</p>
      </div>

      <div class="salutation">
        <p>Dear ${candidateName},</p>
      </div>

      <div class="paragraph">
        <p>We are pleased to offer you the position of <strong>${data.position || 'Position Title'}</strong> with ${companyName}. Your employment will commence on <strong>${data.startDate ? new Date(data.startDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : 'the start date'}</strong> and will be subject to the terms and conditions set out below. After careful consideration of your qualifications and interview performance, we are confident you will make a valuable contribution to our team.</p>
      </div>

      <div class="section">
        <div class="section-title">Position Details</div>
        <div class="kv">
          <div class="label">Position Title:</div>
          <div class="value">${data.position || 'Position Title'}</div>
        </div>
        <div class="kv">
          <div class="label">Department:</div>
          <div class="value">${data.department || 'To be assigned'}</div>
        </div>
        <div class="kv">
          <div class="label">Start Date:</div>
          <div class="value">${data.startDate ? new Date(data.startDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'To be determined'}</div>
        </div>
        <div class="kv">
          <div class="label">Employment Type:</div>
          <div class="value">${data.employmentType || 'Full-time'}</div>
        </div>
        <div class="kv">
          <div class="label">Reporting Manager:</div>
          <div class="value">${data.reportingManager || 'To be assigned'}</div>
        </div>
        <div class="kv">
          <div class="label">Work Location:</div>
          <div class="value">${data.workLocation || 'Office'}</div>
        </div>
        <div class="kv">
          <div class="label">Working Hours:</div>
          <div class="value">${data.workingHours || '9:00 AM to 6:00 PM, Monday to Friday'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Compensation</div>
        <div class="paragraph">
          <p>Your total annual cost-to-company (CTC) is <strong>₹${formatCurrency(ctc.gross)}</strong> per annum, payable in monthly installments as per company payroll policies. The detailed breakdown is as follows:</p>
        </div>
        
        <table class="ctc-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Monthly (₹)</th>
              <th>Annual (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>${formatCurrency(ctc.basicMonthly)}</td>
              <td>${formatCurrency(ctc.basic)}</td>
            </tr>
            <tr>
              <td>HRA (House Rent Allowance)</td>
              <td>${formatCurrency(ctc.hraMonthly)}</td>
              <td>${formatCurrency(ctc.hra)}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>${formatCurrency(ctc.allowanceMonthly)}</td>
              <td>${formatCurrency(ctc.allowance)}</td>
            </tr>
            <tr>
              <td>Employer PF Contribution</td>
              <td>${formatCurrency(ctc.employerPfMonthly)}</td>
              <td>${formatCurrency(ctc.employerPf)}</td>
            </tr>
            <tr>
              <td><strong>Gross CTC</strong></td>
              <td><strong>${formatCurrency(ctc.grossMonthly)}</strong></td>
              <td><strong>${formatCurrency(ctc.gross)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        ${data.benefits ? `
        <div class="paragraph">
          <p><strong>Benefits & Perquisites:</strong></p>
          <ul class="terms-list">
            ${data.benefits.split('\n').filter(b => b.trim()).map(benefit => `<li>${benefit.trim()}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Statutory Benefits</div>
        <div class="paragraph">
          <p>Your compensation package includes the following statutory benefits as per applicable Indian labor laws:</p>
          <ul class="terms-list">
            <li><strong>Provident Fund (PF)</strong> - As per EPF Act, 1952</li>
            <li><strong>Employee State Insurance (ESI)</strong> - If applicable based on salary criteria</li>
            <li><strong>Gratuity</strong> - As per Payment of Gratuity Act, 1972</li>
            <li><strong>Medical Insurance</strong> - Group health insurance coverage as per company policy</li>
            <li><strong>Leave Policy</strong> - Casual Leave, Sick Leave, and Privilege Leave as per company policy</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Terms and Conditions</div>
        <ol class="terms-list">
          <li><strong>Background Verification:</strong> This offer is contingent upon successful completion of background verification, reference checks, and document verification.</li>
          <li><strong>Probation Period:</strong> You will be subject to a probationary period of ${data.probationPeriod || '3 months'} from your start date. During this period, your performance will be evaluated against predetermined criteria.</li>
          <li><strong>Confirmation:</strong> Upon successful completion of the probation period, you will be confirmed in the position based on satisfactory performance evaluation.</li>
          <li><strong>Company Policies:</strong> Your employment will be governed by the company's policies, procedures, and employee handbook, which will be provided to you upon joining.</li>
          <li><strong>Confidentiality:</strong> You agree to maintain strict confidentiality of all proprietary, confidential, and sensitive information pertaining to the company, its clients, and business operations.</li>
          <li><strong>Notice Period:</strong> The notice period for resignation is ${data.noticePeriod || '30 days'} or payment in lieu thereof as per company policy.</li>
          <li><strong>Termination:</strong> The company reserves the right to terminate your employment for cause as per company policies, applicable labor laws, and without notice in cases of gross misconduct.</li>
          <li><strong>Offer Validity:</strong> This offer is valid until <strong>${validUntilDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</strong>. If we do not receive your acceptance by this date, this offer will lapse.</li>
        </ol>
      </div>

      <div class="section">
        <div class="section-title">Joining Formalities</div>
        <div class="paragraph">
          <p><strong>On your first day of employment, please complete the following formalities:</strong></p>
        </div>
        
        <div class="paragraph">
          <p><strong>Reporting Details:</strong></p>
          <ul class="terms-list">
            <li>Reporting Time: 10:00 AM</li>
            <li>Reporting Location: ${data.workLocation || data.companyAddress || 'Office Address'}</li>
            <li>Contact Person on Day 1: ${data.reportingManager || data.hrName || 'HR Manager'}</li>
            <li>Contact Details: ${data.hrContact || data.hrEmail || 'HR Email/Phone'}</li>
          </ul>
        </div>
        
        <div class="paragraph">
          <p><strong>Required documents to bring on day 1 (Originals + one set of photocopies):</strong></p>
          <ul class="terms-list">
            <li>Educational certificates (10th, 12th, Graduation, Post-Graduation, etc.)</li>
            <li>Identity proof (Aadhaar Card / PAN Card / Passport)</li>
            <li>Address proof (Aadhaar Card / Voter ID / Utility Bill)</li>
            <li>Previous employment experience letters and relieving letters (if any)</li>
            <li>Passport size photographs (4 copies)</li>
            <li>Bank account details (Cancelled cheque with your name printed)</li>
            <li>Emergency contact information (filled form will be provided)</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Acceptance Instructions</div>
        <div class="paragraph">
          <p>This offer is valid until <strong>${validUntilDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</strong>. To accept this offer, please sign below and email a scanned copy to <strong>${data.hrEmail || data.hrContact || 'hr@company.com'}</strong> or reply to this offer with the subject line "Offer Acceptance – ${candidateName}". If we do not receive your acceptance by ${validUntilDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}, this offer will lapse.</p>
        </div>
      </div>

      <div class="paragraph">
        <p>We are excited about the prospect of you joining our team and contributing to our continued success. If you have any questions regarding this offer, please don't hesitate to contact ${data.hrName || 'HR Manager'} at ${data.hrEmail || data.hrContact || 'HR Email/Phone'}.</p>
      </div>

      <div class="paragraph">
        <p>We look forward to welcoming you to ${companyName}!</p>
      </div>

      <div class="signature">
        <div class="signature-section">
          <div class="signature-box">
            <p>Sincerely,</p>
            <div class="signature-line">
              <p><strong>${data.hrName || 'HR Manager'}</strong></p>
              <p>${data.hrTitle || 'Human Resources'}</p>
              <p>${companyName}</p>
              ${data.companyAddress ? `<p>${data.companyAddress}</p>` : ''}
              ${data.hrEmail ? `<p>Email: ${data.hrEmail}</p>` : ''}
              ${data.hrPhone ? `<p>Phone: ${data.hrPhone}</p>` : ''}
            </div>
          </div>
          
          <div class="signature-box">
            <p>Accepted by:</p>
            <div class="signature-line">
              <p><strong>${candidateName}</strong></p>
              <p>Signature: ___________________</p>
              <p>Date: _______________________</p>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is a confidential document intended solely for ${candidateName}.</p>
        <p>Please refer to the Employee Handbook for detailed company policies and procedures.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Generate salary breakdown table
const generateSalaryBreakdown = (breakdown) => {
  if (!breakdown || !breakdown.earnings || !breakdown.deductions) return '';
  
  const earnings = breakdown.earnings || [];
  const deductions = breakdown.deductions || [];
  
  let earningsRows = earnings.map(item => 
    `<tr><td>${item.name}</td><td>₹${item.amount.toLocaleString('en-IN')}</td></tr>`
  ).join('');
  
  let deductionsRows = deductions.map(item => 
    `<tr><td>${item.name}</td><td>₹${item.amount.toLocaleString('en-IN')}</td></tr>`
  ).join('');
  
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const netSalary = totalEarnings - totalDeductions;
  
  return `
    <div class="salary-breakdown">
      <h3>Monthly Salary Breakdown</h3>
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <table class="salary-table">
            <thead>
              <tr><th>Earnings</th><th>Amount (₹)</th></tr>
            </thead>
            <tbody>
              ${earningsRows}
              <tr class="total-row">
                <td><strong>Total Earnings</strong></td>
                <td><strong>₹${totalEarnings.toLocaleString('en-IN')}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="flex: 1;">
          <table class="salary-table">
            <thead>
              <tr><th>Deductions</th><th>Amount (₹)</th></tr>
            </thead>
            <tbody>
              ${deductionsRows}
              <tr class="total-row">
                <td><strong>Total Deductions</strong></td>
                <td><strong>₹${totalDeductions.toLocaleString('en-IN')}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="margin-top: 15px; text-align: center; font-size: 16px; font-weight: 600; color: #059669;">
        <p>Net Monthly Salary: ₹${netSalary.toLocaleString('en-IN')}</p>
        <p>Annual Take Home: ₹${(netSalary * 12).toLocaleString('en-IN')}</p>
      </div>
    </div>
  `;
};

// Executive Template (more premium design)
const generateExecutiveTemplate = (data) => {
  // Similar structure but with more premium styling
  return generateProfessionalTemplate(data).replace(
    'color: #2563eb',
    'color: #7c3aed'
  ).replace(
    'border-bottom: 3px solid #2563eb',
    'border-bottom: 3px solid #7c3aed'
  );
};

// Startup Template (modern, colorful)
const generateStartupTemplate = (data) => {
  return generateProfessionalTemplate(data).replace(
    'color: #2563eb',
    'color: #10b981'
  ).replace(
    'border-bottom: 3px solid #2563eb',
    'border-bottom: 3px solid #10b981'
  );
};

// Formal Template (traditional)
const generateFormalTemplate = (data) => {
  return generateProfessionalTemplate(data).replace(
    'color: #2563eb',
    'color: #374151'
  ).replace(
    'border-bottom: 3px solid #2563eb',
    'border-bottom: 2px solid #374151'
  );
};

// Generate PDF from HTML
const generatePDFFromHTML = async (htmlContent) => {
  const htmlToPdf = require('html-pdf');
  
  try {
    const pdfBuffer = await new Promise((resolve, reject) => {
      htmlToPdf.create(htmlContent, { 
        format: 'A4', 
        border: '10mm',
        type: 'pdf',
        timeout: 30000
      }).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Generate PDF from HTML with letterhead merging
const generatePDFFromHTMLWithLetterhead = async (htmlContent, companyId) => {
  try {
    console.log('📝 [OFFER SERVICE] Starting PDF generation with letterhead merging for company:', companyId);
    
    // Generate the content PDF first
    const startTime = Date.now();
    const contentPdfBuffer = await generatePDFFromHTML(htmlContent);
    const contentGenerationTime = Date.now() - startTime;
    
    console.log('📝 [OFFER SERVICE] Content PDF generated:', { 
      size: contentPdfBuffer.length, 
      generationTime: contentGenerationTime + 'ms' 
    });
    
    // Check if company has an active letterhead
    const letterhead = await letterheadService.getActiveLetterhead(companyId);
    
    console.log('🔍 [OFFER SERVICE] Letterhead check result:', { 
      letterheadFound: !!letterhead,
      letterheadId: letterhead?._id,
      companyId
    });
    
    if (letterhead) {
      console.log('📝 [OFFER SERVICE] Merging with letterhead:', { 
        letterheadId: letterhead._id, 
        s3Key: letterhead.s3Key 
      });
      
      // Merge with letterhead
      const mergeStartTime = Date.now();
      const mergedPdfBuffer = await pdfMergeService.mergeWithLetterhead(
        contentPdfBuffer, 
        letterhead.s3Key
      );
      const mergeTime = Date.now() - mergeStartTime;
      
      console.log('✅ [OFFER SERVICE] PDF merge completed successfully:', { 
        finalSize: mergedPdfBuffer.length, 
        mergeTime: mergeTime + 'ms',
        totalTime: (contentGenerationTime + mergeTime) + 'ms'
      });
      
      return mergedPdfBuffer;
    }
    
    // Return content-only PDF if no letterhead
    console.log('📝 [OFFER SERVICE] No letterhead found, returning content-only PDF');
    return contentPdfBuffer;
    
  } catch (error) {
    console.error('❌ [OFFER SERVICE] Error generating PDF with letterhead:', error);
    throw error;
  }
};

// Get available templates
const getAvailableTemplates = () => {
  return [
    { id: 'professional', name: 'Professional Corporate', description: 'Clean, modern design suitable for corporate environments' },
    { id: 'executive', name: 'Executive Level', description: 'Premium design for senior positions' },
    { id: 'startup', name: 'Modern Startup', description: 'Contemporary design for tech companies' },
    { id: 'formal', name: 'Formal Traditional', description: 'Traditional formal letter format' }
  ];
};

module.exports = {
  getOfferLetterTemplate,
  generatePDFFromHTML,
  generatePDFFromHTMLWithLetterhead,
  getAvailableTemplates,
  generateProfessionalTemplate,
  generateExecutiveTemplate,
  generateStartupTemplate,
  generateFormalTemplate
};
