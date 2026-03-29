import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ImageUp, Pencil, Plus, Upload, X } from "lucide-react";

export default function AdminCarousel() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Carousel</h1>
          <p className="text-sm text-gray-500">
            Add full-width banner images and send visitors to any page or external link.
          </p>
        </div>
      </div>

      <CarouselSection />
    </div>
  );
}

function CarouselSection() {
  const queryClient = useQueryClient();
  const [editingSlide, setEditingSlide] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_label: "Shop Now",
    image_url: "",
    link_url: "/",
    sort_order: 0,
    is_active: true,
  });

  const { data: slides = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-carousel-slides"],
    queryFn: () => storeApi.carouselSlides.adminList("sort_order,created_date"),
  });

  React.useEffect(() => {
    if (editingSlide) {
      setForm({
        title: editingSlide.title || "",
        subtitle: editingSlide.subtitle || "",
        cta_label: editingSlide.cta_label || "Shop Now",
        image_url: editingSlide.image_url || "",
        link_url: editingSlide.link_url || "/",
        sort_order: editingSlide.sort_order ?? 0,
        is_active: editingSlide.is_active !== false,
      });
    } else {
      setForm({
        title: "",
        subtitle: "",
        cta_label: "Shop Now",
        image_url: "",
        link_url: "/",
        sort_order: 0,
        is_active: true,
      });
    }
  }, [editingSlide]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingSlide?.id) {
        return storeApi.carouselSlides.update(editingSlide.id, payload);
      }
      return storeApi.carouselSlides.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-carousel-slides"] });
      await queryClient.invalidateQueries({ queryKey: ["carousel-slides"] });
      toast.success(editingSlide ? "Carousel slide updated" : "Carousel slide added");
      setEditingSlide(null);
    },
    onError: (err) => {
      toast.error(err?.message || "Unable to save carousel slide");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.carouselSlides.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-carousel-slides"] });
      await queryClient.invalidateQueries({ queryKey: ["carousel-slides"] });
      toast.success("Carousel slide removed");
    },
    onError: (err) => {
      toast.error(err?.message || "Unable to delete carousel slide");
    },
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await storeApi.uploads.image({ file, folder: "digitrench/carousel" });
      if (file_url) {
        setForm((prev) => ({ ...prev, image_url: file_url }));
      }
    } catch (err) {
      toast.error(err?.message || "Unable to upload carousel image");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedLink = String(form.link_url || "").trim() || "/";
    const payload = {
      title: String(form.title || "").trim(),
      subtitle: String(form.subtitle || "").trim(),
      cta_label: String(form.cta_label || "Shop Now").trim() || "Shop Now",
      image_url: String(form.image_url || "").trim(),
      link_url: normalizedLink.startsWith("http://") || normalizedLink.startsWith("https://") || normalizedLink.startsWith("/")
        ? normalizedLink
        : `/${normalizedLink}`,
      sort_order: Number(form.sort_order || 0),
      is_active: Boolean(form.is_active),
    };

    if (!payload.title || !payload.image_url) {
      toast.error("Title and image are required");
      return;
    }

    saveMutation.mutate(payload);
  };

  return (
    <div className="rounded-3xl border bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Carousel Slides</p>
          <p className="text-xs text-gray-500">Add full-width banner images and send visitors to any page or external link.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full sm:w-auto"
          onClick={() => setEditingSlide(null)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New slide
        </Button>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-700">Title *</p>
              <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Big Summer Sale" />
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-700">Subtitle</p>
              <Input value={form.subtitle} onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))} placeholder="Up to 50% off selected items" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">CTA Label</p>
              <Input value={form.cta_label} onChange={(e) => setForm((prev) => ({ ...prev, cta_label: e.target.value }))} placeholder="Shop Now" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Sort Order</p>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-700">Image URL *</p>
              <Input value={form.image_url} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} placeholder="Paste image link or upload one below" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
              {form.image_url ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}>
                  Clear image
                </Button>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-700">Link Path / URL *</p>
              <Input value={form.link_url} onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))} placeholder="/product-listing or https://..." />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Active
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditingSlide(null)}>
                Reset
              </Button>
              <Button type="submit" className="rounded-full bg-gray-900 hover:bg-indigo-600" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingSlide ? "Update Slide" : "Add Slide"}
              </Button>
            </div>
          </div>
        </form>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Saved Slides</p>
              <p className="text-xs text-slate-500">{slides.length} total slides</p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Loading slides...</div>
          ) : isError ? (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-sm text-red-600">
              {error?.message || "Unable to load carousel slides."}
            </div>
          ) : slides.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              No carousel slides yet. Add one to power the homepage banner.
            </div>
          ) : (
            slides.map((slide) => (
              <div key={slide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 sm:aspect-auto">
                    <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{slide.title}</p>
                        {slide.subtitle ? <p className="mt-1 text-xs text-slate-500">{slide.subtitle}</p> : null}
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${slide.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {slide.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-3 break-all text-xs text-slate-500">{slide.link_url}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditingSlide(slide)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(slide.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
