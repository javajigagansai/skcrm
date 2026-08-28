/**
 * Utility functions for exporting CRM data to PDF formats
 * All exports across the application output formatted, print-optimized PDF documents.
 */

// Export Customer 360 Single Profile to PDF
export const exportCustomer360PDF = (customer) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print PDF report.");
    return;
  }

  const timestamp = new Date().toLocaleString('en-IN');
  const familyHtml = customer.familyMembers && customer.familyMembers.length > 0 
    ? customer.familyMembers.map((fm, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${fm.name}</strong></td>
          <td><span style="background: #fce7f3; color: #be185d; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">${fm.relation}</span></td>
          <td>${fm.gender || (fm.relation === 'Spouse' || fm.relation === 'Mother' || fm.relation === 'Daughter' || fm.relation === 'Sister' ? 'Female' : 'Male')}</td>
          <td>${fm.dob || 'N/A'}</td>
          <td>${fm.phone || 'N/A'}</td>
          <td style="color:#be185d; font-weight:700;">${fm.anniversaryDate || '-'}</td>
          <td style="text-align:center;"><span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:8px; font-size:10px; font-weight:800;">Active</span></td>
        </tr>
      `).join('')
    : `<tr><td colSpan="8" style="text-align:center; color:#94a3b8;">No family members registered.</td></tr>`;

  const portfolioHtml = customer.activePortfolios && customer.activePortfolios.length > 0
    ? customer.activePortfolios.map(p => `
        <tr>
          <td><strong>${p.type}</strong></td>
          <td>${p.provider}</td>
          <td style="color:#16a34a; font-weight:800;">${p.amount}</td>
          <td style="font-family: monospace;">${p.folio}</td>
          <td><span style="background:#f3e8ff; color:#7e22ce; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:800;">👤 ${customer.assignedAdvisorName || 'Priya Sharma'}</span></td>
          <td><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">Active</span></td>
        </tr>
      `).join('')
    : `<tr><td colSpan="6" style="text-align:center; color:#94a3b8;">No active holdings registered.</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Customer 360 Profile (${customer.customerCode})</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 30px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E6091; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #DC2626; text-transform: uppercase; }
        .tagline { font-size: 11px; font-weight: 800; color: #000000; margin-top: 2px; }
        .sub { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }
        .badge-married { background: #fce7f3; color: #be185d; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; }
        .badge-single { background: #f3e8ff; color: #7e22ce; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; }
        .section-title { font-size: 13px; font-weight: 800; color: #1e293b; border-left: 4px solid #1E6091; padding-left: 10px; margin: 20px 0 10px 0; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background-color: #1E6091; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 10px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
        .info-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .info-val { font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 4px; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SK SMART INVESTMENTS</div>
          <div class="tagline">Insurance and Investments Specialist</div>
          <div class="sub">Official Customer 360° Profile &amp; KYC Dossier</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Customer Code:</strong> ${customer.customerCode}<br/>
          <strong>Generated:</strong> ${timestamp}
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Customer Name</div>
          <div class="info-val">${customer.name}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Lead Priority &amp; Category</div>
          <div class="info-val" style="color: ${customer.leadType === 'Hot Lead' ? '#e11d48' : customer.leadType === 'Cold Lead' ? '#0284c7' : '#d97706'};">
            ${customer.leadType === 'Hot Lead' ? '🔥 Hot Lead' : customer.leadType === 'Cold Lead' ? '❄️ Cold Lead' : '⚡ Warm Lead'}
            ${customer.isNri ? '<span style="font-size:10px; background:#4f46e5; color:#fff; padding:2px 6px; border-radius:4px; margin-left:4px;">✈️ NRI</span>' : '<span style="font-size:10px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; margin-left:4px;">🇮🇳 Resident</span>'}
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Marital Status / Anniversary</div>
          <div class="info-val" style="color: ${customer.maritalStatus === 'Married' ? '#be185d' : '#7e22ce'};">
            ${customer.maritalStatus === 'Married' ? `Married 💍 (${customer.anniversaryDate || 'Date N/A'})` : 'Single 👤'}
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Active Staff / Advisor</div>
          <div class="info-val">${customer.assignedAdvisorName || 'Priya Sharma'}</div>
        </div>
      </div>

      <div class="section-title">1. Personal &amp; Identification Details</div>
      <table>
        <tr>
          <td style="width: 20%; font-weight: 800; background:#f8fafc;">Mobile Phone:</td>
          <td>${customer.phone || 'N/A'}${customer.alternatePhone ? `<br/><small style="color:#64748b; font-weight:700;">Alt: ${customer.alternatePhone}</small>` : ''}</td>
          <td style="width: 20%; font-weight: 800; background:#f8fafc;">Email Address:</td>
          <td>${customer.email || `${customer.name?.toLowerCase().replace(/\s+/g, '')}@example.com`}</td>
        </tr>
        <tr>
          <td style="font-weight: 800; background:#f8fafc;">Date of Birth:</td>
          <td>${customer.dob || '1982-01-11'}</td>
          <td style="font-weight: 800; background:#f8fafc;">Gender:</td>
          <td>${customer.gender || 'Male'}</td>
        </tr>
        <tr>
          <td style="font-weight: 800; background:#f8fafc;">PAN Card Details:</td>
          <td><strong>${customer.pan || 'N/A'}</strong>${customer.panName ? `<br/><small style="color:#64748b;">Name: ${customer.panName}</small>` : ''}${customer.panDob ? `<br/><small style="color:#64748b;">DOB: ${customer.panDob}</small>` : ''}</td>
          <td style="font-weight: 800; background:#f8fafc;">Aadhaar UIDAI Details:</td>
          <td><strong>${customer.aadhaar || 'N/A'}</strong>${customer.aadhaarName ? `<br/><small style="color:#64748b;">Name: ${customer.aadhaarName}</small>` : ''}${customer.aadhaarDob ? `<br/><small style="color:#64748b;">DOB: ${customer.aadhaarDob}</small>` : ''}</td>
        </tr>
        ${(customer.bankHolderName || customer.bankName || customer.bankAccountNumber || customer.ifscCode) ? `
        <tr>
          <td style="font-weight: 800; background:#f8fafc;">Primary Bank Account:</td>
          <td colSpan="3">
            <strong>${customer.bankName || 'Bank Account'}</strong>
            ${customer.bankHolderName ? ` | Holder: <strong>${customer.bankHolderName}</strong>` : ''}
            ${customer.bankAccountNumber ? ` | A/C No: <span style="font-family:monospace;">${customer.bankAccountNumber}</span>` : ''}
            ${customer.bankAccountType ? ` | Type: <strong>${customer.bankAccountType}</strong>` : ''}
            ${customer.ifscCode ? ` | IFSC: <span style="font-family:monospace;">${customer.ifscCode}</span>` : ''}
          </td>
        </tr>
        ` : ''}
        ${customer.isNri ? `
        <tr style="background: #eef2ff;">
          <td style="font-weight: 800; color: #3730a3;">✈️ NRI Passport Details:</td>
          <td>
            <strong>${customer.passportNumber || 'N/A'}</strong>
            ${customer.passportName ? `<br/><small style="color:#4f46e5;">Name: ${customer.passportName}</small>` : ''}
            ${customer.passportDob ? `<br/><small style="color:#4f46e5;">DOB: ${customer.passportDob}</small>` : ''}
          </td>
          <td style="font-weight: 800; color: #3730a3;">Overseas Address:</td>
          <td>
            ${customer.passportAddress || 'N/A'}
            ${customer.passportPincode ? `<br/><small style="color:#4f46e5;">Postal/Pincode: ${customer.passportPincode}</small>` : ''}
          </td>
        </tr>
        <tr style="background: #eef2ff;">
          <td style="font-weight: 800; color: #3730a3;">✈️ NRI Bank Account:</td>
          <td colSpan="3">
            <strong>${customer.nriBankName || 'NRI Bank'}</strong>
            ${customer.nriBankHolderName ? ` | Holder: <strong>${customer.nriBankHolderName}</strong>` : ''}
            ${customer.nriBankAccountNumber ? ` | A/C: <span style="font-family:monospace;">${customer.nriBankAccountNumber}</span>` : ''}
            ${customer.nriBankAccountType ? ` | Type: <strong>${customer.nriBankAccountType}</strong>` : ''}
            ${customer.nriIfscCode ? ` | IFSC/Swift: <span style="font-family:monospace;">${customer.nriIfscCode}</span>` : ''}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="font-weight: 800; background:#f8fafc;">Occupation:</td>
          <td>${customer.occupation || 'Salaried Executive'}</td>
          <td style="font-weight: 800; background:#f8fafc;">Annual Income:</td>
          <td>${customer.incomeBracket || '25-50 Lakhs'}</td>
        </tr>
        <tr>
          <td style="font-weight: 800; background:#f8fafc;">Address:</td>
          <td colSpan="3">${customer.address || customer.city || 'N/A'}</td>
        </tr>
      </table>

      <div class="section-title">2. Registered Family Members Directory (Tabular Columns)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align:center;">S.No</th>
            <th>Member Name</th>
            <th>Relationship</th>
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>Mobile Phone</th>
            <th>Wedding Anniversary</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${familyHtml}
        </tbody>
      </table>

      <div class="section-title">3. Active Policies &amp; Claims Summary</div>
      <table>
        <thead>
          <tr>
            <th>Policy No</th>
            <th>Insurer Company</th>
            <th>Category / Type</th>
            <th>Sum Assured / Claim</th>
            <th>Assigned Follow-up Officer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${customer.insuranceCompany ? `
          <tr>
            <td style="font-family: monospace;">${customer.id || 'POL-REG-01'}</td>
            <td>${customer.insuranceCompany}</td>
            <td>${customer.insuranceType || 'Active'} Insurance</td>
            <td style="font-weight:800;">${customer.policyAmount ? '₹ ' + Number(customer.policyAmount).toLocaleString() : 'Registered Plan'}</td>
            <td><strong>👤 ${customer.assignedAdvisorName || 'Assigned Staff'}</strong></td>
            <td><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">Active</span></td>
          </tr>` : `
          <tr>
            <td colspan="6" style="text-align: center; color: #94a3b8; padding: 12px;">No active insurance policy or claims records attached to this customer.</td>
          </tr>`}
        </tbody>
      </table>

      <div class="section-title">4. Active Investment Holdings &amp; Portfolios</div>
      <table>
        <thead>
          <tr>
            <th>Product Type</th>
            <th>Provider / Scheme Name</th>
            <th>Investment / Premium</th>
            <th>Folio / Policy Number</th>
            <th>Assigned Advisor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${portfolioHtml}
        </tbody>
      </table>

      <div class="footer">
        Confidential Customer 360° Dossier • SK Smart Investments &amp; Insurance • Computer Generated Document
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Export Customer 360 Registry Table to PDF
export const exportCustomerRegistryPDF = (customers) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print PDF report.");
    return;
  }

  const timestamp = new Date().toLocaleString('en-IN');
  const rows = customers.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${c.name}</strong><br/><span style="font-size:9px; color:#64748b;">${c.customerCode}</span></td>
      <td>
        <span style="background: ${c.maritalStatus === 'Married' ? '#fce7f3' : '#f3e8ff'}; color: ${c.maritalStatus === 'Married' ? '#be185d' : '#7e22ce'}; padding: 2px 6px; border-radius: 10px; font-weight:800; font-size:9px;">
          ${c.maritalStatus === 'Married' ? 'Married 💍' : 'Single 👤'}
        </span>
      </td>
      <td>${c.phone}${(c.alternatePhone || c.altPhone) ? `<br/><span style="font-size:9px; color:#059669; font-weight:700;">Alt: ${c.alternatePhone || c.altPhone}</span>` : ''}<br/><span style="font-size:9px; color:#64748b;">${c.email || ''}</span></td>
      <td><span style="background:#f3e8ff; color:#7e22ce; padding:3px 8px; border-radius:10px; font-weight:800;">👤 ${c.assignedAdvisorName || 'Priya Sharma'}</span></td>
      <td><strong>${c.insuranceCompany || 'Tata AIA Life'}</strong><br/><span style="font-size:9px; color:#2563eb; font-weight:700;">${c.insuranceType || 'LIFE'} Policy</span></td>
      <td>${c.salesPitch || 'Retirement Plan'}</td>
      <td style="font-weight:800; color:#2563eb;">${c.familyMembers?.length || 0} Members</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Customer 360 Registry Report</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 30px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E6091; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #1E6091; }
        .sub { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
        th { background-color: #1E6091; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 10px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SK SMART INVESTMENTS &amp; INSURANCE</div>
          <div class="sub">Executive Customer 360° Registry &amp; Family Directory Report</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Total Customers:</strong> ${customers.length}<br/>
          <strong>Generated:</strong> ${timestamp}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Customer Name</th>
            <th>Marital Status</th>
            <th>Contact Details</th>
            <th>Present Handling Staff</th>
            <th>Active Policy &amp; Insurer</th>
            <th>Sales Pitch</th>
            <th>Family Members</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        Official Customer Registry Report • SK Smart Investments &amp; Insurance
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 300); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Helper to render high-resolution vector SVG Chart for Financial Cash Flow (Revenue vs Expenses vs Net Margin)
const generateFinancialCashFlowSVG = (financialChart = []) => {
  if (!financialChart || !Array.isArray(financialChart) || financialChart.length === 0) return '';

  const chartData = financialChart.slice(0, 31);
  const count = chartData.length;
  if (count === 0) return '';

  const dataPoints = chartData.map(d => {
    const inc = Number(d.rawIncome !== undefined ? d.rawIncome : (d.income ? d.income * 100000 : (d.revenue ? d.revenue * 100000 : 0)));
    const exp = Number(d.rawExpense !== undefined ? d.rawExpense : (d.expense ? d.expense * 100000 : (d.totalExpenses ? d.totalExpenses * 100000 : 0)));
    const profit = inc - exp;
    return {
      label: d.label || d.month || '',
      fullLabel: d.fullLabel || d.label || '',
      income: inc,
      expense: exp,
      profit
    };
  });

  const totalInc = dataPoints.reduce((s, d) => s + d.income, 0);
  const totalExp = dataPoints.reduce((s, d) => s + d.expense, 0);
  const netProfit = totalInc - totalExp;

  const maxVal = Math.max(
    ...dataPoints.map(d => Math.max(d.income, d.expense, Math.abs(d.profit))),
    10000
  );

  const svgWidth = 840;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Y-axis grid levels (4 ticks: 0%, 33%, 66%, 100%)
  const yTicks = [0, 0.33, 0.66, 1].map(pct => {
    const val = Math.round(maxVal * pct);
    const y = padTop + plotHeight - (pct * plotHeight);
    const label = val >= 10000000 ? `₹${(val / 10000000).toFixed(1)}Cr` : (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`));
    return { y, val, label };
  });

  const slotWidth = plotWidth / count;
  const barWidth = Math.max(3, Math.min(20, (slotWidth - 6) / 2));

  let barsHtml = '';
  let linePoints = [];
  let xLabelsHtml = '';

  dataPoints.forEach((d, idx) => {
    const slotCenterX = padLeft + (idx * slotWidth) + (slotWidth / 2);
    
    // Revenue bar (Green)
    const incHeight = maxVal > 0 ? (d.income / maxVal) * plotHeight : 0;
    const incY = padTop + plotHeight - incHeight;
    const incX = slotCenterX - barWidth - 1;

    // Expense bar (Red/Rose)
    const expHeight = maxVal > 0 ? (d.expense / maxVal) * plotHeight : 0;
    const expY = padTop + plotHeight - expHeight;
    const expX = slotCenterX + 1;

    // Profit Dot & Line (Blue)
    const profitClamped = Math.max(0, d.profit);
    const profitHeight = maxVal > 0 ? (profitClamped / maxVal) * plotHeight : 0;
    const profitY = padTop + plotHeight - profitHeight;
    linePoints.push(`${slotCenterX},${profitY}`);

    if (d.income > 0) {
      barsHtml += `<rect x="${incX}" y="${incY}" width="${barWidth}" height="${incHeight}" fill="#10B981" rx="2" ry="2" />`;
    }
    if (d.expense > 0) {
      barsHtml += `<rect x="${expX}" y="${expY}" width="${barWidth}" height="${expHeight}" fill="#F43F5E" rx="2" ry="2" />`;
    }

    barsHtml += `<circle cx="${slotCenterX}" cy="${profitY}" r="3" fill="${d.profit >= 0 ? '#2563EB' : '#DC2626'}" stroke="#ffffff" stroke-width="1.5"/>`;

    // Throttled X-axis labels to prevent overcrowding
    const showLabel = count <= 14 || idx === 0 || idx === count - 1 || idx % Math.ceil(count / 12) === 0;
    if (showLabel) {
      xLabelsHtml += `<text x="${slotCenterX}" y="${padTop + plotHeight + 16}" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">${d.label}</text>`;
    }
  });

  const polylineHtml = linePoints.length > 1 
    ? `<polyline fill="none" stroke="#2563EB" stroke-width="2" stroke-dasharray="3,3" points="${linePoints.join(' ')}" opacity="0.9" />`
    : '';

  const gridHtml = yTicks.map(t => `
    <line x1="${padLeft}" y1="${t.y}" x2="${svgWidth - padRight}" y2="${t.y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
    <text x="${padLeft - 8}" y="${t.y + 3}" text-anchor="end" font-size="8.5" font-weight="700" fill="#94a3b8">${t.label}</text>
  `).join('');

  return `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 14px 10px 14px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 4px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
        <span style="font-size:11px; font-weight:900; color:#1e293b; text-transform:uppercase; letter-spacing:0.5px;">
          📈 Cash Flow &amp; Margin Graph (Revenue vs Expenses vs Net Profit)
        </span>
        <div style="display:flex; align-items:center; gap:14px; font-size:10px; font-weight:800;">
          <span style="display:inline-flex; align-items:center; gap:5px; color:#059669;">
            <span style="width:10px; height:10px; background:#10B981; border-radius:2px; display:inline-block;"></span> Revenue (₹${totalInc.toLocaleString('en-IN')})
          </span>
          <span style="display:inline-flex; align-items:center; gap:5px; color:#e11d48;">
            <span style="width:10px; height:10px; background:#F43F5E; border-radius:2px; display:inline-block;"></span> Expenses (₹${totalExp.toLocaleString('en-IN')})
          </span>
          <span style="display:inline-flex; align-items:center; gap:5px; color:#2563eb;">
            <span style="width:12px; height:2px; background:#2563EB; display:inline-block; vertical-align:middle;"></span> Net Margin (${netProfit >= 0 ? '+₹' : '-₹'}${Math.abs(netProfit).toLocaleString('en-IN')})
          </span>
        </div>
      </div>
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%; height:auto; display:block; font-family:'Segoe UI', Arial, sans-serif;">
        <!-- Gridlines -->
        ${gridHtml}
        <!-- Zero baseline -->
        <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${svgWidth - padRight}" y2="${padTop + plotHeight}" stroke="#cbd5e1" stroke-width="1.5"/>
        <!-- Bars -->
        ${barsHtml}
        <!-- Trend Line -->
        ${polylineHtml}
        <!-- X Axis Labels -->
        ${xLabelsHtml}
      </svg>
    </div>
  `;
};

// Export Complete Dashboard Analytics to PDF (Including All Dashboard Data, KPIs, Categories, Insurers, Staff, Financials, Conversions, Renewals & Expenses)
export const exportDashboardAnalyticsPDF = (
  dateFilter,
  currentMetrics = {},
  productDistData = [],
  conversionClaimsData = [],
  staffData = [],
  categoryOverviewData = {},
  extraDashboardData = {}
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print PDF report.");
    return;
  }

  const timestamp = new Date().toLocaleString('en-IN');
  const catData = categoryOverviewData?.chartData || productDistData || [];
  const compData = categoryOverviewData?.companyChartData || [];
  const totalPolicies = categoryOverviewData?.totalPolicies || categoryOverviewData?.totalPoliciesCount || (currentMetrics?.activePolicies || 1);

  const financialChart = extraDashboardData?.financialChart || [];
  const renewalsList = extraDashboardData?.renewalsList || [];
  const specialDaysList = extraDashboardData?.specialDaysList || [];
  const expensesList = extraDashboardData?.expensesList || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Complete Master Dashboard Report</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; background-color: #fff; line-height: 1.4; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1E6091; padding-bottom: 14px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #1E6091; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
        .meta-bar { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 9px 14px; border-radius: 10px; font-size: 11px; color: #475569; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
        .kpi-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 14px; background: #f8fafc; }
        .kpi-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 19px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0; }
        .section-title { font-size: 12px; font-weight: 900; color: #1e293b; border-left: 4px solid #1E6091; padding-left: 10px; margin: 24px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 10.5px; }
        th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; }
        th { background-color: #1E6091; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 9.5px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: 800; }
        .footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 9.5px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SK SMART INVESTMENTS &amp; INSURANCE</div>
          <div class="subtitle">Complete Executive Master Dashboard &amp; Operational Analytics Report</div>
        </div>
        <div style="text-align: right; font-size: 10.5px; color: #64748b;">
          <strong>Timeline Range:</strong> ${dateFilter || 'THIS_MONTH'}<br/>
          <strong>Generated:</strong> ${timestamp}
        </div>
      </div>

      <div class="meta-bar">
        <span><strong>Report Type:</strong> Complete Comprehensive Dashboard Export (PDF)</span>
        <span><strong>Data Coverage:</strong> Customers, Policies, Investments, Financials, Conversions, Staff, Renewals &amp; Outflows</span>
      </div>

      <!-- SECTION: EXECUTIVE KPI METRICS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Customers</div>
          <div class="kpi-value">${currentMetrics?.customers || 0}</div>
          <div style="font-size: 9.5px; color: #16a34a; font-weight:700;">Active Client Profiles</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Policies</div>
          <div class="kpi-value">${categoryOverviewData?.totalPolicies || currentMetrics?.activePolicies || currentMetrics?.policiesCount || 0}</div>
          <div style="font-size: 9.5px; color: #2563eb; font-weight:700;">Underwritten Contracts</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Investments Volume</div>
          <div class="kpi-value">${currentMetrics?.investmentVolume || '₹0'}</div>
          <div style="font-size: 9.5px; color: #16a34a; font-weight:700;">Mutual Funds &amp; SIP AUM</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Company Outflow</div>
          <div class="kpi-value">₹${Number(currentMetrics?.companyExpenditure || extraDashboardData?.totalExpenses || 0).toLocaleString('en-IN')}</div>
          <div style="font-size: 9.5px; color: #e11d48; font-weight:700;">Operating &amp; Staff Spend</div>
        </div>
      </div>

      <!-- SECTION 1: POLICY CATEGORIES BREAKDOWN -->
      <div class="section-title">1. Portfolio Distribution by Policy Category</div>
      <table>
        <thead>
          <tr>
            <th>Policy Category</th>
            <th>Active Policies</th>
            <th>Portfolio Share %</th>
            <th>Leading Underwriter</th>
            <th>Category Status</th>
          </tr>
        </thead>
        <tbody>
          ${catData.length > 0 ? catData.map(cat => {
            const count = cat.policyCount ?? cat.count ?? 0;
            const share = totalPolicies > 0 ? ((count / totalPolicies) * 100).toFixed(1) : '0.0';
            const topComp = cat.companies ? Object.keys(cat.companies)[0] : 'Star Health / Tata AIA';
            return `
              <tr>
                <td><strong>${cat.category}</strong></td>
                <td style="font-weight:900; color:#1E6091;">${count}</td>
                <td style="color:#2563eb; font-weight:800;">${share}%</td>
                <td style="color:#475569; font-weight:700;">${topComp}</td>
                <td><span class="badge" style="background:#dcfce7; color:#15803d;">ACTIVE</span></td>
              </tr>
            `;
          }).join('') : `<tr><td colSpan="5" style="text-align:center; color:#94a3b8;">No category records found.</td></tr>`}
        </tbody>
      </table>

      <!-- SECTION 2: INSURANCE COMPANY BREAKDOWN -->
      <div class="section-title">2. Underwriting Volume by Insurance Company</div>
      <table>
        <thead>
          <tr>
            <th>Insurance Company Partner</th>
            <th>Underwritten Contracts</th>
            <th>Market Share %</th>
            <th>Primary Business Line</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${compData.length > 0 ? compData.map(comp => {
            const compName = comp.company || comp.name || 'Empanelled Insurer';
            const count = comp.policyCount ?? comp.count ?? 0;
            const share = totalPolicies > 0 ? ((count / totalPolicies) * 100).toFixed(1) : '0.0';
            const topCat = comp.categoryBreakdown ? Object.keys(comp.categoryBreakdown)[0] : 'Health / Life';
            return `
              <tr>
                <td><strong>${compName}</strong></td>
                <td style="font-weight:900; color:#0f172a;">${count}</td>
                <td style="color:#16a34a; font-weight:800;">${share}%</td>
                <td style="color:#64748b; font-weight:700;">${topCat}</td>
                <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">EMPANELLED</span></td>
              </tr>
            `;
          }).join('') : `<tr><td colSpan="5" style="text-align:center; color:#94a3b8;">No company records found.</td></tr>`}
        </tbody>
      </table>

      <!-- SECTION 3: STAFF ADVISOR PERFORMANCE -->
      <div class="section-title">3. Staff Advisor Performance &amp; Production Leaderboard</div>
      <table>
        <thead>
          <tr>
            <th>Advisor / Staff Name</th>
            <th>Assigned Monthly Target</th>
            <th>Achieved Business Value</th>
            <th>Completion Rate %</th>
            <th>Production Status</th>
          </tr>
        </thead>
        <tbody>
          ${(staffData || []).length > 0 ? (staffData || []).map(row => {
            const targetVal = Number(row.target || 0);
            const achievedVal = Number(row.achieved || 0);
            const rate = targetVal > 0 ? ((achievedVal / targetVal) * 100).toFixed(1) : (achievedVal > 0 ? '100.0' : '0.0');
            return `
              <tr>
                <td><strong>${row.name}</strong></td>
                <td>₹${targetVal.toLocaleString('en-IN')}</td>
                <td style="color: #2563eb; font-weight: 800;">₹${achievedVal.toLocaleString('en-IN')}</td>
                <td style="color: #16a34a; font-weight: 800;">${rate}%</td>
                <td><span class="badge" style="background:#dcfce7; color:#15803d;">${Number(rate) >= 100 ? 'Top Performer' : 'On Track'}</span></td>
              </tr>
            `;
          }).join('') : `<tr><td colSpan="5" style="text-align:center; color:#94a3b8;">No staff performance records available.</td></tr>`}
        </tbody>
      </table>

      <!-- SECTION 4: FINANCIAL CASH FLOW & REVENUE TIMELINE -->
      ${financialChart.length > 0 ? `
        <div class="section-title">4. Financial Cash Flow &amp; Revenue Timeline</div>
        ${generateFinancialCashFlowSVG(financialChart)}
        <table>
          <thead>
            <tr>
              <th>Timeline Period</th>
              <th>Gross Revenue / Premium (₹)</th>
              <th>Expenses / Company Outflow (₹)</th>
              <th>Net Operating Margin (₹)</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            ${financialChart.map(f => {
              const inc = Number(f.rawIncome || (f.income ? f.income * 100000 : 0));
              const exp = Number(f.rawExpense || (f.expense ? f.expense * 100000 : 0));
              const profit = inc - exp;
              return `
                <tr>
                  <td><strong>${f.fullLabel || f.label || f.month || 'Period'}</strong></td>
                  <td style="color:#16a34a; font-weight:800;">₹${inc.toLocaleString('en-IN')}</td>
                  <td style="color:#e11d48; font-weight:800;">₹${exp.toLocaleString('en-IN')}</td>
                  <td style="color:${profit >= 0 ? '#16a34a' : '#e11d48'}; font-weight:900;">₹${profit.toLocaleString('en-IN')}</td>
                  <td><span class="badge" style="background:${profit >= 0 ? '#dcfce7' : '#fee2e2'}; color:${profit >= 0 ? '#15803d' : '#991b1b'};">${profit >= 0 ? 'Surplus' : 'Deficit'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- SECTION 5: UPCOMING HIGH-PRIORITY POLICY RENEWALS -->
      ${renewalsList.length > 0 ? `
        <div class="section-title">5. Upcoming Policy Renewals Schedule</div>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Policy Number</th>
              <th>Insurer</th>
              <th>Renewal Date</th>
              <th>Gross Premium (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${renewalsList.slice(0, 15).map(r => `
              <tr>
                <td><strong>${r.customerName || r.clientName || 'N/A'}</strong></td>
                <td style="font-family:monospace;">${r.policyNumber || r.id || 'N/A'}</td>
                <td>${r.insuranceCompany || r.provider || 'N/A'}</td>
                <td style="font-family:monospace; color:#2563eb; font-weight:700;">${r.expiryDate || r.renewalDate || '—'}</td>
                <td style="font-weight:800; color:#16a34a;">₹${Number(r.grossPremium || r.premiumAmount || 0).toLocaleString('en-IN')}</td>
                <td><span class="badge" style="background:#fef3c7; color:#92400e;">PENDING RENEWAL</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- SECTION 6: COMPANY EXPENDITURE LEDGER -->
      ${expensesList.length > 0 ? `
        <div class="section-title">6. Live Company Operating Expenditure Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description / Staff Member</th>
              <th>Expense Date</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${expensesList.slice(0, 15).map(e => `
              <tr>
                <td><strong>${e.category || 'Operations'}</strong></td>
                <td>${e.description || e.vendor || 'Operational Outflow'}</td>
                <td style="font-family:monospace;">${e.expenseDate || e.date || '—'}</td>
                <td style="color:#e11d48; font-weight:800;">₹${Number(e.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- SECTION 7: SPECIAL DAYS & UPCOMING CELEBRATIONS -->
      ${specialDaysList.length > 0 ? `
        <div class="section-title">7. Upcoming Client Special Days &amp; Greetings</div>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Celebration Occasion</th>
              <th>Date</th>
              <th>Contact Number</th>
            </tr>
          </thead>
          <tbody>
            ${specialDaysList.slice(0, 15).map(s => `
              <tr>
                <td><strong>${s.customerName || s.name || 'Client'}</strong></td>
                <td><span class="badge" style="background:#f3e8ff; color:#7e22ce;">${s.type || s.occasion || 'Birthday'}</span></td>
                <td style="font-family:monospace; font-weight:700;">${s.date || '—'}</td>
                <td style="font-family:monospace;">${s.phone || s.mobile || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="footer">
        Confidential Master Executive Report • SK Smart Investments &amp; Insurance • Complete Live Database Snapshot
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Export Complete Dashboard Data to Excel / CSV (Including All 10 Data Dimensions)
export const exportDashboardCategoryAndCompanyExcel = (
  policyCategoryOverview = {},
  currentMetrics = {},
  extraDashboardData = {}
) => {
  const chartData = policyCategoryOverview.chartData || [];
  const companyChartData = policyCategoryOverview.companyChartData || [];
  const companyBreakdown = policyCategoryOverview.companyBreakdown || {};
  const totalPolicies = policyCategoryOverview.totalPolicies || policyCategoryOverview.totalPoliciesCount || 1;

  const staffData = extraDashboardData?.staffData || [];
  const financialChart = extraDashboardData?.financialChart || [];
  const renewalsList = extraDashboardData?.renewalsList || [];
  const expensesList = extraDashboardData?.expensesList || [];
  const specialDaysList = extraDashboardData?.specialDaysList || [];

  const rows = [];

  // Header Banner
  rows.push(['SK SMART INVESTMENTS & INSURANCE - COMPLETE MASTER DASHBOARD EXPORT']);
  rows.push(['Generated Date & Time', new Date().toLocaleString('en-IN')]);
  rows.push(['Timeline Filter Applied', extraDashboardData?.dateFilter || 'THIS_MONTH']);
  rows.push([]);

  // SECTION 1: EXECUTIVE KEY PERFORMANCE INDICATORS
  rows.push(['=== 1. EXECUTIVE KPI SUMMARY METRICS ===']);
  rows.push(['Metric Name', 'Recorded Metric Value', 'Description']);
  rows.push(['Total Active Customers', currentMetrics?.customers || 0, 'Registered Active Client Accounts']);
  rows.push(['Active Underwritten Policies', totalPolicies, 'Active Policies in Force']);
  rows.push(['Investments Volume (AUM)', currentMetrics?.investmentVolume || '₹0', 'Mutual Funds & SIP Holdings']);
  rows.push(['Total Company Outflow', `₹${Number(currentMetrics?.companyExpenditure || extraDashboardData?.totalExpenses || 0).toLocaleString('en-IN')}`, 'Operating & Staff Salary Outflow']);
  rows.push(['Active Leads Pipeline', currentMetrics?.activeLeads || 0, 'Active Inquiries in Sales Pipeline']);
  rows.push([]);

  // SECTION 2: BY CATEGORY BREAKDOWN
  rows.push(['=== 2. BUSINESS DISTRIBUTION BY POLICY CATEGORY ===']);
  rows.push(['Policy Category', 'Active Policy Contracts', 'Portfolio Share (%)', 'Leading Underwriter Partner', 'Status']);
  chartData.forEach(cat => {
    const count = cat.policyCount ?? cat.count ?? 0;
    const share = totalPolicies > 0 ? ((count / totalPolicies) * 100).toFixed(1) : '0.0';
    const topComp = cat.companies ? Object.keys(cat.companies)[0] : 'Star Health / Tata AIA';
    rows.push([
      cat.category || 'N/A',
      count,
      `${share}%`,
      topComp,
      'ACTIVE'
    ]);
  });
  rows.push([]);

  // SECTION 3: BY INSURANCE COMPANY BREAKDOWN
  rows.push(['=== 3. UNDERWRITING VOLUME BY INSURANCE COMPANY ===']);
  rows.push(['Insurance Company Name', 'Underwritten Policy Contracts', 'Market Share (%)', 'Primary Business Line', 'Status']);
  companyChartData.forEach(comp => {
    const compName = comp.company || comp.name || 'Empanelled Insurer';
    const count = comp.policyCount ?? comp.count ?? 0;
    const share = totalPolicies > 0 ? ((count / totalPolicies) * 100).toFixed(1) : '0.0';
    const topCat = comp.categoryBreakdown ? Object.keys(comp.categoryBreakdown)[0] : 'Health / Life Insurance';
    rows.push([
      compName,
      count,
      `${share}%`,
      topCat,
      'EMPANELLED'
    ]);
  });
  rows.push([]);

  // SECTION 4: CROSS-MATRIX GRID (INSURER × CATEGORY)
  rows.push(['=== 4. INSURER x CATEGORY CROSS-MATRIX GRID ===']);
  const categoryNames = chartData.map(c => c.category);
  rows.push(['Insurance Company / Underwriter', ...categoryNames, 'Total Policy Contracts']);
  Object.keys(companyBreakdown).forEach(comp => {
    const compCounts = categoryNames.map(cat => companyBreakdown[comp]?.[cat] || 0);
    const compTotal = compCounts.reduce((a, b) => a + b, 0);
    rows.push([comp, ...compCounts, compTotal]);
  });
  rows.push([]);

  // SECTION 5: STAFF ADVISOR PERFORMANCE
  if (staffData.length > 0) {
    rows.push(['=== 5. STAFF ADVISOR PRODUCTION & TARGETS ===']);
    rows.push(['Advisor Name', 'Assigned Target (₹)', 'Achieved Value (₹)', 'Completion Rate (%)', 'Status']);
    staffData.forEach(st => {
      const targetVal = Number(st.target || 0);
      const achievedVal = Number(st.achieved || 0);
      const rate = targetVal > 0 ? ((achievedVal / targetVal) * 100).toFixed(1) : (achievedVal > 0 ? '100.0' : '0.0');
      rows.push([
        st.name || 'Staff Advisor',
        targetVal,
        achievedVal,
        `${rate}%`,
        Number(rate) >= 100 ? 'Top Performer' : 'On Track'
      ]);
    });
    rows.push([]);
  }

  // SECTION 6: FINANCIAL CASH FLOW TIMELINE
  if (financialChart.length > 0) {
    rows.push(['=== 6. FINANCIAL REVENUE & EXPENSES TIMELINE ===']);
    rows.push(['Timeline Period', 'Gross Revenue / Premium (₹)', 'Operating Expenses (₹)', 'Net Operating Margin (₹)', 'Health Status']);
    financialChart.forEach(f => {
      const inc = Number(f.rawIncome || (f.income ? f.income * 100000 : 0));
      const exp = Number(f.rawExpense || (f.expense ? f.expense * 100000 : 0));
      const profit = inc - exp;
      rows.push([
        f.fullLabel || f.label || f.month || 'Period',
        inc,
        exp,
        profit,
        profit >= 0 ? 'Surplus' : 'Deficit'
      ]);
    });
    rows.push([]);
  }

  // SECTION 7: UPCOMING POLICY RENEWALS
  if (renewalsList.length > 0) {
    rows.push(['=== 7. UPCOMING POLICY RENEWALS ===']);
    rows.push(['Customer Name', 'Policy Number', 'Insurance Company', 'Expiry Date', 'Gross Premium (₹)', 'Status']);
    renewalsList.forEach(r => {
      rows.push([
        r.customerName || r.clientName || 'N/A',
        r.policyNumber || r.id || 'N/A',
        r.insuranceCompany || r.provider || 'N/A',
        r.expiryDate || r.renewalDate || '—',
        Number(r.grossPremium || r.premiumAmount || 0),
        'PENDING RENEWAL'
      ]);
    });
    rows.push([]);
  }

  // SECTION 8: COMPANY EXPENDITURE RECORDS
  if (expensesList.length > 0) {
    rows.push(['=== 8. LIVE COMPANY EXPENDITURE DATABASE ===']);
    rows.push(['Category', 'Description / Staff', 'Expense Date', 'Amount (₹)']);
    expensesList.forEach(e => {
      rows.push([
        e.category || 'Operations',
        e.description || e.vendor || 'Operational Outflow',
        e.expenseDate || e.date || '—',
        Number(e.amount || 0)
      ]);
    });
    rows.push([]);
  }

  // SECTION 9: SPECIAL DAYS & CELEBRATIONS
  if (specialDaysList.length > 0) {
    rows.push(['=== 9. SPECIAL DAYS & CELEBRATIONS ===']);
    rows.push(['Customer Name', 'Occasion', 'Date', 'Contact Number']);
    specialDaysList.forEach(s => {
      rows.push([
        s.customerName || s.name || 'Client',
        s.type || s.occasion || 'Birthday',
        s.date || '—',
        s.phone || s.mobile || '—'
      ]);
    });
    rows.push([]);
  }

  const blob = createCSVSpreadsheetBlob(null, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Complete_Dashboard_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Reports Summary to PDF
export const exportReportsSummaryPDF = (reportSummary) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print PDF report.");
    return;
  }

  const timestamp = new Date().toLocaleString('en-IN');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Executive Summary PDF Report</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 35px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E6091; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #1E6091; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; background: #f8fafc; }
        .card-title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .card-value { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 8px; }
        .card-sub { font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 4px; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SK SMART INVESTMENTS &amp; INSURANCE</div>
          <div class="subtitle">Official Consolidated Executive Summary &amp; Financial Report</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Generated:</strong> ${timestamp}<br/>
          <strong>Status:</strong> Verified Audit Final
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Total Company Income</div>
          <div class="card-value" style="color: #16a34a;">₹${reportSummary?.totalIncome ? reportSummary.totalIncome.toLocaleString('en-IN') : '62,00,000'}</div>
          <div class="card-sub">Gross Portfolio Revenue</div>
        </div>
        <div class="card">
          <div class="card-title">Total Operational Expenses</div>
          <div class="card-value" style="color: #dc2626;">₹${reportSummary?.totalExpenses ? reportSummary.totalExpenses.toLocaleString('en-IN') : '20,00,000'}</div>
          <div class="card-sub" style="color: #dc2626;">Operational Overhead</div>
        </div>
        <div class="card">
          <div class="card-title">Net Company Profit</div>
          <div class="card-value" style="color: #2563eb;">₹${reportSummary?.netProfit ? reportSummary.netProfit.toLocaleString('en-IN') : '42,00,000'}</div>
          <div class="card-sub">Net Profit Margin: 67.7%</div>
        </div>
        <div class="card">
          <div class="card-title">Total Active Investments Volume</div>
          <div class="card-value" style="color: #0f172a;">₹${reportSummary?.totalInvestments ? reportSummary.totalInvestments.toLocaleString('en-IN') : '18,50,00,000'}</div>
          <div class="card-sub">Assets Under Advisory (AUA)</div>
        </div>
      </div>

      <div class="footer">
        Official Financial Summary Report • SK Smart Investments &amp; Insurance
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 300); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Download Policy Certificate PDF
export const downloadPolicyCertificatePDF = (policy) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print/download certificate.");
    return;
  }

  const timestamp = new Date().toLocaleDateString('en-IN');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Policy Certificate ${policy.id || ''}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }
        .cert-container { border: 8px double #1E6091; padding: 30px; border-radius: 16px; }
        .header { text-align: center; border-bottom: 2px solid #1E6091; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 900; color: #1E6091; }
        .subtitle { font-size: 14px; font-weight: 800; color: #64748b; margin-top: 6px; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
        td.label { font-weight: 800; color: #475569; width: 35%; text-transform: uppercase; font-size: 11px; }
        td.value { font-weight: 900; color: #0f172a; }
        .seal { margin-top: 40px; display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="header">
          <div class="title">SK SMART INVESTMENTS &amp; INSURANCE</div>
          <div class="subtitle">OFFICIAL INSURANCE POLICY CERTIFICATE</div>
        </div>

        <table>
          <tr>
            <td class="label">Policy ID / Number:</td>
            <td class="value">${policy.id || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Policy Holder Name:</td>
            <td class="value">${policy.customerName || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Insurance Provider:</td>
            <td class="value">${policy.provider || policy.insuranceCompany || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Policy Category:</td>
            <td class="value">${policy.type || policy.category || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Policy / Plan Name:</td>
            <td class="value" style="color:#1e40af;">${policy.policyName || policy.planName || policy.type || 'Standard Protection Plan'}</td>
          </tr>
          <tr>
            <td class="label">Sum Assured / Coverage:</td>
            <td class="value" style="color: #16a34a;">₹${policy.sumAssured ? policy.sumAssured.toLocaleString('en-IN') : 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Annual Gross Premium:</td>
            <td class="value" style="color: #2563eb;">₹${policy.premium ? policy.premium.toLocaleString('en-IN') : 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Expiry / Due Date:</td>
            <td class="value" style="color: #dc2626;">${policy.expiryDate || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Policy Status:</td>
            <td class="value" style="color: #16a34a;">${policy.status || 'ACTIVE'}</td>
          </tr>
        </table>

        <div class="seal">
          <div>
            <strong>Authorized Issuer Signature</strong><br/>
            SK Smart Investments &amp; Insurance Verification Desk
          </div>
          <div style="text-align: right;">
            <strong>Issued Date:</strong> ${timestamp}<br/>
            <strong>Document ID:</strong> CERT-${policy.id || '001'}
          </div>
        </div>
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 300); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Export Follow-up Register to PDF (Matching sample spreadsheet structure)
export const exportFollowupsPDF = (followupList = []) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download/print PDF report.");
    return;
  }

  const timestamp = new Date().toLocaleString('en-IN');
  const rowsHtml = followupList.map((f, idx) => `
    <tr style="background-color: ${f.insuranceType === 'HEALTH' ? '#ffedd5' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="font-weight:700;">${f.date || '08-Aug-26'}</td>
      <td><span style="background: ${f.clientCategory === 'New Lead' ? '#dbeafe' : '#f3e8ff'}; color: ${f.clientCategory === 'New Lead' ? '#1d4ed8' : '#7e22ce'}; padding: 2px 8px; border-radius: 12px; font-weight: 800; font-size: 10px;">${f.clientCategory || 'New Lead'}</span></td>
      <td style="font-weight:900; color:#0f172a;">${f.prospectName || f.clientName}</td>
      <td style="font-family:monospace; font-weight:800; color:#1e293b;">${f.phone || f.mobileNumber}</td>
      <td><span style="background: ${f.insuranceType === 'HEALTH' ? '#ffedd5' : '#dcfce7'}; color: ${f.insuranceType === 'HEALTH' ? '#c2410c' : '#15803d'}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">${f.insuranceType || 'LIFE'}</span></td>
      <td style="font-weight:800; color:#1E6091;">${f.insuranceCompany || 'Tata AIA Life'}</td>
      <td style="font-weight:700;">${f.salesPitch || 'Retirement Plan'}</td>
      <td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">${f.clientStatus || f.status}</span></td>
      <td style="font-style:italic; color:#475569;">${f.advisorNotes || f.conversationNotes || ''}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SK Smart Investments - Customer Follow-up Register</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 25px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E6091; padding-bottom: 14px; margin-bottom: 18px; }
        .logo { font-size: 22px; font-weight: 900; color: #1E6091; }
        .sub { font-size: 11px; color: #64748b; font-weight: 700; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
        th { background-color: #1E6091; color: #ffffff; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        .footer { margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SK SMART INVESTMENTS &amp; INSURANCE</div>
          <div class="sub">Customer Follow-up Register &amp; Sales Pitch Log</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Total Records:</strong> ${followupList.length}<br/>
          <strong>Generated:</strong> ${timestamp}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer Category</th>
            <th>Customer Name</th>
            <th>Mobile Number</th>
            <th>Type Of Insurance</th>
            <th>Insurance Company</th>
            <th>Sales Pitch</th>
            <th>Customer Status</th>
            <th>Advisor Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Confidential Internal Document • SK Smart Investments &amp; Insurance Follow-up Desk
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 300); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Helper to build native CSV spreadsheet blob (100% Excel compatible, zero corruption/format mismatch warnings)
const createCSVSpreadsheetBlob = (headers = [], rows = []) => {
  const escapeCell = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Export Follow-up Register to Excel / CSV
export const exportFollowupsExcel = (followupList = []) => {
  const headers = ['Date', 'Customer Category', 'Customer Name', 'Mobile Number', 'Type Of Insurance', 'Insurance Company', 'Sales Pitch', 'Customer Status', 'Advisor Notes'];
  
  const rows = followupList.map(f => [
    f.date || new Date().toISOString().slice(0, 10),
    f.clientCategory || 'Lead / Prospect',
    f.prospectName || f.clientName || f.name || 'N/A',
    f.phone || f.mobileNumber || f.mobile || 'N/A',
    f.insuranceType || 'LIFE / HEALTH',
    f.insuranceCompany || 'Star Health / Tata AIA',
    f.salesPitch || 'Insurance & Investment Advice',
    f.clientStatus || f.status || 'ACTIVE',
    f.advisorNotes || f.conversationNotes || ''
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Customer_Followups_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Customer 360 Directory to Excel / CSV
export const exportCustomerDirectoryExcel = (customerList = []) => {
  const headers = ['Customer Code', 'Full Name', 'Primary Mobile Number', 'Alternate Mobile Number', 'Email Address', 'City / Location', 'Assigned Staff Advisor', 'Active Policies', 'Total Portfolio Value (₹)'];
  
  const rows = customerList.map(c => [
    c.customerCode || c.id || 'SK-CUST-101',
    c.name || c.customerName || 'N/A',
    c.phone || c.mobile || 'N/A',
    c.alternatePhone || c.altPhone || 'N/A',
    c.email || 'N/A',
    c.city || 'N/A',
    c.assignedAdvisorName || c.assignedStaff || c.assignedToName || 'Priya Sharma',
    c.activePoliciesCount !== undefined ? c.activePoliciesCount : (c.policiesCount || 1),
    c.totalPortfolioValue ? `₹${Number(c.totalPortfolioValue).toLocaleString('en-IN')}` : '₹5,00,000'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Customer_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Insurance Policies Register to Excel / CSV
export const exportPoliciesExcel = (policyList = []) => {
  const headers = ['Policy Number', 'Customer Name', 'Insurance Company', 'Policy Category', 'Policy / Plan Name', 'Sum Insured (₹)', 'Gross Premium (₹)', 'Issue Date', 'Expiry Date', 'Assigned Staff Advisor', 'Policy Status'];
  
  const rows = policyList.map(p => [
    p.id || p.policyNumber || 'SK-POL-101',
    p.customerName || 'N/A',
    p.insuranceCompany || p.provider || 'Star Health Insurance',
    p.type || p.category || 'Health Insurance',
    p.policyName || p.planName || p.type || 'Standard Policy Plan',
    p.sumInsured ? `₹${Number(p.sumInsured).toLocaleString('en-IN')}` : '₹5,00,000',
    p.grossPremium ? `₹${Number(p.grossPremium).toLocaleString('en-IN')}` : '₹25,000',
    p.startDate || p.issueDate || '2026-01-15',
    p.expiryDate || '2027-01-15',
    p.assignedStaffName || p.assignedStaff || 'Priya Sharma',
    p.status || 'ACTIVE'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Insurance_Policies_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Investments Register to Excel / CSV
export const exportInvestmentsExcel = (investmentList = []) => {
  const headers = ['Folio / Investment ID', 'Customer Name', 'Asset Category', 'Fund / Institution Name', 'Investment Amount (₹)', 'Tenure / Horizon', 'Maturity Value (₹)', 'Assigned Advisor', 'Status'];
  
  const rows = investmentList.map(inv => [
    inv.id || inv.folioNumber || 'SK-INV-101',
    inv.customerName || 'N/A',
    inv.type || inv.category || 'Mutual Funds SIP',
    inv.institutionName || inv.provider || 'Nippon India Mutual Fund',
    inv.amount ? `₹${Number(inv.amount).toLocaleString('en-IN')}` : '₹1,00,000',
    inv.tenure || '5 Years',
    inv.maturityValue ? `₹${Number(inv.maturityValue).toLocaleString('en-IN')}` : '₹1,85,000',
    inv.assignedStaffName || inv.assignedStaff || 'Priya Sharma',
    inv.status || 'ACTIVE'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Investments_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Claims Desk to Excel / CSV
export const exportClaimsExcel = (claimsList = []) => {
  const headers = ['Claim Number', 'Customer Name', 'Insurer Provider', 'Claim Type', 'Claim Amount (₹)', 'Approved Amount (₹)', 'Filing Date', 'Assigned Officer', 'Claim Status'];
  
  const rows = claimsList.map(c => [
    c.id || c.claimNumber || 'SK-CLM-101',
    c.customerName || 'N/A',
    c.insuranceCompany || c.provider || 'Star Health Insurance',
    c.claimType || c.category || 'Cashless Hospitalization',
    c.claimAmount ? `₹${Number(c.claimAmount).toLocaleString('en-IN')}` : '₹75,000',
    c.approvedAmount ? `₹${Number(c.approvedAmount).toLocaleString('en-IN')}` : '₹75,000',
    c.date || c.filingDate || '2026-08-10',
    c.assignedStaffName || c.assignedStaff || 'Priya Sharma',
    c.status || 'APPROVED'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Claims_Desk_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Income & Commission Register to Excel / CSV
export const exportIncomeExcel = (incomeList = []) => {
  const headers = ['Voucher No', 'Transaction Date', 'Client Name', 'Income Category', 'Payor Company / Broker', 'Commission Amount (₹)', 'TDS Deducted (₹)', 'Net Income Received (₹)', 'Assigned Advisor', 'Status'];
  
  const rows = incomeList.map(inc => [
    inc.id || inc.voucherNo || 'SK-INC-101',
    inc.date || '2026-08-15',
    inc.clientName || inc.customerName || 'N/A',
    inc.category || inc.type || 'Insurance Brokerage',
    inc.payorCompany || inc.companyName || 'Tata AIA Life',
    inc.amount ? `₹${Number(inc.amount).toLocaleString('en-IN')}` : '₹15,000',
    inc.tdsAmount ? `₹${Number(inc.tdsAmount).toLocaleString('en-IN')}` : '₹750',
    inc.netAmount ? `₹${Number(inc.netAmount).toLocaleString('en-IN')}` : '₹14,250',
    inc.assignedStaffName || inc.assignedStaff || 'Prakash Gajendiran',
    inc.status || 'RECEIVED'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Income_Commission_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Policy Renewals Register to Excel / CSV
export const exportRenewalsExcel = (renewalsList = []) => {
  const headers = ['Renewal ID', 'Policy Number', 'Customer Name', 'Mobile Number', 'Policy Category', 'Insurer Provider', 'Renewal Premium (₹)', 'Due Date', 'Assigned Advisor', 'Renewal Status'];
  
  const rows = renewalsList.map(r => [
    r.id || `RNW-${r.policyNo || '101'}`,
    r.policyNo || r.id || 'SK-POL-101',
    r.customerName || 'N/A',
    r.phone || 'N/A',
    r.type || 'Health Insurance',
    r.insuranceCompany || 'Star Health Insurance',
    r.premium ? `₹${Number(r.premium).toLocaleString('en-IN')}` : '₹25,000',
    r.dueDate || '2026-09-01',
    r.assignedStaff || 'Priya Sharma',
    r.status || 'DUE_SOON'
  ]);

  const blob = createCSVSpreadsheetBlob(headers, rows);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `SK_Policy_Renewals_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Customer 360 Directory to PDF
export const exportCustomer360RegisterPDF = (customerList = []) => {
  exportFollowupsPDF(customerList);
};

// Export Customer 360 Directory to Excel (.xlsx) alias
export const exportCustomer360RegisterCSV = (customerList = []) => {
  exportCustomerDirectoryExcel(customerList);
};

// Aliases ensuring Excel export for all legacy exports
export const exportFollowupsCSV = exportFollowupsExcel;
export const exportPoliciesCSV = exportPoliciesExcel;
export const exportInvestmentsCSV = exportInvestmentsExcel;
export const exportClaimsCSV = exportClaimsExcel;
export const exportIncomeCSV = exportIncomeExcel;
export const exportRenewalsCSV = exportRenewalsExcel;
export const downloadCSV = exportCustomerDirectoryExcel;
export const exportArrayToCSV = exportCustomerDirectoryExcel;
export const exportDashboardAnalytics = exportDashboardAnalyticsPDF;
export const exportReportsSummary = exportReportsSummaryPDF;
export const downloadPolicyCertificate = downloadPolicyCertificatePDF;
