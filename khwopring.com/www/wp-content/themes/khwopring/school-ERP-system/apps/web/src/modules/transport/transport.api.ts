import { api } from "@/lib/api";

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
}

export type VehicleType = "BUS" | "VAN" | "CAR" | "OTHER";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  capacity: number;
  driverId?: string | null;
  driver?: Driver | null;
}

export interface PickupPoint {
  id: string;
  routeId: string;
  name: string;
  order: number;
  pickupTime?: string | null;
}

export interface Route {
  id: string;
  name: string;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  pickupPoints: PickupPoint[];
  _count?: { assignments: number };
}

export interface RouteAssignment {
  id: string;
  routeId: string;
  studentId: string;
  pickupPointId?: string | null;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  route: { id: string; name: string; vehicle?: Vehicle | null };
  pickupPoint?: PickupPoint | null;
}

export interface TransportFee {
  id: string;
  routeId: string;
  academicSessionId: string;
  amount: number;
}

export const transportApi = {
  // Vehicles
  listVehicles: () => api.get<{ vehicles: Vehicle[] }>("/transport/vehicles").then((r) => r.data.vehicles),
  createVehicle: (data: { registrationNumber: string; type: VehicleType; capacity: number; driverId?: string }) =>
    api.post("/transport/vehicles", data),
  updateVehicle: (
    id: string,
    data: Partial<{ registrationNumber: string; type: VehicleType; capacity: number; driverId?: string }>
  ) => api.patch(`/transport/vehicles/${id}`, data),
  deleteVehicle: (id: string) => api.delete(`/transport/vehicles/${id}`),

  // Drivers
  listDrivers: () => api.get<{ drivers: Driver[] }>("/transport/drivers").then((r) => r.data.drivers),
  createDriver: (data: { fullName: string; phone: string; licenseNumber: string }) =>
    api.post("/transport/drivers", data),
  updateDriver: (id: string, data: Partial<{ fullName: string; phone: string; licenseNumber: string }>) =>
    api.patch(`/transport/drivers/${id}`, data),
  deleteDriver: (id: string) => api.delete(`/transport/drivers/${id}`),

  // Routes
  listRoutes: () => api.get<{ routes: Route[] }>("/transport/routes").then((r) => r.data.routes),
  getRoute: (id: string) => api.get<{ route: Route }>(`/transport/routes/${id}`).then((r) => r.data.route),
  createRoute: (data: { name: string; vehicleId?: string }) => api.post("/transport/routes", data),
  updateRoute: (id: string, data: Partial<{ name: string; vehicleId?: string }>) =>
    api.patch(`/transport/routes/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/transport/routes/${id}`),

  // Pickup points
  createPickupPoint: (data: { routeId: string; name: string; order: number; pickupTime?: string }) =>
    api.post("/transport/pickup-points", data),
  updatePickupPoint: (id: string, data: Partial<{ name: string; order: number; pickupTime?: string }>) =>
    api.patch(`/transport/pickup-points/${id}`, data),
  deletePickupPoint: (id: string) => api.delete(`/transport/pickup-points/${id}`),

  // Transport fees (read-only lookup; does not generate invoice line items)
  getTransportFee: (params: { routeId?: string; academicSessionId?: string }) =>
    api
      .get<{ transportFee: TransportFee | null }>("/transport/fees", { params })
      .then((r) => r.data.transportFee),
  createTransportFee: (data: { routeId: string; academicSessionId: string; amount: number }) =>
    api.post("/transport/fees", data),

  // Route assignments
  listAssignments: (params?: { routeId?: string; studentId?: string }) =>
    api.get<{ assignments: RouteAssignment[] }>("/transport/assignments", { params }).then((r) => r.data.assignments),
  assignStudent: (data: { routeId: string; studentId: string; pickupPointId?: string }) =>
    api.post<{ assignment: RouteAssignment }>("/transport/assignments", data).then((r) => r.data.assignment),
  removeAssignment: (id: string) => api.delete(`/transport/assignments/${id}`),
  bulkAssignStudents: (routeId: string, data: { studentIds: string[]; pickupPointId?: string }) =>
    api
      .post<{ assignments: RouteAssignment[] }>(`/transport/routes/${routeId}/assignments/bulk`, data)
      .then((r) => r.data.assignments),

  // Fuel logs
  listFuelLogs: (vehicleId: string) =>
    api.get<{ fuelLogs: FuelLog[] }>(`/transport/vehicles/${vehicleId}/fuel-logs`).then((r) => r.data.fuelLogs),
  createFuelLog: (
    vehicleId: string,
    data: { filledAt?: string; litres: number; costPerLitre: number; odometerReading?: number }
  ) => api.post<{ fuelLog: FuelLog }>(`/transport/vehicles/${vehicleId}/fuel-logs`, data).then((r) => r.data.fuelLog),
};

export interface FuelLog {
  id: string;
  vehicleId: string;
  filledAt: string;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  odometerReading?: number | null;
}
