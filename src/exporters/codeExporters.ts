import { ChunkingConfig, CodeExportFramework } from '../engine/types';

export function generateExportCode(config: ChunkingConfig, framework: CodeExportFramework): string {
  const { chunkSize, chunkOverlap, unit, encoding } = config;

  switch (framework) {
    case 'langchain-python':
      return `# LangChain Python Text Splitter Implementation
# Install requirement: pip install langchain-text-splitters tiktoken

from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

${
  unit === 'tokens'
    ? `# Token-aware splitter using ${encoding} tokenizer
enc = tiktoken.get_encoding("${encoding}")

def token_length_function(text: str) -> int:
    return len(enc.encode(text))

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=token_length_function,
    separators=["\\n\\n", "\\n", ". ", " ", ""],
    is_separator_regex=False,
)`
    : `# Character-length splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=len,
    separators=["\\n\\n", "\\n", ". ", " ", ""],
)`
}

# Example usage with your documents:
# docs = text_splitter.create_documents([raw_text])
# chunks = text_splitter.split_text(raw_text)
# print(f"Generated {len(chunks)} chunks")
`;

    case 'llamaindex-python':
      return `# LlamaIndex Python Node Parser Implementation
# Install requirement: pip install llama-index llama-index-core tiktoken

from llama_index.core.node_parser import SentenceSplitter
import tiktoken

tokenizer = tiktoken.get_encoding("${encoding}").encode

parser = SentenceSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    tokenizer=tokenizer,
)

# Example usage:
# from llama_index.core import Document
# doc = Document(text=raw_text)
# nodes = parser.get_nodes_from_documents([doc])
# print(f"Parsed {len(nodes)} nodes with average tokens ~ {chunkSize}")
`;

    case 'langchain-js':
      return `// LangChain.js / TypeScript Text Splitter
// Install requirement: npm install @langchain/textsplitters js-tiktoken

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEncoding } from "js-tiktoken";

const enc = getEncoding("${encoding}");

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: ${chunkSize},
  chunkOverlap: ${chunkOverlap},
  ${
    unit === 'tokens'
      ? `lengthFunction: (text: string) => enc.encode(text).length,`
      : `lengthFunction: (text: string) => text.length,`
  }
  separators: ["\\n\\n", "\\n", ". ", " ", ""],
});

// Example usage:
// const chunks = await splitter.splitText(rawText);
// console.log(\`Generated \${chunks.length} chunks\`);
`;

    case 'native-python':
    default:
      return `# Standalone Native Python Chunker (Zero External Dependencies)
# No pip install required. Works anywhere.

import re

def chunk_text(text: str, chunk_size: int = ${chunkSize}, overlap: int = ${chunkOverlap}):
    """
    Splits text into chunks of maximum size with specified overlap.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    step = max(1, chunk_size - overlap)
    
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= len(text):
            break
        start += step
        
    return chunks

# Run standalone test:
if __name__ == "__main__":
    sample = "Paste your target document text here..."
    result = chunk_text(sample)
    print(f"Total chunks: {len(result)}")
`;
  }
}
