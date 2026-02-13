const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getConnection } = require("./connection");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generateGuideHtml } = require("./guideTemplate");

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET || "guia-app-pdfs";

async function createGuide(datos, logoBase64, userUUID) {
  console.log("=== Iniciando creación de guía ===");

  let browser = null;
  let connection = null;
  let guide_id = null;

  try {
    // Validación básica
    if (!datos.sender || !datos.receiver || !datos.package || !datos.pricing) {
      throw new Error("Faltan campos requeridos: sender, receiver, package, pricing");
    }

    const { pricing, service, route, sender, receiver, package: package_data, created_by } = datos;

    // Conectar a la base de datos
    connection = await getConnection();
    console.log("Conexión a DB establecida");

    // ==========================================
    // PRICE OVERRIDE SECURITY
    // ==========================================
    const submittedPrice = pricing.price;

    // Validate price is not negative
    if (submittedPrice < 0) {
      throw new Error("El precio no puede ser negativo");
    }

    // Recalculate price server-side using shipping_rates table
    let calculatedPrice = 0;
    try {
      calculatedPrice = await calculateServerPrice(
        connection,
        route.origin_city_id,
        route.destination_city_id,
        service.service_type,
        package_data.weight_kg,
        package_data.length_cm || 0,
        package_data.width_cm || 0,
        package_data.height_cm || 0
      );
      console.log("Precio calculado server-side:", calculatedPrice, "Precio enviado:", submittedPrice);
    } catch (calcErr) {
      console.warn("No se pudo calcular precio server-side:", calcErr.message);
    }

    // Determine final price and check for override
    let finalPrice = submittedPrice;
    let priceOverride = null;

    if (calculatedPrice > 0 && submittedPrice !== calculatedPrice) {
      // Price differs - verify user is ADMIN
      const userRole = userUUID ? await getUserRole(connection, userUUID) : null;

      if (!userRole || userRole !== 'ADMIN') {
        throw new Error("Solo administradores pueden modificar el precio calculado");
      }

      // Validate: price cannot be $0 if calculation gives > 0
      if (submittedPrice === 0 && calculatedPrice > 0) {
        throw new Error("El precio no puede ser $0 cuando el cálculo arroja un valor mayor");
      }

      // Validate: discount cannot exceed 50%
      if (submittedPrice < calculatedPrice * 0.5) {
        throw new Error("El descuento no puede ser mayor al 50% del precio calculado");
      }

      // Validate: reason is required for override
      const overrideReason = pricing.override_reason || '';
      if (!overrideReason.trim()) {
        throw new Error("Debe proporcionar una razón para modificar el precio");
      }

      finalPrice = submittedPrice;
      priceOverride = {
        originalPrice: calculatedPrice,
        newPrice: submittedPrice,
        reason: overrideReason,
        overriddenBy: userUUID
      };
      console.log("Price override registrado:", priceOverride);
    } else if (calculatedPrice > 0) {
      // Use server-calculated price (no override)
      finalPrice = calculatedPrice;
    }
    // If calculatedPrice is 0 (no rate found), use submitted price as fallback

    await connection.beginTransaction();

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
        service.service_type,
        service.payment_method || 'CONTADO',
        pricing.declared_value,
        finalPrice,
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
    console.log("Partes insertadas");

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
      [guide_id, created_by]
    );
    console.log("Estado inicial insertado");

    /* -------------------------------------------------
       5️⃣ OBTENER DATOS COMPLETOS PARA EL PDF
    ------------------------------------------------- */
    const [guideData] = await connection.execute(
      `SELECT
        sg.guide_id,
        sg.service_type,
        sg.price,
        sg.declared_value,
        sender.full_name AS sender_name,
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
      LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
      LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
      LEFT JOIN cities sender_city ON sender.city_id = sender_city.id
      LEFT JOIN cities receiver_city ON receiver.city_id = receiver_city.id
      LEFT JOIN packages p ON sg.guide_id = p.guide_id
      WHERE sg.guide_id = ?`,
      [guide_id]
    );

    if (!guideData.length) {
      throw new Error("No se pudieron recuperar los datos de la guía");
    }

    const fullGuideData = guideData[0];
    console.log("Datos completos obtenidos");

    // Save price override record if applicable
    if (priceOverride) {
      await connection.execute(
        `INSERT INTO guide_price_overrides
        (guide_id, original_price, new_price, reason, overridden_by)
        VALUES (?, ?, ?, ?, ?)`,
        [
          guide_id,
          priceOverride.originalPrice,
          priceOverride.newPrice,
          priceOverride.reason,
          priceOverride.overriddenBy
        ]
      );
      console.log("Price override guardado en BD");
    }

    await connection.commit();
    console.log("Transacción comprometida");

    /* -------------------------------------------------
       6️⃣ GENERAR PDF
    ------------------------------------------------- */
    const numGuia = String(guide_id).padStart(8, '0');
    console.log("Generando PDF para guía:", numGuia);

    const chromiumPath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: chromiumPath,
      headless: chromium.headless,
    });
    console.log("Browser lanzado");

    const page = await browser.newPage();
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

    const html = generateGuideHtml(datosParaPdf, numGuia, barcodeUrl, logoBase64);
    await page.setContent(html, { waitUntil: "networkidle0" });
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
    console.log("PDF generado, tamaño:", pdfBuffer.length);

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

    // Actualizar la guía con la URL del PDF
    await connection.execute(
      `UPDATE shipping_guides SET pdf_url = ?, pdf_s3_key = ? WHERE guide_id = ?`,
      [signedUrl, fileName, guide_id]
    );

    // Cerrar browser
    await browser.close();
    console.log("Browser cerrado");

    return {
      guide_id,
      guide_number: numGuia,
      pdf_url: signedUrl,
      s3_key: fileName,
      pdf_size: pdfBuffer.length
    };

  } catch (error) {
    console.error("Error en creación de guía:", error);
    
    // Rollback si hay error
    if (connection) {
      try {
        await connection.rollback();
        console.log("Rollback ejecutado");
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }
    
    throw error;

  } finally {
    // Cerrar conexión
    if (connection) {
      try {
        await connection.release();
        console.log("Conexión DB cerrada");
      } catch (closeErr) {
        console.error("Error cerrando conexión:", closeErr);
      }
    }

    // Cerrar browser si quedó abierto
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error cerrando browser:", closeErr);
      }
    }
  }
}

/**
 * Recalculates shipping price server-side using shipping_rates table.
 * Mirrors the Go logic in bd/shipping_rates.go
 */
async function calculateServerPrice(connection, originCityId, destinationCityId, serviceType, weightKg, lengthCm, widthCm, heightCm) {
  const [rates] = await connection.execute(
    `SELECT price_per_kg, min_value
     FROM shipping_rates
     WHERE origin_city_id = ? AND destination_city_id = ?
     LIMIT 1`,
    [originCityId, destinationCityId]
  );

  if (!rates.length) {
    throw new Error("No shipping rate found for this route");
  }

  const rate = rates[0];

  // MENSAJERIA: flat min_value
  if (serviceType === 'MENSAJERIA') {
    return parseFloat(rate.min_value);
  }

  // PAQUETERIA: use billable weight (max of real weight vs volumetric)
  const volumetric = (lengthCm || 0) * (widthCm || 0) * (heightCm || 0);
  const billableWeight = Math.max(weightKg || 0, volumetric);
  const price = billableWeight * 400 * parseFloat(rate.price_per_kg);

  return price;
}

/**
 * Gets the role of a user by their UUID from the users table.
 */
async function getUserRole(connection, userUUID) {
  const [rows] = await connection.execute(
    `SELECT role FROM users WHERE user_uuid = ? LIMIT 1`,
    [userUUID]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0].role;
}

module.exports = { createGuide };