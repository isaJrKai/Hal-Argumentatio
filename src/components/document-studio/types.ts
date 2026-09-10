export type RibbonTab = 
  | 'file'
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'layout'
  | 'references'
  | 'mailings'
  | 'review';

export interface DocumentTheme {
  id: string;
  name: string;
  fontFamily: string;
  headingFont: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  headingStyle: 'clean' | 'underlined' | 'shaded' | 'boxed' | 'classic';
}

export interface DocumentFormattingStyle {
  id: string;
  name: string;
  titleClass: string;
  h1Class: string;
  h2Class: string;
  bodyClass: string;
  borderAccent: string;
}

export interface DocumentPageSettings {
  size: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'narrow' | 'moderate' | 'wide';
  columns: 1 | 2 | 3;
  pageColor: string;
  watermark: string | null;
  borderStyle: 'none' | 'box' | 'shadow' | 'double' | 'classic';
  borderColor: string;
  borderWidth: number;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  indentLeft: number;
  indentRight: number;
  spacingBefore: number;
  spacingAfter: number;
  lineSpacing: number; // 1, 1.15, 1.5, 2.0
}

export interface DocumentRecipient {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  phone: string;
  email: string;
  tradeNiche: string;
  website: string;
  missingSsl: boolean;
  lcpSpeed: string;
  recommendedSlaUsd: number;
}

export interface DocumentComment {
  id: string;
  author: string;
  date: string;
  text: string;
  selectedText?: string;
}
