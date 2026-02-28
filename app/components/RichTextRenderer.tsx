"use client";

import React from "react";

interface RichTextRendererProps {
  content: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  // Render HTML content safely
  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default RichTextRenderer;
