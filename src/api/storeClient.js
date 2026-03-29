const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const buildUrl = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};

const safeParse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const request = async (path, { method = "GET", body, headers = {}, signal } = {}) => {
  const opts = {
    method,
    credentials: "include",
    headers: { ...headers },
    signal,
  };

  if (body && !(body instanceof FormData)) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  } else if (body) {
    opts.body = body;
  }

  const response = await fetch(buildUrl(path), opts);
  const payload = await safeParse(response);

  if (!response.ok) {
    const message = payload?.error || response.statusText || "Request failed";
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

const buildQuery = (filters = {}, sort, limit, fields) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
    } else {
      params.set(key, String(value));
    }
  });
  if (sort) params.set("sort", sort);
  if (limit) params.set("limit", String(limit));
  if (fields) {
    const normalizedFields = Array.isArray(fields) ? fields.filter(Boolean).join(",") : String(fields).trim();
    if (normalizedFields) params.set("fields", normalizedFields);
  }
  return params.toString();
};

const storeApi = {
  auth: {
    me() {
      return request("/auth/me");
    },
    login(email, password) {
      return request("/auth/admin/login", {
        method: "POST",
        body: { email, password },
      });
    },
    logout() {
      return request("/auth/logout", {
        method: "POST",
      });
    },
    async isAuthenticated() {
      try {
        await storeApi.auth.me();
        return true;
      } catch {
        return false;
      }
    },
    redirectToLogin(returnUrl) {
      if (returnUrl) {
        window.location.href = `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      } else {
        window.location.href = "/admin/login";
      }
    },
  },
  customers: {
    register(data) {
      return request("/users/register", {
        method: "POST",
        body: data,
      });
    },
    login(data) {
      return request("/users/login", {
        method: "POST",
        body: data,
      });
    },
    logout() {
      return request("/users/logout", {
        method: "POST",
      });
    },
    me() {
      return request("/users/me");
    },
    update(data) {
      return request("/users/me", {
        method: "PUT",
        body: data,
      });
    },
    orders() {
      return request("/users/me/orders");
    },
  },
  uploads: {
    async image({ file, folder, publicId } = {}) {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      if (publicId) formData.append("public_id", publicId);
      return request("/uploads/image", {
        method: "POST",
        body: formData,
        headers: {},
      });
    },
  },
  media: {
    list(order, limit) {
      const query = buildQuery({}, order, limit);
      const suffix = query ? `?${query}` : "";
      return request(`/admin/media${suffix}`);
    },
    create(data) {
      return request("/admin/media", {
        method: "POST",
        body: data,
      });
    },
    delete(id) {
      return request(`/admin/media/${id}`, {
        method: "DELETE",
      });
    },
  },
  carouselSlides: {
    list(order, limit) {
      const query = buildQuery({}, order, limit);
      const suffix = query ? `?${query}` : "";
      return request(`/carousel-slides${suffix}`);
    },
    adminList(order, limit) {
      const query = buildQuery({}, order, limit);
      const suffix = query ? `?${query}` : "";
      return request(`/admin/carousel-slides${suffix}`);
    },
    create(data) {
      return request("/admin/carousel-slides", {
        method: "POST",
        body: data,
      });
    },
    update(id, data) {
      return request(`/admin/carousel-slides/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    delete(id) {
      return request(`/admin/carousel-slides/${id}`, {
        method: "DELETE",
      });
    },
  },
  entities: {
    Product: {
      list(order, limit) {
        return storeApi.entities.Product.filter({}, order, limit);
      },
      adminList(order, limit, fields) {
        const query = buildQuery({}, order, limit, fields);
        const suffix = query ? `?${query}` : "";
        return request(`/admin/products${suffix}`);
      },
      filter(filters = {}, order, limit, fields) {
        const query = buildQuery(filters, order, limit, fields);
        const suffix = query ? `?${query}` : "";
        return request(`/products${suffix}`);
      },
    create(data) {
      return request("/admin/products", {
        method: "POST",
        body: data,
      });
    },
    import(rows) {
      return request("/admin/products/import", {
        method: "POST",
        body: { rows },
      });
    },
    update(id, data) {
      return request(`/admin/products/${id}`, {
        method: "PUT",
        body: data,
      });
      },
      generateBarcodes() {
        return request("/admin/products/generate-barcodes", {
          method: "POST",
        });
      },
      delete(id) {
        return request(`/admin/products/${id}`, {
          method: "DELETE",
        });
      },
    },
    Category: {
      list(order, limit) {
        return storeApi.entities.Category.filter({}, order, limit);
      },
      filter(filters = {}, order, limit) {
        const query = buildQuery(filters, order, limit);
        const suffix = query ? `?${query}` : "";
        return request(`/categories${suffix}`);
      },
      create(data) {
        return request("/admin/categories", {
          method: "POST",
          body: data,
        });
      },
      update(id, data) {
        return request(`/admin/categories/${id}`, {
          method: "PUT",
          body: data,
        });
      },
      delete(id) {
        return request(`/admin/categories/${id}`, {
          method: "DELETE",
        });
      },
    },
    Supplier: {
      list(order, limit) {
        const query = buildQuery({}, order, limit);
        const suffix = query ? `?${query}` : "";
        return request(`/admin/suppliers${suffix}`);
      },
      create(data) {
        return request("/admin/suppliers", {
          method: "POST",
          body: data,
        });
      },
      update(id, data) {
        return request(`/admin/suppliers/${id}`, {
          method: "PUT",
          body: data,
        });
      },
      delete(id) {
        return request(`/admin/suppliers/${id}`, {
          method: "DELETE",
        });
      },
    },
    Order: {
      list(order, limit) {
        const query = buildQuery({}, order, limit);
        const suffix = query ? `?${query}` : "";
        return request(`/admin/orders${suffix}`);
      },
      filter(filters = {}, order, limit) {
        const query = buildQuery(filters, order, limit);
        const suffix = query ? `?${query}` : "";
        return request(`/orders/my${suffix}`);
      },
      create(data) {
        return request("/orders/checkout", {
          method: "POST",
          body: data,
        });
      },
      update(id, data) {
        return request(`/admin/orders/${id}`, {
          method: "PUT",
          body: data,
        });
      },
      delete(id) {
        return request(`/admin/orders/${id}`, {
          method: "DELETE",
        });
      },
    },
  },
};

export { storeApi, ApiError };
