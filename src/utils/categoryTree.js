export const isRootCategory = (category) => !String(category?.parent_category_id || "").trim();

export const getRootCategories = (categories = []) =>
  categories.filter((category) => isRootCategory(category));

export const getSubcategoriesByParent = (categories = [], parentCategoryId = "") =>
  categories.filter((category) => String(category?.parent_category_id || "") === String(parentCategoryId || ""));

export const buildCategoryTree = (categories = [], parentCategoryId = "") =>
  getSubcategoriesByParent(categories, parentCategoryId).map((category) => ({
    ...category,
    children: buildCategoryTree(categories, category.id),
  }));

export const getCategoryById = (categories = [], categoryId = "") =>
  categories.find((category) => String(category?.id || "") === String(categoryId || "")) || null;

export const getCategoryLineage = (categories = [], categoryId = "") => {
  const lineage = [];
  const seen = new Set();
  let current = getCategoryById(categories, categoryId);

  while (current && !seen.has(String(current.id))) {
    lineage.unshift(current);
    seen.add(String(current.id));
    current = getCategoryById(categories, current.parent_category_id);
  }

  return lineage;
};

export const getCategoryDepth = (categories = [], categoryId = "") =>
  Math.max(getCategoryLineage(categories, categoryId).length - 1, 0);

export const getCategoryDescendantIds = (categories = [], categoryId = "") => {
  const descendants = [];
  const queue = getSubcategoriesByParent(categories, categoryId);

  while (queue.length > 0) {
    const current = queue.shift();
    descendants.push(String(current.id));
    queue.push(...getSubcategoriesByParent(categories, current.id));
  }

  return descendants;
};

export const groupCategoriesByParent = (categories = []) =>
  getRootCategories(categories).map((category) => ({
    ...category,
    children: getSubcategoriesByParent(categories, category.id),
  }));
