"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpenIcon, TrophyIcon, UsersIcon, ArrowRightIcon, CheckIcon, SparklesIcon, TargetIcon } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSubsections: 0,
    totalPoints: 0,
    completedChapters: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: subsectionProgress } = await supabase
          .from("user_subsection_progress")
          .select("points_earned")
          .eq("user_id", user.id);

        const { data: chapterProgress } = await supabase
          .from("user_chapter_progress")
          .select("id")
          .eq("user_id", user.id);

        setStats({
          totalSubsections: subsectionProgress?.length || 0,
          totalPoints: subsectionProgress?.reduce((sum, item) => sum + (item.points_earned || 0), 0) || 0,
          completedChapters: chapterProgress?.length || 0,
        });
      }
    };
    fetchUser();
  }, [supabase]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center max-w-4xl mx-auto">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none mx-auto">
                Master Data Structures &
                <span className="text-blue-600"> Algorithms</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Track your daily progress through comprehensive DSA lessons.
                Perfect for students preparing for technical interviews.
              </p>
            </div>

            {user ? (
              <div className="w-full max-w-sm space-y-6 mx-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSubsections}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.completedChapters}</div>
                    <div className="text-xs text-muted-foreground">Chapters</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/courses">Continue Learning</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">View Progress</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/login">
                    Get Started
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/courses">Browse Content</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Everything you need to succeed
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mx-auto">
                Comprehensive tools and features designed for effective learning
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card className="mx-auto w-full">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 mx-auto">
                  <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle>Structured Learning</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  20 chapters with 300+ subsections covering complete DSA curriculum
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="mx-auto w-full">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 mx-auto">
                  <TargetIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Visual progress indicators, daily streaks, and GitHub-style activity heatmap
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="mx-auto w-full">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 mx-auto">
                  <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle>Share & Collaborate</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Shareable links for specific topics and seamless GitHub integration
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Topics Preview */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Complete DSA Curriculum
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mx-auto">
                From Python basics to advanced algorithmic concepts
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 py-4 max-w-4xl mx-auto">
              {[
                "Python Basics", "Arrays & Lists", "Recursion", "Trees", "Graphs",
                "Dynamic Programming", "Sorting", "Hash Maps", "Heaps", "Binary Search"
              ].map((topic) => (
                <Badge key={topic} variant="secondary" className="text-sm">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50 dark:bg-blue-950">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-blue-900 dark:text-blue-100">
                Start Your Learning Journey
              </h2>
              <p className="max-w-[600px] text-blue-700 md:text-xl dark:text-blue-200 mx-auto">
                Join thousands of students mastering DSA with structured learning
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link href={user ? "/courses" : "/login"}>
                  {user ? "Continue Learning" : "Get Started Free"}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
