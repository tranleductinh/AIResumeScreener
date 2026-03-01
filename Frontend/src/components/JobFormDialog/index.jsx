import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const JobFormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  form,
  onChangeForm,
  onSubmit,
  saving,
  submitLabel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={form.title}
              onChange={(event) => onChangeForm("title", event.target.value)}
              placeholder="Senior Frontend Engineer"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Department</span>
            <Input
              value={form.department}
              onChange={(event) => onChangeForm("department", event.target.value)}
              placeholder="Engineering"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Level</span>
            <select
              value={form.seniorityLevel}
              onChange={(event) => onChangeForm("seniorityLevel", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="intern">intern</option>
              <option value="junior">junior</option>
              <option value="mid">mid</option>
              <option value="senior">senior</option>
              <option value="lead">lead</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Status</span>
            <select
              value={form.status}
              onChange={(event) => onChangeForm("status", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="draft">draft</option>
              <option value="open">open</option>
              <option value="closed">closed</option>
              <option value="on_hold">on_hold</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">JD Text</span>
            <textarea
              value={form.jdText}
              onChange={(event) => onChangeForm("jdText", event.target.value)}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Paste full job description..."
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobFormDialog;
