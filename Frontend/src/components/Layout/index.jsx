import { Outlet } from "react-router-dom"

import Header from "@/components/Header"

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
