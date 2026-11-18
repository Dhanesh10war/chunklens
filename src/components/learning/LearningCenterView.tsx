import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Check,
  Copy,
  ArrowRight,
  Shield,
  TrendingUp,
  Code,
} from 'lucide-react';
import { MANUAL_ARTICLES } from '../../data/learning/manualContent';
import { RAG_ACADEMY_MODULES } from '../../data/learning/ragAcademyContent';
import { DOMAIN_PRESETS } from '../../data/learning/presets';
import { GLOSSARY_TERMS } from '../../data/learning/glossary';
import { DecisionWizardWidget } from './DecisionWizardWidget';
import { ChunkingConfig } from '../../engine/types';
import { copyToClipboard } from '../../utils/clipboard';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

export interface LearningCenterViewProps {
  onApplyConfig?: (config: ChunkingConfig) => void;
  defaultTab?: 'manual' | 'academy' | 'presets' | 'glossary';
  className?: string;
  isModal?: boolean;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  onApplyConfig,
  defaultTab = 'manual',
  className,
  isModal: _isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'academy' | 'presets' | 'glossary'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(MANUAL_ARTICLES[0].id);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>(RAG_ACADEMY_MODULES[0].id);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filtered manual articles
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return MANUAL_ARTICLES;
    return MANUAL_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.summary.toLowerCase().includes(normalizedQuery) ||
        a.category.toLowerCase().includes(normalizedQuery) ||
        a.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(normalizedQuery) ||
            s.content.toLowerCase().includes(normalizedQuery)
        )
    );
  }, [normalizedQuery]);

  // Filtered academy modules
  const filteredAcademyModules = useMemo(() => {
    if (!normalizedQuery) return RAG_ACADEMY_MODULES;
    return RAG_ACADEMY_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(normalizedQuery) ||
        m.subtitle.toLowerCase().includes(normalizedQuery) ||
        m.keyTakeaways.some((k) => k.toLowerCase().includes(normalizedQuery)) ||
        m.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(normalizedQuery) ||
            s.paragraphs.some((p) => p.toLowerCase().includes(normalizedQuery))
        )
    );
  }, [normalizedQuery]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    if (!normalizedQuery) return DOMAIN_PRESETS;
    return DOMAIN_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.description.toLowerCase().includes(normalizedQuery) ||
        p.typicalCorpus.toLowerCase().includes(normalizedQuery) ||
        p.rationale.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  // Filtered glossary
  const filteredGlossary = useMemo(() => {
    if (!normalizedQuery) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (g) =>
        g.term.toLowerCase().includes(normalizedQuery) ||
        g.definition.toLowerCase().includes(normalizedQuery) ||
        g.category.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const activeArticle = useMemo(() => {
    return MANUAL_ARTICLES.find((a) => a.id === selectedArticleId) || filteredArticles[0] || MANUAL_ARTICLES[0];
  }, [selectedArticleId, filteredArticles]);

  const activeAcademy = useMemo(() => {
    return RAG_ACADEMY_MODULES.find((m) => m.id === selectedAcademyId) || filteredAcademyModules[0] || RAG_ACADEMY_MODULES[0];
  }, [selectedAcademyId, filteredAcademyModules]);

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }
  };

  const handleApplyPreset = (preset: (typeof DOMAIN_PRESETS)[0]) => {
    if (onApplyConfig) {
      onApplyConfig(preset.recommendedConfig);
      setAppliedPresetId(preset.id);
      setTimeout(() => setAppliedPresetId(null), 2500);
    }
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      case 'Shield':
        return <Shield className="h-4 w-4 text-accent" />;
      case 'Code':
        return <Code className="h-4 w-4 text-accent" />;
      case 'HelpCircle':
        return <HelpCircle className="h-4 w-4 text-accent" />;
      case 'BookOpen':
      default:
        return <BookOpen className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <div className={cn('flex flex-col text-text font-sans', className)}>
      {/* Top Search & Category Tabs */}
      <div className="border-b border-separator pb-4 mb-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          {/* Category Tabs */}
          <div
            role="tablist"
            aria-label="Learning center categories"
            className="flex items-center space-x-1 p-1 bg-surface-2 rounded-control border border-separator overflow-x-auto text-xs"
          >
            {[
              { id: 'manual', label: 'User Manual', icon: BookOpen, count: MANUAL_ARTICLES.length },
              { id: 'academy', label: 'RAG Academy', icon: GraduationCap, count: RAG_ACADEMY_MODULES.length },
              { id: 'presets', label: 'Presets & Wizard', icon: Sparkles, count: DOMAIN_PRESETS.length },
              { id: 'glossary', label: 'Glossary & Shortcuts', icon: HelpCircle, count: GLOSSARY_TERMS.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'flex items-center space-x-1.5 px-3 py-1.5 rounded-control font-medium transition-all active-press focus-ring whitespace-nowrap',
                    isSelected
                      ? 'bg-surface-1 text-text shadow-subtle font-semibold'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-accent' : 'text-text-tertiary')} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-2xs font-mono',
                      isSelected ? 'bg-accent-subtle text-accent' : 'bg-surface-3 text-text-tertiary'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, RAG concepts, presets..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-2 border border-separator rounded-control text-text placeholder:text-text-tertiary focus-ring transition-colors"
              aria-label="Search learning content"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-text-tertiary hover:text-text px-1"
                aria-label="Clear search query"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <p className="text-2xs text-text-secondary font-mono">
            Showing results matching &ldquo;{searchQuery}&rdquo; ({filteredArticles.length} articles, {filteredAcademyModules.length} academy modules, {filteredPresets.length} presets, {filteredGlossary.length} terms)
          </p>
        )}
      </div>

      {/* Tab Panels */}
      {/* 1. USER MANUAL TAB */}
      {activeTab === 'manual' && (
        <div id="panel-manual" role="tabpanel" aria-labelledby="tab-manual" className="flex-1">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Article Navigation List */}
            <div className="w-full lg:w-80 shrink-0 space-y-2">
              <div className="text-2xs font-semibold text-text-tertiary px-1 pb-1">
                Feature Guides ({filteredArticles.length})
              </div>
              <div className="space-y-1.5 overflow-y-auto pr-2" style={{ maxHeight: '24rem' }}>
                {filteredArticles.map((article) => {
                  const isCurrent = article.id === activeArticle.id;
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setSelectedArticleId(article.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-control border transition-all active-press focus-ring flex flex-col',
                        isCurrent
                          ? 'bg-surface-1 border-accent/40 shadow-subtle'
                          : 'bg-surface-2 border-separator hover:bg-surface-3 text-text-secondary hover:text-text'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded bg-surface-3 text-text-secondary">
                          {article.badge}
                        </span>
                        <span className="text-2xs text-text-tertiary font-mono">{article.readTime}</span>
                      </div>
                      <h4 className={cn('text-xs font-semibold line-clamp-1', isCurrent ? 'text-accent' : 'text-text')}>
                        {article.title}
                      </h4>
                      <p className="text-2xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                        {article.summary}
                      </p>
                    </button>
                  );
                })}
                {filteredArticles.length === 0 && (
                  <div className="p-6 text-center text-xs text-text-tertiary bg-surface-2 rounded-control border border-separator">
                    No articles match your search query.
                  </div>
                )}
              </div>
            </div>

            {/* Right Article Content Reader */}
            <div className="flex-1 min-w-0 p-5 sm:p-6 rounded-card border border-separator bg-surface-1 shadow-card space-y-6">
              {activeArticle ? (
                <>
                  <div className="border-b border-separator pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-control bg-accent-subtle text-accent border border-accent/30">
                        {activeArticle.badge}
                      </span>
                      <span className="text-xs text-text-tertiary font-mono">· {activeArticle.readTime} read</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text mb-2">
                      {activeArticle.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                      {activeArticle.summary}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {activeArticle.sections.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h3 className="text-sm font-bold text-text flex items-center space-x-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{section.heading}</span>
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                          {section.content}
                        </p>

                        {/* Callout box if present */}
                        {section.callout && (
                          <div
                            className={cn(
                              'p-3 rounded-control border text-xs leading-relaxed flex items-start space-x-2',
                              section.callout.type === 'tip' && 'bg-accent-subtle border-accent/30 text-text',
                              section.callout.type === 'note' && 'bg-surface-2 border-separator text-text-secondary',
                              section.callout.type === 'warning' && 'bg-status-warn-subtle border-status-warn/30 text-text'
                            )}
                          >
                            <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-semibold text-text text-2xs mr-1.5 capitalize">
                                {section.callout.type}:
                              </span>
                              {section.callout.text}
                            </div>
                          </div>
                        )}

                        {/* Code snippet if present */}
                        {section.codeSnippet && (
                          <div className="rounded-control border border-separator bg-surface-2 overflow-hidden text-xs">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3 border-b border-separator text-2xs font-mono text-text-secondary">
                              <span>{section.codeSnippet.language}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    `code-${activeArticle.id}-${idx}`,
                                    section.codeSnippet!.code
                                  )
                                }
                                className="flex items-center space-x-1 hover:text-text transition-colors"
                                aria-label="Copy code snippet"
                              >
                                {copiedSnippetId === `code-${activeArticle.id}-${idx}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-status-success" />
                                    <span className="text-status-success-text">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre
                              tabIndex={0}
                              role="region"
                              aria-label="Code example"
                              className="p-3.5 overflow-x-auto font-mono text-2xs text-text leading-relaxed select-all focus-ring"
                            >
                              {section.codeSnippet.code}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-text-tertiary">Select an article to view details</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. RAG ACADEMY TAB */}
      {activeTab === 'academy' && (
        <div id="panel-academy" role="tabpanel" aria-labelledby="tab-academy" className="flex-1">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Module Navigation */}
            <div className="w-full lg:w-80 shrink-0 space-y-2">
              <div className="text-2xs font-semibold text-text-tertiary px-1 pb-1">
                Masterclass Modules ({filteredAcademyModules.length})
              </div>
              <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: '24rem' }}>
                {filteredAcademyModules.map((module) => {
                  const isCurrent = module.id === activeAcademy.id;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => setSelectedAcademyId(module.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-control border transition-all active-press focus-ring flex flex-col',
                        isCurrent
                          ? 'bg-surface-1 border-accent/40 shadow-subtle'
                          : 'bg-surface-2 border-separator hover:bg-surface-3 text-text-secondary hover:text-text'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xs font-mono font-semibold px-1.5 py-0.5 rounded bg-accent-subtle text-accent">
                          {module.level}
                        </span>
                        <span className="text-2xs text-text-tertiary font-mono">{module.readTime}</span>
                      </div>
                      <h4 className={cn('text-xs font-semibold line-clamp-1', isCurrent ? 'text-accent' : 'text-text')}>
                        {module.title}
                      </h4>
                      <p className="text-2xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                        {module.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Academy Module Reader */}
            <div className="flex-1 min-w-0 p-5 sm:p-6 rounded-card border border-separator bg-surface-1 shadow-card space-y-6">
              {activeAcademy ? (
                <>
                  <div className="border-b border-separator pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-control bg-accent-subtle text-accent border border-accent/30">
                        Level: {activeAcademy.level}
                      </span>
                      <span className="text-xs text-text-tertiary font-mono">· {activeAcademy.readTime} study time</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text mb-1">
                      {activeAcademy.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                      {activeAcademy.subtitle}
                    </p>
                  </div>

                  {/* Key Takeaways Card */}
                  <div className="p-4 rounded-control border border-accent/30 bg-accent-subtle space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Executive Key Takeaways</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-text">
                      {activeAcademy.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sections */}
                  <div className="space-y-6">
                    {activeAcademy.sections.map((section, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-sm font-bold text-text flex items-center space-x-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{section.heading}</span>
                        </h3>

                        {section.paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="text-xs text-text-secondary leading-relaxed font-sans">
                            {p}
                          </p>
                        ))}

                        {/* ASCII Architecture Diagram */}
                        {section.diagramAscii && (
                          <div className="rounded-control border border-separator bg-surface-2 overflow-hidden my-2">
                            <div className="px-3 py-1 bg-surface-3 border-b border-separator text-2xs font-mono text-text-tertiary">
                              Architecture Pipeline Flow
                            </div>
                            <pre
                              tabIndex={0}
                              role="region"
                              aria-label="ASCII architecture diagram"
                              className="p-3.5 overflow-x-auto font-mono text-2xs text-accent leading-snug whitespace-pre select-all focus-ring"
                            >
                              {section.diagramAscii}
                            </pre>
                          </div>
                        )}

                        {/* Metric Highlight Box */}
                        {section.keyMetric && (
                          <div className="p-3 rounded-control border border-separator bg-surface-2 flex items-center justify-between">
                            <div>
                              <div className="text-2xs font-mono text-text-tertiary">{section.keyMetric.label}</div>
                              <div className="text-xs text-text-secondary mt-0.5">{section.keyMetric.note}</div>
                            </div>
                            <div className="text-base sm:text-lg font-mono font-bold text-accent shrink-0 ml-2">
                              {section.keyMetric.value}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-text-tertiary">Select a module to view</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRESETS & DECISION WIZARD TAB */}
      {activeTab === 'presets' && (
        <div id="panel-presets" role="tabpanel" aria-labelledby="tab-presets" className="flex-1 space-y-6">
          {/* Interactive Decision Wizard Stepper */}
          <DecisionWizardWidget onApplyConfig={onApplyConfig} />

          {/* Curated Domain Presets Grid */}
          <div className="space-y-4">
            <div className="border-b border-separator pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Calibrated Production Domain Presets</h3>
                <p className="text-xs text-text-secondary">
                  Ready-to-use parameter bundles engineered for specific document archetypes and retrieval benchmarks.
                </p>
              </div>
              <span className="text-2xs font-mono text-text-tertiary">
                {filteredPresets.length} presets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPresets.map((preset) => {
                const isApplied = appliedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className="p-5 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between space-y-4 hover:border-accent/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-7 w-7 rounded-control bg-surface-2 border border-separator flex items-center justify-center">
                            {getPresetIcon(preset.iconName)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-text">{preset.name}</h4>
                            <span className="text-2xs font-mono text-text-tertiary">{preset.category}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-control text-2xs font-mono bg-accent-subtle text-accent border border-accent/30">
                          {preset.recommendedConfig.strategy}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed mb-3">
                        {preset.description}
                      </p>

                      <div className="space-y-1.5 text-2xs">
                        <div className="p-2 rounded bg-surface-2 border border-separator font-mono text-text-secondary">
                          <span className="text-text-tertiary">Corpus:</span> {preset.typicalCorpus}
                        </div>
                        <div className="text-text-tertiary leading-relaxed italic">
                          &ldquo;{preset.rationale}&rdquo;
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-separator flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono text-2xs text-text-secondary">
                        <span>{preset.recommendedConfig.chunkSize} tokens</span>
                        <span>·</span>
                        <span>{preset.recommendedConfig.chunkOverlap} overlap</span>
                        <span>·</span>
                        <span>{preset.recommendedConfig.encoding}</span>
                      </div>

                      {onApplyConfig && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApplyPreset(preset)}
                          className={cn(
                            'text-xs font-medium px-2.5 py-1',
                            isApplied && 'text-status-success-text bg-status-success-subtle border-status-success/30'
                          )}
                        >
                          {isApplied ? (
                            <>
                              <Check className="h-3 w-3 mr-2 text-status-success" />
                              <span>Applied</span>
                            </>
                          ) : (
                            <>
                              <span>Apply to Workbench</span>
                              <ArrowRight className="h-3 w-3 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. GLOSSARY & SHORTCUTS TAB */}
      {activeTab === 'glossary' && (
        <div id="panel-glossary" role="tabpanel" aria-labelledby="tab-glossary" className="flex-1 space-y-6">
          {/* Keyboard Shortcuts Table */}
          <div className="p-5 sm:p-6 rounded-card border border-separator bg-surface-1 shadow-subtle space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-separator">
              <div className="h-6 w-6 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-text">
                <HelpCircle className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-bold text-text">ChunkLens Global Keyboard Shortcuts</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {[
                { key: '?', desc: 'Open User Manual & RAG Academy' },
                { key: 'Cmd+K / Ctrl+K', desc: 'Open Command Palette' },
                { key: 'Cmd+E / Ctrl+E', desc: 'Open Code & Data Export' },
                { key: '[', desc: 'Toggle Navigation Sidebar' },
                { key: ']', desc: 'Toggle Chunk Inspector Drawer' },
                { key: 'j / ArrowDown', desc: 'Select Next Sequential Chunk' },
                { key: 'k / ArrowUp', desc: 'Select Previous Chunk' },
                { key: 'Esc', desc: 'Clear Selection / Close Drawer' },
                { key: 'Tab / Shift+Tab', desc: 'Cycle Interactive Focus' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-control bg-surface-2 border border-separator text-xs"
                >
                  <span className="text-text-secondary text-2xs">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-1 border border-separator font-mono text-2xs text-text shadow-subtle shrink-0 ml-2">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Searchable Glossary Dictionary */}
          <div className="space-y-4">
            <div className="border-b border-separator pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">RAG &amp; Vector Search Technical Glossary</h3>
                <p className="text-xs text-text-secondary">
                  Authoritative definitions of retrieval-augmented generation formulas, algorithms, and architectural concepts.
                </p>
              </div>
              <span className="text-2xs font-mono text-text-tertiary">
                {filteredGlossary.length} terms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-bold text-text">{item.term}</h4>
                      <span className="px-1.5 py-0.5 rounded text-2xs font-mono bg-surface-2 text-text-tertiary border border-separator">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed font-sans">
                      {item.definition}
                    </p>
                  </div>

                  {item.formulaOrExample && (
                    <div className="rounded bg-surface-2 border border-separator p-2.5 font-mono text-2xs text-accent select-all overflow-x-auto">
                      {item.formulaOrExample}
                    </div>
                  )}

                  {item.seeAlso && item.seeAlso.length > 0 && (
                    <div className="flex items-center space-x-1.5 text-2xs text-text-tertiary font-mono pt-1">
                      <span>See also:</span>
                      {item.seeAlso.map((sa, sIdx) => (
                        <span key={sIdx} className="bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">
                          {sa}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
