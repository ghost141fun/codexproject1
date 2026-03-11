import React from 'react';

interface RichTextRendererProps {
  content: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  // Very basic markdown parser for demo purposes
  const parseContent = (text: string) => {
    // Escape HTML to prevent XSS (in a real app, use a sanitizer)
    let processed = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks: ```code```
    processed = processed.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-md my-2 font-code text-sm overflow-x-auto border border-white/10 text-accent"><code>$1</code></pre>');
    
    // Inline code: `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-primary/20 text-primary px-1 rounded font-code">$1</code>');

    // Bold: **text**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return processed;
  };

  return (
    <div 
      className="prose prose-invert max-w-none text-foreground/90 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: parseContent(content) }} 
    />
  );
};