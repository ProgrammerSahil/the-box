"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [user, setUser] = React.useState({
    username: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = React.useState(false);

  const onLogin = async () => {
    try {
      const response = await axios.post("/api/users/login", user);
      console.log("Login successful", response.data);
      toast.success("login successful");
      const level = response.data.level;
      console.log("level: " + level);
      router.push(`/game/${level}`);
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user.username.length > 0 && user.password.length > 0) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

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
