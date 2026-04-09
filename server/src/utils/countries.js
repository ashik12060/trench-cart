import geoip from "geoip-lite";

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
      // Fall back to delimiter parsing below.
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
  const normalized = parsed.map((item) => normalizeCountryCode(item)).filter((item) => COUNTRY_OPTIONS.some((country) => country.code === item));
  return [...new Set(normalized)];
};

export const normalizeCountrySelection = (value = []) => {
  const normalized = normalizeCountryList(value);
  return normalized.length > 0 ? normalized : [...DEFAULT_COUNTRY_CODES];
};

export const isCountrySelectionValid = (value = []) =>
  normalizeCountryList(value).every((code) => DEFAULT_COUNTRY_CODES.includes(code));

export const getCountryOption = (code = "") =>
  COUNTRY_OPTIONS.find((country) => country.code === normalizeCountryCode(code)) || null;

export const getCountryName = (code = "") => getCountryOption(code)?.name || "";

export const getCountryShortLabel = (code = "") => getCountryOption(code)?.shortLabel || normalizeCountryCode(code);

export const formatCountrySelection = (value = []) => {
  const countries = normalizeCountryList(value);

  if (countries.length === 0) {
    return "Global";
  }

  if (countries.length === DEFAULT_COUNTRY_CODES.length && DEFAULT_COUNTRY_CODES.every((code) => countries.includes(code))) {
    return "BD / USA";
  }

  return countries.map((code) => getCountryShortLabel(code)).join(" / ");
};

export const isProductAvailableInCountry = (availableCountries = [], visitorCountry = "") => {
  const countries = normalizeCountryList(availableCountries);

  if (countries.length === 0) {
    return true;
  }

  const normalizedVisitorCountry = normalizeCountryCode(visitorCountry);
  if (!normalizedVisitorCountry) {
    return countries.length === DEFAULT_COUNTRY_CODES.length && DEFAULT_COUNTRY_CODES.every((code) => countries.includes(code));
  }

  return countries.includes(normalizedVisitorCountry);
};

export const buildPublicAvailabilityFilter = (visitorCountry = "") => {
  const normalizedVisitorCountry = normalizeCountryCode(visitorCountry);

  if (normalizedVisitorCountry) {
    return {
      $or: [
        { available_countries: { $exists: false } },
        { available_countries: { $size: 0 } },
        { available_countries: normalizedVisitorCountry },
      ],
    };
  }

  return {
    $or: [
      { available_countries: { $exists: false } },
      { available_countries: { $size: 0 } },
      { available_countries: { $all: DEFAULT_COUNTRY_CODES } },
    ],
  };
};

const getTrustedHeaderCountry = (req) => {
  if (process.env.TRUST_PROXY !== "true") {
    return null;
  }

  const headers = [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "x-country-code",
  ];

  for (const header of headers) {
    const value = req?.headers?.[header];
    const normalized = normalizeCountryCode(value);
    if (normalized) {
      return {
        code: normalized,
        source: `header:${header}`,
      };
    }
  }

  return null;
};

const getRequestIp = (req) => {
  const rawIp = String(req?.ip || req?.socket?.remoteAddress || "").trim();
  if (!rawIp) return "";
  return rawIp.replace(/^::ffff:/, "");
};

export const resolveVisitorCountry = (req) => {
  const fromHeader = getTrustedHeaderCountry(req);
  if (fromHeader) {
    return fromHeader;
  }

  const requestIp = getRequestIp(req);
  if (requestIp) {
    const lookup = geoip.lookup(requestIp);
    const code = normalizeCountryCode(lookup?.country);
    if (code) {
      return {
        code,
        source: "geoip",
      };
    }
  }

  const fallback = normalizeCountryCode(process.env.DEFAULT_VISITOR_COUNTRY || "");
  if (fallback) {
    return {
      code: fallback,
      source: "env",
    };
  }

  return {
    code: "",
    source: "unknown",
  };
};
