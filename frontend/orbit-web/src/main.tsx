import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import "@/design/tokens.css";
import "@/design/primitives.css";
import "@/design/layout.css";

const theme = localStorage.getItem("orbit.theme");
if (theme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
