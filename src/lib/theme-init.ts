/**
 * Blocking script that applies the saved theme before first paint (no theme flash).
 * Astro does not hash `is:inline` scripts, so the layout hashes this string and adds it to the CSP.
 */
export const THEME_INIT_SCRIPT =
  "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();";

/** Base64 SHA-256, the format a CSP `'sha256-…'` source expects. */
export async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
