export const THEME_STORAGE_KEY = "am1ya-theme-id-v1";
export const DEFAULT_THEME_ID = "fuyukawa-kagari";

export type ThemeConfig = {
  id: string;
  label: string;
  description: string;
  /** Optional alternative mount point. The default theme lives at the site root. */
  routePrefix?: string;
};

export const themes: readonly ThemeConfig[] = [
  {
    id: "fuyukawa-kagari",
    label: "Fuyukawa Kagari",
    description: "阿巴怪的实验室 · 二次元手账主题"
  }
];

export type ThemeId = "fuyukawa-kagari";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themes.some((theme) => theme.id === value);
}

export function getTheme(themeId: ThemeId): ThemeConfig {
  return themes.find((theme) => theme.id === themeId)
    ?? themes.find((theme) => theme.id === DEFAULT_THEME_ID)
    ?? themes[0];
}

function withLeadingSlash(pathname: string) {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getCanonicalPath(pathname: string) {
  const normalized = withLeadingSlash(pathname);
  const prefixedThemes = [...themes]
    .filter((theme) => theme.routePrefix)
    .sort((a, b) => (b.routePrefix ?? "").length - (a.routePrefix ?? "").length);

  for (const theme of prefixedThemes) {
    const prefix = theme.routePrefix as string;
    if (normalized === prefix || normalized === `${prefix}/`) return "/";
    if (normalized.startsWith(`${prefix}/`)) {
      return normalized.slice(prefix.length) || "/";
    }
  }

  return normalized;
}

export function getThemePath(themeId: ThemeId, pathname: string) {
  const canonicalPath = getCanonicalPath(pathname);
  const theme = getTheme(themeId);

  if (theme.id === DEFAULT_THEME_ID) return canonicalPath;
  if (!theme.routePrefix) return canonicalPath;
  if (canonicalPath === "/") return `${theme.routePrefix}/`;
  return `${theme.routePrefix}${canonicalPath}`;
}
