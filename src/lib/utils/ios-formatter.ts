import { ParsedContent, IOSFormatter } from '../types/parser';
import { AIEnhancedContent } from '../types/ai';

export class IOSFormatterImpl implements IOSFormatter {
  formatFlomo(content: ParsedContent): string {
    // 如果是AI增强内容，使用AI生成的数据
    const aiContent = content as AIEnhancedContent;
    const useAIContent = aiContent.aiEnhanced;
    
    const displayTitle = useAIContent && aiContent.optimizedTitle ? aiContent.optimizedTitle : content.title;
    const displayContent = useAIContent && aiContent.summary ? aiContent.summary : content.content;
    
    const { images, author, originalUrl } = content;
    
    // 构建flomo内容
    let flomoContent = '';
    
    // 标题
    if (displayTitle) {
      flomoContent += `## ${displayTitle}\n\n`;
    }
    
    // 正文内容（摘要或原文）
    if (displayContent) {
      flomoContent += `${displayContent}\n\n`;
    }
    
    // AI增强信息：分类和标签
    if (useAIContent && aiContent.categories && aiContent.categories.length > 0) {
      flomoContent += `🏷️ ${aiContent.categories.join(' · ')}\n`;
    }
    
    if (useAIContent && aiContent.tags && aiContent.tags.length > 0) {
      flomoContent += `#${aiContent.tags.join(' #')}\n\n`;
    }
    
    // 作者信息
    if (author) {
      flomoContent += `👤 ${author}\n`;
    }
    
    // 原链接
    flomoContent += `🔗 ${originalUrl}\n`;
    
    // 时间戳
    flomoContent += `⏰ ${new Date().toLocaleString('zh-CN')}`;
    
    // AI增强标识
    if (useAIContent) {
      flomoContent += '\n✨ AI增强';
    }

    // 构建flomo URL scheme
    const encodedContent = encodeURIComponent(flomoContent);

    // flomo的image_urls需要JSON数组格式：["url1","url2"]
    const encodedImages = images.length > 0
      ? encodeURIComponent(JSON.stringify(images))
      : '';

    let flomoUrl = `flomo://create?content=${encodedContent}`;
    if (encodedImages) {
      flomoUrl += `&image_urls=${encodedImages}`;
    }

    return flomoUrl;
  }

  formatNotes(content: ParsedContent): string {
    // 如果是AI增强内容，使用AI生成的数据
    const aiContent = content as AIEnhancedContent;
    const useAIContent = aiContent.aiEnhanced;
    
    const displayTitle = useAIContent && aiContent.optimizedTitle ? aiContent.optimizedTitle : content.title;
    const displayContent = useAIContent && aiContent.summary ? aiContent.summary : content.content;
    
    const { images, author, originalUrl } = content;
    
    // 构建备忘录内容
    let notesContent = '';
    
    // 标题
    if (displayTitle) {
      notesContent += `${displayTitle}\n\n`;
    }
    
    // 正文内容（摘要或原文）
    if (displayContent) {
      notesContent += `${displayContent}\n\n`;
    }
    
    // AI增强信息
    if (useAIContent && aiContent.categories && aiContent.categories.length > 0) {
      notesContent += `分类: ${aiContent.categories.join(', ')}\n`;
    }
    
    if (useAIContent && aiContent.tags && aiContent.tags.length > 0) {
      notesContent += `标签: ${aiContent.tags.join(', ')}\n\n`;
    }
    
    // 图片链接（备忘录不支持直接插入图片，只能显示链接）
    if (images.length > 0) {
      notesContent += '📷 图片链接：\n';
      images.forEach((img, index) => {
        notesContent += `${index + 1}. ${img}\n`;
      });
      notesContent += '\n';
    }
    
    // 作者信息
    if (author) {
      notesContent += `作者: ${author}\n`;
    }
    
    // 原链接
    notesContent += `链接: ${originalUrl}\n`;
    
    // 时间戳
    notesContent += `时间: ${new Date().toLocaleString('zh-CN')}`;
    
    // AI增强标识
    if (useAIContent) {
      notesContent += '\nAI增强内容';
    }

    // 构建备忘录URL scheme
    const encodedContent = encodeURIComponent(notesContent);
    
    return `mobilenotes://create?note=${encodedContent}`;
  }

  formatRaw(content: ParsedContent): ParsedContent {
    return content;
  }

  // 辅助方法：清理和格式化文本内容
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 多个空格替换为单个空格
      .replace(/\n\s*\n/g, '\n\n') // 多个换行替换为双换行
      .trim();
  }

  // 辅助方法：验证图片URL
  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(pathname);
    } catch {
      return false;
    }
  }

  // 辅助方法：过滤有效图片
  static filterValidImages(images: string[]): string[] {
    return images.filter(img => this.isValidImageUrl(img));
  }
}