import React, { useState, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading, Minus, Eye, Edit2, Sparkles, HelpCircle } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
}

// Light and secure markdown-like parser to render preview
export function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2 whitespace-pre-wrap font-sans text-xs sm:text-sm">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Horizontal line
        if (trimmed === '---') {
          return <hr key={index} className="my-4 border-zinc-200 dark:border-zinc-800" />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white mt-4 mb-2 first:mt-0 font-sans">
              {renderInline(trimmed.substring(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-base font-black uppercase tracking-wide text-zinc-900 dark:text-white mt-4 mb-2 first:mt-0 font-sans">
              {renderInline(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-4 mb-2 first:mt-0 font-sans">
              {renderInline(trimmed.substring(2))}
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const content = trimmed.substring(2);
          return (
            <ul key={index} className="list-disc pl-5 text-zinc-650 dark:text-zinc-350 my-1 font-sans">
              <li className="font-medium">{renderInline(content)}</li>
            </ul>
          );
        }

        // Numbered lists
        const numListMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numListMatch) {
          const num = numListMatch[1];
          const content = numListMatch[2];
          return (
            <ol key={index} className="list-decimal pl-5 text-zinc-650 dark:text-zinc-350 my-1 font-sans">
              <li className="font-medium" value={parseInt(num)}>{renderInline(content)}</li>
            </ol>
          );
        }

        // Empty line
        if (line === '') {
          return <div key={index} className="h-2" />;
        }

        // Regular paragraph with inline formatting
        return (
          <p key={index} className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  if (!text) return '';
  const boldSplit = text.split('**');
  const boldRendered = boldSplit.map((block, idx) => {
    // Every odd block is bold
    if (idx % 2 === 1) {
      return (
        <strong key={idx} className="font-black text-zinc-950 dark:text-white">
          {block}
        </strong>
      );
    }

    // Parse italics inside a non-bold block
    const italicSplit = block.split('*');
    return italicSplit.map((subBlock, sIdx) => {
      if (sIdx % 2 === 1) {
        return (
          <em key={`${idx}-${sIdx}`} className="italic font-bold text-zinc-800 dark:text-zinc-200">
            {subBlock}
          </em>
        );
      }
      return subBlock;
    });
  });

  return boldRendered;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Tell guests about your property...",
  rows = 6,
  label,
  required = false
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showHelper, setShowHelper] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (type: 'bold' | 'italic' | 'heading' | 'bullet' | 'number' | 'hr') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText ? selectedText.length + 2 : 11;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText ? selectedText.length + 1 : 12;
        break;
      case 'heading':
        replacement = `\n### ${selectedText || 'Heading'}\n`;
        selectionOffsetStart = 5;
        selectionOffsetEnd = selectedText ? selectedText.length + 5 : 12;
        break;
      case 'bullet':
        replacement = `\n- ${selectedText || 'List item'}`;
        selectionOffsetStart = 3;
        selectionOffsetEnd = selectedText ? selectedText.length + 3 : 12;
        break;
      case 'number':
        replacement = `\n1. ${selectedText || 'List item'}`;
        selectionOffsetStart = 4;
        selectionOffsetEnd = selectedText ? selectedText.length + 4 : 13;
        break;
      case 'hr':
        replacement = `\n---\n`;
        selectionOffsetStart = 5;
        selectionOffsetEnd = 5;
        break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Refocus and place selection on the new formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd);
    }, 50);
  };

  return (
    <div className="space-y-1.5 font-sans">
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex items-center gap-3">
          {/* Helper Tips Toggle */}
          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className="text-[10px] uppercase font-bold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle size={12} />
            Formatting Guide
          </button>

          {/* Mode Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'write'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-905 dark:text-white shadow-xs'
                  : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Edit2 size={10} />
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-905 dark:text-white shadow-xs'
                  : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Eye size={10} />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Format Guide Box */}
      {showHelper && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-850 rounded-xl grid grid-cols-2 gap-3 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-full">
          <div>
            <p className="font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">Basic Formatting</p>
            <ul className="space-y-1.5 font-mono">
              <li><strong className="text-zinc-700 dark:text-zinc-300">**bold text**</strong> &rarr; bold</li>
              <li><span className="italic">*italic text*</span> &rarr; italic</li>
              <li><span className="opacity-90">---</span> &rarr; horizontal line</li>
            </ul>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">Titles & Lists</p>
            <ul className="space-y-1.5 font-mono">
              <li><strong className="text-zinc-750 dark:text-zinc-250">### Heading</strong> &rarr; subtitle</li>
              <li><strong className="text-zinc-750 dark:text-zinc-250">- list item</strong> &rarr; bullet list</li>
              <li><strong className="text-zinc-750 dark:text-zinc-250">1. list item</strong> &rarr; numbered list</li>
            </ul>
          </div>
        </div>
      )}

      {/* Editor Frame */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-white transition-all shadow-xs">
        {/* Formatting Toolbar - Only visible in Write mode */}
        {activeTab === 'write' && (
          <div className="flex items-center justify-between gap-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 select-none overflow-x-auto shrink-0 scrollbar-none">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => insertFormat('bold')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Bold (Selection)"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('italic')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Italic (Selection)"
              >
                <Italic size={13} />
              </button>
              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-850 mx-1" />
              <button
                type="button"
                onClick={() => insertFormat('heading')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Heading (Selection)"
              >
                <Heading size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('bullet')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Bullet List"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('number')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Numbered List"
              >
                <ListOrdered size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('hr')}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                title="Horizontal Divider"
              >
                <Minus size={13} />
              </button>
            </div>
            
            {/* Ambient note */}
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-zinc-400 font-bold font-sans pr-1">
              Supports markdown headers & bolding
            </span>
          </div>
        )}

        {/* Editor or Preview Pane */}
        <div className="relative">
          {activeTab === 'write' ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              rows={rows}
              required={required}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-zinc-900 dark:text-white text-xs font-semibold leading-relaxed font-sans placeholder-zinc-400 dark:placeholder-zinc-600 resize-y"
            />
          ) : (
            <div 
              className="px-4 py-3 min-h-[144px] max-h-[300px] overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-800 dark:text-zinc-200 selection:bg-zinc-200 dark:selection:bg-zinc-800"
              style={{ minHeight: `${rows * 24}px` }}
            >
              {value ? (
                <FormattedText text={value} />
              ) : (
                <p className="text-zinc-400 dark:text-zinc-605 italic text-xs leading-relaxed font-sans font-medium">
                  Nothing to preview yet. Live rendering will appear here...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
