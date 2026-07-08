import { useState } from "react";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
  <div>
    <div>
      <h1 className="text-2xl font-bold">Welcome Back</h1>
    </div>

    <Input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <Input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <Button
      text="Login"
    />

    <div className="mt-4">
      <p className="text-sm">
        Don't have an account?{" "}
        <link to="/Register" className="text-blue-500 hover:underline">Register</link>
      </p>
    </div>

  </div>
);
}

export default Login