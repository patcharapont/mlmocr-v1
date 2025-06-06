export async function onRequestPost({ request }) {
  try {
    console.log("📥 รับคำขอ OCR");

    const body = await request.json();
    const imageUrl = body.url;
    console.log("🔗 URL ภาพ:", imageUrl);

    if (!imageUrl) {
      console.log("⛔ ไม่มี URL ใน body");
      return new Response(JSON.stringify({ error: "Missing 'url' in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const authHeader = request.headers.get('Authorization') || '';
    console.log("🔐 มี Authorization header หรือไม่:", !!authHeader);

    const res = await fetch(imageUrl, {
      headers: { Authorization: authHeader }
    });

    if (!res.ok) {
      console.log("❌ โหลดภาพไม่สำเร็จ:", res.status);
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log("📦 โหลดภาพสำเร็จ - ขนาด (bytes):", uint8Array.length);

    let Tesseract;
    try {
      console.log("⚙️ กำลังโหลด Tesseract จาก CDN...");
      const tesseractCode = await fetch("https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js").then(r => r.text());
      const injected = new Function(`${tesseractCode}; return Tesseract;`)();
      if (!injected) throw new Error("Tesseract failed to load");
      Tesseract = injected;
      console.log("✅ โหลด Tesseract สำเร็จ");
    } catch (e) {
      console.log("❌ โหลด Tesseract ล้มเหลว:", e.message);
      return new Response(JSON.stringify({ error: "Tesseract load error: " + e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("🔠 เริ่มประมวลผล OCR...");
    const result = await Tesseract.recognize(uint8Array, 'tha+eng', {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
      cacheMethod: 'none',
    });

    const text = result.data.text;
    console.log("✅ สำเร็จ: OCR ข้อความบางส่วน:", text?.slice(0, 80) || "(ไม่มีข้อมูล)");

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("🔥 Error ใน try หลัก:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
