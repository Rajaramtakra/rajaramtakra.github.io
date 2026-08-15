import { api } from "@/lib/api";

export interface HostelRoomRecord {
  id: string;
  hostelId: string;
  roomNumber: string;
  capacity: number;
  roomType?: string | null;
  occupied: number;
}

export interface HostelRecord {
  id: string;
  name: string;
  address?: string | null;
  wardenStaffId?: string | null;
  totalCapacity: number;
  wardenStaff?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  rooms: HostelRoomRecord[];
}

export type HostelAllocationStatus = "ACTIVE" | "CHECKED_OUT";

export interface HostelAllocationRecord {
  id: string;
  hostelRoomId: string;
  studentId: string;
  checkInDate: string;
  checkOutDate?: string | null;
  status: HostelAllocationStatus;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  hostelRoom: { id: string; roomNumber: string; hostel: { id: string; name: string } };
}

export const hostelApi = {
  listHostels: () => api.get<{ hostels: HostelRecord[] }>("/hostel/hostels").then((r) => r.data.hostels),
  getHostel: (id: string) => api.get<{ hostel: HostelRecord }>(`/hostel/hostels/${id}`).then((r) => r.data.hostel),
  createHostel: (data: { name: string; address?: string; wardenStaffId?: string; totalCapacity: number }) =>
    api.post<{ hostel: HostelRecord }>("/hostel/hostels", data).then((r) => r.data.hostel),
  updateHostel: (id: string, data: Partial<{ name: string; address: string; wardenStaffId: string; totalCapacity: number }>) =>
    api.patch<{ hostel: HostelRecord }>(`/hostel/hostels/${id}`, data).then((r) => r.data.hostel),

  listRoomsForHostel: (hostelId: string) =>
    api.get<{ rooms: HostelRoomRecord[] }>(`/hostel/hostels/${hostelId}/rooms`).then((r) => r.data.rooms),
  createRoom: (data: { hostelId: string; roomNumber: string; capacity: number; roomType?: string }) =>
    api.post<{ room: HostelRoomRecord }>("/hostel/rooms", data).then((r) => r.data.room),
  updateRoom: (id: string, data: Partial<{ roomNumber: string; capacity: number; roomType: string }>) =>
    api.patch<{ room: HostelRoomRecord }>(`/hostel/rooms/${id}`, data).then((r) => r.data.room),

  listAllocations: (params?: { hostelRoomId?: string; status?: HostelAllocationStatus }) =>
    api.get<{ allocations: HostelAllocationRecord[] }>("/hostel/allocations", { params }).then((r) => r.data.allocations),
  createAllocation: (data: { hostelRoomId: string; studentId: string; checkInDate?: string }) =>
    api.post<{ allocation: HostelAllocationRecord }>("/hostel/allocations", data).then((r) => r.data.allocation),
  checkoutAllocation: (id: string, checkOutDate?: string) =>
    api
      .post<{ allocation: HostelAllocationRecord }>(`/hostel/allocations/${id}/checkout`, { checkOutDate })
      .then((r) => r.data.allocation),

  getStudentAllocation: (studentId: string) =>
    api
      .get<{ allocation: HostelAllocationRecord | null }>(`/hostel/students/${studentId}/allocation`)
      .then((r) => r.data.allocation),
};
