declare module "*.css" {
  const content: string;
  export default content;
}

declare module "react-quill/dist/quill.snow.css" {
  const content: string;
  export default content;
}

declare module "react-quill-new/dist/quill.snow.css" {
  const content: string;
  export default content;
}

declare module "react-quill-new" {
  import * as React from "react";

  interface ReactQuillProps {
    theme?: string;
    value?: string;
    onChange?: (value: string) => void;
    modules?: object;
    formats?: string[];
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    readOnly?: boolean;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
  }

  const ReactQuill: React.FC<ReactQuillProps>;
  export default ReactQuill;
}
