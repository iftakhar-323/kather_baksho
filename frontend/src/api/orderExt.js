import API from "./axios";

// Order timeline events
// GET /api/orders/:id/events
export const getOrderTimeline = (id) => API.get(`/orders/${id}/events`);

// Add a manual timeline event (admin)
// POST /api/orders/:id/events/admin
export const addOrderEvent = (id, payload) =>
  API.post(`/orders/${id}/events/admin`, payload);

// Estimated delivery
// GET /api/orders/:id/estimated-delivery
export const getEstimatedDelivery = (id) =>
  API.get(`/orders/${id}/estimated-delivery`);

// Return / Refund / Exchange requests
// POST /api/returns
export const requestReturn = (orderId, payload) =>
  API.post(`/returns`, { ...payload, order_id: orderId, type: "return" });
export const requestRefund = (orderId, payload) =>
  API.post(`/returns`, { ...payload, order_id: orderId, type: "refund" });
export const requestExchange = (orderId, payload) =>
  API.post(`/returns`, { ...payload, order_id: orderId, type: "exchange" });

// GET /api/returns  (admin: all, user: own)
export const getReturns = (params = {}) =>
  API.get("/returns", { params });

// PATCH /api/returns/:id  (admin)
export const updateReturnStatus = (id, payload) =>
  API.patch(`/returns/${id}`, payload);

// Fetch a server-rendered HTML document (invoice / receipt) through the same
// axios instance the rest of the app uses, so the auth header + baseURL are
// handled centrally (the previous version read the wrong localStorage key).
const openHtml = async (path) => {
  const res = await API.get(path, { responseType: "text" });
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(res.data);
    w.document.close();
  }
  return true;
};

// GET /api/orders/:id/invoice  — server-rendered printable invoice
export const openInvoice = (id) => openHtml(`/orders/${id}/invoice`);

// GET /api/orders/:id/receipt
export const openReceipt = (id) => openHtml(`/orders/${id}/receipt`);

// Legacy PDF-named exports kept for old imports (return HTML text).
export const getInvoicePDF = async (id) =>
  (await API.get(`/orders/${id}/invoice`, { responseType: "text" })).data;
export const getReceiptPDF = async (id) =>
  (await API.get(`/orders/${id}/receipt`, { responseType: "text" })).data;
