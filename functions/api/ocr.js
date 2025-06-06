// File: functions/api/ocr.js (for Cloudflare Pages Functions - Debug v1)

import { recognize } from '@tesseract.js/core';
import { createWorker } from '@tesseract.js/core';

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const imageUrl = body.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authHeader = request.headers.get('Authorization') || '';

    const imageRes = await fetch(imageUrl, {
      headers: { Authorization: authHeader },
    });

    if (!imageRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch image. HTTP ${imageRes.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = await imageRes.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const worker = await createWorker('eng+tha');
    const result = await worker.recognize(uint8);
    await worker.terminate();

    return new Response(JSON.stringify({ text: result.data.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
