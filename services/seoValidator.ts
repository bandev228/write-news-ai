import { ArticleData, SeoValidationResult, HeadingInfo } from '../types';

const stripHtml = (html: string): string => {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>?/gm, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const countOccurrences = (text: string, sub: string): number => {
    if (!sub || !text) return 0;
    return text.toLowerCase().split(sub.toLowerCase()).length - 1;
};

export const validateSeo = (article: Omit<ArticleData, 'id' | 'createdAt'>, focusKeyword: string, sourceUrl: string): SeoValidationResult => {
    const doc = typeof DOMParser !== 'undefined' ? new DOMParser().parseFromString(article.content, 'text/html') : null;
    const plainContent = stripHtml(article.content);
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const lowerCaseFocusKeyword = focusKeyword.toLowerCase();
    
    let checks: { [key: string]: { pass: boolean, weight: number } } = {};

    // 1. Title
    const titleLen = article.seoTitle.length;
    const titleHasKeyword = article.seoTitle.toLowerCase().includes(lowerCaseFocusKeyword);
    const isTitleLengthOk = titleLen >= 50 && titleLen <= 70;
    checks.title = { pass: isTitleLengthOk && titleHasKeyword, weight: 20 };
    const titleResult = {
        check: {
            pass: checks.title.pass,
            message: `Tiêu đề SEO dài ${titleLen} ký tự (nên từ 50-70) và ${titleHasKeyword ? 'chứa' : 'KHÔNG chứa'} từ khóa.`
        },
        length: titleLen,
        idealMin: 50,
        idealMax: 70
    };

    // 2. Meta Description
    const metaLen = article.seoDescription.length;
    const metaHasKeyword = article.seoDescription.toLowerCase().includes(lowerCaseFocusKeyword);
    const isMetaLengthOk = metaLen >= 120 && metaLen <= 160;
    checks.meta = { pass: isMetaLengthOk && metaHasKeyword, weight: 15 };
    const metaResult = {
        check: {
            pass: checks.meta.pass,
            message: `Mô tả SEO dài ${metaLen} ký tự (nên từ 120-160) và ${metaHasKeyword ? 'chứa' : 'KHÔNG chứa'} từ khóa.`
        },
        length: metaLen,
        idealMin: 120,
        idealMax: 160
    };

    // 3. Keyword Density
    const keywordCount = countOccurrences(plainContent, focusKeyword);
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    const isDensityOk = density >= 0.8 && density <= 3.0;
    checks.density = { pass: isDensityOk, weight: 20 };
    const densityResult = {
        check: {
            pass: isDensityOk,
            message: `Mật độ từ khóa là ${density.toFixed(2)}% (${keywordCount} lần). Mức lý tưởng là 0.8% - 3.0%.`,
            value: `${density.toFixed(2)}%`
        },
        count: keywordCount,
        wordCount: wordCount,
        density: density
    };

    // 4. Image Alt Text
    const firstImage = doc ? doc.querySelector('img') : null;
    const hasAltText = firstImage ? firstImage.hasAttribute('alt') && (firstImage.getAttribute('alt') || '').trim() !== '' : false;
    checks.image = { pass: hasAltText, weight: 10 };
    const imageResult = {
        check: {
            pass: hasAltText,
            message: hasAltText ? 'Ảnh đại diện có văn bản thay thế (alt text).' : 'Ảnh đại diện thiếu văn bản thay thế (alt text).'
        }
    };
    
    // 5. Headings
    const headings: HeadingInfo[] = [];
    if(doc) {
        doc.querySelectorAll('h2, h3').forEach(h => {
            headings.push({
                level: parseInt(h.tagName.substring(1), 10),
                text: h.textContent || ''
            });
        });
    }
    const hasH2 = headings.some(h => h.level === 2);
    checks.headings = { pass: hasH2, weight: 15 };
    const headingsResult = {
        check: {
            pass: hasH2,
            message: hasH2 ? `Bài viết có cấu trúc tiêu đề tốt (${headings.length} tiêu đề).` : 'Bài viết thiếu tiêu đề H2, ảnh hưởng đến cấu trúc.'
        },
        structure: headings
    };
    
    // 6. Links
    let internalCount = 0;
    let externalCount = 0;
    if(doc) {
        const sourceHostname = new URL(sourceUrl).hostname;
        doc.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href) {
                try {
                    const linkUrl = new URL(href, sourceUrl); // Resolve relative URLs
                    if (linkUrl.hostname === sourceHostname) {
                        internalCount++;
                    } else {
                        externalCount++;
                    }
                } catch (e) {
                    // Invalid URL, likely something like "tel:" or "mailto:"
                }
            }
        });
    }
    const hasLinks = internalCount > 0 && externalCount > 0;
    checks.links = { pass: hasLinks, weight: 20 };
    const linksResult = {
        check: {
            pass: hasLinks,
            message: hasLinks ? 'Bài viết chứa cả liên kết nội bộ và liên kết ngoài.' : 'Bài viết nên có cả liên kết nội bộ và liên kết ngoài.'
        },
        internalCount,
        externalCount
    };
    
    const totalWeight = Object.values(checks).reduce((sum, check) => sum + check.weight, 0);
    const score = Math.round(
        Object.values(checks).reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0) / totalWeight * 100
    );

    return { 
        score, 
        title: titleResult,
        metaDescription: metaResult,
        keywordDensity: densityResult,
        image: imageResult,
        headings: headingsResult,
        links: linksResult
    };
};