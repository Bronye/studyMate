/// <reference types="vite/client" />

// Environment Variables interface
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLOUD_VISION_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// SVG module declarations for React components
declare module '*.svg?react' {
  import { ReactElement } from 'react';
  const content: (props: React.SVGProps<SVGSVGElement>) => ReactElement;
  export default content;
}
