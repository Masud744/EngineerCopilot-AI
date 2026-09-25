import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize HTML from external sources to prevent XSS attacks.
 * Strips scripts, event handlers, and dangerous tags while preserving
 * safe formatting tags for job descriptions.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty.replace(/\\n/g, '<br/>'), {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'table',
      'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Format a date string into a human-readable relative time.
 */
export function formatPostedDate(dateValue?: string): string {
  if (!dateValue) return 'Recent';
  const days = Math.floor((Date.now() - new Date(dateValue).getTime()) / 86400000);
  if (!Number.isFinite(days) || days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get a company logo URL from Clearbit or return null.
 */
export function getCompanyLogoUrl(company?: string): string | null {
  if (!company) return null;
  // Normalize: "Spotify" -> "spotify.com", "Brain Station 23" -> "brainstation-23.com"
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  if (!slug) return null;
  return `https://logo.clearbit.com/${slug}.com`;
}

/**
 * Get color class based on match score.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-white font-bold';
  if (score >= 50) return 'text-zinc-300 font-semibold';
  return 'text-zinc-400';
}

/**
 * Decode common HTML entities (e.g. &#038;, &amp;, &quot;, &#39;) into clean characters.
 */
export function decodeHtmlEntities(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&#039;|&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
