"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, TrophyIcon, BookOpenIcon, TargetIcon, FlameIcon } from "lucide-react";
import { ProgressHeatmap } from "@/components/progress-heatmap";

interface UserStats {
    totalPoints: number;
    totalSubsections: number;
    completedChapters: number;
    currentStreak: number;
}

interface DailyProgress {
    date: string;
    points: number;
    subsections: Array<{
        id: string;
        title: string;
        chapterTitle: string;
        sectionTitle: string;
        chapterSlug: string;
        sectionSlug: string;
        subsectionSlug: string;
    }>;
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [userStats, setUserStats] = useState<UserStats>({
        totalPoints: 0,
        totalSubsections: 0,
        completedChapters: 0,
        currentStreak: 0,
    });
    const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/login";
                return;
            }
            setUser(user);
        };
        fetchUser();
    }, [supabase]);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user, supabase]);

    const fetchUserData = async () => {
        try {
            setLoading(true);

            // Fetch user stats
            const { data: subsectionProgress } = await supabase
                .from("user_subsection_progress")
                .select("points_earned, completed_at")
                .eq("user_id", user.id);

            const { data: chapterProgress } = await supabase
                .from("user_chapter_progress")
                .select("completed_at")
                .eq("user_id", user.id);

            // Calculate stats
            const totalPoints = subsectionProgress?.reduce((sum, item) => sum + (item.points_earned || 0), 0) || 0;
            const totalSubsections = subsectionProgress?.length || 0;
            const completedChapters = chapterProgress?.length || 0;

            setUserStats({
                totalPoints,
                totalSubsections,
                completedChapters,
                currentStreak: calculateStreak(subsectionProgress || []),
            });

            // Fetch daily progress data
            await fetchDailyProgress();

        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyProgress = async () => {
        try {
            const { data, error } = await supabase
                .from("user_subsection_progress")
                .select(`
          subsection_id,
          points_earned,
          completed_at,
          subsections!inner(
            id,
            title,
            slug,
            sections!inner(
              title,
              slug,
              chapters!inner(
                title,
                slug
              )
            )
          )
        `)
                .eq("user_id", user.id)
                .order("completed_at", { ascending: false });

            if (error) throw error;

            // Group by date
            const dailyData: { [key: string]: DailyProgress } = {};

            data?.forEach((item: any) => {
                const date = new Date(item.completed_at).toISOString().split('T')[0];

                if (!dailyData[date]) {
                    dailyData[date] = {
                        date,
                        points: 0,
                        subsections: [],
                    };
                }

                dailyData[date].points += item.points_earned || 0;
                dailyData[date].subsections.push({
                    id: item.subsection_id,
                    title: item.subsections.title,
                    chapterTitle: item.subsections.sections.chapters.title,
                    sectionTitle: item.subsections.sections.title,
                    chapterSlug: item.subsections.sections.chapters.slug,
                    sectionSlug: item.subsections.sections.slug,
                    subsectionSlug: item.subsections.slug,
                });
            });

            setDailyProgress(Object.values(dailyData));
        } catch (error) {
            console.error("Error fetching daily progress:", error);
        }
    };

    const calculateStreak = (progress: any[]) => {
        if (!progress.length) return 0;

        const dates = progress
            .map(p => new Date(p.completed_at).toISOString().split('T')[0])
            .filter((date, index, arr) => arr.indexOf(date) === index)
            .sort()
            .reverse();

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = today;

        for (const date of dates) {
            if (date === currentDate) {
                streak++;
                // Move to previous day
                const prevDate = new Date(currentDate);
                prevDate.setDate(prevDate.getDate() - 1);
                currentDate = prevDate.toISOString().split('T')[0];
            } else {
                break;
            }
        }

        return streak;
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse dark:bg-blue-900">
                            <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="text-lg font-medium">Loading your profile...</div>
                        <div className="text-sm text-muted-foreground">Gathering your learning data</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Profile Header */}
            <div className="mb-8">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex items-center space-x-6">
                            <Avatar className="h-24 w-24 ring-4 ring-blue-100 dark:ring-blue-800">
                                <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
                                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </h1>
                                <p className="text-blue-700 dark:text-blue-300">{user.email}</p>
                                <div className="flex items-center space-x-2">
                                    <Badge className="bg-blue-600 hover:bg-blue-700">
                                        DSA Learner
                                    </Badge>
                                    {userStats.currentStreak > 0 && (
                                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-950">
                                            <FlameIcon className="w-3 h-3 mr-1" />
                                            {userStats.currentStreak} day streak
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-900">
                            <TrophyIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{userStats.totalPoints}</div>
                        <p className="text-xs text-muted-foreground">
                            Points earned from completed topics
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Topics Completed</CardTitle>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900">
                            <BookOpenIcon className="h-4 w-4 text-green-600 dark:text-green-300" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{userStats.totalSubsections}</div>
                        <p className="text-xs text-muted-foreground">
                            Individual topics mastered
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chapters Done</CardTitle>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center dark:bg-purple-900">
                            <TargetIcon className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{userStats.completedChapters}</div>
                        <p className="text-xs text-muted-foreground">
                            Complete chapters finished
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center dark:bg-orange-900">
                            <FlameIcon className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{userStats.currentStreak}</div>
                        <p className="text-xs text-muted-foreground">
                            Consecutive days learning
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Heatmap */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <CalendarIcon className="w-5 h-5 text-blue-600" />
                                <span>Learning Activity</span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Your daily progress over the past year • {dailyProgress.length} active days
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                            Last 365 days
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProgressHeatmap data={dailyProgress} />
                    {dailyProgress.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
                                <CalendarIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                            <p className="text-muted-foreground">
                                Start completing topics to see your progress here
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Motivational Section */}
            {userStats.totalSubsections > 0 && (
                <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-950 dark:to-blue-950 dark:border-green-800">
                    <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900">
                            <TrophyIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                            Keep up the great work! 🎉
                        </h3>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                            You're making excellent progress on your DSA learning journey.
                            {userStats.currentStreak > 0 && ` Your ${userStats.currentStreak}-day streak shows great consistency!`}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}