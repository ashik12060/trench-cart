import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package, TrendingDown, TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import StatsCard from "@/components/admin/StatsCard";
import SearchBar from "@/components/store/SearchBar";

export default function AdminInventory() {
  const [search, setSearch] = useState("");
  const [editingStock, setEditingStock] = useState({});
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => storeApi.entities.Product.adminList(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }) => storeApi.entities.Product.update(id, { stock_quantity: parseInt(stock) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Stock updated");
    },
  });

  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c.id] = c.name; });

  const totalStock = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
  const lowStock = products.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0);
  const outOfStock = products.filter((p) => (p.stock_quantity || 0) <= 0);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your product stock levels</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Items" value={totalStock} icon={Package} color="indigo" index={0} />
        <StatsCard title="Products" value={products.length} icon={TrendingUp} color="green" index={1} />
        <StatsCard title="Low Stock" value={lowStock.length} subtitle="Below threshold" icon={TrendingDown} color="amber" index={2} />
        <StatsCard title="Out of Stock" value={outOfStock.length} subtitle="Need restocking" icon={AlertTriangle} color="red" index={3} />
      </div>

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Product</th>
                <th className="px-6 py-3 font-medium text-gray-500">SKU</th>
                <th className="px-6 py-3 font-medium text-gray-500">Category</th>
                <th className="px-6 py-3 font-medium text-gray-500">Current Stock</th>
                <th className="px-6 py-3 font-medium text-gray-500">Threshold</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const isLow = product.stock_quantity <= (product.low_stock_threshold || 5) && product.stock_quantity > 0;
                const isOut = (product.stock_quantity || 0) <= 0;

                return (
                  <tr key={product.id} className={`border-b last:border-0 hover:bg-gray-50 ${isOut ? "bg-red-50/30" : isLow ? "bg-amber-50/30" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&q=80"}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{product.sku || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{categoryMap[product.category_id] || "—"}</td>
                    <td className="px-6 py-4 font-bold text-lg">{product.stock_quantity || 0}</td>
                    <td className="px-6 py-4 text-gray-500">{product.low_stock_threshold || 5}</td>
                    <td className="px-6 py-4">
                      {isOut ? (
                        <Badge className="bg-red-100 text-red-700 border-0">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge className="bg-amber-100 text-amber-700 border-0">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-0">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20 h-8"
                          value={editingStock[product.id] ?? product.stock_quantity ?? 0}
                          onChange={(e) => setEditingStock({ ...editingStock, [product.id]: e.target.value })}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            updateMutation.mutate({ id: product.id, stock: editingStock[product.id] ?? product.stock_quantity });
                            setEditingStock((prev) => { const n = { ...prev }; delete n[product.id]; return n; });
                          }}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
