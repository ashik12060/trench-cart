import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, FolderTree } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-full bg-gray-900 hover:bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
            {cat.image_url && (
              <img src={cat.image_url} alt="" className="w-full h-32 rounded-xl object-cover mb-4" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                {cat.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>}
              </div>
              <Badge className={`border-0 ${cat.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {cat.is_active !== false ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex gap-1 mt-4 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setShowForm(true); }}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(cat.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
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

      <CategoryFormDialog open={showForm} onClose={() => setShowForm(false)} category={editing} />
    </div>
  );
}

function CategoryFormDialog({ open, onClose, category }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (category) setForm({ ...category });
    else setForm({ name: "", description: "", image_url: "", is_active: true, sort_order: 0 });
  }, [category, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (category) return storeApi.entities.Category.update(category.id, data);
      return storeApi.entities.Category.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(category ? "Category updated" : "Category created");
      onClose();
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await storeApi.uploads.image({ file });
    setForm((prev) => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input required value={form.name || ""} onChange={(e) => update("name", e.target.value)} className="mt-1.5" />
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
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active ?? true} onCheckedChange={(v) => update("is_active", v)} />
            <Label>Active</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending} className="rounded-full bg-gray-900 hover:bg-indigo-600">
              {saveMutation.isPending ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
