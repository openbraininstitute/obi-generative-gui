"use client";

import { useEffect, useState, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface LatexPreviewProps {
  content: string;
  className?: string;
}

export function LatexPreview({ content, className }: LatexPreviewProps) {
  const [sections, setSections] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Split content into LaTeX sections
    const parts = content.split('\n\n').filter(Boolean);
    setSections(parts);
  }, [content]);

  useEffect(() => {
    if (!previewRef.current) return;

    // Clear previous content
    previewRef.current.innerHTML = '';

    // Process each section
    sections.forEach((section) => {
      const container = document.createElement('div');
      container.className = 'mb-6';

      // Skip rendering document class and other LaTeX commands
      if (section.trim().startsWith('\\documentclass') || 
          section.trim().startsWith('\\begin{document}') ||
          section.trim().startsWith('\\end{document}')) {
        return;
      }

      try {
        // Handle section and subsection commands
        if (section.trim().startsWith('\\section{') || 
            section.trim().startsWith('\\subsection{')) {
          const titleMatch = section.match(/\\(?:sub)?section{([^}]+)}/);
          if (titleMatch) {
            const isSubsection = section.startsWith('\\subsection');
            const titleElement = document.createElement(isSubsection ? 'h3' : 'h2');
            titleElement.className = cn(
              'font-bold mb-4',
              isSubsection ? 'text-xl mt-6' : 'text-2xl mt-8'
            );
            titleElement.textContent = titleMatch[1];
            container.appendChild(titleElement);
            
            // Get the content after the section command
            const content = section.slice(section.indexOf('}') + 1).trim();
            if (content) {
              const contentDiv = document.createElement('div');
              katex.render(content, contentDiv, {
                displayMode: true,
                throwOnError: false,
                strict: false
              });
              container.appendChild(contentDiv);
            }
          }
        } else {
          // Regular LaTeX content
          katex.render(section, container, {
            displayMode: true,
            throwOnError: false,
            strict: false
          });
        }
      } catch (error) {
        // If LaTeX parsing fails, show as plain text
        container.className = 'mb-6 font-mono text-sm whitespace-pre-wrap';
        container.textContent = section;
      }

      previewRef.current?.appendChild(container);
    });
  }, [sections]);

  return (
    <div className={cn(
      "p-8 overflow-y-auto bg-white dark:bg-gray-900 min-w-[400px]", 
      className
    )}>
      <div ref={previewRef} className="max-w-[800px] mx-auto" />
    </div>
  );
}