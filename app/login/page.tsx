"use client";
import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import F1GPTlogo from "../assets/F1GPTLogo.png";
import { signInWithEmail } from "../auth/actions";
import { createClient } from "@/lib/supabase/client";

const Login = () => {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await signInWithEmail(formData);
            if (result?.error) setError(result.error);
        });
    };

    const handleGoogle = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) setError(error.message);
    };

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-brand">
                    <Image className="logo" src={F1GPTlogo} width={140} alt="F1GPT Logo" />
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-caption">Log in to pick up where you left off.</p>

                <button className="auth-google" type="button" onClick={handleGoogle}>
                    <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-field">
                        <span>Email</span>
                        <input type="email" name="email" placeholder="you@example.com" required />
                    </label>

                    <label className="auth-field">
                        <span>Password</span>
                        <input type="password" name="password" placeholder="Enter your password" required />
                    </label>

                    <div className="auth-row">
                        <a className="auth-link" href="#">Forgot password?</a>
                    </div>

                    <button className="auth-submit" type="submit" disabled={pending}>
                        {pending ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
