/**
 * @deprecated This file is deprecated as of Feature 002 (formatter refactoring).
 * Use the new formatter system in `@/lib/formatters` instead.
 *
 * Migration guide:
 * - Instead of `IOSFormatterImpl`, use `formatterRegistry.get('flomo')` or `formatterRegistry.get('notes')`
 * - New system supports capability discovery and extensibility
 * - See `/specs/002-formatter-refactor/quickstart.md` for adding new formatters
 *
 * This file is kept temporarily for backward compatibility during migration.
 * Will be removed in a future version.
 */

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
    const validImages = IOSFormatterImpl.filterValidImages(images);
    const encodedImages = validImages.length > 0
      ? encodeURIComponent(JSON.stringify(validImages))
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
  // 只验证URL格式正确性，不猜测内容类型
  // 让调用者（flomo/Notes）决定URL是否有效
  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // 只接受 http/https 协议
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }

      // 排除明显的非图片资源
      const pathname = urlObj.pathname.toLowerCase();
      if (/\.(js|css|json|xml|txt|html|php|asp)$/i.test(pathname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // 辅助方法：过滤有效图片
  static filterValidImages(images: string[]): string[] {
    return images.filter(img => this.isValidImageUrl(img));
  }
}