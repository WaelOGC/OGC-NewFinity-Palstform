import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../../utils/apiClient.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!token) return <p>Invalid reset link.</p>;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate("/auth");
    } catch {
      setError("Reset failed or token expired.");
    }
  };

  return (
    <form onSubmit={submit}>
      <h1>Reset Password</h1>
      <input 
        type="password" 
        value={password}
        onChange={e => setPassword(e.target.value)} 
        placeholder="New password"
        required
      />
      <button type="submit">Reset</button>
      {error && <p>{error}</p>}
    </form>
  );
}
