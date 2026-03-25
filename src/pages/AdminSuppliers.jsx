import React, { useState } from "react";
import { storeApi } from "@/api/storeClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

const supplierTypes = ["Manufacturer", "Wholesaler", "Distributor"];
const supplierStatuses = ["Active", "Inactive", "Blacklisted"];

export default function AdminSuppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: () => storeApi.entities.Supplier.list("-createdAt"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete supplier");
    },
  });

  const activeSuppliers = suppliers.filter((supplier) => supplier.status === "Active").length;
  const totalPurchasedUnits = suppliers.reduce(
    (sum, supplier) => sum + (supplier.purchased_units_total || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage supplier records, documents, and sourcing performance.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-full bg-gray-900 hover:bg-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Suppliers" value={suppliers.length} helper={`${activeSuppliers} active`} />
        <SummaryCard
          label="Tracked Products"
          value={suppliers.reduce((sum, supplier) => sum + (supplier.linked_products_count || 0), 0)}
          helper="Products linked to suppliers"
        />
        <SummaryCard
          label="Purchased Units"
          value={totalPurchasedUnits}
          helper="Total units recorded from suppliers"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Supplier</th>
                <th className="px-6 py-3 font-medium text-gray-500">Contact</th>
                <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 font-medium text-gray-500">Tracked</th>
                <th className="px-6 py-3 font-medium text-gray-500">Purchased</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.supplier_name}</p>
                      <p className="text-xs text-gray-500">
                        {supplier.supplier_code || supplier.id}
                        {supplier.company_name ? ` • ${supplier.company_name}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="space-y-1">
                      <p>{supplier.contact_person_name || "No contact added"}</p>
                      <p className="text-xs text-gray-400">{supplier.phone_number || supplier.email_address || "No phone or email"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{supplier.supplier_type}</td>
                  <td className="px-6 py-4 text-gray-600">{supplier.linked_products_count || 0} products</td>
                  <td className="px-6 py-4 text-gray-600">{supplier.purchased_units_total || 0} units</td>
                  <td className="px-6 py-4">
                    <Badge className={`border-0 ${statusClassName(supplier.status)}`}>{supplier.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(supplier);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Truck className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                    No suppliers added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierFormDialog open={showForm} onClose={() => setShowForm(false)} supplier={editing} />
    </div>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{helper}</p>
    </div>
  );
}

function SupplierFormDialog({ open, onClose, supplier }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (supplier) {
      setForm({ ...supplier });
    } else {
      setForm({
        supplier_name: "",
        company_name: "",
        supplier_type: "Wholesaler",
        contact_person_name: "",
        phone_number: "",
        email_address: "",
        website: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state_division: "",
        postal_code: "",
        country: "",
        trade_license_image: "",
        product_categories_supplied: "",
        minimum_order_quantity: 0,
        lead_time: "",
        pricing_notes: "",
        status: "Active",
        rating: "",
        notes_remarks: "",
        supplier_code: "",
      });
    }
  }, [supplier, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        product_categories_supplied: Array.isArray(data.product_categories_supplied)
          ? data.product_categories_supplied
          : String(data.product_categories_supplied || ""),
      };

      if (supplier) {
        return storeApi.entities.Supplier.update(supplier.id, payload);
      }

      return storeApi.entities.Supplier.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(supplier ? "Supplier updated" : "Supplier created");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to save supplier");
    },
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await storeApi.uploads.image({ file });
      setForm((prev) => ({ ...prev, trade_license_image: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-6"
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              <p className="text-xs text-gray-500">Core supplier identity used across inventory and sourcing.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Supplier Name *">
                <Input
                  required
                  value={form.supplier_name || ""}
                  onChange={(e) => update("supplier_name", e.target.value)}
                  className="mt-1.5"
                />
              </Field>
              <Field label="Company Name">
                <Input
                  value={form.company_name || ""}
                  onChange={(e) => update("company_name", e.target.value)}
                  className="mt-1.5"
                />
              </Field>
              <Field label="Supplier Type">
                <Select value={form.supplier_type || "Wholesaler"} onValueChange={(value) => update("supplier_type", value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Supplier Code">
                <Input
                  value={form.supplier_code || ""}
                  onChange={(e) => update("supplier_code", e.target.value)}
                  className="mt-1.5"
                  placeholder="Auto-generated if left empty"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
              <p className="text-xs text-gray-500">Keep the main business contact details in one place.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Contact Person">
                <Input value={form.contact_person_name || ""} onChange={(e) => update("contact_person_name", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Phone Number">
                <Input value={form.phone_number || ""} onChange={(e) => update("phone_number", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Email Address">
                <Input type="email" value={form.email_address || ""} onChange={(e) => update("email_address", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Website">
                <Input value={form.website || ""} onChange={(e) => update("website", e.target.value)} className="mt-1.5" placeholder="https://example.com" />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Address Details</h3>
              <p className="text-xs text-gray-500">Used for shipping records and supplier documentation.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Address Line 1">
                <Input value={form.address_line_1 || ""} onChange={(e) => update("address_line_1", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Address Line 2">
                <Input value={form.address_line_2 || ""} onChange={(e) => update("address_line_2", e.target.value)} className="mt-1.5" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="City">
                <Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="State / Division">
                <Input value={form.state_division || ""} onChange={(e) => update("state_division", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Postal Code">
                <Input value={form.postal_code || ""} onChange={(e) => update("postal_code", e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Country">
                <Input value={form.country || ""} onChange={(e) => update("country", e.target.value)} className="mt-1.5" />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Business & Supply Info</h3>
              <p className="text-xs text-gray-500">Commercial terms and sourcing notes for your purchasing team.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Categories Supplied">
                <Input
                  value={Array.isArray(form.product_categories_supplied) ? form.product_categories_supplied.join(", ") : form.product_categories_supplied || ""}
                  onChange={(e) => update("product_categories_supplied", e.target.value)}
                  className="mt-1.5"
                  placeholder="Groceries, Electronics"
                />
              </Field>
              <Field label="MOQ">
                <Input
                  type="number"
                  value={form.minimum_order_quantity ?? 0}
                  onChange={(e) => update("minimum_order_quantity", e.target.value)}
                  className="mt-1.5"
                />
              </Field>
              <Field label="Lead Time">
                <Input value={form.lead_time || ""} onChange={(e) => update("lead_time", e.target.value)} className="mt-1.5" placeholder="7 days" />
              </Field>
              <Field label="Rating">
                <Input type="number" min="0" max="5" step="0.1" value={form.rating ?? ""} onChange={(e) => update("rating", e.target.value)} className="mt-1.5" />
              </Field>
            </div>
            <Field label="Pricing Agreement / Notes">
              <Textarea value={form.pricing_notes || ""} onChange={(e) => update("pricing_notes", e.target.value)} className="mt-1.5 h-24" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Trade License Image</Label>
                {form.trade_license_image ? (
                  <img
                    src={form.trade_license_image}
                    alt=""
                    className="mt-1.5 h-40 w-full rounded-xl border object-cover"
                  />
                ) : null}
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Trade License"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="space-y-4">
                <Field label="Status">
                  <Select value={form.status || "Active"} onValueChange={(value) => update("status", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Notes / Remarks">
                  <Textarea value={form.notes_remarks || ""} onChange={(e) => update("notes_remarks", e.target.value)} className="mt-1.5 h-[132px]" />
                </Field>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="rounded-full bg-gray-900 hover:bg-indigo-600">
              {saveMutation.isPending ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function statusClassName(status) {
  if (status === "Active") return "bg-green-100 text-green-700";
  if (status === "Blacklisted") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}
