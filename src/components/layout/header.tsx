"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { BookOpenIcon, UserIcon, LogOutIcon, TrophyIcon, BarChart3Icon } from "lucide-react";

export default function Header() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [userStats, setUserStats] = useState({ points: 0, completed: 0 });

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchUserStats(session.user.id);
                }
            }
        );

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            if (session?.user) {
                fetchUserStats(session.user.id);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const fetchUserStats = async (userId: string) => {
        try {
            const { data } = await supabase
                .from("user_subsection_progress")
                .select("points_earned")
                .eq("user_id", userId);

            if (data) {
                const points = data.reduce((sum, item) => sum + (item.points_earned || 0), 0);
                setUserStats({
                    points,
                    completed: data.length,
                });
            }
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUserStats({ points: 0, completed: 0 });
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Gyaan.Life</span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/courses"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Courses
                    </Link>
                    {user && (
                        <Link
                            href="/profile"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Profile
                        </Link>
                    )}
                </nav>

                {/* Right Side */}
                <div className="flex items-center space-x-2">
                    <ModeToggle />

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                            {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        <p className="font-medium text-sm">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </p>
                                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />

                                {/* Stats */}
                                <div className="p-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span className="flex items-center">
                                            <TrophyIcon className="w-3 h-3 mr-1" />
                                            Points
                                        </span>
                                        <span className="font-semibold text-blue-600">{userStats.points}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center">
                                            <BarChart3Icon className="w-3 h-3 mr-1" />
                                            Completed
                                        </span>
                                        <span className="font-semibold text-green-600">{userStats.completed}</span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/courses" className="cursor-pointer">
                                        <BookOpenIcon className="mr-2 h-4 w-4" />
                                        <span>Courses</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                                    <LogOutIcon className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}