export const parseSort = (rawSort = "-created_date") => {
  if (!rawSort) return { created_date: -1 };
  const sort = {};
  String(rawSort)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.startsWith("-")) {
        sort[part.slice(1)] = -1;
      } else {
        sort[part] = 1;
      }
    });
  return Object.keys(sort).length ? sort : { created_date: -1 };
};

const coerce = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
};

export const parseFilters = (query = {}) => {
  const filters = {};
  Object.entries(query).forEach(([key, value]) => {
    if (["sort", "limit", "page"].includes(key)) return;
    if (key === "id") {
      filters._id = coerce(value);
      return;
    }
    filters[key] = coerce(value);
  });
  return filters;
};
