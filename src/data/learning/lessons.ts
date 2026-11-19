import lesson1_1 from '../../../docs/learn/m1-rag-foundations/1-1-what-is-rag.md?raw';
import lesson3_2 from '../../../docs/learn/m3-chunking-fundamentals/3-2-the-size-trade-off.md?raw';

export const LESSON_CONTENT: Record<string, string> = {
  '1-1-what-is-rag': lesson1_1,
  '3-2-the-size-trade-off': lesson3_2,
};

export function getLessonMarkdown(slug: string): string | undefined {
  return LESSON_CONTENT[slug];
}
