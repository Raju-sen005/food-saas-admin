import { useState } from "react";
import RegisterTenant from "./RegisterTenant";
import Login from "./Login";

export default function AuthGate() {
  const [authView, setAuthView] = useState("LOGIN");

  if (authView === "SIGNUP") {
    return <RegisterTenant onSwitchToLogin={() => setAuthView("LOGIN")} />;
  }

  return <Login onSwitchToSignup={() => setAuthView("SIGNUP")} />;
}