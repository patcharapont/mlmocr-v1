export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const imageUrl = body.url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const res = await fetch(imageUrl, {
      headers: { Authorization: authHeader }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const tesseractCode = await fetch("https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js").then(r => r.text());
    new Function(tesseractCode)();

    const result = await Tesseract.recognize(uint8Array, 'tha+eng', {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
      cacheMethod: 'none',
    });

    return new Response(JSON.stringify({ text: result.data.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
