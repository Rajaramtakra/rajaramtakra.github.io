import { api } from "@/lib/api";

export type AnnouncementAudience = "ALL" | "STUDENTS" | "PARENTS" | "TEACHERS" | "STAFF";
export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP" | "PUSH";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export interface Message {
  id: string;
  schoolId: string;
  senderId: string;
  recipientId: string;
  subject?: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  popupUntil?: string | null;
  publishedById: string;
  publishedAt: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  schoolId: string;
  recipientId?: string | null;
  channel: NotificationChannel;
  subject?: string | null;
  body: string;
  status: NotificationStatus;
  error?: string | null;
  createdAt: string;
}

export const communicationApi = {
  getInbox: () => api.get<{ messages: Message[] }>("/communication/messages/inbox").then((r) => r.data.messages),
  sendMessage: (data: { recipientIds: string[]; subject?: string; body: string }) =>
    api.post<{ messages: Message[] }>("/communication/messages", data).then((r) => r.data.messages),
  markMessageRead: (id: string) =>
    api.patch<{ message: Message }>(`/communication/messages/${id}/read`).then((r) => r.data.message),

  listAnnouncements: () =>
    api.get<{ announcements: Announcement[] }>("/communication/announcements").then((r) => r.data.announcements),
  createAnnouncement: (data: { title: string; body: string; audience: AnnouncementAudience; pinned?: boolean; popupUntil?: Date | string }) =>
    api.post<{ announcement: Announcement }>("/communication/announcements", data).then((r) => r.data.announcement),
  setAnnouncementPin: (id: string, data: { pinned: boolean; popupUntil?: string | null }) =>
    api.patch<{ announcement: Announcement }>(`/communication/announcements/${id}/pin`, data).then((r) => r.data.announcement),

  listNotificationLogs: () =>
    api.get<{ logs: NotificationLog[] }>("/communication/notifications").then((r) => r.data.logs),

  sendBulkMessage: (data: { channel: NotificationChannel; classId?: string; sectionId?: string; roleName?: string; body: string }) =>
    api.post<{ job: BulkMessageJob }>("/communication/bulk-messages", data).then((r) => r.data.job),
  listBulkMessageJobs: () =>
    api.get<{ jobs: BulkMessageJob[] }>("/communication/bulk-messages").then((r) => r.data.jobs),
};

export interface BulkMessageJob {
  id: string;
  channel: NotificationChannel;
  classId?: string | null;
  sectionId?: string | null;
  roleName?: string | null;
  body: string;
  status: NotificationStatus;
  sentCount: number;
  createdAt: string;
}
