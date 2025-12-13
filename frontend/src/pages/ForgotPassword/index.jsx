import { useState } from "react";
import { requestPasswordReset } from "../../utils/apiClient.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await requestPasswordReset(email);
    } catch (_) {}

    setMessage("If the email exists, a reset link was sent.");
  };

  return (
    <form onSubmit={submit}>
      <h1>Forgot Password</h1>
      <input 
        type="email"
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="Email"
        required
      />
      <button type="submit">Send reset link</button>
      {message && <p>{message}</p>}
    </form>
  );
}
