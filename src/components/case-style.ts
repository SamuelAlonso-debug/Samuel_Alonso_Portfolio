/** Shared by the home panel and the case page, so the media keeps its backdrop across the transition. */
const surfaces = ['petrol', 'mist', 'ink'] as const;

/** Backdrop of the case at 0-based position `at`. */
export function surfaceOf(at: number): (typeof surfaces)[number] {
  return surfaces[at % surfaces.length] ?? 'petrol';
}

/** 16 px stroke icons per evidence kind. */
export const icons = {
  demo: '<path d="M6 3.5h6.5V10M12.25 3.75 3.5 12.5"/>',
  repo: '<circle cx="4.5" cy="3.5" r="1.75"/><circle cx="4.5" cy="12.5" r="1.75"/><circle cx="11.5" cy="5.5" r="1.75"/><path d="M4.5 5.25v5.5M11.5 7.25c0 2.5-3 2.5-6.2 3.9"/>',
  video: '<rect x="1.75" y="3" width="12.5" height="10" rx="2"/><path d="M6.75 6v4l3.25-2z"/>',
  testimonial:
    '<path d="M2.5 12.5c0-4 1-6.5 3.5-8M2.7 9h2.8v3.5H2.7zM9.5 12.5c0-4 1-6.5 3.5-8M9.7 9h2.8v3.5H9.7z"/>',
  artifact:
    '<path d="M4 1.75h5.25L12.5 5v9.25H4z"/><path d="M9.25 1.75V5h3.25M6 8.25h4.5M6 11h4.5"/>',
  metric: '<path d="M2 13.75h12.25"/><path d="M3.5 11 6.5 7.5l2.5 2 4-5"/>',
} as const;
