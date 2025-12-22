"use client";

import { useState } from "react";

import { LogIn } from "lucide-react";

import { Button, Input, Typography } from "~/components";
import { Logger } from "~/lib/logger";

import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
    } catch (err) {
      Logger.error("LoginPage.handleSubmit: ", err);
      setError("Invalid email or password");
    }
  };

  return (
    <section className="flex flex-col items-center w-dvw">
      <div className="w-full max-w-md space-y-4 p-6">
        <Typography as="h1" className="text-2xl font-bold" label="auth.login" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="auth.email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="auth.password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            label="auth.signIn"
            endNode={<LogIn />}
          />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <Typography
              as="span"
              className="bg-background px-2 text-muted-foreground"
              label="general.or"
            />
          </div>
        </div>

        <Button
          onClick={signInWithGoogle}
          variant="outline"
          className="w-full"
          label="auth.signInGoogle"
        />
      </div>
    </section>
  );
}
