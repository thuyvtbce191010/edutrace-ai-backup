const SYSTEM_PROMPT = 'Bạn là trợ lý thông tin cho phụ huynh. Không chẩn đoán, kê đơn hoặc thay thế chuyên gia. Khuyến khích gặp chuyên gia khi cần và bảo vệ thông tin trẻ em.';

export async function generateGemini({ caller, data, apiKey, fetchImpl = fetch }) {
  if (!caller?.uid) throw new Error('unauthenticated');
  if (!apiKey) throw new Error('not-configured');
  const messages = data?.messages;
  const mode = data?.mode || 'chat';
  if (!['chat', 'assessment'].includes(mode)) throw new Error('invalid-argument');
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
      messages.some(m => !m || !['user', 'model'].includes(m.role) || typeof m.text !== 'string' || !m.text.trim() || m.text.length > 4000)) {
    throw new Error('invalid-argument');
  }
  const result = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + (mode === 'assessment' ? ' Trả về duy nhất JSON với các trường ageGroup (chuỗi), extractedKeywords (mảng các đối tượng {"text": chuỗi, "type": "default"}), advice (chuỗi) và recommendedExerciseIds (mảng chuỗi, có thể rỗng). Không suy đoán khi thiếu dữ liệu.' : '') }] },
      contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      generationConfig: { maxOutputTokens: 1200 }
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!result.ok) throw new Error('upstream-error');
  const response = await result.json();
  const text = response?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  if (!text) throw new Error('empty-response');
  return { text };
}
