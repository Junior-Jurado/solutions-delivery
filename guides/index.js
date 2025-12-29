const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getConnection } = require("./connection");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET || "guia-app-pdfs";

let LOGO_BASE64 = null;
try {
  const logoPath = path.join(__dirname, 'assets', 'logo.png');
  const logoBuffer = fs.readFileSync(logoPath);
  LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  console.log("Logo cargado correctamente");
} catch (err) {
  console.warn("No se pudo cargar el logo, usando texto por defecto:", err.message);
}

exports.handler = async (event) => {
  console.log("Evento recibido:", JSON.stringify(event));

  console.log("SECRET NAME:", process.env.DB_SECRET_NAME)


  if (event?.warmup) {
    console.log('Warmup ping');
    return { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
  }

  let browser = null;
  let connection = null;
  let guide_id = null;

  try {
    // Parse del body
    let datos;
    if (typeof event.body === 'string') {
      datos = JSON.parse(event.body);
      console.log("Body parseado:", JSON.stringify(datos));
    } else {
      datos = event;
    }

    // Validación básica
    if (!datos.sender || !datos.receiver || !datos.package || !datos.pricing) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: "Faltan campos requeridos: sender, receiver, package, pricing"
        })
      };
    }

    const { pricing, service, route,sender, receiver, package: package_data, created_by } = datos;



    // Conectar a la base de datos
    connection = await getConnection();
    console.log("Tipo de connection:", Object.getOwnPropertyNames(Object.getPrototypeOf(connection)));

    await connection.beginTransaction();
    console.log("Conexión a la base de datos establecida");

    /* -------------------------------------------------
       1️⃣ INSERT SHIPPING GUIDE
    ------------------------------------------------- */
    const [guide_result] = await connection.execute(
      `INSERT INTO shipping_guides
      (
        service_type,
        payment_method,
        declared_value,
        price,
        origin_city_id,
        destination_city_id,
        current_status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, 'CREATED', ?)`,
      [
        service.service_type,                 // 'NORMAL'
        service.payment_method || 'CONTADO',  // default
        pricing.declared_value,
        pricing.price,
        route.origin_city_id,
        route.destination_city_id,
        created_by
      ]
    );

    guide_id = guide_result.insertId;
    console.log("Guía creada con ID:", guide_id);

    /* -------------------------------------------------
       2️⃣ INSERT GUIDE PARTIES (SENDER / RECEIVER)
    ------------------------------------------------- */
    const parties = [
      { role: 'SENDER', data: sender },
      { role: 'RECEIVER', data: receiver }
    ];

    for (const party of parties) {
      await connection.execute(
        `INSERT INTO guide_parties
        (
          guide_id,
          party_role,
          full_name,
          document_type,
          document_number,
          phone,
          email,
          address,
          city_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guide_id,
          party.role,
          party.data.full_name,
          party.data.document_type,
          party.data.document_number,
          party.data.phone,
          party.data.email || null,
          party.data.address,
          party.data.city_id
        ]
      );
    }


    console.log("Partes (remitente/destinatario) insertadas");

    /* -------------------------------------------------
       3️⃣ INSERT PACKAGE
    ------------------------------------------------- */
    await connection.execute(
      `INSERT INTO packages
      (
        guide_id,
        weight_kg,
        pieces,
        length_cm,
        width_cm,
        height_cm,
        insured,
        description,
        special_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guide_id,
        package_data.weight_kg,
        package_data.pieces || 1,
        package_data.length_cm,
        package_data.width_cm,
        package_data.height_cm,
        package_data.insured || false,
        package_data.description || null,
        package_data.special_notes || null
      ]
    );

    console.log("Paquete insertado");

    /* -------------------------------------------------
       4️⃣ INSERT INITIAL STATUS
    ------------------------------------------------- */
    await connection.execute(
      `INSERT INTO guide_status_history
      (guide_id, status, updated_by)
      VALUES (?, 'CREATED', ?)`,
      [
        guide_id,
        created_by
      ]
    );

    console.log("Estado inicial insertado");

    /* -------------------------------------------------
       5️⃣ OBTENER DATOS COMPLETOS PARA EL PDF (con nombres de ciudades)
    ------------------------------------------------- */
    const [guideData] = await connection.execute(
      `SELECT
        sg.guide_id,
        sg.service_type,
        sg.price,
        sg.declared_value,

        sender.full_name  AS sender_name,
        sender.document_type AS sender_doc_type,
        sender.document_number AS sender_doc_number,
        sender.phone AS sender_phone,
        sender.address AS sender_address,
        sender_city.name AS sender_city_name,

        receiver.full_name AS receiver_name,
        receiver.document_type AS receiver_doc_type,
        receiver.document_number AS receiver_doc_number,
        receiver.phone AS receiver_phone,
        receiver.address AS receiver_address,
        receiver_city.name AS receiver_city_name,

        p.weight_kg,
        p.pieces,
        p.description,
        p.special_notes

      FROM shipping_guides sg

      LEFT JOIN guide_parties sender
        ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'

      LEFT JOIN guide_parties receiver
        ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'

      LEFT JOIN cities sender_city
        ON sender.city_id = sender_city.id

      LEFT JOIN cities receiver_city
        ON receiver.city_id = receiver_city.id

      LEFT JOIN packages p
        ON sg.guide_id = p.guide_id

      WHERE sg.guide_id = ?`,
      [guide_id]
    );

    if (!guideData.length) {
      throw new Error("No se pudieron recuperar los datos de la guía");
    }

    const fullGuideData = guideData[0];
    console.log("Datos completos de la guía obtenidos");

    await connection.commit();
    console.log("Transacción comprometida exitosamente");

    /* -------------------------------------------------
       6️⃣ GENERAR PDF
    ------------------------------------------------- */
    const numGuia = String(guide_id).padStart(8, '0');
    console.log("Generando PDF para guía:", numGuia);

    const chromiumPath = await chromium.executablePath();
    console.log("Path de Chromium:", chromiumPath);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: chromiumPath,
      headless: chromium.headless,
    });
    console.log("Browser lanzado correctamente");

    const page = await browser.newPage();
    console.log("Página creada correctamente");

    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${numGuia}&scale=3&height=15`;
    
    // Preparar datos para el template
    const datosParaPdf = {
      remitente: {
        ciudad: fullGuideData.sender_city_name,
        nombre: fullGuideData.sender_name,
        numeroDocumento: `${fullGuideData.sender_doc_type} ${fullGuideData.sender_doc_number}`,
        direccion: fullGuideData.sender_address,
        telefono: fullGuideData.sender_phone
      },
      destinatario: {
        ciudad: fullGuideData.receiver_city_name,
        nombre: fullGuideData.receiver_name,
        numeroDocumento: `${fullGuideData.receiver_doc_type} ${fullGuideData.receiver_doc_number}`,
        direccion: fullGuideData.receiver_address,
        telefono: fullGuideData.receiver_phone
      },
      detalle: {
        metodoPago: service.payment_method || 'CONTADO',
        tipoEnvio: service.shipping_type || 'TERRESTRE',
        claseProducto: fullGuideData.description || 'GENERAL',
        valorDeclarado: pricing.declared_value,
        peso: package_data.weight_kg,
        flete: pricing.price,
        otros: 0,
        total: pricing.price,
        numPiezas: fullGuideData.pieces,
        descripcion: fullGuideData.description,
        observaciones: fullGuideData.special_notes || ''
      }
    };

    const html = generateHtmlTemplate(datosParaPdf, numGuia, barcodeUrl, LOGO_BASE64);
    console.log("HTML listo para renderizar");

    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("HTML cargado en la página");

    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "Legal",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '3mm',
        right: '3mm',
        bottom: '3mm',
        left: '3mm'
      }
    });
    console.log("PDF generado correctamente, tamaño (bytes):", pdfBuffer.length);

    /* -------------------------------------------------
       7️⃣ SUBIR PDF A S3
    ------------------------------------------------- */
    const fileName = `guias/guia-${numGuia}.pdf`;
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(uploadCommand);
    console.log("PDF subido a S3:", fileName);

    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 1800 });
    console.log("URL firmada generada");

    // Actualizar la guía con la URL del PDF
    await connection.execute(
      `UPDATE shipping_guides
      SET pdf_url = ?, pdf_s3_key = ?
      WHERE guide_id = ?`,
      [signedUrl, fileName, guide_id]
    );

    /* -------------------------------------------------
       8️⃣ RESPUESTA EXITOSA
    ------------------------------------------------- */
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        guide_id,
        guide_number: numGuia,
        pdf_url: signedUrl,
        s3_key: fileName,
        pdf_size: pdfBuffer.length,
        message: "Guía creada y PDF generado exitosamente"
      })
    };

  } catch (error) {
    console.error("Error en el proceso:", error);
    console.error("Stack trace:", error.stack);

    // Rollback de la base de datos si hay error
    if (connection) {
      try {
        await connection.rollback();
        console.log("Rollback ejecutado");
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Error en el proceso de creación de guía",
        details: error.message,
        guide_id: guide_id
      })
    };

  } finally {
    // Cerrar conexión a la base de datos
    if (connection) {
      try {
        await connection.release();
        console.log("Conexión a DB cerrada");
      } catch (closeErr) {
        console.error("Error cerrando conexión DB:", closeErr);
      }
    }

    // Cerrar browser
    if (browser) {
      try {
        await browser.close();
        console.log("Browser cerrado correctamente");
      } catch (closeErr) {
        console.error("Error cerrando el browser:", closeErr);
      }
    }
  }
};

function generateHtmlTemplate(datos, numGuia, barcodeUrl, logoBase64) {
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
                ? `<img src="${logoBase64}" alt="Logo MEX"/>` 
                : 'MEX'}
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
    <style>${getStyles()}</style>
  </head>
  <body>
    <div class="print-wrapper">${sections}</div>
  </body>
  </html>
  `;
}

function getStyles() {
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