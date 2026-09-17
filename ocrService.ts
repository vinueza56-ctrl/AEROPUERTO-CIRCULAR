import { BalanceOcrResult } from '../types';

export async function analyzeScaleImage(
  imageBase64: string,
  declaredWeight?: number
): Promise<BalanceOcrResult> {
  try {
    const response = await fetch('/api/ocr-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        declaredWeight,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        detected_weight: data.detected_weight ?? null,
        confidence: data.confidence ?? 0,
        display_readable: Boolean(data.display_readable),
        visual_notes: data.visual_notes || '',
        ocr_status: data.ocr_status || 'manual_review',
        match: Boolean(data.match),
        alert_message: data.alert_message || 'Lectura de balanza procesada.',
      };
    }
  } catch (error) {
    console.warn('Error al llamar al servicio OCR en servidor:', error);
  }

  // Safe fallback: never infer a match from the declared value when OCR is unavailable.
  // The administrator must review the original photograph manually.
  return {
    detected_weight: null,
    confidence: 0,
    display_readable: false,
    visual_notes: 'No fue posible ejecutar la lectura automática de la balanza.',
    ocr_status: 'manual_review',
    match: false,
    alert_message: 'Lectura automática no disponible. Revisión manual de la fotografía requerida.',
  };
}
