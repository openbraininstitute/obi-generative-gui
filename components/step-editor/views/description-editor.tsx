"use client";

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  return (
    <div className="h-full p-4 bg-background">
      <CodeEditor
        value={value}
        language="markdown"
        placeholder="Enter description in markdown format"
        onChange={(e) => onChange(e.target.value)}
        padding={15}
        style={{
          fontSize: 14,
          backgroundColor: "transparent",
          fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          height: '100%',
          overflow: 'auto'
        }}
      />
    </div>
  );
}