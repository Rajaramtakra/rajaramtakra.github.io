import { useEffect, useState } from "react";
import { Trash2, Truck } from "lucide-react";
import { transportApi, type Route, type Vehicle } from "./transport.api";
import { NewRouteDialog } from "./NewRouteDialog";
import { NewPickupPointDialog } from "./NewPickupPointDialog";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function RouteCard({ route, onChanged }: { route: Route; onChanged: () => void }) {
  const seatsTaken = route._count?.assignments ?? 0;
  const capacity = route.vehicle?.capacity;

  async function handleDeletePoint(id: string) {
    try {
      await transportApi.deletePickupPoint(id);
      toast({ title: "Pickup point removed" });
      onChanged();
    } catch (err) {
      toast({ title: "Failed to remove pickup point", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{route.name}</CardTitle>
          {capacity !== undefined && (
            <Badge variant={seatsTaken >= capacity ? "destructive" : "secondary"} className="text-[10px]">
              {seatsTaken}/{capacity} seats
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5" />
          {route.vehicle ? (
            <span>
              {route.vehicle.registrationNumber}
              {route.vehicle.driver ? ` · ${route.vehicle.driver.fullName}` : ""}
            </span>
          ) : (
            <span>No vehicle assigned</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {route.pickupPoints.length === 0 && <p className="text-xs text-muted-foreground">No pickup points yet.</p>}
        {[...route.pickupPoints]
          .sort((a, b) => a.order - b.order)
          .map((point) => (
            <div key={point.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
              <div>
                <Badge variant="outline" className="mr-2 text-[10px]">
                  #{point.order}
                </Badge>
                <span className="font-medium">{point.name}</span>
                {point.pickupTime && <span className="ml-2 text-muted-foreground">{point.pickupTime}</span>}
              </div>
              <Can anyOf={["transport:manage"]}>
                <button
                  onClick={() => handleDeletePoint(point.id)}
                  className="text-destructive hover:opacity-70"
                  aria-label="Remove pickup point"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Can>
            </div>
          ))}
        <Can anyOf={["transport:manage"]}>
          <div className="pt-1">
            <NewPickupPointDialog routeId={route.id} onCreated={onChanged} />
          </div>
        </Can>
      </CardContent>
    </Card>
  );
}

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([transportApi.listRoutes(), transportApi.listVehicles()])
      .then(([r, v]) => {
        setRoutes(r);
        setVehicles(v);
      })
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground">Transport routes and their ordered pickup points.</p>
        </div>
        <Can anyOf={["transport:manage"]}>
          <NewRouteDialog vehicles={vehicles} onCreated={reload} />
        </Can>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No routes yet.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
