/**
 * /api/generate-image
 *
 * Backend real de generación de imágenes para el Laboratorio de Imágenes
 * de Urgencia (Veloces / Dropi Brand Hub).
 *
 * Recibe una descripción + formato + distribución de color desde el
 * frontend, arma un prompt con las reglas fijas de marca, y llama a la
 * API de Gemini (modelo gemini-2.5-flash-image, "Nano Banana") para
 * fabricar una fotografía nueva y realista cada vez — nunca reutiliza
 * ninguna imagen subida por el diseñador.
 *
 * REQUIERE una variable de entorno GEMINI_API_KEY configurada en el
 * proyecto de Vercel (Project Settings → Environment Variables).
 * Consigue una clave gratis en https://aistudio.google.com/apikey
 * (tiene capa gratuita, ~500 imágenes/día; luego tiene costo por imagen).
 *
 * Despliegue: este archivo, junto con dashboard-creativo.html y
 * styles.css, se sube tal cual a un proyecto de Vercel. Vercel detecta
 * automáticamente cualquier archivo dentro de /api como función
 * serverless — no hace falta configuración adicional.
 */

const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/* Reglas fijas de marca — se inyectan SIEMPRE en el prompt, sin importar
   lo que pida el diseñador en la descripción. */
const BRAND_PROMPT_RULES = `
Marca: Veloces, transportadora de última milla para e-commerce en Colombia, México y Ecuador (veloces.app).
Esencia de marca: "Pasión por entregar bien" — velocidad, confiabilidad y flexibilidad.
Estilo obligatorio: FOTOGRAFÍA REALISTA (nunca ilustración, nunca 3D, nunca dibujo, nunca render estilizado). Debe verse como una foto publicitaria real, tomada con cámara profesional, con iluminación e imperfecciones naturales de una fotografía auténtica.
Paleta de marca a integrar en vestuario, empaques o elementos del entorno cuando sea posible: magenta (#FF0072) y blanco.
Encuadre: deja una zona limpia y despejada en el tercio superior de la imagen (sin elementos importantes ahí), porque encima se sobrepondrá el logo y el titular de la pieza.
No incluir texto, letras ni logotipos generados dentro de la propia imagen — el logo y el texto se agregan después, por separado.
`.trim();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Falta configurar la variable de entorno GEMINI_API_KEY en Vercel (Project Settings → Environment Variables) con una clave de https://aistudio.google.com/apikey',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { descripcion = '', format = 'post' } = body || {};

  const aspectRatio = format === 'historia' ? '9:16' : '4:5';
  const escena = descripcion.trim().length > 0
    ? descripcion.trim()
    : 'un mensajero de Veloces entregando un paquete a un cliente, con actitud rápida y confiable';

  const prompt = `Fotografía publicitaria realista para una campaña de Instagram y pauta paga.
Escena a fotografiar: ${escena}.
${BRAND_PROMPT_RULES}
Relación de aspecto de salida: ${aspectRatio}.`;

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: data?.error?.message || 'Error llamando a la API de Gemini.', detail: data });
      return;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      res.status(502).json({ error: 'El modelo no devolvió ninguna imagen. Intenta de nuevo o ajusta la descripción.', detail: data });
      return;
    }

    res.status(200).json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error de red llamando a la API de Gemini.', detail: String(err) });
  }
};
