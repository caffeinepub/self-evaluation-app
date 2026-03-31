import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  BellRing,
  CalendarDays,
  Clock,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// XLSX loaded from CDN via index.html (window.XLSX)

type LeadUnit = "days" | "hours" | "weeks" | "months";

interface Reminder {
  id: string;
  title: string;
  eventDate: string; // ISO date string YYYY-MM-DD
  eventTime?: string; // HH:MM (optional)
  notes: string;
  leadAmount: number;
  leadUnit: LeadUnit;
}

const STORAGE_KEY = "date-reminders-v1";

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultReminders();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return getDefaultReminders();
  } catch {
    return getDefaultReminders();
  }
}

function getDefaultReminders(): Reminder[] {
  const today = new Date();
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r.toISOString().slice(0, 10);
  };
  return [
    {
      id: "default-1",
      title: "Passport Expiry",
      eventDate: addDays(today, 185),
      notes:
        "Renew at the post office — bring 2 passport photos and birth certificate.",
      leadAmount: 6,
      leadUnit: "months",
    },
    {
      id: "default-2",
      title: "Emma's Birthday",
      eventDate: addDays(today, 12),
      notes: "Daughter's 30th — book a restaurant!",
      leadAmount: 1,
      leadUnit: "weeks",
    },
    {
      id: "default-3",
      title: "Car Insurance Renewal",
      eventDate: addDays(today, 45),
      notes: "Compare quotes online before renewing.",
      leadAmount: 14,
      leadUnit: "days",
    },
    {
      id: "default-4",
      title: "Annual Health Check-up",
      eventDate: addDays(today, 60),
      notes: "",
      leadAmount: 2,
      leadUnit: "weeks",
    },
  ];
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function formatDate(dateStr: string, timeStr?: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const datePart = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (timeStr) return `${datePart}, ${timeStr}`;
  return datePart;
}

function getEventDateTime(r: Reminder): Date {
  const [year, month, day] = r.eventDate.split("-").map(Number);
  if (r.eventTime) {
    const [hours, minutes] = r.eventTime.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split("-").map(Number);
  const event = new Date(year, month - 1, day);
  return Math.round(
    (event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getReminderWindowStart(r: Reminder): Date {
  const event = getEventDateTime(r);
  if (r.leadUnit === "days") event.setDate(event.getDate() - r.leadAmount);
  else if (r.leadUnit === "hours")
    event.setHours(event.getHours() - r.leadAmount);
  else if (r.leadUnit === "weeks")
    event.setDate(event.getDate() - r.leadAmount * 7);
  else event.setMonth(event.getMonth() - r.leadAmount);
  return event;
}

type ReminderStatus = "remind-now" | "upcoming" | "past";

function getStatus(r: Reminder): ReminderStatus {
  const now = new Date();
  const eventDateTime = getEventDateTime(r);
  if (now > eventDateTime) return "past";
  const windowStart = getReminderWindowStart(r);
  if (now >= windowStart) return "remind-now";
  return "upcoming";
}

function leadLabel(r: Reminder): string {
  return `${r.leadAmount} ${r.leadUnit} before`;
}

function generateId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const TODAY_STR = new Date().toISOString().slice(0, 10);

// ── Notification helpers ─────────────────────────────────────────────────────

const notificationsSupported =
  typeof window !== "undefined" && "Notification" in window;

function isInSoundWindow(): boolean {
  const hour = new Date().getHours();
  // Allow sound: 6 AM to 12:59 PM, and 4 PM to 9:59 PM
  return (hour >= 6 && hour < 13) || (hour >= 16 && hour < 22);
}

function playReminderSound() {
  if (!isInSoundWindow()) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const times = [0, 0.2, 0.4];
    const freqs = [880, 1108, 1320];
    times.forEach((startTime, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + startTime + 0.6,
      );
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + 0.6);
    });
  } catch {
    // Ignore audio errors
  }
}

function fireNotification(r: Reminder) {
  if (!notificationsSupported || Notification.permission !== "granted") return;
  playReminderSound();
  try {
    new Notification(r.title, {
      body: `This is due on ${formatDate(r.eventDate, r.eventTime)} — you asked to be reminded ${r.leadAmount} ${r.leadUnit} before.`,
      icon: "/favicon.ico",
    });
  } catch {
    // Silently ignore if notification fails
  }
}

async function scheduleNotification(r: Reminder) {
  if (!notificationsSupported || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const reminderDate = getReminderWindowStart(r);
    if (reminderDate <= new Date()) {
      // Already in window — fire immediately
      fireNotification(r);
      return;
    }
    // Use Notification Triggers API if available (Chrome/Android)
    // @ts-ignore — experimental API
    if (typeof TimestampTrigger !== "undefined") {
      await reg.showNotification(r.title, {
        body: `Due on ${formatDate(r.eventDate, r.eventTime)} — you asked to be reminded ${r.leadAmount} ${r.leadUnit} before.`,
        icon: "/favicon.ico",
        tag: r.id,
        // @ts-ignore
        showTrigger: new (window as any).TimestampTrigger(
          reminderDate.getTime(),
        ),
      });
    }
    // If not supported, rely on interval check when app is open
  } catch {
    // Silently ignore
  }
}

async function cancelScheduledNotification(reminderId: string) {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const notifications = await reg.getNotifications({ tag: reminderId });
    for (const n of notifications) n.close();
  } catch {
    // Silently ignore
  }
}

// ── Excel helpers ────────────────────────────────────────────────────────────

const EXCEL_COLUMNS = [
  "Title",
  "Event Date (YYYY-MM-DD)",
  "Event Time (HH:MM)",
  "Notes",
  "Remind Amount",
  "Remind Unit (days/hours/weeks/months)",
];

function exportToExcel(reminders: Reminder[]) {
  const rows = reminders.map((r) => ({
    Title: r.title,
    "Event Date (YYYY-MM-DD)": r.eventDate,
    "Event Time (HH:MM)": r.eventTime ?? "",
    Notes: r.notes,
    "Remind Amount": r.leadAmount,
    "Remind Unit (days/hours/weeks/months)": r.leadUnit,
  }));

  const ws = XLSX.utils.json_to_sheet(rows, { header: EXCEL_COLUMNS });

  // Set column widths
  ws["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 18 },
    { wch: 40 },
    { wch: 15 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reminders");
  XLSX.writeFile(wb, "DateAlert-Reminders.xlsx");
}

function downloadTemplate() {
  const sampleRows = [
    {
      Title: "Passport Expiry",
      "Event Date (YYYY-MM-DD)": "2026-09-15",
      "Event Time (HH:MM)": "14:30",
      Notes: "Renew 6 months before expiry",
      "Remind Amount": 6,
      "Remind Unit (days/hours/weeks/months)": "months",
    },
    {
      Title: "Emma's Birthday",
      "Event Date (YYYY-MM-DD)": "2026-04-20",
      "Event Time (HH:MM)": "",
      Notes: "Order cake and book restaurant",
      "Remind Amount": 1,
      "Remind Unit (days/hours/weeks/months)": "weeks",
    },
    {
      Title: "Team Meeting",
      "Event Date (YYYY-MM-DD)": "2026-04-10",
      "Event Time (HH:MM)": "",
      Notes: "Prepare slides",
      "Remind Amount": 3,
      "Remind Unit (days/hours/weeks/months)": "hours",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: EXCEL_COLUMNS });
  ws["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 18 },
    { wch: 40 },
    { wch: 15 },
    { wch: 35 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reminders");
  XLSX.writeFile(wb, "DateAlert-Template.xlsx");
}

function parseExcelFile(
  file: File,
  onResult: (imported: Reminder[], skipped: number) => void,
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const imported: Reminder[] = [];
      let skipped = 0;

      for (const row of rows) {
        const title = String(row.Title ?? "").trim();
        const eventDate = String(row["Event Date (YYYY-MM-DD)"] ?? "").trim();
        const eventTimeRaw = String(row["Event Time (HH:MM)"] ?? "").trim();
        const eventTime = /^\d{2}:\d{2}$/.test(eventTimeRaw)
          ? eventTimeRaw
          : undefined;
        const notes = String(row.Notes ?? "").trim();
        const leadAmountRaw = row["Remind Amount"];
        const leadUnitRaw = String(
          row["Remind Unit (days/hours/weeks/months)"] ??
            row["Remind Unit (days/weeks/months)"] ??
            "",
        )
          .trim()
          .toLowerCase();

        // Validate
        if (!title) {
          skipped++;
          continue;
        }
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
          Number.isNaN(Date.parse(eventDate))
        ) {
          skipped++;
          continue;
        }
        const leadAmount = Number.parseInt(String(leadAmountRaw), 10);
        if (!Number.isFinite(leadAmount) || leadAmount < 1) {
          skipped++;
          continue;
        }
        if (
          !(["days", "hours", "weeks", "months"] as string[]).includes(
            leadUnitRaw,
          )
        ) {
          skipped++;
          continue;
        }

        imported.push({
          id: generateId(),
          title,
          eventDate,
          eventTime,
          notes,
          leadAmount,
          leadUnit: leadUnitRaw as LeadUnit,
        });
      }

      onResult(imported, skipped);
    } catch {
      toast.error("Could not read the file. Please use the provided template.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReminderStatus }) {
  if (status === "remind-now")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning-foreground animate-pulse-ring border border-warning/30">
        <BellRing className="w-3 h-3" />
        Remind Now
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-primary/15">
        <Clock className="w-3 h-3" />
        Upcoming
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      Past
    </span>
  );
}

// ── ReminderCard ─────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  index,
  onDelete,
}: {
  reminder: Reminder;
  index: number;
  onDelete: () => void;
}) {
  const status = getStatus(reminder);
  const daysUntil = getDaysUntil(reminder.eventDate);

  const borderClass =
    status === "remind-now"
      ? "border-warning/40 bg-warning-bg/40"
      : status === "past"
        ? "border-border/50 bg-muted/30"
        : "border-border bg-card";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      data-ocid={`reminders.item.${index}`}
      className={`rounded-2xl border p-4 shadow-card hover:shadow-card-hover transition-shadow ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3
              className={`font-display text-base font-semibold leading-snug ${
                status === "past" ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {reminder.title}
            </h3>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(reminder.eventDate, reminder.eventTime)}</span>
            <span className="text-border">·</span>
            <span>
              {daysUntil > 0
                ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""} away`
                : daysUntil === 0
                  ? "Today!"
                  : `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Bell className="w-3 h-3 text-primary/60 flex-shrink-0" />
            <span className="text-primary/80 font-medium">
              Remind me {leadLabel(reminder)}
            </span>
          </div>

          {reminder.notes && (
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {reminder.notes}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          data-ocid={`reminders.delete_button.${index}`}
          onClick={onDelete}
          className="flex-shrink-0 h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={`Delete ${reminder.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── AddReminderForm ──────────────────────────────────────────────────────────

function AddReminderForm({ onAdd }: { onAdd: (r: Reminder) => void }) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [notes, setNotes] = useState("");
  const [leadAmount, setLeadAmount] = useState("1");
  const [leadUnit, setLeadUnit] = useState<LeadUnit>("weeks");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!eventDate) {
      toast.error("Please select an event date.");
      return;
    }
    const amount = Number.parseInt(leadAmount, 10);
    if (!amount || amount < 1) {
      toast.error("Lead time must be at least 1.");
      return;
    }

    onAdd({
      id: generateId(),
      title: title.trim(),
      eventDate,
      eventTime: eventTime || undefined,
      notes: notes.trim(),
      leadAmount: amount,
      leadUnit,
    });

    setTitle("");
    setEventDate("");
    setEventTime("");
    setNotes("");
    setLeadAmount("1");
    setLeadUnit("weeks");
    setOpen(false);
    toast.success("Reminder added!");
  };

  return (
    <div className="mb-6">
      <AnimatePresence>
        {!open ? (
          <motion.div
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              data-ocid="reminders.open_modal_button"
              onClick={() => setOpen(true)}
              className="w-full h-12 rounded-2xl font-display font-semibold text-base gap-2 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add a Reminder
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-2xl border-primary/20 shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">
                    New Reminder
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    data-ocid="reminders.close_button"
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reminder-title"
                      className="text-sm font-medium"
                    >
                      Title
                    </Label>
                    <Input
                      id="reminder-title"
                      data-ocid="reminders.input"
                      placeholder="e.g. Passport Expiry"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-10 rounded-xl border-border/70 focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-date" className="text-sm font-medium">
                      Event Date
                    </Label>
                    <Input
                      id="event-date"
                      type="date"
                      data-ocid="reminders.input"
                      min={TODAY_STR}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-10 rounded-xl border-border/70 focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-time" className="text-sm font-medium">
                      Event Time
                      <span className="text-muted-foreground font-normal ml-1">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="h-10 rounded-xl border-border/70 focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Remind me
                      <span className="text-muted-foreground font-normal ml-1">
                        (how far in advance?)
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="9999"
                        data-ocid="reminders.input"
                        value={leadAmount}
                        onChange={(e) => setLeadAmount(e.target.value)}
                        className="h-10 w-24 rounded-xl border-border/70 focus-visible:ring-primary/30 text-center font-semibold"
                      />
                      <Select
                        value={leadUnit}
                        onValueChange={(v) => setLeadUnit(v as LeadUnit)}
                      >
                        <SelectTrigger
                          data-ocid="reminders.select"
                          className="flex-1 h-10 rounded-xl border-border/70"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours before</SelectItem>
                          <SelectItem value="days">Days before</SelectItem>
                          <SelectItem value="weeks">Weeks before</SelectItem>
                          <SelectItem value="months">Months before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reminder-notes"
                      className="text-sm font-medium"
                    >
                      Notes
                      <span className="text-muted-foreground font-normal ml-1">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="reminder-notes"
                      data-ocid="reminders.textarea"
                      placeholder="Any details you want to remember..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="rounded-xl border-border/70 focus-visible:ring-primary/30 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    data-ocid="reminders.submit_button"
                    className="w-full h-11 rounded-xl font-display font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save Reminder
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ExcelToolbar ─────────────────────────────────────────────────────────────

function ExcelToolbar({
  reminders,
  onImport,
}: {
  reminders: Reminder[];
  onImport: (imported: Reminder[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseExcelFile(file, (imported, skipped) => {
      if (imported.length > 0) {
        onImport(imported);
        toast.success(
          `${imported.length} reminder${imported.length !== 1 ? "s" : ""} imported successfully!${
            skipped > 0
              ? ` (${skipped} row${skipped !== 1 ? "s" : ""} skipped due to errors)`
              : ""
          }`,
        );
      } else {
        toast.error(
          skipped > 0
            ? `No valid reminders found — ${skipped} row${skipped !== 1 ? "s" : ""} had errors. Check the template for the correct format.`
            : "The file appears to be empty.",
        );
      }
    });
    // Reset so the same file can be re-imported if needed
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
      <div className="flex items-center gap-1.5 mr-auto">
        <FileSpreadsheet className="w-4 h-4 text-primary/70" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Excel
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        data-ocid="excel.secondary_button"
        onClick={downloadTemplate}
        className="h-8 rounded-xl text-xs gap-1.5 border-border/70 hover:bg-secondary"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Template
      </Button>

      <Button
        variant="outline"
        size="sm"
        data-ocid="excel.upload_button"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 rounded-xl text-xs gap-1.5 border-border/70 hover:bg-secondary"
      >
        <Upload className="w-3.5 h-3.5" />
        Import
      </Button>

      <Button
        variant="outline"
        size="sm"
        data-ocid="excel.button"
        onClick={() => exportToExcel(reminders)}
        disabled={reminders.length === 0}
        className="h-8 rounded-xl text-xs gap-1.5 border-border/70 hover:bg-secondary disabled:opacity-40"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleImportFile}
        data-ocid="excel.dropzone"
      />
    </div>
  );
}

// ── NotificationBanner ───────────────────────────────────────────────────────

function NotificationBanner({
  onEnable,
  onDismiss,
}: {
  onEnable: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      data-ocid="notifications.panel"
      className="flex items-center gap-3 px-4 py-2.5 bg-primary/8 border-b border-primary/15"
    >
      <Bell className="w-4 h-4 text-primary flex-shrink-0" />
      <p className="flex-1 text-xs text-foreground/80">
        Enable notifications to get alerts even when the app is closed
      </p>
      <Button
        size="sm"
        data-ocid="notifications.primary_button"
        onClick={onEnable}
        className="h-7 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
      >
        Enable
      </Button>
      <button
        type="button"
        data-ocid="notifications.close_button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        aria-label="Dismiss notification prompt"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission | null>(
      notificationsSupported ? Notification.permission : null,
    );
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const notifiedIds = useRef<Set<string>>(new Set());
  // Capture initial reminders for the mount effect
  const initialRemindersRef = useRef<Reminder[]>(reminders);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  // Fire notifications for all 'remind-now' reminders not yet notified this session
  const checkAndNotify = useCallback((reminderList: Reminder[]) => {
    if (!notificationsSupported || Notification.permission !== "granted")
      return;
    for (const r of reminderList) {
      if (getStatus(r) === "remind-now" && !notifiedIds.current.has(r.id)) {
        notifiedIds.current.add(r.id);
        fireNotification(r);
      }
    }
  }, []);

  // Run once on mount — use ref snapshot to satisfy lint
  useEffect(() => {
    const initial = initialRemindersRef.current;
    checkAndNotify(initial);
    if (notificationsSupported && Notification.permission === "granted") {
      for (const r of initial) scheduleNotification(r);
    }
  }, [checkAndNotify]);

  // Periodic check every 60 seconds (catches midnight transitions)
  useEffect(() => {
    if (!notificationsSupported) return;
    const interval = setInterval(() => {
      setReminders((current) => {
        checkAndNotify(current);
        return current;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  const handleEnableNotifications = async () => {
    if (!notificationsSupported) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      checkAndNotify(reminders);
      // Schedule all future reminders
      for (const r of reminders) scheduleNotification(r);
      toast.success(
        "Notifications enabled! You'll be alerted even when the app is closed.",
      );
    } else if (result === "denied") {
      toast.error(
        "Notifications blocked. You can re-enable them in your browser settings.",
      );
    }
  };

  const showBanner =
    notificationsSupported && notifPermission === "default" && !bannerDismissed;

  const addReminder = (r: Reminder) => {
    setReminders((prev) => [...prev, r]);
    scheduleNotification(r);
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    cancelScheduledNotification(id);
    toast.success("Reminder deleted.");
  };

  const importReminders = (imported: Reminder[]) => {
    setReminders((prev) => [...prev, ...imported]);
  };

  const sorted = [...reminders].sort((a, b) => {
    const da = getDaysUntil(a.eventDate);
    const db = getDaysUntil(b.eventDate);
    if (da < 0 && db >= 0) return 1;
    if (db < 0 && da >= 0) return -1;
    return da - db;
  });

  const remindNowCount = reminders.filter(
    (r) => getStatus(r) === "remind-now",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 10%, oklch(0.44 0.18 270 / 0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, oklch(0.78 0.16 75 / 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Bell className="w-4.5 h-4.5 text-primary-foreground w-[18px] h-[18px]" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground leading-none">
              DateAlert
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Never miss an important date
            </p>
          </div>
          {remindNowCount > 0 && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-bg border border-warning/30"
            >
              <BellRing className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs font-semibold text-warning-foreground">
                {remindNowCount} active
              </span>
            </motion.div>
          )}
        </div>

        {/* Notification permission banner — inside header so it sticks */}
        <AnimatePresence>
          {showBanner && (
            <NotificationBanner
              onEnable={handleEnableNotifications}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-6">
        <AddReminderForm onAdd={addReminder} />

        {/* Excel toolbar */}
        <ExcelToolbar reminders={reminders} onImport={importReminders} />

        {/* Summary */}
        {reminders.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Your Reminders
            </h2>
            <span className="text-xs text-muted-foreground">
              {reminders.length} total
            </span>
          </div>
        )}

        {/* Remind Now Banner */}
        <AnimatePresence>
          {remindNowCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div
                data-ocid="reminders.panel"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warning-bg border border-warning/30"
              >
                <BellRing className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm font-semibold text-warning-foreground">
                  {remindNowCount === 1
                    ? "1 reminder needs your attention now!"
                    : `${remindNowCount} reminders need your attention now!`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {reminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="reminders.empty_state"
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">
              No reminders yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Add your first reminder above — passport expiry, birthdays,
              renewals, and more.
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((r, i) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  index={i + 1}
                  onDelete={() => deleteReminder(r.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 mt-12 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster position="top-center" />
    </div>
  );
}
