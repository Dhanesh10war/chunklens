import { describe, it, expect } from 'vitest';
import { generateExportCode } from '../codeExporters';
import { ChunkingConfig } from '../../engine/types';

describe('Code Exporters', () => {
  const baseConfig: ChunkingConfig = {
    strategy: 'recursive',
    chunkSize: 500,
    chunkOverlap: 50,
    unit: 'tokens',
    encoding: 'o200k_base',
  };

  it('generates Python LangChain code with token length function', () => {
    const code = generateExportCode(baseConfig, 'langchain-python');
    expect(code).toContain('RecursiveCharacterTextSplitter');
    expect(code).toContain('chunk_size=500');
    expect(code).toContain('chunk_overlap=50');
    expect(code).toContain('token_length_function');
  });

  it('generates Python LangChain code with character length function', () => {
    const code = generateExportCode({ ...baseConfig, unit: 'characters' }, 'langchain-python');
    expect(code).toContain('RecursiveCharacterTextSplitter');
    expect(code).toContain('length_function=len');
  });

  it('generates LlamaIndex Python code with tokenizer', () => {
    const code = generateExportCode(baseConfig, 'llamaindex-python');
    expect(code).toContain('SentenceSplitter');
    expect(code).toContain('chunk_size=500');
    expect(code).toContain('chunk_overlap=50');
    expect(code).toContain('o200k_base');
  });

  it('generates LangChain.js code with encoding', () => {
    const code = generateExportCode(baseConfig, 'langchain-js');
    expect(code).toContain('RecursiveCharacterTextSplitter');
    expect(code).toContain('chunkSize: 500');
    expect(code).toContain('chunkOverlap: 50');
    expect(code).toContain('o200k_base');
  });

  it('generates Native Python standalone code with zero dependencies', () => {
    const code = generateExportCode(baseConfig, 'native-python');
    expect(code).toContain('def chunk_text(');
    expect(code).toContain('chunk_size: int = 500');
    expect(code).toContain('overlap: int = 50');
  });
});
