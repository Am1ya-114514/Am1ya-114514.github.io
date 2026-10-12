// Playlist rules for the MUSIC/ folder.
//
// Kept separate from generate-assets.mjs so the ordering can be unit-tested without
// touching the filesystem. See MUSIC/README.md for the reader-facing explanation.

export const audioExtensions = new Set([".mp3", ".flac", ".wav", ".ogg", ".m4a"]);

// A leading "01-", "02.", "03 " or "04、" is an explicit rank and is dropped from the
// displayed title, so 01-最后一页.mp3 shows up as 「最后一页」.
export const trackRankPattern = /^(\d{1,3})\s*[-_.、．)）]\s*/;

export function extensionOf(filename) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export function isAudioFile(filename) {
  return audioExtensions.has(extensionOf(filename));
}

export function titleOf(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(trackRankPattern, "").trim();
}

export function rankOf(filename) {
  const match = trackRankPattern.exec(filename);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function compareTracks(a, b) {
  const rankA = rankOf(a);
  const rankB = rankOf(b);
  if (rankA !== rankB) return rankA - rankB;
  return a.localeCompare(b, "zh-CN", { sensitivity: "base" });
}

export function orderTrackNames(names) {
  return [...names].filter(isAudioFile).sort(compareTracks);
}

// Keeps only the entries that name a file that actually exists, in the declared order.
export function selectDeclaredTracks(declared, names) {
  if (!Array.isArray(declared)) return [];
  const known = new Set(orderTrackNames(names));
  const entries = [];
  for (const item of declared) {
    const file = typeof item === "string" ? item : item?.file;
    if (typeof file !== "string" || !known.has(file)) continue;
    known.delete(file);
    entries.push({
      file,
      title: (typeof item === "object" && typeof item.title === "string" && item.title) || titleOf(file),
      artist: typeof item === "object" && typeof item.artist === "string" ? item.artist : ""
    });
  }
  return entries;
}

export function buildManifest(names, declared = []) {
  const ordered = orderTrackNames(names);
  const selected = selectDeclaredTracks(declared, names);
  const selectedNames = new Set(selected.map(entry => entry.file));
  const tracks = [
    ...selected,
    ...ordered
      .filter(name => !selectedNames.has(name))
      .map(name => ({ file: name, title: titleOf(name), artist: "" }))
  ];

  return tracks.map((entry, index) => {
    const track = {
      id: `track-${index + 1}`,
      title: entry.title,
      file: entry.file,
      src: `/themes/fuyukawa-kagari/music/${entry.file.split("/").map(encodeURIComponent).join("/")}`
    };
    if (entry.artist) track.artist = entry.artist;
    return track;
  });
}
