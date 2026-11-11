import { ChunkingConfig, CodeExportFramework } from '../engine/types';

export function generateExportCode(config: ChunkingConfig, framework: CodeExportFramework): string {
  const { strategy, chunkSize, chunkOverlap, unit, encoding } = config;

  switch (framework) {
    case 'langchain-python':
      if (strategy === 'markdown') {
        return `# LangChain Python Markdown Header & Content Splitter
# Install requirement: pip install langchain-text-splitters tiktoken

from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
import tiktoken

# 1. Split on Markdown headers preserving hierarchy
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]
markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on,
    strip_headers=False,
)
md_header_splits = markdown_splitter.split_text(raw_text)

# 2. Sub-chunk content that exceeds chunk size limit
${
  unit === 'tokens'
    ? `enc = tiktoken.get_encoding("${encoding}")
def token_length(text: str) -> int:
    return len(enc.encode(text))

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=token_length,
)`
    : `text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=len,
)`
}

# Example usage:
# all_chunks = text_splitter.split_documents(md_header_splits)
# print(f"Generated {len(all_chunks)} chunks with header metadata")
`;
      }

      if (strategy === 'sentence') {
        return `# LangChain Python Sentence Boundary Splitter
# Install requirement: pip install langchain-text-splitters tiktoken

from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

${
  unit === 'tokens'
    ? `enc = tiktoken.get_encoding("${encoding}")
def token_length(text: str) -> int:
    return len(enc.encode(text))

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=token_length,
    separators=[". ", "! ", "? ", "\\n\\n", "\\n", " "],
)`
    : `text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=len,
    separators=[". ", "! ", "? ", "\\n\\n", "\\n", " "],
)`
}

# Example usage:
# chunks = text_splitter.split_text(raw_text)
# print(f"Generated {len(chunks)} sentence chunks")
`;
      }

      if (strategy === 'fixed') {
        return `# LangChain Python Fixed Character/Token Splitter
# Install requirement: pip install langchain-text-splitters tiktoken

from langchain_text_splitters import CharacterTextSplitter
import tiktoken

${
  unit === 'tokens'
    ? `enc = tiktoken.get_encoding("${encoding}")
def token_length(text: str) -> int:
    return len(enc.encode(text))

text_splitter = CharacterTextSplitter(
    separator="",
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=token_length,
)`
    : `text_splitter = CharacterTextSplitter(
    separator="",
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    length_function=len,
)`
}

# Example usage:
# chunks = text_splitter.split_text(raw_text)
# print(f"Generated {len(chunks)} fixed chunks")
`;
      }

      // Default: Recursive
      return `# LangChain Python Recursive Character Splitter
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
      if (strategy === 'markdown') {
        return `# LlamaIndex Python Markdown Node Parser Implementation
# Install requirement: pip install llama-index llama-index-core

from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.core import Document

parser = MarkdownNodeParser()

# Example usage:
# doc = Document(text=raw_text)
# nodes = parser.get_nodes_from_documents([doc])
# print(f"Parsed {len(nodes)} Markdown nodes preserving header hierarchy")
`;
      }

      if (strategy === 'fixed') {
        return `# LlamaIndex Python Fixed Token Splitter Implementation
# Install requirement: pip install llama-index llama-index-core tiktoken

from llama_index.core.node_parser import TokenTextSplitter
import tiktoken

parser = TokenTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    separator=" ",
)

# Example usage:
# from llama_index.core import Document
# doc = Document(text=raw_text)
# nodes = parser.get_nodes_from_documents([doc])
# print(f"Parsed {len(nodes)} fixed token nodes")
`;
      }

      // Default: Sentence or Recursive
      return `# LlamaIndex Python SentenceSplitter Node Parser Implementation
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
# print(f"Parsed {len(nodes)} nodes with average tokens ~ ${chunkSize}")
`;

    case 'langchain-js':
      if (strategy === 'markdown') {
        return `// LangChain.js / TypeScript Markdown Header & Sub-Chunk Splitter
// Install requirement: npm install @langchain/textsplitters js-tiktoken

import { MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEncoding } from "js-tiktoken";

const enc = getEncoding("${encoding}");

const headerSplitter = new MarkdownHeaderTextSplitter({
  headersToSplitOn: [
    ["#", "Header 1"],
    ["##", "Header 2"],
    ["###", "Header 3"],
  ],
});

const subSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: ${chunkSize},
  chunkOverlap: ${chunkOverlap},
  ${
    unit === 'tokens'
      ? `lengthFunction: (text: string) => enc.encode(text).length,`
      : `lengthFunction: (text: string) => text.length,`
  }
});

// Example usage:
// const headerDocs = await headerSplitter.splitText(rawText);
// const chunks = await subSplitter.splitDocuments(headerDocs);
// console.log(\`Generated \${chunks.length} markdown chunks\`);
`;
      }

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
  separators: ${
    strategy === 'sentence'
      ? `[". ", "! ", "? ", "\\n\\n", "\\n", " "]`
      : `["\\n\\n", "\\n", ". ", " ", ""]`
  },
});

// Example usage:
// const chunks = await splitter.splitText(rawText);
// console.log(\`Generated \${chunks.length} chunks\`);
`;

    case 'native-python':
    default:
      if (strategy === 'markdown') {
        return `# Standalone Native Python Markdown Chunker (Zero External Dependencies)
# No pip install required. Works anywhere.

import re

def chunk_markdown(text: str, max_chunk_size: int = ${chunkSize}):
    """
    Splits markdown by headings while keeping headers and code fences intact.
    """
    if not text:
        return []
    
    # Split along markdown headers
    sections = re.split(r'(?m)^(?=#{1,6}\s+)', text)
    chunks = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(section) <= max_chunk_size:
            chunks.append(section)
        else:
            # Paragraph split within section
            paragraphs = section.split("\\n\\n")
            buf = []
            buf_len = 0
            for p in paragraphs:
                if buf_len + len(p) <= max_chunk_size:
                    buf.append(p)
                    buf_len += len(p) + 2
                else:
                    if buf:
                        chunks.append("\\n\\n".join(buf))
                    buf = [p]
                    buf_len = len(p)
            if buf:
                chunks.append("\\n\\n".join(buf))
                
    return chunks

if __name__ == "__main__":
    sample = "# Sample Header\\n\\nSome markdown content goes here."
    result = chunk_markdown(sample)
    print(f"Total markdown chunks: {len(result)}")
`;
      }

      if (strategy === 'sentence') {
        return `# Standalone Native Python Sentence Chunker (Zero External Dependencies)
# No pip install required. Works anywhere.

import re

def chunk_sentences(text: str, chunk_size: int = ${chunkSize}, overlap: int = ${chunkOverlap}):
    """
    Splits text along grammatical sentence boundaries with overlap.
    """
    if not text:
        return []
    
    # Split sentences on punctuation followed by whitespace
    sentences = re.split(r'(?<=[.!?])\\s+', text.strip())
    chunks = []
    current_chunk = []
    current_len = 0
    
    for s in sentences:
        s_len = len(s)
        if current_len + s_len + (1 if current_chunk else 0) <= chunk_size:
            current_chunk.append(s)
            current_len += s_len + 1
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            current_chunk = [s]
            current_len = s_len
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

if __name__ == "__main__":
    sample = "First sentence. Second sentence with details. Third conclusion."
    result = chunk_sentences(sample)
    print(f"Total sentence chunks: {len(result)}")
`;
      }

      // Default: Fixed / Recursive sliding window
      return `# Standalone Native Python Sliding Window Chunker (Zero External Dependencies)
# No pip install required. Works anywhere.

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

if __name__ == "__main__":
    sample = "Paste your target document text here..."
    result = chunk_text(sample)
    print(f"Total chunks: {len(result)}")
`;
  }
}
