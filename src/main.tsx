import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { QueryProvider } from "@/app/providers/query-client"
import { router } from "@/app/router/routes"
// Inicializa el tema (lee localStorage y aplica la clase) antes del render.
import "@/app/stores/theme-store"
import "@/styles/index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </React.StrictMode>,
)
