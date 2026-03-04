import { useContext } from "react"
import { Navigate, Outlet } from "react-router-dom"

import AuthContext from "@/context/authContext"

const PublicRoute = () => {
  const { user } = useContext(AuthContext)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicRoute
