export const COUNTRY_OPTIONS = Object.freeze([
  {
    code: "BD",
    name: "Bangladesh",
    shortLabel: "BD",
  },
  {
    code: "US",
    name: "United States",
    shortLabel: "USA",
  },
]);

export const DEFAULT_COUNTRY_CODES = COUNTRY_OPTIONS.map((country) => country.code);

const COUNTRY_ALIASES = new Map([
  ["BD", "BD"],
  ["BGD", "BD"],
  ["BANGLADESH", "BD"],
  ["US", "US"],
  ["USA", "US"],
  ["UNITEDSTATES", "US"],
  ["UNITEDSTATESOFAMERICA", "US"],
]);

const normalizeRawCountryToken = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s._-]+/g, "");

const parseCountryInput = (value) => {
  if (Array.isArray(value)) return value;

  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  return raw.split(/[|,;/]+/);
};

export const normalizeCountryCode = (value = "") => {
  const token = normalizeRawCountryToken(value);
  if (!token) return "";
  return COUNTRY_ALIASES.get(token) || "";
};

export const normalizeCountryList = (value = []) => {
  const parsed = parseCountryInput(value);
  const normalized = parsed
    .map((item) => normalizeCountryCode(item))
    .filter((item) => COUNTRY_OPTIONS.some((country) => country.code === item));
  return [...new Set(normalized)];
};

export const normalizeCountrySelection = (value = []) => {
  const normalized = normalizeCountryList(value);
  return normalized.length > 0 ? normalized : [...DEFAULT_COUNTRY_CODES];
};

export const formatCountrySelection = (value = []) => {
  const countries = normalizeCountryList(value);

  if (countries.length === 0) {
    return "Global";
  }

  if (countries.length === DEFAULT_COUNTRY_CODES.length && DEFAULT_COUNTRY_CODES.every((code) => countries.includes(code))) {
    return "BD / USA";
  }

  return countries
    .map((code) => COUNTRY_OPTIONS.find((country) => country.code === code)?.shortLabel || code)
    .join(" / ");
};
