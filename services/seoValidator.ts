import { ArticleData, SeoValidationResult } from '../types';

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const countOccurrences = (text: string, sub: string): number => {
    if (!sub || !text) return 0;
    return text.toLowerCase().split(sub.toLowerCase()).length - 1;
};

export const validateSeo = (article: ArticleData, focusKeyword: string): SeoValidationResult => {
    const results: SeoValidationResult['results'] = {
        titleLength: { pass: false, message: '' },
        metaDescriptionLength: { pass: false, message: '' },
        keywordInTitle: { pass: false, message: '' },
        keywordInMetaDescription: { pass: false, message: '' },
        keywordInContent: { pass: false, message: '' },
        headings: { pass: false, message: '' },
    };

    let passedChecks = 0;
    const totalChecks = Object.keys(results).length;
    const lowerCaseFocusKeyword = focusKeyword.toLowerCase();

    // 1. Title Length (50-60 chars)
    const titleLen = article.seoTitle.length;
    if (titleLen >= 50 && titleLen <= 60) {
        results.titleLength.pass = true;
        results.titleLength.message = `Tuyệt vời! Tiêu đề SEO dài ${titleLen} ký tự (trong khoảng 50-60).`;
        passedChecks++;
    } else {
        results.titleLength.message = `Tiêu đề SEO dài ${titleLen} ký tự. Nên dài từ 50-60 ký tự.`;
    }

    // 2. Meta Description Length (120-160 chars)
    const metaLen = article.seoDescription.length;
    if (metaLen >= 120 && metaLen <= 160) {
        results.metaDescriptionLength.pass = true;
        results.metaDescriptionLength.message = `Tốt! Mô tả SEO dài ${metaLen} ký tự (trong khoảng 120-160).`;
        passedChecks++;
    } else {
        results.metaDescriptionLength.message = `Mô tả SEO dài ${metaLen} ký tự. Nên dài từ 120-160 ký tự.`;
    }
    
    // 3. Keyword in SEO Title
    if (article.seoTitle.toLowerCase().includes(lowerCaseFocusKeyword)) {
        results.keywordInTitle.pass = true;
        results.keywordInTitle.message = 'Từ khóa tập trung có trong tiêu đề SEO.';
        passedChecks++;
    } else {
        results.keywordInTitle.message = 'Từ khóa tập trung KHÔNG có trong tiêu đề SEO.';
    }

    // 4. Keyword in Meta Description
    if (article.seoDescription.toLowerCase().includes(lowerCaseFocusKeyword)) {
        results.keywordInMetaDescription.pass = true;
        results.keywordInMetaDescription.message = 'Từ khóa tập trung có trong mô tả SEO.';
        passedChecks++;
    } else {
        results.keywordInMetaDescription.message = 'Từ khóa tập trung KHÔNG có trong mô tả SEO.';
    }

    // 5. Keyword Density
    const plainContent = stripHtml(article.content);
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const keywordCount = countOccurrences(plainContent, focusKeyword);
    
    if (wordCount > 0) {
        const density = (keywordCount / wordCount) * 100;
        if (density >= 0.5 && density <= 2.5) {
            results.keywordInContent.pass = true;
            results.keywordInContent.message = `Mật độ từ khóa là ${density.toFixed(2)}% (${keywordCount} lần), rất tốt.`;
            passedChecks++;
        } else if (density < 0.5) {
            results.keywordInContent.message = `Mật độ từ khóa là ${density.toFixed(2)}% (${keywordCount} lần). Hơi thấp, hãy thêm từ khóa một cách tự nhiên.`;
        } else {
             results.keywordInContent.message = `Mật độ từ khóa là ${density.toFixed(2)}% (${keywordCount} lần). Hơi cao, có thể bị coi là nhồi nhét từ khóa.`;
        }
    } else {
        results.keywordInContent.message = `Không thể tính mật độ từ khóa vì không có nội dung.`;
    }


    // 6. Headings check
    if (article.content.includes('<h2') || article.content.includes('<h3')) {
        results.headings.pass = true;
        results.headings.message = 'Bài viết có sử dụng các thẻ tiêu đề (H2/H3).';
        passedChecks++;
    } else {
        results.headings.message = 'Bài viết không có thẻ tiêu đề (H2/H3). Hãy thêm vào để cải thiện cấu trúc.';
    }

    const score = Math.round((passedChecks / totalChecks) * 100);

    return { score, results };
};