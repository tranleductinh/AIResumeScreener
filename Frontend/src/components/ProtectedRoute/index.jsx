import { useContext, useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import AuthContext from "@/context/authContext"

const ProtectedRoute = () => {
  const { user, syncSession } = useContext(AuthContext)
  const location = useLocation()
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      if (!user) {
        if (isMounted) setIsCheckingSession(false)
        return
      }

      try {
        await syncSession()
      } catch (_error) {
        // syncSession already clears localStorage + context.
      } finally {
        if (isMounted) setIsCheckingSession(false)
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [])

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
