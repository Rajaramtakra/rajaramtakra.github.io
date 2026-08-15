import { useEffect, useState } from "react";
import { Inbox, MailCheck, Megaphone, Send } from "lucide-react";
import { ROLE_NAMES } from "@erp/shared";
import { communicationApi, type BulkMessageJob, type Message, type NotificationChannel } from "./communication.api";
import { academicApi, type ClassRecord, type SectionRecord } from "@/modules/academic/academic.api";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function InboxTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    communicationApi
      .getInbox()
      .then(setMessages)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleMarkRead(id: string) {
    try {
      await communicationApi.markMessageRead(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    } catch (err) {
      toast({ title: "Failed to mark as read", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <Card key={m.id} className={m.isRead ? undefined : "border-primary/50"}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.subject || "(No subject)"}</span>
                {!m.isRead && <Badge variant="default">New</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                {!m.isRead && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkRead(m.id)}>
                    <MailCheck className="h-3.5 w-3.5" /> Mark read
                  </Button>
                )}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
          </CardContent>
        </Card>
      ))}
      {messages.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Your inbox is empty.</CardContent>
        </Card>
      )}
    </div>
  );
}

function SendMessageTab() {
  const [recipientIds, setRecipientIds] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const ids = recipientIds
      .split(/[,\n]/)
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      toast({ title: "Enter at least one recipient user ID", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const messages = await communicationApi.sendMessage({ recipientIds: ids, subject: subject || undefined, body });
      toast({ title: `Message sent to ${messages.length} recipient(s)` });
      setRecipientIds("");
      setSubject("");
      setBody("");
    } catch (err) {
      toast({ title: "Failed to send message", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label>Recipient user IDs</Label>
          <Textarea
            rows={2}
            placeholder="Comma or newline separated user IDs"
            value={recipientIds}
            onChange={(e) => setRecipientIds(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Subject (optional)</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !body.trim()}>
          <Send className="h-4 w-4" /> Send message
        </Button>
      </CardContent>
    </Card>
  );
}

const NONE = "NONE";

function BulkMessageTab() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [jobs, setJobs] = useState<BulkMessageJob[]>([]);
  const [channel, setChannel] = useState<NotificationChannel>("IN_APP");
  const [classId, setClassId] = useState(NONE);
  const [sectionId, setSectionId] = useState(NONE);
  const [roleName, setRoleName] = useState(NONE);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reloadJobs() {
    communicationApi.listBulkMessageJobs().then(setJobs);
  }

  useEffect(() => {
    academicApi.listClasses().then(setClasses);
    academicApi.listSections().then(setSections);
    reloadJobs();
  }, []);

  async function handleSubmit() {
    if (classId === NONE && sectionId === NONE && roleName === NONE) {
      toast({ title: "Choose at least one audience filter", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const job = await communicationApi.sendBulkMessage({
        channel,
        classId: classId === NONE ? undefined : classId,
        sectionId: sectionId === NONE ? undefined : sectionId,
        roleName: roleName === NONE ? undefined : roleName,
        body,
      });
      toast({ title: `Bulk message sent to ${job.sentCount} recipient(s)` });
      setBody("");
      reloadJobs();
    } catch (err) {
      toast({ title: "Failed to send bulk message", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as NotificationChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class (optional)</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Any class</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Section (optional)</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Any section</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.class?.name} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role (optional)</Label>
            <Select value={roleName} onValueChange={setRoleName}>
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Any role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Any role</SelectItem>
                {ROLE_NAMES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !body.trim()}>
            <Megaphone className="h-4 w-4" /> Send bulk message
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Recent bulk sends</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{j.channel}</TableCell>
                  <TableCell>{[j.classId && "Class", j.sectionId && "Section", j.roleName].filter(Boolean).join(", ") || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{j.body}</TableCell>
                  <TableCell>{j.sentCount}</TableCell>
                  <TableCell>
                    <Badge variant={j.status === "SENT" ? "success" : j.status === "FAILED" ? "destructive" : "warning"}>
                      {j.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No bulk messages sent yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function MessagesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission("communication:manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Direct messages between you and other members of the school.</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="mr-1.5 h-4 w-4" /> Inbox
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="send">
              <Send className="mr-1.5 h-4 w-4" /> Send message
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="bulk">
              <Megaphone className="mr-1.5 h-4 w-4" /> Bulk message
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="inbox">
          <InboxTab />
        </TabsContent>
        {canManage && (
          <TabsContent value="send">
            <SendMessageTab />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="bulk">
            <BulkMessageTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
