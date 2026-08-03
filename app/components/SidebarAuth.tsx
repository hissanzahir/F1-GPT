"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const SidebarAuth = () => {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            router.refresh();
        });

        supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.refresh();
    };

    if (user) {
        return (
            <div className="sidebar-user">
                <span className="sidebar-user-email">{user.email}</span>
                <button className="sidebar-auth" type="button" onClick={handleSignOut}>
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <>
            <Link href="/login" className="sidebar-auth">
                Login
            </Link>
            <Link href="/signup" className="sidebar-auth primary">
                Sign up
            </Link>
        </>
    );
};

export default SidebarAuth;
