// --- CẤU HÌNH ---
const API_KEY = "AQ.Ab8RN6IVJJzBaoqHR17GemCziBhetZoBcNDEjxgPnzDgl5Hi0A"; // API Key của bạn
const MODEL = "mistralai/Mistral-7B-Instruct-v0.1"; // Model AI miễn phí từ Hugging Face
const BOOK_KNOWLEDGE = "Dán tóm tắt kiến thức sách giáo khoa vào đây...";

// --- CHỨC NĂNG ĐIỀU KHIỂN TRỰC TIẾP ---

async function fetchAnswer(question) {
    const prompt = `Dựa vào kiến thức: "${BOOK_KNOWLEDGE}". Hãy trả lời câu hỏi sau chỉ bằng đáp án ngắn gọn nhất (không giải thích): "${question}"`;
    
    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 50, temperature: 0.2 }
            })
        });
        
        const result = await response.json();
        // Xử lý kết quả từ Hugging Face (cấu trúc trả về có thể khác nhau tùy model)
        if (result.error) return "Không tìm thấy đáp án.";
        return result[0]?.generated_text?.replace(prompt.trim(), "").trim() || "Không rõ";
    } catch (e) {
        console.error("Lỗi AI:", e);
        return "Lỗi kết nối AI.";
    }
}

async function autoPlayAndSubmit() {
    // 1. Tìm ô nhập liệu hoặc nút radio/checkbox gần nhất chứa câu hỏi
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea, select');
    const radios = document.querySelectorAll('input[type="radio"]');
    
    // Logic đơn giản: Tìm ô đầu tiên hoặc ô gần vùng text câu hỏi nhất
    let targetElement = null;
    let questionText = "";

    if (inputs.length > 0) {
        targetElement = inputs[0];
        // Cố gắng lấy văn bản gần đó (giả lập)
        questionText = document.body.innerText.substring(0, 200).replace(/[^a-zA-Z0-9\u00C0-\u017F\s]/g, "").trim();
    } else if (radios.length > 0) {
        // Nếu là trắc nghiệm
        targetElement = radios[0];
        questionText = document.body.innerText.substring(0, 200);
    }

    if (!targetElement) {
        console.log("Không tìm thấy ô để điền.");
        return;
    }

    console.log(`Đang giải câu hỏi: "${questionText.substring(0, 30)}..."`);
    
    // 2. Gọi AI lấy đáp án
    const answer = await fetchAnswer(questionText);
    console.log(`Đáp án từ AI: ${answer}`);

    // 3. Điền đáp án tùy loại ô
    if (targetElement.tagName === 'SELECT') {
        // Tìm option chứa đáp án
        const options = targetElement.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].text.includes(answer) || options[i].value.includes(answer)) {
                targetElement.selectedIndex = i;
                targetElement.dispatchEvent(new Event('change'));
                break;
            }
        }
    } else if (targetElement.type === 'radio') {
        // Tìm radio button có giá trị khớp hoặc text gần đó khớp
        const allRadios = document.querySelectorAll(`input[type="radio"][name="${targetElement.name}"]`);
        for (let r of allRadios) {
            const label = r.nextElementSibling?.innerText || r.previousElementSibling?.innerText;
            if (label && label.includes(answer)) {
                r.checked = true;
                r.dispatchEvent(new Event('change'));
                break;
            }
        }
    } else {
        // Điền vào ô text
        targetElement.value = answer;
        targetElement.dispatchEvent(new Event('input'));
        targetElement.dispatchEvent(new Event('change'));
    }

    // 4. Tự động tìm nút Submit/Next/Check để bấm
    setTimeout(() => {
        const submitButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
        let foundButton = false;
        
        for (let btn of submitButtons) {
            const text = btn.innerText.toLowerCase();
            if (text.includes('submit') || text.includes('next') || text.includes('đáp án') || text.includes('gửi') || text.includes('kiểm tra')) {
                btn.click();
                console.log("Đã bấm nút nộp bài.");
                foundButton = true;
                break;
            }
        }
        
        if (!foundButton) {
            console.log("Không tìm thấy nút nộp bài rõ ràng, bạn hãy bấm thủ công.");
        }
    }, 1000); // Chờ 1 giây sau khi điền để đảm bảo UI cập nhật
}

// Chạy ngay lập tức
autoPlayAndSubmit();