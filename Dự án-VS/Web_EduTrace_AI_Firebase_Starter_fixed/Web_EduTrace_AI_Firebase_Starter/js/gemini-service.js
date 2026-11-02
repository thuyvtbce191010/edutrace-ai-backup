/**
 * EduTrace AI - Google Gemini API Service Client
 * Handles API key management, model selection, connectivity testing,
 * structured assessment generation, and multi-turn conversational chat.
 */

class EduTraceGeminiService {
  constructor() {
    this.STORAGE_KEY_API = 'edutrace_gemini_api_key';
    this.STORAGE_KEY_MODEL = 'edutrace_gemini_model';
    this.DEFAULT_MODEL = 'gemini-3.5-flash-lite';
    this.API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    this.supportedModels = [
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', isDefault: true },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' }
    ];
  }

  /**
   * Lấy API Key hiện tại từ localStorage
   */
  getApiKey() {
    if (window.edutraceGeminiCloud) return '';
    return (localStorage.getItem(this.STORAGE_KEY_API) || '').trim();
  }

  /**
   * Lưu API Key mới
   */
  setApiKey(key) {
    if (window.edutraceGeminiCloud) throw new Error('Khóa Gemini được quản lý trên máy chủ.');
    const cleaned = (key || '').trim();
    if (cleaned) {
      localStorage.setItem(this.STORAGE_KEY_API, cleaned);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_API);
    }
    this.dispatchStatusChange();
    return Boolean(cleaned);
  }

  /**
   * Lấy model hiện đang cấu hình
   */
  getModel() {
    if (window.edutraceGeminiCloud) return 'gemini-3.8-flash';
    const saved = localStorage.getItem(this.STORAGE_KEY_MODEL);
    return this.supportedModels.some(model => model.id === saved) ? saved : this.DEFAULT_MODEL;
  }

  /**
   * Lưu model đã chọn
   */
  setModel(modelId) {
    const valid = this.supportedModels.some(m => m.id === modelId);
    const target = valid ? modelId : this.DEFAULT_MODEL;
    localStorage.setItem(this.STORAGE_KEY_MODEL, target);
    this.dispatchStatusChange();
    return target;
  }

  /**
   * Kiểm tra hệ thống đã có API Key chưa
   */
  isConfigured() {
    if (window.edutraceGeminiCloud) return window.edutraceGeminiCloud.available;
    return Boolean(this.getApiKey());
  }

  /**
   * Bắn event thông báo trạng thái key thay đổi
   */
  dispatchStatusChange() {
    const event = new CustomEvent('edutrace:gemini-status-changed', {
      detail: {
        isConfigured: this.isConfigured(),
        model: this.getModel()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Kiểm tra kết nối trực tiếp đến Google Gemini API
   * @param {string} testKey (Tùy chọn) Key cần kiểm tra, nếu bỏ qua sẽ lấy key đã lưu
   * @param {string} testModel (Tùy chọn) Model cần kiểm tra
   * @returns {Promise<{success: boolean, latencyMs?: number, message?: string, error?: string}>}
   */
  async testConnection(testKey = null, testModel = null) {
    if (window.edutraceGeminiCloud) {
      const start = performance.now();
      try {
        const message = await window.edutraceGeminiCloud.generate([{ role: 'user', text: 'Xin chào' }]);
        return { success: true, latencyMs: Math.round(performance.now() - start), message };
      } catch (error) { return { success: false, error: error.message }; }
    }
    const key = (testKey !== null ? testKey : this.getApiKey()).trim();
    const model = testModel || this.getModel();

    if (!key) {
      return {
        success: false,
        error: 'Chưa có Google Gemini API Key. Vui lòng nhập key từ aistudio.google.com'
      };
    }

    const startTime = performance.now();
    const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Xin chào, phản hồi ngắn gọn: "EduTrace AI Kết nối thành công!".' }]
          }],
          generationConfig: {
            maxOutputTokens: 512
          }
        })
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let errorDetail = `Lỗi HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error?.message) {
            errorDetail = errJson.error.message;
          }
        } catch (_) {}
        return {
          success: false,
          latencyMs,
          error: errorDetail
        };
      }

      const data = await response.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
      if (!replyText) return { success: false, latencyMs, error: 'Gemini không trả về nội dung.' };

      return {
        success: true,
        latencyMs,
        message: replyText
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra lại mạng.'
      };
    }
  }

  /**
   * Phân tích triệu chứng bằng Gemini AI với tri thức y khoa đã nạp
   * @param {string} userInput Lời chia sẻ của phụ huynh
   * @returns {Promise<Object>} Dữ liệu phân tích cấu trúc { ageGroup, extractedKeywords, advice, recommendedExerciseIds }
   */
  async analyzeAssessment(userInput) {
    if (window.edutraceGeminiCloud) {
      const raw = await window.edutraceGeminiCloud.generate([{ role: 'user', text: userInput }], 'assessment');
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleaned);
      if (typeof result.advice !== 'string' || !Array.isArray(result.extractedKeywords) ||
          !result.extractedKeywords.every(item => item && typeof item.text === 'string') ||
          !Array.isArray(result.recommendedExerciseIds)) throw new Error('Phản hồi AI không đúng định dạng.');
      return result;
    }
    const key = this.getApiKey();
    if (!key) {
      throw new Error('MISSING_API_KEY');
    }

    if (window.waitForEduTraceKnowledge) await window.waitForEduTraceKnowledge();
    const model = this.getModel();
    const systemPrompt = window.buildFullSystemPrompt ? window.buildFullSystemPrompt('assessment') : '';
    const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: `Tình trạng phụ huynh chia sẻ về con: "${userInput}"\n\nHãy phân tích và trả về định dạng JSON theo đúng hướng dẫn.` }]
      }],
      generationConfig: {
        maxOutputTokens: 1200
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errMsg = `Lỗi ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error?.message) errMsg = errData.error.message;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Xử lý làm sạch JSON Markdown
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch (parseError) {
      console.warn('Lỗi parse JSON từ Gemini, thử trích xuất khối JSON bằng RegExp:', rawText);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Gemini không trả về đúng định dạng JSON yêu cầu. Vui lòng thử lại.');
    }
  }

  /**
   * Trò chuyện đa lượt với Trợ lý AI có nạp ngữ cảnh tri thức
   * @param {string} userMessage Câu hỏi/tin nhắn mới của người dùng
   * @param {Array<{role: string, content: string}>} history Lịch sử tin nhắn trước đó
   * @returns {Promise<string>} Câu trả lời từ Gemini
   */
  async sendChatMessage(userMessage, history = []) {
    if (window.edutraceGeminiCloud) {
      const messages = history.slice(-19).map(item => ({ role: item.role === 'user' ? 'user' : 'model', text: String(item.text || item.content || '') }));
      messages.push({ role: 'user', text: userMessage });
      return window.edutraceGeminiCloud.generate(messages);
    }
    const key = this.getApiKey();
    if (!key) {
      throw new Error('MISSING_API_KEY');
    }

    if (window.waitForEduTraceKnowledge) await window.waitForEduTraceKnowledge();
    const model = this.getModel();
    const systemPrompt = window.buildFullSystemPrompt ? window.buildFullSystemPrompt('chat') : '';
    const endpoint = `${this.API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`;

    // Chuẩn hóa lịch sử sang format của Gemini API: role = 'user' | 'model'
    const formattedContents = [];

    history.forEach(item => {
      formattedContents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.content }]
      });
    });

    // Thêm câu hỏi hiện tại
    formattedContents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: formattedContents,
      generationConfig: {
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errMsg = `Lỗi ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error?.message) errMsg = errData.error.message;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      throw new Error('Không nhận được phản hồi từ AI.');
    }
    return reply;
  }
}

// Khởi tạo instance duy nhất (Singleton)
window.geminiService = new EduTraceGeminiService();
