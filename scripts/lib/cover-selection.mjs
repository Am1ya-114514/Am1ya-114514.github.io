const coverName = /^cover-\d+\.webp$/;
const prefix = "/blog-covers/";

export function selectCoverNames(manifest, additions = []) {
  const names = Object.keys(manifest).map(source => {
    if (!source.startsWith(prefix) || !coverName.test(source.slice(prefix.length))) {
      throw new Error(`Invalid responsive cover source: ${source}`);
    }
    return source.slice(prefix.length);
  });
  for (const name of additions) {
    if (!coverName.test(name)) throw new Error(`Invalid cover name: ${name}`);
    names.push(name);
  }
  // An empty manifest is a valid state: this site can ship without responsive covers.
  // New sources still have to be named explicitly through --include=cover-N.webp.
  return [...new Set(names)].sort();
}
