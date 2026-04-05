import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/api/storeClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle2, Star, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : format(parsed, "MMM d, yyyy h:mm a");
};

const renderStars = (rating) =>
  Array(5)
    .fill(0)
    .map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Number(rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
      />
    ));

export default function AdminReviews() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-review-products"],
    queryFn: () => storeApi.entities.Product.adminList("-created_date"),
  });

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      if (!product?.id) return;
      map.set(String(product.id), product.name || product.id);
    });
    return map;
  }, [products]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews", statusFilter, search],
    queryFn: () =>
      storeApi.reviews.adminList(
        {
          status: statusFilter,
          search,
        },
        "-created_date",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => storeApi.reviews.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Review updated");
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to update review");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.reviews.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Review deleted");
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to delete review");
    },
  });

  const filtered = useMemo(() => reviews, [reviews]);
  const pendingCount = reviews.filter((review) => review.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            {reviews.length} total reviews, {pendingCount} waiting for approval
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[220px]">
            <Label>Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, order, comment..."
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div className="min-w-[180px]">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-500">Rating</th>
                <th className="px-4 py-3 font-medium text-gray-500">Comment</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
                {filtered.map((review) => (
                <tr key={review.id || review._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-4 align-top">
                    <div>
                      <p className="font-medium text-gray-900">{productMap.get(String(review.product_id)) || review.product_id}</p>
                      <p className="text-xs text-gray-400">{review.order_number || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div>
                      <p className="font-medium text-gray-900">{review.customer_name || "-"}</p>
                      <p className="text-xs text-gray-400">{review.customer_email || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-600">
                    <p className="max-w-md whitespace-pre-wrap">{review.comment || "-"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge className={`${statusColors[review.status] || "bg-gray-100 text-gray-800"} border-0 capitalize`}>
                      {review.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-500">{formatDate(review.created_date)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => review.id && updateMutation.mutate({ id: review.id, data: { status: "approved" } })}
                        disabled={review.status === "approved" || updateMutation.isPending || !review.id}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => review.id && updateMutation.mutate({ id: review.id, data: { status: "rejected" } })}
                        disabled={review.status === "rejected" || updateMutation.isPending || !review.id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => review.id && deleteMutation.mutate(review.id)}
                        disabled={deleteMutation.isPending || !review.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No reviews found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
