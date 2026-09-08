import React from "react";
import ReactDOM from "react-dom/client";
import FichaCliente from "./FichaCliente.jsx";
import FichaView from "./FichaView.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

function App() {
  const path = window.location.pathname;
  if (path.startsWith("/ficha")) return <FichaView />;
  if (path.startsWith("/admin")) return <AdminDashboard />;
  return <FichaCliente />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
