import { useEffect, useMemo, useState } from "react";
import { Megaphone, Pin, PinOff } from "lucide-react";
import { communicationApi, type Announcement, type AnnouncementAudience } from "./communication.api";
import { NewAnnouncementDialog } from "./NewAnnouncementDialog";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AUDIENCE_FILTERS: Array<AnnouncementAudience | "ALL_FILTER"> = ["ALL_FILTER", "ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"];

const AUDIENCE_VARIANT: Record<AnnouncementAudience, "default" | "secondary" | "success" | "warning"> = {
  ALL: "default",
  STUDENTS: "success",
  PARENTS: "warning",
  TEACHERS: "secondary",
  STAFF: "secondary",
};

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementAudience | "ALL_FILTER">("ALL_FILTER");

  function reload() {
    setLoading(true);
    communicationApi
      .listAnnouncements()
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  const filtered = useMemo(
    () => (audienceFilter === "ALL_FILTER" ? announcements : announcements.filter((a) => a.audience === audienceFilter)),
    [announcements, audienceFilter]
  );

  async function togglePin(announcement: Announcement) {
    await communicationApi.setAnnouncementPin(announcement.id, { pinned: !announcement.pinned });
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">School-wide notices published to your audience.</p>
        </div>
        <Can anyOf={["announcement:manage"]}>
          <NewAnnouncementDialog onCreated={reload} />
        </Can>
      </div>

      <Select value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as AnnouncementAudience | "ALL_FILTER")}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filter by audience" />
        </SelectTrigger>
        <SelectContent>
          {AUDIENCE_FILTERS.map((a) => (
            <SelectItem key={a} value={a}>
              {a === "ALL_FILTER" ? "All audiences" : a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-primary/50" : undefined}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{a.title}</h3>
                    {a.pinned && (
                      <Badge variant="outline" className="gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={AUDIENCE_VARIANT[a.audience]}>{a.audience}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.publishedAt).toLocaleString()}</span>
                    <Can anyOf={["announcement:manage"]}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => togglePin(a)}>
                        {a.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                    </Can>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                {a.popupUntil && new Date(a.popupUntil) > new Date() && (
                  <p className="text-xs text-amber-600">Showing as popup until {new Date(a.popupUntil).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">No announcements yet.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
