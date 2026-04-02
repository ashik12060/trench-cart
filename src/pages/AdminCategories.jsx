import React, { useMemo, useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, FolderTree, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { getRootCategories, getSubcategoriesByParent } from "@/utils/categoryTree";

const ROOT_CATEGORY_VALUE = "__root__";

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [initialParentId, setInitialParentId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list("sort_order"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
  });

  const categoryTree = useMemo(() => {
    const roots = getRootCategories(categories);
    return roots.map((category) => ({
      ...category,
      children: getSubcategoriesByParent(categories, category.id),
    }));
  }, [categories]);

  const parentLookup = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      if (category?.id) map.set(String(category.id), category);
    });
    return map;
  }, [categories]);

  const selectedCategory = selectedCategoryId
    ? categories.find((category) => String(category.id) === String(selectedCategoryId))
    : null;
  const selectedSubcategories = selectedCategory
    ? getSubcategoriesByParent(categories, selectedCategory.id)
    : [];
  const visibleCategories = selectedCategory ? categoryTree.filter((category) => category.id === selectedCategory.id) : categoryTree;

  const openCategoryForm = (category = null, parentId = "") => {
    setEditing(category);
    setInitialParentId(parentId);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={() => openCategoryForm(null, "")} className="rounded-full bg-gray-900 hover:bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">Category Nav</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !selectedCategoryId ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {getRootCategories(categories).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  String(selectedCategoryId) === String(category.id)
                    ? "bg-blue-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory ? (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Subcategory Nav</p>
                <p className="text-sm text-gray-500 mt-1">Under {selectedCategory.name}</p>
              </div>
              <Button
                type="button"
                className="rounded-full bg-gray-900 hover:bg-indigo-600"
                onClick={() => openCategoryForm(null, selectedCategory.id)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Subcategory
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openCategoryForm(null, selectedCategory.id)}
                className="rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
              >
                + Add subcategory
              </button>
              {selectedSubcategories.length > 0 ? (
                selectedSubcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => openCategoryForm(subcategory, subcategory.parent_category_id || selectedCategory.id)}
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {subcategory.name}
                  </button>
                ))
              ) : (
                <span className="rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-500">
                  No subcategories yet
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {visibleCategories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <Badge className="border-0 bg-blue-100 text-blue-800">Category</Badge>
                  <Badge className={`border-0 ${cat.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.is_active !== false ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {cat.description ? <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p> : null}
              </div>
              {cat.image_url ? (
                <img src={cat.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => openCategoryForm(cat, cat.parent_category_id || "")}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => openCategoryForm(null, cat.id)}>
                <Plus className="w-4 h-4 mr-1" /> Add Subcategory
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={cat.children?.length > 0}
                onClick={() => {
                  if (cat.children?.length > 0) {
                    toast.error("Delete subcategories first");
                    return;
                  }
                  deleteMutation.mutate(cat.id);
                }}
                className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Subcategories
                </p>
                <span className="text-xs text-slate-500">
                  {cat.children?.length || 0} total
                </span>
              </div>
              {cat.children?.length ? (
                <div className="mt-3 space-y-2">
                  {cat.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-4 w-4 text-slate-400" />
                          <p className="font-medium text-slate-900">{child.name}</p>
                        </div>
                        {child.description ? (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{child.description}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`border-0 ${child.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {child.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => openCategoryForm(child, child.parent_category_id || "")}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(child.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  No subcategories yet. Use <span className="font-medium text-slate-700">Add Subcategory</span> to create one under this category.
                </div>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-20">
            <FolderTree className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400">No categories yet</p>
          </div>
        )}
      </div>

      <CategoryFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setInitialParentId("");
        }}
        category={editing}
        categories={categories}
        initialParentId={initialParentId}
      />
    </div>
  );
}

function CategoryFormDialog({ open, onClose, category, categories, initialParentId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);

  React.useEffect(() => {
    if (category) {
      setForm({ ...category, parent_category_id: category.parent_category_id || "" });
    } else {
      setForm({
        name: "",
        description: "",
        image_url: "",
        parent_category_id: initialParentId || "",
        is_active: true,
        sort_order: 0,
      });
    }
  }, [category, open, initialParentId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        parent_category_id: String(data.parent_category_id || "").trim(),
      };
      if (category) return storeApi.entities.Category.update(category.id, payload);
      return storeApi.entities.Category.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(category ? "Category updated" : "Category created");
      onClose();
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await storeApi.uploads.image({ file });
      setForm((prev) => ({ ...prev, image_url: file_url }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const selectableParents = rootCategories.filter((root) => root.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : initialParentId ? "Add Subcategory" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <Label>Name *</Label>
            <Input required value={form.name || ""} onChange={(e) => update("name", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Parent Category</Label>
            <Select
              value={form.parent_category_id || ROOT_CATEGORY_VALUE}
              onValueChange={(value) => update("parent_category_id", value === ROOT_CATEGORY_VALUE ? "" : value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Top-level category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_CATEGORY_VALUE}>Top-level category</SelectItem>
                {selectableParents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {initialParentId ? (
              <p className="mt-2 text-xs text-slate-500">
                This category will be created under {categories.find((cat) => cat.id === initialParentId)?.name || "the selected parent"}.
              </p>
            ) : null}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Image</Label>
            {form.image_url && <img src={form.image_url} alt="" className="w-full h-32 rounded-xl object-cover mt-1.5 mb-2" />}
            <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 text-sm mt-1.5">
              <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => update("is_active", v)} />
              <Label>Active</Label>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => update("sort_order", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="rounded-full bg-gray-900 hover:bg-indigo-600">
              {saveMutation.isPending ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
