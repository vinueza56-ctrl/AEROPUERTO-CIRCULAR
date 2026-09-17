import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Support large payload for base64 balance images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Lazy initialization for Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    airport: "Aeropuerto Internacional Mariscal Sucre de Quito (UIO)",
    service: "Trazabilidad de Residuos Reciclables API",
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Balance Scale OCR Endpoint with Gemini 2.5 Flash
app.post("/api/ocr-balance", async (req, res) => {
  try {
    const { imageBase64, declaredWeight } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Se requiere la imagen de la balanza en base64.",
      });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        success: true,
        detected_weight: null,
        ocr_status: "manual_review",
        alert_message: "Lectura automática no disponible (API Key no configurada). Revisión manual requerida.",
        match: false,
      });
    }

    // Strip header if data URL
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const prompt = `Analiza detalladamente esta fotografía tomada en el Aeropuerto Internacional Mariscal Sucre de Quito como evidencia de pesaje de residuos.
Tu objetivo es examinar la pantalla digital o dial analógico de la balanza/báscula y extraer con precisión el valor numérico del peso mostrado en kilogramos (kg).

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin markdown adicional):
{
  "detected_weight": <número o null si no es legible>,
  "confidence": <número entre 0.0 y 1.0>,
  "display_readable": <true si se ve claramente el valor numérico, false si no>,
  "unit_detected": "<kg, lb, g u otro>",
  "visual_notes": "<breve descripción en español de lo que se observa en la balanza>"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { detected_weight: null, confidence: 0, display_readable: false };
    }

    const detectedWeight = typeof parsed.detected_weight === "number" ? parsed.detected_weight : null;
    let match = false;
    let ocrStatus: "match" | "mismatch" | "manual_review" = "manual_review";
    let alertMessage = "Lectura automática no disponible. Revisión manual requerida.";

    if (detectedWeight !== null) {
      if (typeof declaredWeight === "number" && !isNaN(declaredWeight)) {
        const diff = Math.abs(detectedWeight - declaredWeight);
        if (diff <= 0.25) {
          match = true;
          ocrStatus = "match";
          alertMessage = `Coincidencia confirmada (Balanza: ${detectedWeight.toFixed(2)} kg vs Declarado: ${declaredWeight.toFixed(2)} kg)`;
        } else {
          match = false;
          ocrStatus = "mismatch";
          alertMessage = `ALERTA: Revisar peso. Balanza detectó ${detectedWeight.toFixed(2)} kg pero se declararon ${declaredWeight.toFixed(2)} kg.`;
        }
      } else {
        ocrStatus = "match";
        alertMessage = `Peso detectado en balanza: ${detectedWeight.toFixed(2)} kg`;
      }
    } else {
      ocrStatus = "manual_review";
      alertMessage = parsed.visual_notes || "Lectura automática no disponible. Revisión manual requerida.";
    }

    return res.json({
      success: true,
      detected_weight: detectedWeight,
      confidence: parsed.confidence || 0,
      display_readable: Boolean(parsed.display_readable),
      visual_notes: parsed.visual_notes || "",
      ocr_status: ocrStatus,
      match,
      alert_message: alertMessage,
    });
  } catch (error: any) {
    console.error("Error al procesar OCR de balanza:", error);
    return res.json({
      success: true,
      detected_weight: null,
      ocr_status: "manual_review",
      alert_message: "Lectura automática no disponible. Revisión manual requerida.",
      match: false,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UIO CIRCULAR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
