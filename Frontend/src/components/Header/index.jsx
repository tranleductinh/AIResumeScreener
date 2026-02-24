import { Bell, Brain, Moon, Search, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, NavLink } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates/ranking" },
  { label: "Jobs", to: "/jobs" },
  { label: "Analytics", to: "/analytics" },
  { label: "Screening", to: "/upload-screening" },
]

function getInitialTheme() {
  const storedTheme = window.localStorage.getItem("ai-resume-theme")
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function Header() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    window.document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("ai-resume-theme", theme)
  }, [theme])

  const handleThemeToggle = () => {
    setTheme((previousTheme) => {
      const nextTheme = previousTheme === "dark" ? "light" : "dark"
      return nextTheme
    })
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Brain className="size-5" />
            </span>
            <span className="truncate text-base font-bold tracking-tight">Ai Resume Screener</span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 border-transparent pb-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                    isActive && "border-primary text-primary"
                  )
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden w-56 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search..." />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleThemeToggle}
            aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button size="icon" variant="outline">
            <Bell className="size-4" />
          </Button>
          <Avatar>
            <AvatarImage
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGgvkY-uGz7sSVnWyzS7KSfybkBqW9iO2oyaDVZALg_-p0nIMkxyCoxcIz8eukrCtFkIJKVJETga3wjXGjCeJkT3jx_qw1tyR3e9iba50RiISXHTZmofm5uhYY3xIGkOT-5Qe7p0b2z7qdFZdB5h1RDBo5SgEyjz9i4RIThqlRA0pVLKM_hgu-j59SaaoXA-Ug-r_TGCuOYTG1GQ25XN1vcIAN_-_TTG8g4rs3doY0eHaUmqpFvwcVQMdEnhchSIHM-xdQ9SKv_TU"
              alt="Recruiter"
            />
            <AvatarFallback>HR</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

export default Header
