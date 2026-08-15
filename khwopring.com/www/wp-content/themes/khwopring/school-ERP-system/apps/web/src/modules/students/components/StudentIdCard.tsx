import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { idCardApi, type IdCardData } from "../idCard.api";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active Student",
  SUSPENDED: "Suspended",
  TRANSFERRED: "Transferred",
  ALUMNI: "Alumni",
  EXPELLED: "Expelled",
};

const CARD_WIDTH = 280;
const CARD_HEIGHT = 444;

export function StudentIdCardSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("rounded-[28px]", className)} style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} />
  );
}

export function StudentIdCard({ card, className }: { card: IdCardData; className?: string }) {
  const [flipped, setFlipped] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const { school } = card;
  const gradient = `linear-gradient(120deg, ${school.primaryColor}, ${school.secondaryColor})`;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    idCardApi.getCardQrBlob(card.id).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setQrUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [card.id]);

  const initials = card.fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <div
      className={cn("animate-in fade-in-0 zoom-in-95 duration-500 [perspective:1600px]", className)}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="relative block h-full w-full text-left transition-transform duration-500 [transform-style:preserve-3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        aria-label="Flip ID card to see the other side"
      >
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-white shadow-xl [backface-visibility:hidden]">
          {/* Top curved band */}
          <div className="absolute inset-x-0 top-0 h-32 rounded-b-[50%_40px]" style={{ background: gradient }} />

          <div className="relative flex items-center gap-2 px-5 pt-5 text-white">
            {school.logoUrl ? (
              <img
                src={`/uploads/${school.logoUrl}`}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-1 shadow"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold shadow" style={{ color: school.primaryColor }}>
                {school.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{school.name}</p>
              <p className="text-[9px] uppercase tracking-wide text-white/80">Student ID Card</p>
            </div>
          </div>

          {/* Photo, overlapping the band */}
          <div className="relative flex justify-center pt-6">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full p-1.5 shadow-md"
              style={{ background: gradient }}
            >
              <Avatar className="h-full w-full rounded-full ring-4 ring-white">
                <AvatarImage
                  src={card.photoUrl ? `/uploads/${card.photoUrl}` : undefined}
                  alt={card.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-full bg-muted text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="relative mt-3 px-5 text-center">
            <p className="truncate text-base font-semibold text-foreground">{card.fullName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.className} - {card.sectionName}
            </p>
          </div>

          <div className="relative mx-5 mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-medium text-foreground">{card.registrationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DOB</span>
              <span className="font-medium text-foreground">{new Date(card.dateOfBirth).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Roll No</span>
              <span className="font-medium text-foreground">{card.rollNumber ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Grp</span>
              <span className="font-medium text-foreground">{card.bloodGroup ?? "-"}</span>
            </div>
          </div>

          {/* Bottom curved band with QR */}
          <div className="absolute inset-x-0 bottom-0 h-24 rounded-t-[50%_36px]" style={{ background: gradient }} />
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white p-1 shadow">
              {qrUrl ? (
                <img src={qrUrl} alt="Verification QR code" className="h-full w-full" />
              ) : (
                <div className="h-full w-full animate-pulse rounded bg-muted" />
              )}
            </div>
            <Badge variant="success" className="bg-white/90 text-[9px] text-emerald-700">
              {STATUS_LABEL[card.status] ?? card.status}
            </Badge>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[28px] p-5 text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ background: school.secondaryColor }}
        >
          <div className="absolute inset-x-0 top-0 h-16 rounded-b-[50%_24px]" style={{ background: gradient }} />
          <p className="relative mt-2 text-sm font-semibold">Student Details</p>
          <dl className="relative mt-6 space-y-2.5 text-xs text-white/90">
            <div>
              <dt className="text-white/60">Date of Birth</dt>
              <dd className="font-medium">{new Date(card.dateOfBirth).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-white/60">Blood Group</dt>
              <dd className="font-medium">{card.bloodGroup ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-white/60">Address</dt>
              <dd className="font-medium">{card.address}</dd>
            </div>
            <div>
              <dt className="text-white/60">Guardian</dt>
              <dd className="font-medium">{card.guardianName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-white/60">Emergency Contact</dt>
              <dd className="font-medium">{card.guardianPhone ?? "-"}</dd>
            </div>
          </dl>
          <p className="absolute bottom-14 left-5 right-5 text-[9px] leading-relaxed text-white/60">
            This card is the property of the school. If found, please return it to the school office.
          </p>
          <div className="absolute bottom-6 left-5 right-5 border-t border-white/30 pt-2 text-[9px] text-white/70">
            Authorized Signature
          </div>
          <p className="absolute bottom-1 right-4 text-[8px] text-white/50">Card v{card.idCardVersion}</p>
        </div>
      </button>
    </div>
  );
}
