// Only these reviewed originals and superseded candidates are excluded from the build output.
// Files remain untouched in public; no glob-based unused-file deletion.
//
// Empty by default: this personal site ships every public asset it references.
// Add relative paths (from the dist root) here when a source file must stay in the
// repository but must never be published, and prune-published-media.mjs will remove it
// after verifying that nothing in the build still references the basename.
export const excludedPublicMedia = [];
