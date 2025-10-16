import { GoogleGenAI, Type } from "@google/genai";
import { ArticleData, NewsSearchResult, RewriteResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface RewriteOptions {
  tone: string;
  length: string;
  isStrict: boolean;
  language: string;
  seoGoal: string;
  seoLevel: number;
  sampleTitle?: string;
}

interface SeoOutline {
    title: string;
    summary: string;
    outline: string[]; // e.g., ["H2: Section 1", "H3: Sub-section 1.1", "H2: Section 2"]
}

interface SeoMetadata {
    keywords: string[];
    categories: string[];
    slug: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
}

const MAX_RETRIES = 3;

// Helper: Extracts only the main article text from a URL
const extractArticleTextFromUrl = async (url: string): Promise<string> => {
    const prompt = `Vui lòng truy cập URL sau: ${url}. Đọc nội dung chính của bài viết. Loại bỏ tất cả các yếu tố không cần thiết như menu điều hướng, quảng cáo, thanh bên, chân trang, và các bình luận. Chỉ trả về văn bản thuần túy (plain text) của nội dung bài viết chính.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: { temperature: 0.2 }
    });
    
    return response.text;
}

// Helper: Generates a title, summary, and structural outline
const generateSeoOutline = async (articleText: string, focusKeyword: string, language: string, seoGoal: string, sampleTitle?: string): Promise<SeoOutline> => {
    const outlineSchema = {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "Một tiêu đề bài viết hấp dẫn, thân thiện SEO, chứa từ khóa tập trung."
            },
            summary: {
                type: Type.STRING,
                description: "Một bản tóm tắt ngắn (2-3 câu) về nội dung chính của bài viết."
            },
            outline: {
                type: Type.ARRAY,
                description: "Một dàn ý chi tiết cho bài viết, sử dụng các tiền tố 'H2:' và 'H3:' để chỉ định cấp độ tiêu đề. Vd: ['H2: Giới thiệu', 'H2: Lợi ích của X', 'H3: Lợi ích 1']",
                items: { type: Type.STRING }
            }
        },
        required: ["title", "summary", "outline"]
    };

    const prompt = `Dựa trên nội dung bài viết sau đây và các yêu cầu SEO, hãy tạo một kế hoạch nội dung.
    
    **TỪ KHÓA TẬP TRUNG**: "${focusKeyword}"
    **NGÔN NGỮ**: ${language}
    **MỤC TIÊU SEO**: ${seoGoal} (ví dụ: cung cấp thông tin, bán hàng, đánh giá sản phẩm)
    **TIÊU ĐỀ MẪU (nếu có)**: ${sampleTitle || "Không có"}
    
    **NỘI DUNG GỐC (tóm tắt)**: "${articleText.substring(0, 2000)}..."
    
    **NHIỆM VỤ**: Tạo một tiêu đề hấp dẫn, một bản tóm tắt ngắn và một dàn ý chi tiết (sử dụng H2, H3) cho một bài viết được tối ưu hóa SEO bằng ngôn ngữ đã chỉ định. Đảm bảo từ khóa tập trung được tích hợp một cách tự nhiên.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: outlineSchema,
            temperature: 0.6,
        },
    });

    return JSON.parse(response.text);
}

// Helper: Rewrites the article content in HTML based on a plan
const rewriteContentFromOutline = async (
    originalArticleText: string,
    plan: SeoOutline,
    options: RewriteOptions,
    focusKeyword: string
): Promise<string> => {
    const prompt = `Bạn là một chuyên gia viết nội dung SEO. Dựa vào kế hoạch và nội dung gốc được cung cấp, hãy viết lại một bài viết hoàn chỉnh.
    
    **TỪ KHÓA TẬP TRUNG**: "${focusKeyword}"
    
    **TIÊU ĐỀ BÀI VIẾT**: ${plan.title}
    
    **DÀN Ý CẦN TUÂN THEO**:
    ${plan.outline.join('\n')}
    
    **YÊU CẦU TÙY CHỈNH**:
    *   **Ngôn ngữ**: ${options.language}
    *   **Văn phong**: ${options.tone}
    *   **Mục tiêu SEO**: ${options.seoGoal}
    *   **Mức độ tối ưu SEO (1-5, 5 là cao nhất)**: ${options.seoLevel}. Mức độ này ảnh hưởng đến mật độ từ khóa, cấu trúc câu và các yếu tố SEO on-page khác.
    *   **Độ dài mong muốn**: ${options.length}
    *   **Mức độ viết lại nghiêm ngặt**: ${options.isStrict ? 'Rất cao. Viết lại sâu sắc, chỉ giữ lại ý chính.' : 'Tiêu chuẩn.'}
    
    **NỘI DUNG GỐC ĐỂ THAM KHẢO**:
    "${originalArticleText.substring(0, 4000)}..."

    **NHIỆM VỤ**:
    1.  Viết một bài viết hoàn chỉnh dưới dạng HTML bằng ngôn ngữ "${options.language}".
    2.  Sử dụng các thẻ \`<h2>\` và \`<h3>\` tương ứng với dàn ý.
    3.  Tích hợp **Từ khóa tập trung** và các từ khóa liên quan một cách tự nhiên, phù hợp với mức độ tối ưu SEO đã chọn.
    4.  Đảm bảo nội dung độc đáo, chất lượng cao và tuân thủ các yêu cầu tùy chỉnh.
    5.  Sử dụng các thẻ \`<p>\`, \`<ul>\`, \`<strong>\` để định dạng.
    6.  **QUAN TRỌNG**: Sau đoạn giới thiệu đầu tiên (1-2 đoạn \`<p>\`), chèn một placeholder duy nhất là \`[AVATAR_IMAGE_HERE]\`.
    
    Chỉ trả về phần thân HTML của bài viết, không bao gồm thẻ \`<html>\` hay \`<body>\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            temperature: 0.7,
        },
    });

    return response.text.trim();
}


// Helper: Generates SEO metadata from the final rewritten content
const generateSeoMetadata = async (articleHtmlContent: string, title: string, focusKeyword: string): Promise<SeoMetadata> => {
    const metadataSchema = {
      type: Type.OBJECT,
      properties: {
        keywords: {
          type: Type.ARRAY,
          description: "Một mảng gồm 3-5 từ khóa nội bộ (tags) có liên quan cho bài viết.",
          items: { type: Type.STRING }
        },
        categories: {
          type: Type.ARRAY,
          description: "Một mảng gồm 1-2 danh mục phù hợp cho bài viết.",
          items: { type: Type.STRING }
        },
        slug: {
          type: Type.STRING,
          description: "Một slug thân thiện với URL, chứa từ khóa tập trung, sử dụng dấu gạch ngang."
        },
        seoTitle: {
          type: Type.STRING,
          description: "Một tiêu đề SEO được tối ưu hóa, khoảng 50-70 ký tự, phải chứa từ khóa tập trung ở đầu."
        },
        seoDescription: {
          type: Type.STRING,
          description: "Một meta description hấp dẫn cho SEO, khoảng 120-160 ký tự, phải chứa từ khóa tập trung."
        },
        seoKeywords: {
          type: Type.ARRAY,
          description: "Một mảng gồm 5-7 từ khóa SEO, bao gồm từ khóa chính và các biến thể.",
          items: { type: Type.STRING }
        }
      },
      required: ["keywords", "categories", "slug", "seoTitle", "seoDescription", "seoKeywords"]
    };

    const plainText = articleHtmlContent.replace(/<[^>]*>?/gm, '').substring(0, 3000);
    const prompt = `Dựa trên nội dung bài viết và từ khóa tập trung, hãy tạo ra các siêu dữ liệu SEO cần thiết.
    
    **TỪ KHÓA TẬP TRUNG**: "${focusKeyword}"
    **TIÊU ĐỀ BÀI VIẾT**: "${title}"
    **NỘI DUNG BÀI VIẾT (tóm tắt)**: "${plainText}..."

    **NHIỆM VỤ**: Tạo tất cả các trường siêu dữ liệu SEO theo schema đã cho. Đảm bảo tất cả đều được tối ưu hóa cho từ khóa tập trung.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: metadataSchema,
            temperature: 0.5,
        },
    });

    return JSON.parse(response.text);
}

// Helper: Generates an image prompt and then the image itself
const generateImage = async (seoTitle: string, focusKeyword: string): Promise<{ avatarUrl: string }> => {
    const promptGenPrompt = `Tạo một lời nhắc (prompt) chi tiết, mô tả sống động bằng tiếng Anh cho một mô hình tạo hình ảnh AI. Lời nhắc này phải tạo ra một hình ảnh đại diện (featured image) chất lượng cao, phù hợp với tiêu đề bài viết sau đây.
    
    **TIÊU ĐỀ BÀI VIẾT**: "${seoTitle}"
    **TỪ KHÓA CHÍNH**: "${focusKeyword}"
    
    **YÊU CẦU VỀ LỜI NHẮC**:
    -   Bằng tiếng Anh.
    -   Mô tả chi tiết về đối tượng, bối cảnh, ánh sáng, và phong cách (ví dụ: 'photorealistic', 'vibrant colors', 'dramatic lighting').
    -   Khoảng 15-25 từ.

    Chỉ trả về chuỗi lời nhắc.`;

    const promptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: promptGenPrompt }] }]
    });
    const avatarPrompt = promptGenResponse.text.trim();
    console.log("--- Generated Image Prompt ---", avatarPrompt);

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: avatarPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    const avatarUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    
    return { avatarUrl };
}

export const searchRecentNews = async (topic: string): Promise<NewsSearchResult[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tìm những bài báo tin tức gần đây nhất về chủ đề: "${topic}"`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (!groundingChunks) {
            return [];
        }
        
        const results: NewsSearchResult[] = groundingChunks
            .map((chunk: any) => ({
                title: chunk.web?.title || '',
                url: chunk.web?.uri || '',
            }))
            .filter((item: NewsSearchResult) => item.title && item.url);

        return results.slice(0, 5); // Return top 5 results

    } catch (error) {
        console.error("Error searching for news:", error);
        throw new Error("Failed to search for news. The API might be busy or an error occurred.");
    }
}

export const suggestKeywordsFromUrl = async (url: string): Promise<string[]> => {
    const prompt = `Phân tích nội dung bài viết tại URL: ${url}. Dựa trên chủ đề chính, hãy đề xuất 4 từ khóa tập trung (focus keywords) phù hợp nhất cho SEO. Các từ khóa phải bằng tiếng Việt, ngắn gọn và có ý định tìm kiếm cao. Trả về KẾT QUÁ DUY NHẤT dưới dạng một mảng JSON chứa các chuỗi. Ví dụ: ["cách làm phở bò", "công thức phở bò gia truyền", "nấu phở bò ngon tại nhà", "bí quyết nấu phở bò"]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.5,
            },
        });
        const suggestions = JSON.parse(response.text);
        return suggestions;
    } catch (error) {
        console.error("Error suggesting keywords:", error);
        return [];
    }
}

export const convertHtmlToMarkdown = async (htmlContent: string): Promise<string> => {
    const prompt = `Vui lòng chuyển đổi nội dung HTML sau thành Markdown được định dạng tốt. Duy trì cấu trúc, bao gồm tiêu đề, danh sách, văn bản in đậm, v.v. Không bao gồm bất kỳ văn bản giải thích nào, chỉ trả về Markdown thô.
    
    NỘI DUNG HTML:
    ${htmlContent}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: { temperature: 0.1 }
    });

    return response.text.trim();
}

export const getReadabilityScore = async (articleText: string): Promise<{ score: number; message: string }> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: {
                type: Type.NUMBER,
                description: "Một điểm số từ 0 đến 100 đánh giá mức độ dễ đọc của văn bản."
            },
            message: {
                type: Type.STRING,
                description: "Một câu nhận xét ngắn gọn (khoảng 15-20 từ) giải thích điểm số, ví dụ: 'Văn bản rất dễ đọc với câu ngắn và từ ngữ đơn giản.'"
            }
        },
        required: ["score", "message"]
    };

    const prompt = `Phân tích văn bản sau đây để đánh giá mức độ dễ đọc. Xem xét các yếu tố như độ dài câu, sự phức tạp của từ ngữ và cấu trúc tổng thể. Cung cấp điểm số từ 0 (rất khó đọc) đến 100 (rất dễ đọc) và một nhận xét ngắn gọn.

    VĂN BẢN:
    "${articleText.substring(0, 4000)}..."`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.3,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting readability score:", error);
        return { score: 0, message: "Không thể phân tích độ dễ đọc." };
    }
};


export const rewriteArticleFromUrl = async (
    url: string,
    focusKeyword: string,
    options: RewriteOptions & { autoImages: boolean }
): Promise<RewriteResult> => {
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            console.log(`--- Starting Article Generation Attempt ${i + 1} ---`);
            
            // STEP 1: Extract clean text from URL
            console.log("[1/6] Extracting content from URL...");
            const articleText = await extractArticleTextFromUrl(url);

            // STEP 2: Generate an SEO-focused outline
            console.log("[2/6] Generating SEO outline...");
            const structuredPlan = await generateSeoOutline(articleText, focusKeyword, options.language, options.seoGoal, options.sampleTitle);

            // STEP 3: Rewrite the article based on the outline
            console.log("[3/6] Rewriting content from outline...");
            const rewrittenHtmlContent = await rewriteContentFromOutline(articleText, structuredPlan, options, focusKeyword);

            // STEP 4: Generate all SEO metadata based on the new content
            console.log("[4/6] Generating SEO metadata...");
            const metadata = await generateSeoMetadata(rewrittenHtmlContent, structuredPlan.title, focusKeyword);

            // STEP 5: Generate the avatar image (conditionally)
            let avatarUrl = '';
            if (options.autoImages) {
                console.log("[5/6] Generating image...");
                const { avatarUrl: generatedUrl } = await generateImage(metadata.seoTitle, focusKeyword);
                avatarUrl = generatedUrl;
            } else {
                console.log("[5/6] Skipping image generation as per settings.");
            }
            
            // STEP 6: Assemble the final article
            console.log("[6/6] Assembling final article...");
            
            let finalContent = rewrittenHtmlContent;
            if (options.autoImages && avatarUrl) {
                const imageTag = `<img src="${avatarUrl}" alt="${metadata.seoTitle}" style="width:100%; height:auto; border-radius: 8px; margin: 1.5em 0;" />`;
                finalContent = finalContent.replace('[AVATAR_IMAGE_HERE]', imageTag);
            } else {
                finalContent = rewrittenHtmlContent.replace('[AVATAR_IMAGE_HERE]', '');
            }

            const finalArticle = {
                ...metadata,
                title: structuredPlan.title,
                summary: structuredPlan.summary,
                content: finalContent,
                avatarUrl: avatarUrl
            };

            console.log("--- Article Generation Successful ---");
            return { articleData: finalArticle, originalText: articleText };

        } catch (error) {
            lastError = error as Error;
            console.error(`Attempt ${i + 1} failed. Retrying in ${2 ** i} seconds...`, error);
            if (i < MAX_RETRIES - 1) {
                await new Promise(res => setTimeout(res, (2 ** i) * 1000));
            }
        }
    }
    throw lastError;
};