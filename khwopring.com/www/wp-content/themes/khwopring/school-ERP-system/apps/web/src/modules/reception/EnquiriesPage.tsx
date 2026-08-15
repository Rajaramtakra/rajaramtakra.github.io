import { useEffect, useState } from "react";
import { receptionApi, type Enquiry, type EnquiryStatus } from "./reception.api";
import { NewEnquiryDialog } from "./NewEnquiryDialog";
import { ConvertEnquiryDialog } from "./ConvertEnquiryDialog";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<EnquiryStatus, "default" | "secondary" | "success" | "warning"> = {
  NEW: "warning",
  FOLLOW_UP: "default",
  CONVERTED: "success",
  CLOSED: "secondary",
};

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    receptionApi
      .listEnquiries(status === "ALL" ? undefined : status)
      .then(setEnquiries)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [status]);

  async function handleStatusChange(id: string, next: EnquiryStatus) {
    try {
      await receptionApi.updateEnquiry(id, { status: next });
      toast({ title: "Enquiry updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update enquiry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="text-sm text-muted-foreground">Track prospective admissions from first contact to conversion.</p>
        </div>
        <Can anyOf={["reception:manage"]}>
          <NewEnquiryDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
              <SelectItem value="CONVERTED">Converted</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Interested Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enquiries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.fullName}</TableCell>
                    <TableCell>{e.phone}</TableCell>
                    <TableCell>{e.interestedClass?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge>
                    </TableCell>
                    <TableCell>{e.followUpDate ? new Date(e.followUpDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Can anyOf={["reception:manage"]}>
                        {e.status !== "CONVERTED" && (
                          <>
                            <Select value={e.status} onValueChange={(v) => handleStatusChange(e.id, v as EnquiryStatus)}>
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <ConvertEnquiryDialog enquiry={e} onConverted={reload} />
                          </>
                        )}
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
                {enquiries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No enquiries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
