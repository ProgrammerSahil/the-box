"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = React.useState({
    username: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = React.useState(false);

  const onSignupPush = () => {
    router.push('/signup');
  }

  const onLogin = async (e:Event) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/users/login", user);
      localStorage.setItem("username", user.username);
      toast.success("login successful");
      const level = response.data.level;
      console.log("level: " + level);
      router.push(`/game/${level}`);
    } catch (error: any) {
      toast.error(error.response.data.error);
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
    
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
      <Toaster position="bottom-center"/>
      <div className="max-w-lg w-full">
        <div
          className="bg-gray-800 rounded-lg shadow-xl overflow-hidden"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="p-8">
            <h2 className="text-center text-3xl font-extrabold text-white">
              Welcome Back
            </h2>
            <p className="mt-4 text-center text-gray-400">Sign in to continue</p>
            <form method="POST" action="#" className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm">
                <div>
                  <label className="sr-only">Username</label>
                  <input
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    type="text"
                    id="username"
                    value={user.username}
                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div className="mt-4">
                  <label className="sr-only">Password</label>
                  <input
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    type="password"
                    id="password"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    placeholder="password"
                  />
                </div>
              </div>
              <div>
                <button
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  type="submit"
                  onClick={onLogin}
                >
                  Login
                </button>
              </div>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-700 text-center">
            <span className="text-gray-400">Don't have an account?</span>
            <a className="font-medium text-indigo-500 hover:text-indigo-400 cursor-pointer" onClick={onSignupPush}>
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}