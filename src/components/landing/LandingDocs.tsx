import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ArrowRight,
  Sliders,
  Keyboard,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { copyToClipboard } from '../../utils/clipboard';

interface LandingDocsProps {
  onLaunchApp: () => void;
}

export const LandingDocs: React.FC<LandingDocsProps> = ({ onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'langchain-python' | 'llamaindex' | 'langchain-js'>('langchain-python');
  const [copiedCode, setCopiedCode] = useState(false);

  const codeSnippets = {
    'langchain-python': `# pip install langchain-text-splitters tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Strategy calibrated with ChunkLens Visualizer
# Target budget: 400 tokens · Overlap: 40 tokens (10%)
splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base",
    chunk_size=400,
    chunk_overlap=40,
    separators=["\\n\\n", "\\n", " ", ""]
)

# Split document corpus into optimal partitions
documents = splitter.create_documents([raw_text])
print(f"Generated {len(documents)} partitions with verified boundary continuity.")`,

    llamaindex: `# pip install llama-index tiktoken
from llama_index.core.node_parser import SentenceSplitter
import tiktoken

# Strategy calibrated with ChunkLens Visualizer
# Sentence-aware chunking preserving paragraph context
splitter = SentenceSplitter(
    chunk_size=400,
    chunk_overlap=40,
    tokenizer=tiktoken.get_encoding("cl100k_base").encode,
    separator=" "
)

nodes = splitter.get_nodes_from_documents(documents)
print(f"Parsed {len(nodes)} semantic nodes.")`,

    'langchain-js': `// npm install @langchain/textsplitters js-tiktoken
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Strategy calibrated with ChunkLens Visualizer
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 40,
  separators: ["\\n\\n", "\\n", " ", ""],
});

const docs = await splitter.createDocuments([rawText]);
console.log(\`Generated \${docs.length} partitions.\`);`,
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(codeSnippets[activeTab]);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-control bg-accent-subtle text-accent text-2xs font-mono font-semibold mb-3 border border-accent/25">
          <BookOpen className="h-3 w-3" />
          <span>Implementation &amp; API Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-4">
          Export Production Code with One Click
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
          ChunkLens bridges the gap between visual document inspection and production code. Tune your parameters visually, then export drop-in snippets for Python and TypeScript.
        </p>
      </div>

      {/* Code Export Showcase */}
      <div className="rounded-card border border-separator bg-surface-1 shadow-card p-6 sm:p-8 mb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          {/* Framework Tabs */}
          <div className="flex items-center space-x-1.5 bg-surface-2 p-1 rounded-control border border-separator text-xs">
            {[
              { id: 'langchain-python', label: 'LangChain (Python)' },
              { id: 'llamaindex', label: 'LlamaIndex (Python)' },
              { id: 'langchain-js', label: 'LangChain (TypeScript)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'px-3 py-1 rounded-control font-medium transition-all active-press focus-ring',
                  activeTab === tab.id
                    ? 'bg-surface-1 text-text shadow-subtle font-semibold'
                    : 'text-text-secondary hover:text-text'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-control text-xs font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-status-success" />
                <span className="text-status-success-text">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block */}
        <pre
          tabIndex={0}
          role="region"
          aria-label="Code example snippet"
          className="p-4 rounded-control bg-surface-2 border border-separator font-mono text-2xs sm:text-xs text-text-secondary overflow-x-auto leading-relaxed select-all focus-ring"
        >
          {codeSnippets[activeTab]}
        </pre>
      </div>

      {/* Parameter Optimization Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle card-interactive">
          <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
            <Sliders className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">Chunk Size &amp; Overlap Rules of Thumb</h3>
          <ul className="space-y-3 text-xs text-text-secondary">
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <span><strong>Embedding Model Alignment:</strong> Match target tokens to model sweet spots (256–512 tokens for sentence-transformers, 512–1024 for dense models).</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <span><strong>10%–15% Overlap Ratio:</strong> Sufficient to link continuous thoughts without generating bloated near-duplicate chunks.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <span><strong>Delimiters Hierarchy:</strong> Always place semantic paragraph boundaries (<code className="text-2xs bg-surface-2 px-1 py-0.5 rounded">\n\n</code>) before line breaks (<code className="text-2xs bg-surface-2 px-1 py-0.5 rounded">\n</code>).</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle card-interactive">
          <div className="h-10 w-10 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-text mb-4">
            <Keyboard className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">Visualizer Keyboard Shortcuts</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-separator/60">
              <span className="text-text-secondary">Toggle Navigation Sidebar</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator font-mono text-2xs text-text">[</kbd>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-separator/60">
              <span className="text-text-secondary">Toggle Inspector Drawer</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator font-mono text-2xs text-text">]</kbd>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-separator/60">
              <span className="text-text-secondary">Command Palette</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator font-mono text-2xs text-text">Cmd+K / Ctrl+K</kbd>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-separator/60">
              <span className="text-text-secondary">Export Configuration &amp; Chunks</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator font-mono text-2xs text-text">Cmd+E / Ctrl+E</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Similarity Heatmap</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator font-mono text-2xs text-text">H</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-card border border-separator bg-surface-2/40 text-center">
        <h3 className="text-xl font-bold text-text mb-2">Ready to calibrate your pipeline?</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto mb-6">
          Test your document chunks, verify boundary continuity, and export production-ready code in seconds.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onLaunchApp}
          icon={<ArrowRight className="h-4 w-4" />}
          className="text-xs font-semibold px-6 shadow-card"
        >
          <span>Open ChunkLens Visualizer</span>
        </Button>
      </div>
    </div>
  );
};
