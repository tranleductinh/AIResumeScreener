import { cn } from "@/lib/utils"

function Progress({ className, value = 0, ...props }) {
  const normalized = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${normalized}%` }}
      />
    </div>
  )
}

export { Progress }
