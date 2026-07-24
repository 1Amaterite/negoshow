import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  try {
    const key = "AIzaSyAtlfWxhLcbRs15X8iPv_lz-0CkqtBbgb0";
    console.log("Key available:", !!key);
    
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.7 } });
    
    const prompt = "Hello, generate a tiny valid JSON array like [{\"test\":\"ok\"}]";
    console.log("Sending prompt...");
    const result = await model.generateContent(prompt);
    console.log("Response text:", result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
