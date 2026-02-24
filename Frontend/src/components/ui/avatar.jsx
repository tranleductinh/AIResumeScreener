import { useState } from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, src, alt, ...props }) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square size-full object-cover", className)}
      onError={() => setBroken(true)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
