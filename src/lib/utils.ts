// Utility functions can be added here

// Utility function for merging class names
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function noop() {}
