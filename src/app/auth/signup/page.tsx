"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", passwordConfirm: "",
    dateOfBirth: "", gender: "" as "" | "male" | "female",
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return;
    if (form.password !== form.passwordConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await authApi.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
        ...(form.gender && { gender: form.gender }),
      });
      // Auto sign in after signup
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.ok) {
        toast.success("Account created!");
        router.push("/feed");
      } else {
        toast.success("Account created! Please sign in.");
        router.push("/auth/login");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create account";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white text-xl font-black">R</div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join Route Posts today</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" placeholder="John Doe" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" placeholder="you@example.com" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                className="input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input type="password" placeholder="••••••••" className="input" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-gray-400">(optional)</span></label>
            <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-gray-400">(optional)</span></label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "" | "male" | "female" })} disabled={loading}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading || !form.name || !form.email || !form.password} className="btn-primary w-full py-3">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
