import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/theme.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/auth.css";
import "./styles/pages.css";
import "./styles/roles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
