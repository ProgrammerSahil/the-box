"use client";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { axios } from "axios";

export default function SignupPage() {
  const router = useRouter();
  const [user, setUser] = React.useState({
    username: "",
    password: "",
  });

  const onLogin = () => {
    router.push("/game/1");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>Login</h1>
      <hr />
      <input
        className="p-2 m-2 text-black"
        type="text"
        id="username"
        value={user.username}
        onChange={(e) => setUser({ ...user, username: e.target.value })}
        placeholder="username"
      />
      <input
        className="p-2 m-2 text-black"
        type="password"
        id="password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        placeholder="password"
      />

      <button
        className="text-black p-3 m-2 font-mono bg-slate-300"
        onClick={onLogin}
      >
        Login
      </button>
    </div>
  );
}
