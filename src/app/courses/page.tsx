"use client";

import { dsaPythonCourse } from "@/data/dsa-python-course";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { BookOpenIcon, ClockIcon, TrophyIcon, TargetIcon } from "lucide-react";

export default function CoursesPage() {
    const [user, setUser] = useState<any>(null);
    const [completedSubsections, setCompletedSubsections] = useState<Set<string>>(new Set());
    const [courseProgress, setCourseProgress] = useState<number>(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, [supabase]);

    useEffect(() => {
        if (user) {
            fetchProgress();
        }
    }, [user, supabase]);

    const fetchProgress = async () => {
        try {
            const { data, error } = await supabase
                .from("user_subsection_progress")
                .select("subsection_id")
                .eq("user_id", user.id);

            if (data) {
                const completed = new Set(data.map((item) => item.subsection_id));
                setCompletedSubsections(completed);

                // Calculate overall course progress
                const allSubsections = dsaPythonCourse.chapters.flatMap(chapter =>
                    chapter.sections.flatMap(section => section.subsections)
                );
                const progress = allSubsections.length > 0
                    ? (data.length / allSubsections.length) * 100
                    : 0;
                setCourseProgress(progress);
            }
            if (error) {
                console.error("Error fetching progress:", error);
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
        }
    };

    // Calculate stats
    const totalChapters = dsaPythonCourse.chapters.length;
    const totalSections = dsaPythonCourse.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);
    const totalSubsections = dsaPythonCourse.chapters.reduce((sum, chapter) =>
        sum + chapter.sections.reduce((sectionSum, section) => sectionSum + section.subsections.length, 0), 0
    );

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Available Courses</h1>
                <p className="text-muted-foreground">
                    Master data structures and algorithms with our comprehensive curriculum
                </p>
            </div>

            {/* Stats Overview */}
            {user && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Progress</CardTitle>
                            <TargetIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.round(courseProgress)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Overall completion
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {completedSubsections.size}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                of {totalSubsections} subsections
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
                            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {totalChapters}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Available chapters
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sections</CardTitle>
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {totalSections}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total sections
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Course Card */}
            <div className="grid gap-6">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl">{dsaPythonCourse.title}</CardTitle>
                                <CardDescription className="text-base">
                                    {dsaPythonCourse.description}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Python
                                </Badge>
                                {user && courseProgress > 0 && (
                                    <Badge variant={courseProgress === 100 ? "default" : "outline"}>
                                        {courseProgress === 100 ? "Completed" : `${Math.round(courseProgress)}% Complete`}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Course Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{totalChapters}</div>
                                <div className="text-sm text-muted-foreground">Chapters</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{totalSections}</div>
                                <div className="text-sm text-muted-foreground">Sections</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{totalSubsections}</div>
                                <div className="text-sm text-muted-foreground">Subsections</div>
                            </div>
                        </div>

                        {/* Progress Bar for authenticated users */}
                        {user && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Your Progress</span>
                                    <span>{Math.round(courseProgress)}%</span>
                                </div>
                                <Progress value={courseProgress} className="h-2" />
                            </div>
                        )}

                        {/* Course Topics Preview */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">What you'll learn:</h4>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Python Programming", "Arrays & Lists", "Recursion", "Trees & Graphs",
                                    "Dynamic Programming", "Sorting Algorithms", "Hash Maps", "Binary Search Trees"
                                ].map((topic) => (
                                    <Badge key={topic} variant="outline" className="text-xs">
                                        {topic}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                            <Button asChild className="w-full">
                                <Link href={`/courses/${dsaPythonCourse.slug}`}>
                                    {user && courseProgress > 0 ? "Continue Learning" : "Start Learning"}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                    More courses coming soon. Stay tuned for advanced topics and specialized tracks!
                </p>
            </div>
        </div>
    );
}