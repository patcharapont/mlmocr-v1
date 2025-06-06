export async function onRequestPost({ request }) {
  try {
    console.log("📥 รับคำขอ OCR");

    const body = await request.json();
    const imageUrl = body.url;
    console.log("🔗 URL ภาพ:", imageUrl);

    if (!imageUrl) {
      console.log("⛔ ไม่มี URL ใน request");
      return new Response(JSON.stringify({ error: "Missing 'url' in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const authHeader = request.headers.get('Authorization') || '';
    console.log("🔐 Authorization header ถูกส่งมาหรือไม่:", !!authHeader);

    const res = await fetch(imageUrl, {
      headers: { Authorization: authHeader }
    });

    if (!res.ok) {
      console.log("❌ ไม่สามารถโหลดภาพได้:", res.status);
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log("📦 โหลดภาพสำเร็จ - ขนาด (bytes):", uint8Array.length);

    console.log("⚙️ กำลังโหลด Tesseract จาก CDN...");
    const tesseractCode = await fetch("https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js").then(r => r.text());
    new Function(tesseractCode)();
    console.log("✅ โหลด Tesseract สำเร็จ");

    console.log("🔠 เริ่มประมวลผล OCR...");
    const result = await Tesseract.recognize(uint8Array, 'tha+eng', {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
      cacheMethod: 'none'
    });

    console.log("✅ OCR เสร็จสิ้น:", result.data.text?.slice(0, 100) || "(ไม่มีข้อมูล)");

    return new Response(JSON.stringify({ text: result.data.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("🔥 เกิดข้อผิดพลาด:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
