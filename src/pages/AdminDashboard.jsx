import React from "react";
import { storeApi } from "@/api/storeClient";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, AlertTriangle, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";
import StatsCard from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff", "#f3e8ff"];

export default function AdminDashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products", "dashboard"],
    queryFn: () =>
      storeApi.entities.Product.adminList(
        "-created_date",
        undefined,
        "category_id,low_stock_threshold,stock_quantity",
      ),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => storeApi.entities.Order.list("-created_date", 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => storeApi.entities.Category.list(),
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const lowStockProducts = products.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5));
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Revenue last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter((o) => {
      const d = new Date(o.created_date);
      return d.toDateString() === date.toDateString();
    });
    return {
      day: format(date, "EEE"),
      revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      orders: dayOrders.length,
    };
  });

  // Category distribution
  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c.id] = c.name; });
  const catData = {};
  products.forEach((p) => {
    const name = categoryMap[p.category_id] || "Uncategorized";
    catData[name] = (catData[name] || 0) + 1;
  });
  const pieData = Object.entries(catData).map(([name, value]) => ({ name, value }));

  const recentOrders = orders.slice(0, 5);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`৳${totalRevenue.toFixed(2)}`} icon={Banknote} color="green" index={0} />
        <StatsCard title="Total Orders" value={orders.length} subtitle={`${pendingOrders} pending`} icon={ShoppingCart} color="indigo" index={1} />
        <StatsCard title="Products" value={products.length} icon={Package} color="violet" index={2} />
        <StatsCard title="Low Stock" value={lowStockProducts.length} subtitle="Need attention" icon={AlertTriangle} color="red" index={3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Products by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
          )}
          <div className="space-y-1 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="ml-auto text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Order</th>
                <th className="px-6 py-3 font-medium text-gray-500">Customer</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                <th className="px-6 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{order.order_number}</td>
                  <td className="px-6 py-4 text-gray-600">{order.customer_name}</td>
                  <td className="px-6 py-4">
                    <Badge className={`${statusColors[order.status]} border-0 capitalize`}>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">৳{order.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {order.created_date && format(new Date(order.created_date), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
