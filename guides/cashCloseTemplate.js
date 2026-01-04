function generateCashCloseHtml(closeData, details, logoBase64) {
  const optionsDate = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true };

  const currentDate = new Date().toLocaleDateString('es-CO', optionsDate);
  const currentTime = new Date().toLocaleTimeString('es-CO', optionsTime);

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return Math.round(amount).toLocaleString("es-CO");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const translatePeriodType = (type) => {
    const translations = {
      'DAILY': 'Diario',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensual',
      'YEARLY': 'Anual'
    };
    return translations[type] || type;
  };

  // Separar detalles por método de pago
  const cashDetails = details.filter(d => d.payment_method === 'CASH');
  const codDetails = details.filter(d => d.payment_method === 'COD');
  const creditDetails = details.filter(d => d.payment_method === 'CREDIT');

  // Función para generar tabla de detalles
  const generateDetailsTable = (title, tableDetails) => {
    if (tableDetails.length === 0) return '';

    let totalUnits = 0;
    let totalWeight = 0;
    let totalFreight = 0;
    let totalOther = 0;
    let totalHandling = 0;
    let totalDiscount = 0;
    let totalValue = 0;

    const rows = tableDetails.map(detail => {
      totalUnits += detail.units || 0;
      totalWeight += detail.weight || 0;
      totalFreight += detail.freight || 0;
      totalOther += detail.other || 0;
      totalHandling += detail.handling || 0;
      totalDiscount += detail.discount || 0;
      totalValue += detail.total_value || 0;

      return `
        <tr>
          <td>${formatDate(detail.date)}</td>
          <td class="text-center">${detail.guide_id}</td>
          <td>${(detail.sender || '').substring(0, 25)}</td>
          <td>${(detail.destination || '').substring(0, 22)}</td>
          <td class="text-center">${detail.units || 0}</td>
          <td class="text-right">${(detail.weight || 0).toFixed(2)}</td>
          <td class="text-right">$ ${formatCurrency(detail.freight)}</td>
          <td class="text-right">$ ${formatCurrency(detail.other)}</td>
          <td class="text-right">$ ${formatCurrency(detail.handling)}</td>
          <td class="text-right">${formatCurrency(detail.discount)}</td>
          <td class="text-right">$ ${formatCurrency(detail.total_value)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-section">
        <div class="table-title">${title}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Fecha</th>
              <th style="width: 7%;">Guía</th>
              <th style="width: 17%;">Remitente</th>
              <th style="width: 15%;">Destino</th>
              <th style="width: 5%;">Unid</th>
              <th style="width: 6%;">Peso</th>
              <th style="width: 8%;">Flete</th>
              <th style="width: 7%;">Otros</th>
              <th style="width: 7%;">Acarreo</th>
              <th style="width: 6%;">Dsto</th>
              <th style="width: 8%;">Vr. Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="totals">
              <td>TOTALES</td>
              <td class="text-center"># Guía: ${tableDetails.length}</td>
              <td></td>
              <td></td>
              <td class="text-center">${totalUnits}</td>
              <td class="text-right">${totalWeight.toFixed(2)}</td>
              <td class="text-right">$ ${formatCurrency(totalFreight)}</td>
              <td class="text-right">$ ${formatCurrency(totalOther)}</td>
              <td class="text-right">$ ${formatCurrency(totalHandling)}</td>
              <td class="text-right">${formatCurrency(totalDiscount)}</td>
              <td class="text-right">$ ${formatCurrency(totalValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cierre de Caja - SOLUCIONES SAS</title>
    <style>
        @page {
            size: Letter landscape;
            margin: 10mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.3;
            color: #000;
        }

        .container {
            width: 100%;
            max-width: 257mm;
            margin: 0 auto;
            padding-bottom: 30px;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .logo-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 8px;
        }

        .company-logo {
            width: 80px;
            height: auto;
            margin-right: 15px;
        }

        .company-name {
            font-size: 16pt;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 4px;
        }

        .company-info {
            font-size: 8pt;
            margin-bottom: 2px;
        }

        .title-box {
            background: #ffd700;
            border: 2px solid #000;
            padding: 8px;
            margin: 10px 0;
        }

        .title-box h1 {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
        }

        .summary-section {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        .summary-box {
            flex: 1;
            border: 2px solid #000;
            padding: 10px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 9pt;
        }

        .summary-row.total {
            background: #ffd700;
            padding: 6px 5px;
            margin-top: 8px;
            font-weight: bold;
            font-size: 10pt;
        }

        .summary-label {
            font-weight: bold;
        }

        .summary-value {
            text-align: right;
        }

        .info-box {
            border: 2px solid #000;
            padding: 10px;
        }

        .info-box h3 {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 6px;
        }

        .info-row {
            font-size: 8pt;
            padding: 2px 0;
        }

        .table-section {
            margin: 20px 0;
            page-break-inside: avoid;
        }

        .table-title {
            background: #f0f0f0;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10pt;
            border: 1px solid #000;
            margin-bottom: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background: #c0c0c0;
            font-size: 7pt;
            font-weight: bold;
            padding: 5px 3px;
            border: 1px solid #000;
            text-align: center;
        }

        td {
            font-size: 7pt;
            padding: 4px 3px;
            border: 1px solid #000;
        }

        td.text-right {
            text-align: right;
        }

        td.text-center {
            text-align: center;
        }

        tr.totals {
            background: #f0f0f0;
            font-weight: bold;
        }

        .footer {
            margin-top: 30px;
            padding-top: 8px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 7pt;
        }

        .footer-info {
            margin-bottom: 3px;
        }

        .page-number {
            margin-top: 3px;
            font-weight: bold;
        }

        @media print {
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                padding: 8px;
                border-top: 1px solid #000;
            }
            
            .container {
                padding-bottom: 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-section">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Empresa" class="company-logo">` : ''}
                <div>
                    <div class="company-name">SOLUCIONES SAS</div>
                </div>
            </div>
            
            <div class="company-info">Responsable del Impuesto sobre las ventas IVA</div>
            <div class="company-info">SOLUCIONES LOGISTICAS BLESSED SOLUCIONES SAS Nit. 901686492-2 - Régimen Simple de Tributación</div>
            <div class="company-info">CLL 16 J # 96 C 95 SUBA - BOGOTA D.C. CO.Colombia</div>
            
            <div class="title-box">
                <h1>CIERRE DE CAJA</h1>
            </div>
        </div>

        <div class="summary-section">
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Contado:</span>
                    <span class="summary-value">$ ${formatCurrency(closeData.total_cash)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">ContraEntrega:</span>
                    <span class="summary-value">$ ${formatCurrency(closeData.total_cod)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Crédito:</span>
                    <span class="summary-value">$ ${formatCurrency(closeData.total_credit)}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">TOTAL CIERRE:</span>
                    <span class="summary-value">$ ${formatCurrency(closeData.total_amount)}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">TOTAL GUÍAS:</span>
                    <span class="summary-value">${closeData.total_guides}</span>
                </div>
            </div>

            <div class="info-box">
                <h3>INFORMACIÓN GUÍA</h3>
                <div class="info-row">Impresión: ${currentDate} ${currentTime}</div>
                <div class="info-row">Tipo de Período: ${translatePeriodType(closeData.period_type)}</div>
                <div class="info-row">Fecha Inicio Proceso: ${formatDate(closeData.start_date)}</div>
                <div class="info-row">Fecha Final Proceso: ${formatDate(closeData.end_date)}</div>
                <div class="info-row">Total Unidades: ${closeData.total_units}</div>
                <div class="info-row">Total Pesos: ${closeData.total_weight.toFixed(2)} kg</div>
                <hr style="margin: 6px 0; border: 0; border-top: 1px solid #666;">
                <div class="info-row">Fletes: $ ${formatCurrency(closeData.total_freight)}</div>
                <div class="info-row">Otros: $ ${formatCurrency(closeData.total_other)}</div>
            </div>
        </div>

        ${generateDetailsTable('FORMA DE PAGO C O N T A D O', cashDetails)}
        ${generateDetailsTable('FORMA DE PAGO CONTRAENTREGA', codDetails)}
        ${generateDetailsTable('FORMA DE PAGO C R É D I T O', creditDetails)}

        <div class="footer">
            <div class="footer-info">S.I.M.A - Administrativo - simasoftapl@gmail.com</div>
            <div class="page-number">Página 1</div>
        </div>
    </div>
</body>
</html>
  `;
}

module.exports = { generateCashCloseHtml };