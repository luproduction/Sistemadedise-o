# Laboratorio de Imágenes de Urgencia — conectar generación real de IA

Esta carpeta ya incluye todo lo necesario para que el fondo de cada pieza
se fabrique con una foto nueva generada por IA (Gemini / "Nano Banana"),
en vez de usar una foto de referencia subida a mano.

```
dashboard-creativo.html
styles.css
api/
  generate-image.js   ← backend serverless (nuevo)
```

## Paso 1 — Conseguir una clave de la API de Gemini

1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
2. Crea una API key (tiene capa gratuita: ~500 imágenes/día; después
   tiene un costo pequeño por imagen, alrededor de USD 0.04 c/u con el
   modelo `gemini-2.5-flash-image`).
3. Copia la clave — la vas a necesitar en el paso 3.

## Paso 2 — Subir el proyecto a Vercel

1. Entra a https://vercel.com (o crea una cuenta si no tenés).
2. "Add New… → Project" y subí esta misma carpeta (podés arrastrar los
   archivos, o subirlos a un repo de GitHub y conectarlo — cualquiera de
   las dos formas funciona).
3. No hace falta configurar nada más: Vercel detecta automáticamente que
   `api/generate-image.js` es una función serverless y que el resto son
   archivos estáticos.
4. Dale a "Deploy".

## Paso 3 — Agregar la clave como variable de entorno

1. Dentro del proyecto ya creado en Vercel: **Settings → Environment
   Variables**.
2. Agregá una variable llamada exactamente `GEMINI_API_KEY` con el valor
   de la clave del Paso 1.
3. Volvé a desplegar el proyecto (Vercel → Deployments → botón "Redeploy")
   para que la función tome la nueva variable.

## Listo

Una vez desplegado, abrí la URL que te dio Vercel (algo como
`tu-proyecto.vercel.app/dashboard-creativo.html`) y entrá al Laboratorio
de Imágenes de Urgencia. Al tocar "Generar propuestas", el sitio llama a
`/api/generate-image`, que arma el prompt con las reglas fijas de marca
(fondo fotográfico realista, colores Veloces, espacio limpio arriba para
el logo/titular) y le pide una foto nueva a Gemini — nunca reutiliza
ninguna imagen subida por el diseñador.

Si todavía no desplegaste el backend (por ejemplo, mientras probás el
archivo localmente), el sitio lo detecta solo y avisa con un mensaje
claro, cayendo de vuelta a una foto de referencia subida en el Paso 1
del asistente como respaldo temporal — nunca falla en silencio.

## Costos a tener en cuenta

Cada click en "Generar propuestas" hace **una** llamada a la API (la
misma imagen se usa para las 2 propuestas, con distinto tratamiento
gráfico), así que el costo por pieza generada es de aproximadamente
USD 0.04 con el modelo actual. Podés seguir regenerando tantas veces
como quieras hasta quedar conforme antes de descargar.
