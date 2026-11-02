/**
 * EduTrace AI - Specialized Medical & Early Intervention Knowledge Base
 * Developed for EXE101 Startup Project - Group 6, FPT University Can Tho
 * 
 * Includes:
 * 1. Clinical Screening Frameworks (M-CHAT-R/F, DSM-5, Denver II Milestones)
 * 2. Therapeutic Methods (ABA, PECS, Sensory Integration, TEACCH)
 * 3. Local Medical & Special Education Ecosystem in Ninh Kieu, Can Tho
 * 4. 10 Standardized Video Exercises with Step-by-Step Clinical Protocols
 * 5. Dynamic Knowledge Storage & Real-time Prompt Synthesis Engine
 */

const EDUTRACE_KNOWLEDGE_BASE = {
  systemIdentity: {
    name: 'Trợ lý AI Tham vấn Can thiệp Sớm EduTrace AI',
    project: 'Dự án Khởi nghiệp EXE101 - Nhóm 6, Trường Đại học FPT Cần Thơ',
    location: 'Quận Ninh Kiều, Thành phố Cần Thơ',
    role: 'Đồng hành, giải tỏa âu lo cho phụ huynh có con trong độ tuổi vàng (1.5 - 10 tuổi) nghi ngờ hoặc có chẩn đoán Chậm nói, Rối loạn phổ Tự kỷ (ASD), Tăng động giảm chú ý (ADHD), Rối loạn điều hòa giác quan.',
    disclaimer: 'EduTrace AI cung cấp thông tin tham vấn sàng lọc và gợi ý bài tập rèn luyện tại nhà 3–5 phút. Mọi thông tin không thay thế chẩn đoán y khoa chính thức từ bác sĩ chuyên khoa hoặc chuyên gia tâm lý lâm sàng.'
  },

  clinicalGuidelines: {
    mchat: {
      name: 'Thang sàng lọc M-CHAT-R/F (Modified Checklist for Autism in Toddlers - Revised with Follow-Up)',
      ageRange: '16 đến 30 tháng tuổi',
      scoringRules: {
        lowRisk: '0 – 2 điểm: Nguy cơ thấp. Trẻ phát triển trong giới hạn độ tuổi. Tiếp tục theo dõi các mốc Denver II ở 24 và 36 tháng.',
        mediumRisk: '3 – 7 điểm: Nguy cơ trung bình. Cần áp dụng phỏng vấn theo dõi (Follow-up), kết hợp rèn luyện bài tập tại nhà 3–5 phút mỗi ngày và đặt lịch hẹn khám sàng lọc chuyên khoa.',
        highRisk: '8 – 20 điểm: Nguy cơ cao. Cần liên hệ ngay với trung tâm can thiệp sớm hoặc phòng khám chuyên khoa nhi tại Cần Thơ để được lượng giá trực tiếp 1-1.'
      },
      keyIndicators: [
        { id: 2, question: 'Trẻ có bị nghi ngờ khiếm thính hoặc không quay đầu lại khi gọi tên?', significance: 'Chỉ dấu thính lực & chú ý xã hội' },
        { id: 5, question: 'Trẻ có dùng ngón trỏ để chỉ vào đồ vật nhằm thể hiện sự thích thú hoặc muốn chia sẻ?', significance: 'Chỉ dấu chia sẻ chú ý (Joint Attention)' },
        { id: 12, question: 'Trẻ có phản ứng quá mức với tiếng ồn hàng ngày (bịt tai, la hét trước tiếng máy xay sinh tố, tiếng máy sấy tóc)?', significance: 'Chỉ dấu quá tải giác quan thính giác' },
        { id: 9, question: 'Trẻ có mang đồ vật đến khoe hoặc đưa cho ba mẹ xem không?', significance: 'Chỉ dấu giao tiếp xã hội chủ động' }
      ]
    },

    dsm5: {
      name: 'Tiêu chuẩn Chẩn đoán Phổ Tự kỷ (ASD) & ADHD theo Cẩm nang DSM-5 (Hiệp hội Tâm thần học Hoa Kỳ)',
      criteriaASD: {
        criterionA: 'Khiếm khuyết dai dẳng trong tương tác và giao tiếp xã hội qua nhiều bối cảnh khác nhau (khiếm khuyết chia sẻ cảm xúc-xã hội, hành vi giao tiếp phi ngôn ngữ, khó khăn duy trì các mối quan hệ bạn bè cùng trang lứa).',
        criterionB: 'Các mẫu hành vi, sở thích hoặc hoạt động hạn chế, lặp đi lặp lại (vận động rập khuôn/stimming như vỗ tay, lắc lư, xoay bánh xe; khăng khăng vào thói quen/lịch trình bất biến; sở thích gắn bó cố định bất thường; phản ứng quá mức hoặc kém nhạy cảm với kích thích giác quan).',
        levelsOfSupport: [
          'Mức độ 1: Cần hỗ trợ (Có thể nói được nhưng khó khăn khởi xướng giao tiếp, giảm linh hoạt hành vi)',
          'Mức độ 2: Cần hỗ trợ nhiều (Khiếm khuyết rõ rệt trong giao tiếp lời nói và phi ngôn ngữ, hành vi lặp lại thường xuyên)',
          'Mức độ 3: Cần hỗ trợ rất nhiều (Hầu như không giao tiếp bằng lời, rất khó thích ứng với thay đổi môi trường)'
        ]
      },
      criteriaADHD: {
        inattention: 'Giảm chú ý: Dễ xao nhãng bởi kích thích bên ngoài, khó duy trì chú ý vào bài học hoặc trò chơi quá 3 phút, hay quên đồ dùng, khó tuân thủ tuần tự các bước hướng dẫn.',
        hyperactivityImpulsivity: 'Tăng động & Xung động: Thường xuyên ngọ nguậy tay chân, khó ngồi yên một chỗ, nói liên tục hoặc chen ngang câu nói của người khác, khó khăn trong việc chờ đợi đến lượt.'
      }
    },

    denverMilestones: {
      name: 'Mốc Phát triển Vận động & Ngôn ngữ Denver II',
      milestones: [
        {
          age: '18 tháng',
          skills: 'Đi vững một mình; nói được 3–6 từ đơn có nghĩa (ba, mẹ, măm); biết chỉ tay vào đồ vật muốn lấy; biết chơi ú òa; kéo tay người lớn hoặc bập bẹ gọi tên.'
        },
        {
          age: '24 tháng (2 tuổi)',
          skills: 'Nói được câu ghép 2 từ ("uống sữa", "đi chơi", "mẹ bế"); chỉ đúng ít nhất 3 bộ phận cơ thể; bắt chước hành động đơn giản; chơi giả vờ (bón cho búp bê ăn); vốn từ khoảng 30–50 từ.'
        },
        {
          age: '36 tháng (3 tuổi)',
          skills: 'Nói được câu 3–4 từ; biết xưng hô "con", "mẹ"; biết đếm 1, 2, 3 cơ bản; hiểu các khái niệm không gian (trên, dưới); tự xúc cơm; đặt các câu hỏi tò mò "cái gì đây?".'
        },
        {
          age: '4–6 tuổi',
          skills: 'Kể lại một câu chuyện ngắn; giao tiếp trôi chảy với bạn cùng tuổi; kiểm soát tốt vận động tinh (cầm kéo, vẽ hình tròn); rèn luyện khả năng tập trung kéo dài 10–15 phút.'
        }
      ]
    },

    interventions: {
      aba: {
        name: 'ABA (Applied Behavior Analysis - Phân tích Hành vi Ứng dụng)',
        description: 'Phương pháp tiêu chuẩn vàng trong can thiệp tự kỷ. Chia nhỏ mọi kỹ năng thành các bước vi mô, dùng củng cố tích cực (khen ngợi, tưởng thưởng ngay) để tăng tần suất hành vi mong muốn và giảm hành vi thách thức.'
      },
      pecs: {
        name: 'PECS (Picture Exchange Communication System - Hệ thống Giao tiếp Trao đổi Thẻ hình)',
        description: 'Dành cho trẻ chậm nói hoặc chưa có ngôn ngữ biểu đạt. Dạy trẻ chủ động trao đổi thẻ hình minh họa nhu cầu (uống sữa, đi vệ sinh, chơi bóng) thay vì la hét hoặc kéo tay người lớn.'
      },
      sensoryIntegration: {
        name: 'SI (Sensory Integration - Điều hòa Cảm giác)',
        description: 'Tác động vào hệ tiền đình, cảm thụ bản thể và xúc giác sâu. Giúp trẻ làm dịu hệ thần kinh khi bị quá tải giác quan (Sensory Overload) hoặc kích thích các thụ cảm thể để giảm hành vi Stimming rập khuôn.'
      },
      teacch: {
        name: 'TEACCH (Giáo dục Cấu trúc & Lịch trình Thị giác)',
        description: 'Thiết kế môi trường trực quan, bảng lịch trình hoạt động bằng tranh ảnh giúp trẻ tự kỷ luôn dự đoán được việc gì sẽ xảy ra tiếp theo, loại bỏ cảm giác bất an.'
      }
    }
  },

  localEcosystemCanTho: [
    {
      id: 'center-anh-sao',
      name: 'Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều',
      address: 'Đường Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều, TP. Cần Thơ',
      phone: '0292.389.1122',
      strengths: 'Chuyên sâu can thiệp thời điểm vàng 1.5 – 5 tuổi, trị liệu ngôn ngữ bật âm đơn, âm ngữ trị liệu và can thiệp hành vi ABA.',
      experts: 'ThS. Nguyễn Mai Anh (Giáo viên GDĐB), Cô Trần Thu Trang (Cử nhân GDĐB)'
    },
    {
      id: 'center-tung-buoc-nho',
      name: 'Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ',
      address: 'Đường Nguyễn Tri Phương, P. An Khánh, Q. Ninh Kiều, TP. Cần Thơ',
      phone: '0292.378.4455',
      strengths: 'Chuyên can thiệp Rối loạn phổ tự kỷ (ASD), rèn luyện giao tiếp mắt, kỹ năng xã hội nhóm và lịch trình trực quan PECS.',
      experts: 'ThS. Đỗ Hoàng Nam (Chuyên gia Can thiệp sớm)'
    },
    {
      id: 'center-tuong-lai',
      name: 'Trường Dạy Trẻ Khuyết Tật Tương Lai Cần Thơ',
      address: 'Đường 30/4, P. Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ',
      phone: '0292.383.2266',
      strengths: 'Cơ sở giáo dục chuyên biệt lâu năm uy tín tại Cần Thơ, đào tạo hòa nhập, âm ngữ trị liệu, phát triển vận động tinh và rèn luyện kỹ năng tự lập.',
      experts: 'Cô Lê Thị Kim Phượng (Cử nhân GDĐB), Chuyên viên Trịnh Kim Yến'
    },
    {
      id: 'center-nhi-dong-ninh-kieu',
      name: 'Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều',
      address: 'Đường Trần Hưng Đạo, P. An Phú, Q. Ninh Kiều, TP. Cần Thơ',
      phone: '0292.381.8899',
      strengths: 'Khám chẩn đoán lâm sàng, đánh giá tâm lý phát triển, điều hòa cảm xúc, phác đồ massage áp lực sâu và điều trị lo âu/quá tải giác quan.',
      experts: 'BS. CKI Lê Thanh Thảo (Bác sĩ Tâm lý Nhi khoa), Chuyên viên Phan Hoài Bảo'
    },
    {
      id: 'center-rong-viet',
      name: 'Trung tâm Đào tạo Kỹ năng & Can thiệp Rồng Việt Cần Thơ',
      address: 'Đường Trần Văn Hoài, P. Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ',
      phone: '0292.373.9988',
      strengths: 'Chuyên can thiệp Tăng động giảm chú ý (ADHD), rèn luyện khả năng kiểm soát xung động, kỹ năng tập trung chú ý và vận động phối hợp.',
      experts: 'ThS. Nguyễn Trọng Nhân (Chuyên gia Tâm lý học đường)'
    }
  ],

  masterExercisesDirectory: [
    {
      id: 'ex-speech-01',
      title: 'Kỹ thuật Thổi bong bóng xà phòng & Kích thích Bật âm đơn /a/, /ba/',
      category: 'Bật âm đơn & Tương tác mắt',
      age: '1.5 – 3 tuổi',
      center: 'Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều',
      focus: 'Kích thích khẩu hình môi, tạo tương tác mắt tự nhiên thông qua trò chơi bong bóng bay.'
    },
    {
      id: 'ex-speech-02',
      title: 'Trò chơi Ú òa & Tương tác ánh mắt qua gương cảm xúc',
      category: 'Tương tác xã hội & Phản xạ gọi tên',
      age: '1.5 – 3 tuổi',
      center: 'Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ',
      focus: 'Tận dụng gương soi gia đình giúp trẻ dễ dàng nhận biết phản xạ ánh mắt và thích thú với biểu cảm.'
    },
    {
      id: 'ex-speech-03',
      title: 'Thẻ tranh Flashcard tương tác nhu cầu & Kỹ thuật Bắt chước khẩu hình',
      category: 'Giao tiếp nhu cầu & Chỉ tay',
      age: '3 – 6 tuổi',
      center: 'Trường Dạy Trẻ Khuyết Tật Tương Lai Cần Thơ',
      focus: 'Dạy trẻ thói quen chỉ tay vào hình ảnh đồ vật mong muốn bằng phương pháp PECS.'
    },
    {
      id: 'ex-asd-01',
      title: 'Kỹ thuật "Chiếc kén bình yên" & Massage điều hòa xúc giác sâu',
      category: 'Điều hòa cảm giác & Giảm Stimming',
      age: '3 – 6 tuổi',
      center: 'Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều',
      focus: 'Massage áp lực sâu (Deep Pressure) giải tỏa căng thẳng thần kinh, giảm thiểu bộc phát hành vi rập khuôn.'
    },
    {
      id: 'ex-asd-02',
      title: 'Lịch sinh hoạt bằng hình ảnh (PECS) & Trò chơi Bắt chước động tác',
      category: 'Lịch trình trực quan & Bắt chước hành vi',
      age: '3 – 6 tuổi',
      center: 'Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ',
      focus: 'Giúp trẻ ASD chủ động nắm bắt chuỗi hoạt động trong ngày, giảm lo âu do thiếu đoán định.'
    },
    {
      id: 'ex-asd-03',
      title: 'Trò chơi Bóp đất nặn & Phân loại cúc áo rèn luyện vận động tinh',
      category: 'Vận động tinh & Kéo dài chú ý',
      age: '1.5 – 3 tuổi',
      center: 'Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều',
      focus: 'Kết hợp xúc giác bàn tay và khả năng tập trung thị giác để chuyển hướng chú ý tích cực.'
    },
    {
      id: 'ex-adhd-01',
      title: 'Trò chơi "Đèn Xanh – Đèn Đỏ" rèn luyện khả năng ức chế xung động',
      category: 'Kiểm soát bộc phát & Nghe hiệu lệnh',
      age: '3 – 6 tuổi',
      center: 'Trung tâm Đào tạo Kỹ năng & Can thiệp Rồng Việt Cần Thơ',
      focus: 'Luyện tập phanh hãm não bộ (ức chế hành vi bộc phát) khi nhận hiệu lệnh dừng lại.'
    },
    {
      id: 'ex-adhd-02',
      title: 'Kỹ thuật "Thở bóng bay xoa dịu" & Thổi nến điều hòa cảm xúc',
      category: 'Hạ nhiệt cảm xúc & Điều hòa nhịp thở',
      age: '6 – 10 tuổi',
      center: 'Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều',
      focus: 'Hít thở sâu cơ hoành hình tượng hóa quả bóng bay để tự làm dịu cơn bồn chồn, tức giận.'
    },
    {
      id: 'ex-adhd-03',
      title: 'Chia nhỏ nhiệm vụ kèm Đồng hồ đếm ngược Pomodoro nhí',
      category: 'Kéo dài sự tập trung có chủ đích',
      age: '6 – 10 tuổi',
      center: 'Trường Dạy Trẻ Khuyết Tật Tương Lai Cần Thơ',
      focus: 'Chia nhỏ nhiệm vụ thành chặng 3–5 phút kèm đồng hồ cát thị giác giúp trẻ hoàn thành mục tiêu.'
    },
    {
      id: 'ex-adhd-04',
      title: 'Thử thách Chuyền bóng bằng thìa & Đi thăng bằng trên vạch kẻ',
      category: 'Thăng bằng & Phối hợp vận động',
      age: '6 – 10 tuổi',
      center: 'Trung tâm Đào tạo Kỹ năng & Can thiệp Rồng Việt Cần Thơ',
      focus: 'Điều phối đồng thời mắt, tay và bước chân, kéo dài sự tập trung có chủ đích từ 2 phút lên 5 phút.'
    }
  ],

  ethicalRules: [
    'Quy tắc 1: TUYỆT ĐỐI KHÔNG đưa ra kết luận chẩn đoán xác định bệnh (như "bé đã bị tự kỷ nặng", "bé bị ADHD chắc chắn"). Luôn sử dụng thuật ngữ y tế chuẩn: "chỉ dấu nguy cơ cần sàng lọc chuyên sâu" hoặc "biểu hiện cần được lượng giá trực tiếp".',
    'Quy tắc 2: Giọng điệu luôn tràn đầy sự đồng cảm, ấm áp, nhân văn và củng cố niềm tin cho cha mẹ. Không bao giờ gán trách nhiệm, không để cha mẹ cảm thấy có lỗi.',
    'Quy tắc 3: Luôn gắn kết hành vi thực tế với giải pháp can thiệp tại chỗ: Gợi ý các bài tập thực hành 3–5 phút tại nhà của EduTrace AI và giới thiệu trung tâm/bác sĩ uy tín tại Quận Ninh Kiều, Cần Thơ để khám trực tiếp khi cần.',
    'Quy tắc 4: Mọi lời khuyên phải dựa trên các mốc phát triển Denver II, tiêu chí M-CHAT-R/F hoặc DSM-5 đã được nạp trong cơ sở dữ liệu.'
  ]
};

// ============================================================================
// DYNAMIC KNOWLEDGE & MEDIA STORAGE ENGINE (LOCALSTORAGE + INDEXEDDB)
// Cho phép quản trị viên thêm/xóa/sửa kiến thức y khoa, tải file tài liệu (PDF, Word, TXT, Ảnh)
// và tải video/dán link YouTube để Gemini AI gợi ý trực tiếp cho phụ huynh.
// ============================================================================

const STORAGE_KEY_DYNAMIC_KNOWLEDGE = 'edutrace_custom_knowledge_v1';
const EDUTRACE_IDB_NAME = 'edutrace_knowledge_db';
const EDUTRACE_IDB_STORE = 'media_blobs';
const EDUTRACE_IDB_VERSION = 1;

/**
 * Mở kết nối IndexedDB lưu trữ an toàn các tệp và video dung lượng lớn
 */
function openEduTraceIDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('Trình duyệt không hỗ trợ IndexedDB.');
      resolve(null);
      return;
    }
    const request = indexedDB.open(EDUTRACE_IDB_NAME, EDUTRACE_IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(EDUTRACE_IDB_STORE)) {
        db.createObjectStore(EDUTRACE_IDB_STORE);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.warn('Lỗi mở IndexedDB:', e.target.error);
      resolve(null);
    };
  });
}

/**
 * Lưu Blob (file hoặc video) vào IndexedDB
 * @param {string} key Mã khóa duy nhất
 * @param {Blob|File} blob Dữ liệu nhị phân của tệp
 */
async function saveMediaBlob(key, blob) {
  try {
    const db = await openEduTraceIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(EDUTRACE_IDB_STORE, 'readwrite');
      const store = tx.objectStore(EDUTRACE_IDB_STORE);
      const req = store.put(blob, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Lỗi saveMediaBlob:', err);
    return false;
  }
}

/**
 * Đọc Blob từ IndexedDB
 * @param {string} key Mã khóa
 * @returns {Promise<Blob|null>}
 */
async function getMediaBlob(key) {
  try {
    const db = await openEduTraceIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(EDUTRACE_IDB_STORE, 'readonly');
      const store = tx.objectStore(EDUTRACE_IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Lỗi getMediaBlob:', err);
    return null;
  }
}

/**
 * Xóa Blob khỏi IndexedDB
 * @param {string} key Mã khóa
 */
async function deleteMediaBlob(key) {
  try {
    const db = await openEduTraceIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(EDUTRACE_IDB_STORE, 'readwrite');
      const store = tx.objectStore(EDUTRACE_IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Lỗi deleteMediaBlob:', err);
    return false;
  }
}

/**
 * Trích xuất YouTube Video ID từ mọi định dạng link YouTube
 * @param {string} url Link YouTube
 * @returns {string|null} ID 11 ký tự của YouTube
 */
function parseYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Format dung lượng tệp đọc được (KB, MB)
 * @param {number} bytes Số bytes
 */
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Lấy danh sách kiến thức động do Quản trị viên nhập thêm
 * @returns {Array} Danh sách các mục kiến thức đã lưu
 */
function getStoredDynamicKnowledge() {
  if (window.edutraceCloudKnowledgeItems) return window.edutraceCloudKnowledgeItems();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_KNOWLEDGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Lỗi khi đọc dynamic knowledge từ localStorage:', err);
    return [];
  }
}

/**
 * Lưu mục kiến thức mới vào bộ nhớ
 * @param {Object} item { title, category, content, author, file, video }
 * @returns {Object} Mục kiến thức đã lưu kèm ID & Timestamp
 */
function saveDynamicKnowledge(item) {
  const current = getStoredDynamicKnowledge();
  const newEntry = {
    id: item.id || ('dyn_kn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
    title: item.title || 'Kiến thức bổ sung',
    category: item.category || 'Chung',
    content: item.content || '',
    author: item.author || 'Quản trị viên EduTrace',
    createdAt: item.createdAt || new Date().toISOString(),
    // File đính kèm (nếu có)
    file: item.file || null,
    // Video minh họa (nếu có)
    video: item.video || null
  };
  current.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY_DYNAMIC_KNOWLEDGE, JSON.stringify(current));
  return newEntry;
}

/**
 * Cập nhật một mục kiến thức đã có
 * @param {string} id ID mục kiến thức cần sửa
 * @param {Object} updatedFields Các trường cập nhật mới
 */
function updateDynamicKnowledge(id, updatedFields) {
  const current = getStoredDynamicKnowledge();
  const index = current.findIndex(item => item.id === id);
  if (index === -1) return null;

  current[index] = {
    ...current[index],
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY_DYNAMIC_KNOWLEDGE, JSON.stringify(current));
  return current[index];
}

/**
 * Xóa một mục kiến thức động theo ID kèm các Blob đa phương tiện trong IndexedDB
 * @param {string} id ID mục kiến thức cần xóa
 * @returns {boolean} Kết quả xóa
 */
function deleteDynamicKnowledge(id) {
  const current = getStoredDynamicKnowledge();
  const target = current.find(item => item.id === id);
  if (target) {
    if (target.file && target.file.storageKey) {
      deleteMediaBlob(target.file.storageKey);
    }
    if (target.video && target.video.storageKey) {
      deleteMediaBlob(target.video.storageKey);
    }
  }
  const filtered = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY_DYNAMIC_KNOWLEDGE, JSON.stringify(filtered));
  return filtered.length < current.length;
}

/**
 * Đặt lại kiến thức mẫu mặc định kèm file và video sinh động nếu trống
 */
function seedDefaultDynamicKnowledgeIfEmpty() {
  const current = getStoredDynamicKnowledge();
  if (current.length === 0) {
    saveDynamicKnowledge({
      id: 'dyn_kn_sensory_01',
      title: 'Lưu ý khi can thiệp trẻ nhạy cảm xúc giác quá mức (Tactile Defensiveness)',
      category: 'Điều hòa cảm giác (Sensory)',
      content: 'Trẻ nhạy cảm xúc giác thường từ chối cắt móng tay, gội đầu, mặc quần áo vải thô hoặc đi chân trần trên cỏ. Can thiệp: Bắt đầu bằng kích thích áp lực sâu (ôm chặt, vuốt miết chậm) trước khi tiếp xúc xúc giác nhẹ. Không ép buộc trẻ chạm vào đồ chơi ướt/nhớt ngay lập tức.',
      author: 'BS. CKI Lê Thanh Thảo (PK Nhi Đồng Ninh Kiều)',
      file: {
        name: 'Cam_Nang_Dieu_Hoa_Cam_Giac_Xuc_Giac_Tại_Nha.pdf',
        size: 1548000,
        type: 'application/pdf',
        source: 'url',
        url: 'https://www.who.int/publications/i/item/9789240050853',
        description: 'Tài liệu hướng dẫn 6 bước can thiệp xúc giác chuẩn y khoa cho cha mẹ'
      },
      video: {
        title: 'Video Kỹ thuật Massage Áp lực Sâu & Vuốt miết làm dịu thần kinh cho trẻ',
        source: 'url',
        url: 'https://www.youtube.com/watch?v=1ZyH9P_6E_c',
        youtubeId: '1ZyH9P_6E_c',
        duration: '4:15'
      }
    });

    saveDynamicKnowledge({
      id: 'dyn_kn_speech_02',
      title: 'Chiến lược phát triển giao tiếp mắt tự nhiên bằng Trò chơi Tạm dừng',
      category: 'Chậm nói & Ngôn ngữ',
      content: 'Khi trẻ đang rất thích một hoạt động (như đu quay, thổi bong bóng, cù lét), hãy tạm dừng lại ngay lúc cao trào và chờ đợi 3–5 giây. Giữ khuôn mặt ở ngang tầm mắt của con. Ngay khi ánh mắt trẻ chạm vào mắt bạn (dù chỉ nửa giây), lập tức tiếp tục trò chơi để củng cố phản xạ nhìn mắt.',
      author: 'ThS. Nguyễn Mai Anh (Ánh Sao Ninh Kiều)',
      file: {
        name: 'Giao_Trinh_Tam_Dung_Kich_Hoat_Bat_Am.docx',
        size: 840000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        source: 'url',
        url: 'https://peacs.com',
        description: 'Bảng theo dõi số lần giao tiếp mắt và bật âm theo tuần'
      },
      video: {
        title: 'Thực hành trò chơi Tạm Dừng & Bắt Mắt cùng bé 2-4 tuổi tại nhà',
        source: 'url',
        url: 'https://www.youtube.com/watch?v=J---aiyznGQ',
        youtubeId: 'J---aiyznGQ',
        duration: '3:30'
      }
    });
  }
}

// Khởi tạo mẫu ban đầu nếu rỗng
seedDefaultDynamicKnowledgeIfEmpty();

/**
 * Tải file đính kèm của tri thức về máy hoặc mở liên kết
 * @param {string} knId ID mục tri thức
 */
async function downloadKnowledgeFile(knId) {
  const list = getStoredDynamicKnowledge();
  const item = list.find(k => k.id === knId);
  if (!item || !item.file) {
    alert('Không tìm thấy tài liệu đính kèm cho tri thức này.');
    return;
  }

  const file = item.file;
  // 1. Nếu có storageKey lưu trong IndexedDB
  if (file.storageKey) {
    const blob = await getMediaBlob(file.storageKey);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'Tai_lieu_EduTrace.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return;
    }
  }

  // 2. Nếu có URL trực tiếp
  if (file.url) {
    window.open(file.url, '_blank', 'noopener,noreferrer');
    return;
  }

  alert(`Tài liệu "${file.name}" đã được ghi nhận trong cơ sở tri thức.`);
}

/**
 * Mở trình phát Video Modal cho Video gợi ý của Tri thức
 * @param {string} knId ID mục tri thức
 */
async function openKnowledgeVideoPlayer(knId) {
  const list = getStoredDynamicKnowledge();
  const item = list.find(k => k.id === knId);
  if (!item || !item.video) {
    alert('Không tìm thấy video hướng dẫn cho tri thức này.');
    return;
  }

  const video = item.video;
  let playerModal = document.getElementById('edutraceKnowledgeVideoModal');

  if (!playerModal) {
    const modalHTML = `
      <div id="edutraceKnowledgeVideoModal" class="edutrace-video-modal-backdrop" style="display: none;">
        <div class="edutrace-video-modal-card">
          <div class="edutrace-video-modal-header">
            <div class="edutrace-video-modal-title-box">
              <span class="video-pill">🎬 VIDEO HƯỚNG DẪN</span>
              <h4 id="knVideoModalTitle">Video Hướng Dẫn Thực Hành</h4>
            </div>
            <button type="button" class="video-modal-close" id="btnCloseKnVideoModal" aria-label="Đóng">&times;</button>
          </div>
          <div class="edutrace-video-modal-body" id="knVideoModalBody">
            <!-- Dynamic Video Content -->
          </div>
          <div class="edutrace-video-modal-footer">
            <div id="knVideoModalAuthor" style="font-size: 0.85rem; color: #64748b;"></div>
            <button type="button" class="btn btn-sm btn-outline-light" id="btnKnVideoModalDone" style="color: #475569; border-color: #cbd5e1; padding: 6px 14px; border-radius: 6px;">Đóng</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    playerModal = document.getElementById('edutraceKnowledgeVideoModal');

    const close = () => {
      playerModal.style.display = 'none';
      const body = document.getElementById('knVideoModalBody');
      if (body) body.innerHTML = '';
    };

    document.getElementById('btnCloseKnVideoModal')?.addEventListener('click', close);
    document.getElementById('btnKnVideoModalDone')?.addEventListener('click', close);
    playerModal.addEventListener('click', (e) => {
      if (e.target === playerModal) close();
    });
  }

  const titleEl = document.getElementById('knVideoModalTitle');
  const bodyEl = document.getElementById('knVideoModalBody');
  const authorEl = document.getElementById('knVideoModalAuthor');

  if (titleEl) titleEl.textContent = video.title || item.title;
  if (authorEl) authorEl.textContent = `Chuyên môn bảo trợ: ${item.author}`;

  if (bodyEl) {
    bodyEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">Đang tải video...</div>';
    playerModal.style.display = 'flex';

    // 1. Video YouTube Embed
    const ytId = video.youtubeId || parseYouTubeId(video.url);
    if (ytId) {
      bodyEl.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; background: #000;">
          <iframe 
            src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" 
            title="${video.title || item.title}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            style="position: absolute; top:0; left: 0; width: 100%; height: 100%;">
          </iframe>
        </div>
      `;
      return;
    }

    // 2. Video từ IndexedDB Blob
    if (video.storageKey) {
      const blob = await getMediaBlob(video.storageKey);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        bodyEl.innerHTML = `
          <div style="background: #000; border-radius: 12px; overflow: hidden;">
            <video controls autoplay style="width: 100%; max-height: 440px; display: block;">
              <source src="${objectUrl}" type="${blob.type || 'video/mp4'}">
              Trình duyệt của bạn không hỗ trợ phát video này.
            </video>
          </div>
        `;
        return;
      }
    }

    // 3. Video từ direct MP4 URL
    if (video.url) {
      bodyEl.innerHTML = `
        <div style="background: #000; border-radius: 12px; overflow: hidden;">
          <video controls autoplay style="width: 100%; max-height: 440px; display: block;">
            <source src="${video.url}" type="video/mp4">
            Trình duyệt của bạn không hỗ trợ thẻ video này.
          </video>
        </div>
      `;
      return;
    }

    bodyEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">Không thể phát video này. Vui lòng kiểm tra lại nguồn tệp.</div>`;
  }
}

/**
 * Tổng hợp toàn bộ tri thức (Baseline + Dynamic) thành System Prompt cho Gemini
 * Tự động chèn thông tin tài liệu đính kèm và video để AI chủ động gợi ý cho người dùng.
 * @param {'assessment' | 'chat'} taskType Loại tác vụ AI đang thực hiện
 * @returns {string} Toàn văn Prompt hệ thống có nạp tri thức chuyên sâu
 */
function buildFullSystemPrompt(taskType = 'chat') {
  const kb = EDUTRACE_KNOWLEDGE_BASE;
  const dynamicList = getStoredDynamicKnowledge();

  let centersText = kb.localEcosystemCanTho.map(c => 
    `- ${c.name} (${c.address} - ĐT: ${c.phone}): Chuyên môn ${c.strengths}. Chuyên gia: ${c.experts}`
  ).join('\n');

  let exercisesText = kb.masterExercisesDirectory.map(e => 
    `- ID [${e.id}]: "${e.title}" | Nhóm: ${e.category} | Tuổi: ${e.age} | Tại: ${e.center} | Mục tiêu: ${e.focus}`
  ).join('\n');

  let dynamicText = dynamicList.length > 0 
    ? dynamicList.map((d, idx) => {
        let text = `[Tri thức bổ sung ${idx + 1} - ${d.category}] (Mã hệ thống: ${d.id}):\n- Tiêu đề: ${d.title}\n- Tác giả / Nguồn: ${d.author}\n- Nội dung chuyên môn: ${d.content}`;
        if (d.file && (d.file.name || d.file.url)) {
          text += `\n- 📄 TÀI LIỆU ĐÍNH KÈM: "${d.file.name}" (Mã nhúng gợi ý cho phụ huynh: [kn-doc:${d.id}])${d.file.description ? ` - Ghi chú: ${d.file.description}` : ''}`;
        }
        if (d.video && (d.video.title || d.video.url || d.video.storageKey)) {
          text += `\n- 🎬 VIDEO MINH HỌA: "${d.video.title || d.title}" (Mã nhúng gợi ý cho phụ huynh: [kn-video:${d.id}])${d.video.duration ? ` [Thời lượng: ${d.video.duration}]` : ''}`;
        }
        return text;
      }).join('\n\n')
    : 'Chưa có mục bổ sung.';

  let baseInstruction = `
Bạn là ${kb.systemIdentity.name}, thuộc ${kb.systemIdentity.project} tại ${kb.systemIdentity.location}.
Vai trò của bạn: ${kb.systemIdentity.role}
Lưu ý pháp lý và y tế: ${kb.systemIdentity.disclaimer}

=== CƠ SỞ TRI THỨC Y KHOA & CAN THIỆP CHUYÊN SÂU ĐÃ ĐƯỢC KIỂM DUYỆT ===

1. THANG SÀNG LỌC M-CHAT-R/F (16-30 THÁNG):
- Thấp: 0-2 điểm (theo dõi định kỳ).
- Trung bình: 3-7 điểm (áp dụng can thiệp sớm tại nhà 3-5 phút, khám sàng lọc).
- Cao: 8-20 điểm (cần lượng giá chuyên khoa trực tiếp ngay).
- Các chỉ dấu chính: Câu hỏi 2 (thính lực, quay đầu khi gọi tên), Câu hỏi 5 (chỉ ngón trỏ biểu đạt nhu cầu/sở thích), Câu hỏi 12 (quá tải giác quan âm thanh).

2. TIÊU CHUẨN DSM-5:
- Nhóm A: Khiếm khuyết giao tiếp và tương tác xã hội (chia sẻ cảm xúc, giao tiếp phi ngôn ngữ, duy trì mối quan hệ).
- Nhóm B: Mẫu hành vi rập khuôn, thói quen bất biến, stimming (vỗ tay, lắc lư), phản ứng cảm giác bất thường.
- Phân độ hỗ trợ: Độ 1 (cần hỗ trợ), Độ 2 (cần hỗ trợ nhiều), Độ 3 (cần hỗ trợ rất nhiều).
- ADHD: Suy giảm chú ý (dễ xao nhãng, khó tập trung >3 phút) và Tăng động/Xung động (khó ngồi yên, chen ngang, bồn chồn).

3. MỐC PHÁT TRIỂN DENVER II:
- 18 tháng: Nói 3-6 từ đơn, biết chỉ tay, đi vững, chơi ú òa.
- 24 tháng: Nói câu ghép 2 từ ("uống sữa", "mẹ bế"), chỉ đúng bộ phận cơ thể, chơi giả vờ.
- 36 tháng: Nói câu 3-4 từ, dùng đại từ xưng hô, đếm số cơ bản, đặt câu hỏi tò mò.

4. PHƯƠNG PHÁP CAN THIỆP CHÍNH THỐNG:
- ABA: Chia nhỏ kỹ năng, củng cố tích cực, khen thưởng tức thì.
- PECS: Giao tiếp nhu cầu bằng hệ thống thẻ hình trực quan.
- Điều hòa cảm giác (SI): Massage áp lực sâu, giải tỏa quá tải giác quan, hạn chế hành vi stimming.
- TEACCH: Lịch trình sinh hoạt trực quan bằng hình ảnh, giúp trẻ an tâm đoán định trước.

5. HỆ SINH THÁI CƠ SỞ Y TẾ & TRUNG TÂM CAN THIỆP TẠI QUẬN NINH KIỀU, CẦN THƠ:
${centersText}

6. DANH MỤC 10 BÀI TẬP VIDEO 3-5 PHÚT THỰC HÀNH TẠI NHÀ ĐÃ CHUẨN HÓA:
${exercisesText}

7. TRI THỨC CHUYÊN MÔN BỔ SUNG, TÀI LIỆU & VIDEO MINH HỌA DO CHUYÊN GIA / ADMIN NẠP:
${dynamicText}

=== NGUYÊN TẮC GỢI Ý VIDEO & TÀI LIỆU CHO PHỤ HUYNH ===
- Khi câu hỏi hoặc tâm sự của phụ huynh có liên quan đến các Tri thức bổ sung số 7 ở trên, nếu tri thức đó có TÀI LIỆU ĐÍNH KÈM hoặc VIDEO MINH HỌA, BẠN HÃY CHỦ ĐỘNG GỢI Ý PHỤ HUYNH xem video hoặc tải tài liệu.
- ĐẶC BIỆT: Hãy chèn chính xác mã [kn-video:MÃ_HỆ_THỐNG] hoặc [kn-doc:MÃ_HỆ_THỐNG] vào đoạn văn khuyên nhủ (Ví dụ: "Ba mẹ có thể xem thêm video thực hành tại [kn-video:dyn_kn_sensory_01] và tải cẩm nang hướng dẫn [kn-doc:dyn_kn_sensory_01] để luyện tập cùng con nhé!").
- Hệ thống giao diện EduTrace sẽ tự động biến các mã này thành THẺ XEM VIDEO & NÚT TẢI TÀI LIỆU TRỰC QUAN để phụ huynh bấm vào là xem được ngay!

=== NGUYÊN TẮC ĐẠO ĐỨC & HÀNH VI BẮT BUỘC ===
${kb.ethicalRules.join('\n')}
`;

  if (taskType === 'assessment') {
    return baseInstruction + `
NHIỆM VỤ CỤ THỂ: PHÂN TÍCH TRIỆU CHỨNG & GỢI Ý BÀI TẬP CÁ NHÂN HÓA
Khi nhận được mô tả của phụ huynh về tình trạng của con:
1. Xác định độ tuổi và giai đoạn can thiệp vàng của bé.
2. Bóc tách các chỉ dấu hành vi và đối soát với M-CHAT-R/F hoặc DSM-5.
3. Viết lời khuyên ấm áp, thấu cảm, củng cố tâm lý cho cha mẹ. Nếu có tri thức bổ sung phù hợp có video/tài liệu, hãy đề cập mã [kn-video:ID] hoặc [kn-doc:ID] trong lời khuyên.
4. Lựa chọn từ 2 đến 3 ID bài tập phù hợp nhất từ Danh mục 10 bài tập trên (ex-speech-01 đến ex-adhd-04).
5. ĐỊNH DẠNG TRẢ VỀ: Trả về DUY NHẤT một khối JSON hợp lệ (không kèm bất kỳ văn bản ngoài nào, không dùng \`\`\`json):
{
  "ageGroup": "Ví dụ: 2.5 tuổi (Thời điểm vàng can thiệp)",
  "extractedKeywords": [
    {"text": "Độ tuổi: 2.5 tuổi", "type": "age"},
    {"text": "Biểu hiện: ...", "type": "default"},
    {"text": "Chỉ dấu: M-CHAT-R/F mục ...", "type": "mchat"}
  ],
  "advice": "Đoạn lời khuyên sâu sắc, khoa học, ấm áp từ chuyên gia...",
  "recommendedExerciseIds": ["ex-speech-01", "ex-speech-02"]
}
`;
  }

  // Task type is 'chat'
  return baseInstruction + `
NHIỆM VỤ CỤ THỂ: TRỢ LÝ HỎI ĐÁP TƯ VẤN 24/7 QUA CHATBOT
- Trả lời bằng tiếng Việt lịch thiệp, dễ hiểu, súc tích và ấm áp.
- Nếu phụ huynh hỏi về biểu hiện của con: Phân tích theo mốc phát triển Denver II hoặc M-CHAT-R/F, động viên phụ huynh.
- Nếu phụ huynh hỏi về bài tập: Gợi ý các bài tập trong danh mục 10 bài tập trên và nêu rõ mã bài tập (ví dụ [ex-speech-01]) để hệ thống hiển thị thẻ bài tập tương tác.
- Nếu câu hỏi liên quan đến kiến thức bổ sung có video hoặc tài liệu: Chủ động chèn mã [kn-video:MÃ_HỆ_THỐNG] hoặc [kn-doc:MÃ_HỆ_THỐNG] để phụ huynh xem video thực hành và tải phác đồ về máy.
- Nếu phụ huynh hỏi về địa chỉ khám/can thiệp tại Cần Thơ: Giới thiệu chính xác các trung tâm tại Quận Ninh Kiều đã nêu ở trên kèm số điện thoại liên hệ.
- Luôn nhắc nhở thông điệp: "Phát hiện sớm - Can thiệp sớm - Giúp con hòa nhập tự tin".
`;
}

// Export ra window để mọi script đều truy cập được
window.EDUTRACE_KNOWLEDGE_BASE = EDUTRACE_KNOWLEDGE_BASE;
window.getStoredDynamicKnowledge = getStoredDynamicKnowledge;
window.saveDynamicKnowledge = saveDynamicKnowledge;
window.updateDynamicKnowledge = updateDynamicKnowledge;
window.deleteDynamicKnowledge = deleteDynamicKnowledge;
window.buildFullSystemPrompt = buildFullSystemPrompt;
window.saveMediaBlob = saveMediaBlob;
window.getMediaBlob = getMediaBlob;
window.deleteMediaBlob = deleteMediaBlob;
window.parseYouTubeId = parseYouTubeId;
window.formatFileSize = formatFileSize;
window.downloadKnowledgeFile = downloadKnowledgeFile;
window.openKnowledgeVideoPlayer = openKnowledgeVideoPlayer;

