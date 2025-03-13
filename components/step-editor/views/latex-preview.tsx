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

    // Render each section
    sections.forEach((section) => {
      const container = document.createElement('div');
      container.className = 'mb-6';

      try {
        // Try to render as LaTeX
        katex.render(section, container, {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
      } catch (error) {
        // If LaTeX parsing fails, show as plain text
        container.className = 'mb-6 font-mono text-sm whitespace-pre-wrap';
        container.textContent = section;
      }

      previewRef.current?.appendChild(container);
    });
  }, [sections]);

  return (
    <div className={cn("p-8 overflow-y-auto bg-white dark:bg-gray-900", className)}>
      <div ref={previewRef} />
    </div>
  );
}