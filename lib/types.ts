export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Cancelled";

export interface Appointment {
  id: string;
  appointmentNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  appointmentDate: string; // "yyyy-MM-dd HH:mm"
  status: AppointmentStatus;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalAppointments: number;
}

export interface Service {
  id: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

export interface BookAppointmentPayload {
  customerPhone: string;
  customerName?: string;
  serviceId: string;
  appointmentDate: string; // "yyyy-MM-ddTHH:mm:ss"
}

export interface UpdateStatusPayload {
  status: AppointmentStatus;
}

export interface ServicePayload {
  serviceName: string;
  price: number;
  durationMinutes: number;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  url: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}