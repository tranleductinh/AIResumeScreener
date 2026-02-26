import { Bell, Brain, LogOut, Moon, Search, Sun, User } from "lucide-react"
import { useContext, useEffect, useRef, useState } from "react"
import { Link, NavLink } from "react-router-dom"

import AuthContext from "@/context/authContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates/ranking" },
  { label: "Jobs", to: "/jobs" },
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
  const { user, logOutContext } = useContext(AuthContext)
  const [theme, setTheme] = useState(getInitialTheme)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const userInfo = user?.user || user || null
  const displayName = userInfo?.fullName || userInfo?.name || userInfo?.email || "HR"
  const email = userInfo?.email || ""
  const avatarUrl = userInfo?.avatar || userInfo?.avatarUrl || ""
  const fallbackName = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "HR"

  useEffect(() => {
    window.document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("ai-resume-theme", theme)
  }, [theme])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const handleThemeToggle = () => {
    setTheme((previousTheme) => {
      const nextTheme = previousTheme === "dark" ? "light" : "dark"
      return nextTheme
    })
  }

  const handleLogout = async () => {
    setIsProfileOpen(false)
    await logOutContext()
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
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((previous) => !previous)}
              className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar>
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{fallbackName}</AvatarFallback>
              </Avatar>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  {email ? (
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  ) : null}
                </div>

                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  <User className="size-4" />
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-accent">
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
