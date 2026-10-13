import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LangProvider } from "./i18n";
import "./styles/theme.css";
import "./styles/tokens.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/components.css";
import "./styles/world.css";
import "./styles/auth.css";
import "./styles/pages.css";
import "./styles/roles.css";
import "./styles/admin.css";
import "./styles/homes.css";
import "./styles/screens.css";
import "./styles/landing.css";
import "./styles/motion.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>,
);
