// Shared between the client form (validation) and Server Actions/gallery
// (validation + embed rendering) — must stay free of "server-only".
//
// Only URLs from providers we can safely iframe-embed are accepted (FR-53
// says "e.g. YouTube links"). Rendering an arbitrary user-supplied URL on a
// public team page would be a phishing vector, so unknown hosts are rejected
// at write time, not just rendered differently.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function getVideoEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www|m)\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return `https://www.youtube-nocookie.com/embed/${v}`;
    const pathId = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})(?:$|\/)/);
    return pathId ? `https://www.youtube-nocookie.com/embed/${pathId[1]}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const pathId = url.pathname.match(/^\/(?:video\/)?(\d+)(?:$|\/)/);
    return pathId ? `https://player.vimeo.com/video/${pathId[1]}` : null;
  }
  return null;
}
