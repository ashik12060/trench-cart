export const isRootCategory = (category) => !String(category?.parent_category_id || "").trim();

export const getRootCategories = (categories = []) =>
  categories.filter((category) => isRootCategory(category));

export const getSubcategoriesByParent = (categories = [], parentCategoryId = "") =>
  categories.filter((category) => String(category?.parent_category_id || "") === String(parentCategoryId || ""));

export const groupCategoriesByParent = (categories = []) =>
  getRootCategories(categories).map((category) => ({
    ...category,
    children: getSubcategoriesByParent(categories, category.id),
  }));
