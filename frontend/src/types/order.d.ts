/**
 * Order, Checkout, and Real-Time Delivery Tracking Type Definitions
 */

import { Product } from "./product";

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Packed"
  | "On the Way"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentMethod = "cod" | "sslcommerz" | "bkash" | "nagad";
export type PaymentStatus = "Pending COD" | "Paid" | "Failed" | "Refunded";

export interface OrderItem {
  id: number;
  ID?: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface OrderTimelineEvent {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface DeliveryRiderGPS {
  event: "connected" | "gps_update";
  order_id: number;
  step?: number;
  total_steps?: number;
  location?: string;
  lat?: number;
  lng?: number;
  speed_kmh?: number;
  eta_minutes?: number;
  progress_percent?: number;
  rider_name: string;
  rider_phone: string;
  note?: string;
  timestamp?: string;
}

export interface Order {
  id: number;
  ID?: number;
  user_id: number;
  status: OrderStatus;
  total_price: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  delivery_note?: string;
  items?: OrderItem[];
  timeline?: OrderTimelineEvent[];
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
}

