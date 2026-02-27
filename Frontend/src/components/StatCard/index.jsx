import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const deltaConfig = {
  positive: {
    icon: ArrowUpRight,
    className: "text-emerald-600 dark:text-emerald-400",
    badge: "success",
    sign: "+",
  },
  negative: {
    icon: ArrowDownRight,
    className: "text-rose-600 dark:text-rose-400",
    badge: "destructive",
    sign: "",
  },
  neutral: {
    icon: Minus,
    className: "text-muted-foreground",
    badge: "outline",
    sign: "",
  },
}

const StatCard = ({ label, value, delta, trend = "positive", className }) => {
  const config = deltaConfig[trend]
  const DeltaIcon = config.icon

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {typeof delta === "number" && (
            <Badge variant={config.badge} className="gap-1">
              <DeltaIcon className={cn("size-3", config.className)} />
              {`${config.sign}${delta}%`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default StatCard
