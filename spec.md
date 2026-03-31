# Date Reminder App

## Current State
Reminders have an `eventDate` (YYYY-MM-DD string). The form shows a date picker. Cards display the date and days-until. Notification scheduling is based on date only (midnight).

## Requested Changes (Diff)

### Add
- `eventTime?: string` (HH:MM format) field to the Reminder interface
- Time input (`<input type="time">`) in the AddReminderForm, displayed next to or below the date input
- Helper `getEventDateTime(r)` that combines eventDate + eventTime into a Date (defaults to 00:00 if no time set)

### Modify
- `formatDate` → update to show time alongside date when `eventTime` is set (e.g. "15 Apr 2026, 14:30")
- `getDaysUntil` → keep date-only logic (days display is still date-based)
- `getReminderWindowStart` → use `getEventDateTime` so lead time subtracts from the exact event datetime
- `getStatus` → use exact event datetime for "past" comparison when time is set
- `ReminderCard` → show time in the date/time row if present
- Excel export/import → add "Event Time (HH:MM)" column; parse during import; keep backward compat (missing column = no time)
- `downloadTemplate` → include example times in sample rows
- Notification body text → include time when available
- Default reminders → leave eventTime undefined (backward compatible)

### Remove
- Nothing removed

## Implementation Plan
1. Add `eventTime?: string` to `Reminder` interface
2. Add `getEventDateTime(r: Reminder): Date` helper
3. Update `getReminderWindowStart` and `getStatus` to use `getEventDateTime`
4. Update `formatDate` to accept optional time and format as "15 Apr 2026, 14:30"
5. Update `AddReminderForm` — add `eventTime` state and `<input type="time">` field below the date field
6. Update `ReminderCard` date display to show time if present
7. Update notification body to include time
8. Update Excel export/import to handle `Event Time (HH:MM)` column
