function generateGuideHtml(datos, numGuia, barcodeUrl, logoBase64) {
  const optionsDate = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true };

  const currentDate = new Date().toLocaleDateString('es-CO', optionsDate);
  const currentTime = new Date().toLocaleTimeString('es-CO', optionsTime);

  const remitente = datos.remitente || {};
  const destinatario = datos.destinatario || {};
  const detalle = datos.detalle || {};

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return amount.toLocaleString("es-CO"); 
  };

  const copyTypes = ['ORIGINAL - DESTINATARIO', 'REMITENTE', 'TRANSPORTADORA'];

  const sections = copyTypes.map(copyType => {
    return `
      <div class="guide-section">
        <div class="header">
          <div class="header-left">
            <div>Multientregas expres HNH SAS - NIT: 901686492-2</div>
            <div>Fecha: ${currentDate} ${currentTime}</div>
          </div>

          <div class="header-center">
            <div class="company-logo">
              ${logoBase64 
                ? `<img src="${logoBase64}" alt="Logo SOLUCIONES"/>` 
                : 'SOLUCIONES'}
            </div>
          </div>

          <div class="header-right">
            <div class="barcode-container">
              <img src="${barcodeUrl}" alt="Barcode"/>
            </div>
            <div class="guide-number">${numGuia}</div>
          </div>
        </div>

        <div class="payment-line">
          <span><strong>MÉTODO PAGO:</strong> <span class="payment-value">${detalle.metodoPago || ''}</span></span>
          <span><strong>Tipo Envío:</strong> ${detalle.tipoEnvio || ''}</span>
          <span><strong>Clase Productos:</strong> ${detalle.claseProducto || ''}</span>
        </div>

        <div class="content-wrap">
          <div class="left-yellow">
            <span>COPIA<br>${copyType.split(' - ')[0]}</span>
          </div>

          <div class="center-content">
            <div class="parties-section">
              <div class="party-section">
                <div class="party-title">REMITENTE</div>
                <div class="party-info">
                  <div><strong>CIUDAD:</strong> <span class="city-value">${remitente.ciudad || ''}</span></div>
                  <div><strong>NOMBRE:</strong> ${remitente.nombre || ''}</div>
                  <div><strong>CC/NIT:</strong> ${remitente.numeroDocumento || ''}</div>
                  <div><strong>DIRECCIÓN:</strong> ${remitente.direccion || ''}</div>
                  <div><strong>TELÉFONO:</strong> ${remitente.telefono || ''}</div>
                </div>
              </div>

              <div class="party-section">
                <div class="party-title">DESTINATARIO</div>
                <div class="party-info">
                  <div><strong>CIUDAD:</strong> <span class="city-value">${destinatario.ciudad || ''}</span></div>
                  <div><strong>NOMBRE:</strong> ${destinatario.nombre || ''}</div>
                  <div><strong>CC/NIT:</strong> ${destinatario.numeroDocumento || ''}</div>
                  <div><strong>DIRECCIÓN:</strong> ${destinatario.direccion || ''}</div>
                  <div><strong>TELÉFONO:</strong> ${destinatario.telefono || ''}</div>
                </div>
              </div>
            </div>

            <div class="financial-details">
              <div><strong>Valor Declarado:</strong> $ ${formatCurrency(detalle.valorDeclarado)} - <strong>PESO:</strong> ${detalle.peso || 0} kg</div>
              <div><strong>Flete:</strong> $ ${formatCurrency(detalle.flete)} - <strong>Otros:</strong> $ ${formatCurrency(detalle.otros)} - <strong>Seguro:</strong> $0</div>
            </div>

            <div class="bottom-section">
              <div class="guide-info">
                <div><strong>Nro Guía:</strong> ${numGuia}</div>
                <div class="pieces-info">
                  <div><strong>PIEZAS:</strong> ${detalle.numPiezas || 0}</div>
                  <div class="disclaimer">
                    <strong>Descripción:</strong> ${detalle.descripcion || ''}
                  </div>
                </div>
              </div>

              <div class="total-box">
                <div class="total-label">TOTAL A PAGAR</div>
                <div class="total-amount">$ ${formatCurrency(detalle.total)}</div>
              </div>

              <div class="observations">
                <div><strong>Observaciones:</strong></div>
                <div class="observations-box">${detalle.observaciones || ''}</div>
              </div>
            </div>
          </div>

          <div class="right-yellow"><span>GUÍA DE<br>TRANSPORTE</span></div>
        </div>

        <div class="signatures">
          <div class="signature-block">
            <div style="display:flex; align-items:flex-end;">
              <span class="signature-label">Firma Remitente:</span>
              <span class="signature-line"></span>
            </div>
            <div class="signature-extra">Cédula:</div>
          </div>

          <div class="signature-block">
            <div style="display:flex; align-items:flex-end;">
              <span class="signature-label">Firma Destinatario:</span>
              <span class="signature-line"></span>
            </div>
            <div class="signature-extra">Cédula:</div>
          </div>
        </div>

        <div class="legal-footer">
          <div>
            <div><strong>Fecha de Impresión:</strong> ${currentDate}, ${currentTime}</div>
            <div style="font-size:8px; margin-top:3px;">
              AL FIRMAR A CONFORMIDAD, NO NOS HACEMOS RESPONSABLE POR DAÑOS O PERJUICIOS
            </div>
            <div class="company-info">Multientregas expres HNH SAS - multientregas23@gmail.com</div>
          </div>
          <div class="contact-message">
            Contáctanos al número: 3132713069
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8"/>
    <title>Guía de Transporte</title>
    <style>${getGuideStyles()}</style>
  </head>
  <body>
    <div class="print-wrapper">${sections}</div>
  </body>
  </html>
  `;
}

function getGuideStyles() {
  return `
    @page { 
      size: Legal portrait; 
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body { 
      font-family: Arial, sans-serif; 
      font-size: 8px; 
      margin: 0; 
      padding: 3mm;
      background: white; 
      color: #000; 
      width: 100%; 
      height: 100%;
    }
    
    .print-wrapper { 
      display: flex; 
      flex-direction: column; 
      gap: 2mm;
      height: 100%;
    }
    
    .guide-section { 
      border: 1.2px solid #000; 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      background: #fff; 
      width: 100%; 
      page-break-inside: avoid; 
      position: relative; 
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 4px 8px; 
      border-bottom: 1px solid #000;
      min-height: 50px;
    }
    
    .header-left { 
      flex: 1 1 33%; 
      text-align: left; 
      font-size: 7px; 
      line-height: 1.3;
    }
    
    .header-center { 
      flex: 1 1 34%; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
    }
    
    .company-logo img { 
      width: 90px; 
      height: auto; 
      display: block; 
    }
    
    .header-right { 
      flex: 1 1 33%; 
      display: flex; 
      flex-direction: column; 
      align-items: flex-end; 
      gap: 2px; 
    }
    
    .barcode-container img { 
      height: 38px; 
      width: auto; 
      display: block; 
    }
    
    .guide-number { 
      color: #000; 
      padding: 3px 8px; 
      font-size: 11px; 
      font-weight: 600; 
      letter-spacing: 0.5px; 
    }
    
    .payment-line { 
      border-bottom: 1px solid #000; 
      padding: 3px 0; 
      display: flex; 
      justify-content: center; 
      gap: 10px; 
      font-size: 7.5px;
      min-height: 20px;
    }
    
    .payment-line span { 
      display: inline-block; 
      min-width: 80px; 
      text-align: center; 
    }
    
    .payment-value { 
      color: #1e40af; 
      font-weight: 700; 
      text-transform: uppercase; 
      font-size: 8px; 
    }
    
    .content-wrap { 
      display: flex; 
      flex: 1;
    }
    
    .left-yellow { 
      width: 22px; 
      background: #1e40af; 
      border-right: 1px solid #000; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      writing-mode: vertical-rl; 
      transform: rotate(180deg); 
      font-weight: 700; 
      color: #fff; 
      font-size: 7px; 
      padding: 4px 0; 
    }
    
    .right-yellow { 
      width: 22px; 
      background: #1e40af; 
      border-left: 1px solid #000; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      writing-mode: vertical-rl; 
      font-weight: 700; 
      color: #fff; 
      font-size: 7px; 
      padding: 4px 0; 
    }
    
    .center-content { 
      flex: 1; 
      padding: 5px 8px; 
      box-sizing: border-box; 
      border-bottom: 1.2px solid #000;
      display: flex;
      flex-direction: column;
    }
    
    .parties-section { 
      display: flex; 
      gap: 6px; 
      margin-bottom: 3px; 
    }
    
    .party-section { 
      flex: 1; 
      font-size: 7px;
      line-height: 1.4;
    }
    
    .party-title { 
      font-weight: 900; 
      text-decoration: underline; 
      color: #1e40af; 
      margin-bottom: 2px; 
      font-size: 8px; 
    }
    
    .party-info div { 
      margin-bottom: 1px; 
    }
    
    .city-value { 
      color: #1e40af; 
      font-weight: 700; 
      text-transform: uppercase; 
      font-size: 7px; 
    }
    
    .financial-details { 
      display: flex; 
      justify-content: space-between; 
      font-size: 7px; 
      padding: 3px 0; 
      border-bottom: 1px solid #ddd;
      line-height: 1.3;
    }
    
    .bottom-section { 
      display: flex; 
      align-items: flex-start; 
      justify-content: space-between; 
      gap: 6px; 
      margin-top: 4px;
      flex: 1;
    }
    
    .guide-info { 
      flex: 1; 
      font-size: 7px;
      line-height: 1.4;
    }
    
    .pieces-info { 
      margin-top: 3px; 
    }
    
    .disclaimer { 
      margin-top: 3px; 
      font-size: 7px; 
    }
    
    .total-box { 
      background: #1e40af; 
      border: 1.5px solid #000; 
      padding: 6px 8px; 
      color: #fff; 
      min-width: 90px; 
      text-align: center;
      align-self: flex-start;
    }
    
    .total-label { 
      font-weight: 700; 
      font-size: 7.5px; 
    }
    
    .total-amount { 
      font-weight: 800; 
      font-size: 13px; 
      margin-top: 2px; 
    }
    
    .observations { 
      width: 100px; 
      font-size: 7px; 
    }
    
    .observations-box { 
      border: 1px solid #000; 
      padding: 3px; 
      min-height: 28px; 
      font-size: 6.5px; 
      background: #fff;
      line-height: 1.3;
    }
    
    .signatures { 
      display: flex; 
      justify-content: space-between; 
      gap: 20px; 
      width: 100%; 
      padding: 8px 10px 3px;
      border-bottom: 1px solid #000;
    }
    
    .signature-block { 
      display: flex; 
      flex-direction: column; 
      font-size: 7.5px; 
      flex: 1;
    }
    
    .signature-label { 
      font-weight: bold; 
      margin-right: 6px; 
      white-space: nowrap; 
    }
    
    .signature-line {
      flex: 1;
      height: 14px; 
      border-bottom: 1px solid #000;
    }
    
    .signature-extra {
      margin-top: 2px;
      font-size: 7.5px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    
    .legal-footer { 
      border-top: 1px solid #000; 
      padding: 3px 6px; 
      font-size: 6.5px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: #f8f8f8;
      line-height: 1.3;
    }
    
    .contact-message {
      text-align: center;
      margin-top: 4px;
      font-size: 7px;
      font-weight: bold;
    }
    
    .company-info {
      font-size: 6.5px;
    }
  `;
}

module.exports = { generateGuideHtml };