import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility to ensure a URL is absolute (adds https:// if missing)
 */
export function getAbsoluteUrl(url: string | undefined): string {
  if (!url) return "#";
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return url;
  return `https://${url}`;
}
