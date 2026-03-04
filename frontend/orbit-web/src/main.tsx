import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { useAuthStore } from "@/stores/authStore";
import { applyTheme, readTheme } from "@/lib/theme/theme";
import "@/design/tokens.css";
import "@/design/primitives.css";
import "@/design/layout.css";
import "@/design/auth.css";

applyTheme(readTheme());
useAuthStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
