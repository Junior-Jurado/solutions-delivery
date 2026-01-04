const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generateCashCloseHtml } = require("./cashCloseTemplate");

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET || "guia-app-pdfs";

async function generateCashClosePDF(closeData, details, logoBase64) {
  console.log("=== Iniciando generación de PDF de Cierre de Caja ===");
  console.log("Close ID:", closeData.close_id);
  console.log("Total de detalles:", details.length);

  let browser = null;

  try {
    // Generar número de cierre formateado
    const numCierre = String(closeData.close_id).padStart(8, '0');
    console.log("Número de cierre:", numCierre);

    // Lanzar browser
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

    // Generar HTML
    const html = generateCashCloseHtml(closeData, details, logoBase64);
    console.log("HTML del cierre generado");

    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("HTML cargado en la página");

    await page.emulateMediaType("screen");

    // Generar PDF en modo landscape (horizontal)
    const pdfBuffer = await page.pdf({
      format: "Letter",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    console.log("PDF generado correctamente, tamaño (bytes):", pdfBuffer.length);

    // Subir a S3 organizado por año/mes
    const closeDate = new Date(closeData.start_date);
    const year = closeDate.getFullYear();
    const month = String(closeDate.getMonth() + 1).padStart(2, '0');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    const fileName = `cash-closes/${year}/${month}/close_${numCierre}_${timestamp}.pdf`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(uploadCommand);
    console.log("PDF subido a S3:", fileName);

    // Generar URL pre-firmada (válida por 7 días)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 7 * 24 * 60 * 60 // 7 días en segundos
    });
    console.log("URL firmada generada (válida por 7 días)");

    // Cerrar browser
    await browser.close();
    console.log("Browser cerrado correctamente");

    return {
      pdf_url: signedUrl,
      s3_key: fileName,
      pdf_size: pdfBuffer.length
    };

  } catch (error) {
    console.error("Error generando PDF de cierre:", error);
    console.error("Stack trace:", error.stack);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error cerrando browser:", closeErr);
      }
    }
    
    throw error;
  }
}

module.exports = { generateCashClosePDF };