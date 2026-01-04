const fs = require('fs');
const path = require('path');
const { createGuide } = require('./guideHandler');
const { generateCashClosePDF } = require('./cashCloseHandler');

// Cargar logo una sola vez
let LOGO_BASE64 = null;
try {
  const logoPath = path.join(__dirname, 'assets', 'logo.png');
  const logoBuffer = fs.readFileSync(logoPath);
  LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  console.log("Logo cargado correctamente");
} catch (err) {
  console.warn("No se pudo cargar el logo:", err.message);
}

exports.handler = async (event) => {
  console.log("=== Lambda PDF Generator ===");
  console.log("Evento recibido:", JSON.stringify(event));

  // Warmup ping
  if (event?.warmup) {
    console.log('Warmup ping recibido');
    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Lambda warmed up' }) 
    };
  }

  try {
    // Parse del body
    let datos;
    if (typeof event.body === 'string') {
      datos = JSON.parse(event.body);
    } else {
      datos = event;
    }

    // ROUTING: Determinar el tipo de operación
    if (datos.type === 'CASH_CLOSE') {
      console.log(">>> Tipo: CIERRE DE CAJA");
      return await handleCashClose(datos);
    } else {
      console.log(">>> Tipo: GUÍA DE TRANSPORTE");
      return await handleGuide(datos);
    }

  } catch (error) {
    console.error("Error general en handler:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Error en el procesamiento",
        details: error.message
      })
    };
  }
};

// ===================================
// HANDLER PARA GUÍA
// ===================================
async function handleGuide(datos) {
  try {
    const result = await createGuide(datos, LOGO_BASE64);

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ...result,
        message: "Guía creada y PDF generado exitosamente"
      })
    };

  } catch (error) {
    console.error("Error en handler de guía:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Error en el proceso de creación de guía",
        details: error.message
      })
    };
  }
}

// ===================================
// HANDLER PARA CIERRE DE CAJA
// ===================================
async function handleCashClose(datos) {
  try {
    // Validar datos requeridos
    if (!datos.close_data || !datos.details) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: "Faltan campos requeridos: close_data, details"
        })
      };
    }

    const { close_data, details } = datos;
    const result = await generateCashClosePDF(close_data, details, LOGO_BASE64);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        close_id: close_data.close_id,
        ...result,
        message: "PDF de cierre de caja generado exitosamente"
      })
    };

  } catch (error) {
    console.error("Error en handler de cierre:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Error generando PDF de cierre de caja",
        details: error.message
      })
    };
  }
}