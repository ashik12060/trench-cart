import React, { useMemo, useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, ImagePlus, Link2, Upload, X } from "lucide-react";

const formatBytes = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};


export default function AdminMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [bulkLinks, setBulkLinks] = useState("");
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => storeApi.media.list("-createdAt"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.media.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("Media removed");
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to remove media");
    },
  });

  const files = useMemo(() => mediaItems || [], [mediaItems]);
  const allLinks = useMemo(() => files.map((file) => file.url).filter(Boolean), [files]);

  const copyToClipboard = async (value, label = "Link") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const addUploadedFiles = async (selectedFiles) => {
    const queue = Array.from(selectedFiles || []);
    if (queue.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of queue) {
        const { file_url } = await storeApi.uploads.image({ file });
        if (file_url) {
          uploaded.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file_url,
          });
        }
      }
      toast.success(uploaded.length > 0 ? `Uploaded ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}` : "No files uploaded");
      await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (error) {
      toast.error(error?.message || "Unable to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = async (event) => {
    const selectedFiles = event.target.files;
    await addUploadedFiles(selectedFiles);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    await addUploadedFiles(event.dataTransfer.files);
  };

  const addBulkLinks = async () => {
    const nextLinks = bulkLinks
      .split(/\r?\n/)
      .map((link) => link.trim())
      .filter(Boolean);

    if (nextLinks.length === 0) {
      toast.error("Paste one or more links first");
      return;
    }

    setIsSavingLinks(true);
    try {
      try {
        await Promise.all(
          nextLinks.map((url) =>
            storeApi.media.create({
              name: url.split("/").pop() || "Linked media",
              size: 0,
              type: "link",
              source: "link",
              url,
            }),
          ),
        );
      } catch (error) {
        toast.error(error?.message || "Unable to save some links to the server");
      }

      setBulkLinks("");
      await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success(`Added ${nextLinks.length} link${nextLinks.length > 1 ? "s" : ""}`);
    } finally {
      setIsSavingLinks(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</p>
        <h1 className="text-2xl font-bold text-gray-900">Media</h1>
        <p className="text-sm text-gray-500">
          Upload images here and copy the generated links for products, variants, banners, or any other place in the store.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className={[
              "rounded-3xl border-2 border-dashed p-8 transition-colors",
              dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white",
            ].join(" ")}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <ImagePlus className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Drop media here</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Upload one or multiple images. Every file gets a usable link after upload.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600">
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Choose files"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleInputChange} disabled={isUploading} />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Paste media links</p>
                <p className="text-xs text-gray-500">One link per line. Useful for external images too.</p>
              </div>
              <Button type="button" variant="outline" className="rounded-full" onClick={addBulkLinks}>
                <Link2 className="mr-2 h-4 w-4" />
                {isSavingLinks ? "Adding..." : "Add links"}
              </Button>
            </div>
            <Textarea
              value={bulkLinks}
              onChange={(e) => setBulkLinks(e.target.value)}
              className="mt-4 min-h-32"
              placeholder="https://example.com/image-1.jpg
https://example.com/image-2.jpg"
            />
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Uploaded media</p>
              <p className="text-xs text-gray-500">{files.length} items ready to use</p>
            </div>
            {allLinks.length > 0 ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={() => copyToClipboard(allLinks.join("\n"), "All links")}>
                <Copy className="mr-2 h-4 w-4" />
                Copy all
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {isLoading && mediaItems.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                Loading media...
              </div>
            ) : isError ? (
              <div className="rounded-2xl bg-red-50 p-8 text-center text-sm text-red-600">
                {error?.message || "Unable to load media."}
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                No media yet. Upload files or paste links to build your library.
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-50">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                        <Badge className="border-0 bg-slate-100 text-slate-700 capitalize">
                          {file.type === "link" ? "Linked" : "Uploaded"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Input value={file.url} readOnly className="min-w-0 flex-1 bg-slate-50 text-xs" />
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => copyToClipboard(file.url, "Media link")}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => {
                            if (file.id) {
                              deleteMutation.mutate(file.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-4 w-4 text-red-500" />
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
    </div>
  );
}
