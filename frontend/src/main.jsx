import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { startApiAuthDefaultSync } from "./utils/syncApiAuthDefaults.js";
import App from "./App.jsx";

startApiAuthDefaultSync();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
