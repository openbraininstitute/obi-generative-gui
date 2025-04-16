"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexPreviewProps {
  content: string;
  className?: string;
}

export function LatexPreview({ content, className }: LatexPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    // Clear previous content
    previewRef.current.innerHTML = '';

    // Split content into sections
    const sections = content.split('\n\n').filter(Boolean);

    sections.forEach((section) => {
      const container = document.createElement('div');
      container.className = 'mb-6';

      try {
        if (section.includes('\\[') && section.includes('\\]')) {
          // Handle display math
          const mathContent = section
            .replace(/\\\[/g, '') // Escape both backslash and square bracket
            .replace(/\\\]/g, '')
            .trim();
          
          katex.render(mathContent, container, {
            displayMode: true,
            throwOnError: false
          });
        } else if (section.includes('\\begin{align*}')) {
          // Handle align* environment
          const mathContent = section
            .replace('\\begin{align*}', '')
            .replace('\\end{align*}', '')
            .trim();
          
          katex.render(mathContent, container, {
            displayMode: true,
            throwOnError: false
          });
        } else if (section.startsWith('\\section') || section.startsWith('\\subsection')) {
          // Handle section headers
          const titleMatch = section.match(/\{([^}]+)\}/);
          if (titleMatch) {
            container.className = section.startsWith('\\section') 
              ? 'text-2xl font-bold mb-4' 
              : 'text-xl font-semibold mb-3';
            container.textContent = titleMatch[1];
          }
        } else {
          // Handle regular text
          container.className = 'mb-4 font-mono text-sm whitespace-pre-wrap';
          container.textContent = section;
        }
      } catch (error) {
        // If rendering fails, show as plain text
        container.className = 'mb-4 font-mono text-sm whitespace-pre-wrap text-red-500';
        container.textContent = section;
      }

      previewRef.current?.appendChild(container);
    });
  }, [content]);

  return (
    <div className={cn("p-8 overflow-y-auto bg-white dark:bg-gray-900", className)}>
      <div ref={previewRef} />
    </div>
  );
}