"use client";

import { dsaPythonCourse } from "@/data/dsa-python-course";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    BookOpenIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    PlayIcon,
    CircleIcon
} from "lucide-react";

interface ChapterPageProps {
    params: {
        courseSlug: string;
        chapterSlug: string;
    };
}

export default function ChapterPage({ params }: ChapterPageProps) {
    const [courseSlug, setCourseSlug] = useState<string>('');
    const [chapterSlug, setChapterSlug] = useState<string>('');
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [completedSubsections, setCompletedSubsections] = useState<Set<string>>(new Set());
    const [chapterProgress, setChapterProgress] = useState<number>(0);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setCourseSlug(resolvedParams.courseSlug);
            setChapterSlug(resolvedParams.chapterSlug);
        };
        getParams();
    }, [params]);

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

    const course = dsaPythonCourse;

    if (courseSlug && course.slug !== courseSlug) {
        notFound();
    }

    const chapter = chapterSlug ? course.chapters.find((c) => c.slug === chapterSlug) : null;
    if (chapterSlug && !chapter) {
        notFound();
    }

    // Don't render anything until params are loaded
    if (!courseSlug || !chapterSlug || !chapter) {
        return null;
    }

    // Get all subsections in this chapter
    const allSubsections = chapter.sections.flatMap(section => section.subsections);
    const totalSubsections = allSubsections.length;

    const fetchProgress = async () => {
        try {
            const { data, error } = await supabase
                .from("user_subsection_progress")
                .select("subsection_id")
                .eq("user_id", user.id);

            if (data) {
                const completed = new Set(data.map((item) => item.subsection_id));
                setCompletedSubsections(completed);

                // Calculate chapter progress
                const completedInChapter = allSubsections.filter(sub => completed.has(sub.id)).length;
                const progress = totalSubsections > 0 ? (completedInChapter / totalSubsections) * 100 : 0;
                setChapterProgress(progress);

                // Calculate completed sections
                const sectionCompletionStatus = new Set<string>();
                chapter.sections.forEach(section => {
                    const allSubsectionsCompleted = section.subsections.length > 0 &&
                        section.subsections.every(sub => completed.has(sub.id));
                    if (allSubsectionsCompleted) {
                        sectionCompletionStatus.add(section.id);
                    }
                });
                setCompletedSections(sectionCompletionStatus);
            }
            if (error) {
                console.error("Error fetching progress:", error);
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
        }
    };

    const previousChapter = chapter.order > 1 ? course.chapters[chapter.order - 2] : null;
    const nextChapter = chapter.order < course.chapters.length ? course.chapters[chapter.order] : null;

    // Section summaries (placeholder data)
    const getSectionSummary = (sectionSlug: string) => {
        const summaries: { [key: string]: string } = {
            "chapter-goals": "Overview of what you'll learn and achieve in this chapter.",
            "creating-objects": "Learn how to create and instantiate objects in Python.",
            "calling-methods-on-objects": "Understand how to call methods and access object properties.",
            "implementing-a-class": "Master the fundamentals of class creation and structure.",
            "operator-overloading": "Explore how to customize operator behavior in your classes.",
            "importing-modules": "Learn to organize and import code using Python modules.",
            "computer-architecture": "Understand how computer hardware affects algorithm performance.",
            "accessing-elements-in-a-python-list": "Learn the mechanics of list access and indexing.",
            "big-oh-notation": "Master the mathematical notation for describing algorithm complexity.",
            "scope": "Understand variable scope and lifetime in Python programs.",
            "the-run-time-stack-and-the-heap": "Learn how memory is managed during program execution.",
            "writing-a-recursive-function": "Master the art of writing functions that call themselves."
        };

        return summaries[sectionSlug] || "Explore important concepts and implementations in this section.";
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                <Link href="/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
                <ArrowRightIcon className="h-3 w-3" />
                <Link href={`/courses/${courseSlug}`} className="hover:text-blue-600 transition-colors">
                    {course.title}
                </Link>
                <ArrowRightIcon className="h-3 w-3" />
                <span className="text-foreground font-medium">{chapter.title}</span>
            </nav>

            {/* Chapter Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-700 font-bold text-lg dark:bg-blue-900 dark:text-blue-300">
                                {chapter.order}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold">{chapter.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center space-x-1">
                                        <BookOpenIcon className="w-4 h-4" />
                                        <span>{chapter.sections.length} sections</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant={chapterProgress === 100 ? "default" : "secondary"}
                        className={`${chapterProgress === 100 ? "bg-green-600 hover:bg-green-700" : ""} whitespace-nowrap`}
                    >
                        {chapterProgress === 100 ? "Completed" : `${Math.round(chapterProgress)}% Complete`}
                    </Badge>
                </div>

                {/* Progress Section */}
                {user && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {Math.round(chapterProgress)}%
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">Progress</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {completedSections.size}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">Sections Done</div>
                                </div>
                                <div className="text-center col-span-2 md:col-span-1">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {chapter.sections.length}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Sections</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                                    <span>Chapter Progress</span>
                                    <span>{Math.round(chapterProgress)}%</span>
                                </div>
                                <Progress value={chapterProgress} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sections Grid */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Sections in this Chapter</h2>
                    <div className="text-sm text-muted-foreground">
                        {chapter.sections.length} sections
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chapter.sections.map((section, index) => {
                        const isCompleted = completedSections.has(section.id);
                        const summary = getSectionSummary(section.slug);

                        return (
                            <Card key={section.id} className="group hover:shadow-lg transition-all duration-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-4">
                                        {/* Section Number/Completion Icon */}
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isCompleted
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircleIcon className="w-4 h-4" />
                                            ) : (
                                                <span className="text-sm font-medium">{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <Badge
                                            variant={isCompleted ? "default" : "secondary"}
                                            className={`${isCompleted
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                }`}
                                        >
                                            {isCompleted ? "Complete" : "Pending"}
                                        </Badge>
                                    </div>

                                    {/* Title with Link */}
                                    <Link
                                        href={`/courses/${courseSlug}/${chapterSlug}/${section.slug}`}
                                        className="block group-hover:text-blue-600 transition-colors"
                                    >
                                        <CardTitle className="text-lg mb-2 line-clamp-2">
                                            {section.title}
                                        </CardTitle>
                                    </Link>

                                    {/* Description */}
                                    <CardDescription className="text-sm line-clamp-2 mb-4">
                                        {summary}
                                    </CardDescription>

                                    {/* Action Button */}
                                    <div className="absolute bottom-4 right-4">
                                        <Button
                                            size="icon"
                                            variant={isCompleted ? "outline" : "default"}
                                            asChild
                                            className={`rounded-full w-10 h-10 ${isCompleted
                                                ? 'hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/50'
                                                : 'hover:bg-blue-600'
                                                }`}
                                        >
                                            <Link href={`/courses/${courseSlug}/${chapterSlug}/${section.slug}`}>
                                                {isCompleted ? (
                                                    <BookOpenIcon className="h-5 w-5" />
                                                ) : (
                                                    <PlayIcon className="h-5 w-5" />
                                                )}
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t">
                <div className="order-2 sm:order-1">
                    {previousChapter && (
                        <Button variant="outline" asChild>
                            <Link href={`/courses/${courseSlug}/${previousChapter.slug}`}>
                                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Previous Chapter</span>
                                <span className="sm:hidden">Previous</span>
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="order-1 sm:order-2">
                    <Button variant="ghost" asChild>
                        <Link href={`/courses/${courseSlug}`}>
                            Back to Course
                        </Link>
                    </Button>
                </div>

                <div className="order-3">
                    {nextChapter && (
                        <Button variant="outline" asChild>
                            <Link href={`/courses/${courseSlug}/${nextChapter.slug}`}>
                                <span className="hidden sm:inline">Next Chapter</span>
                                <span className="sm:hidden">Next</span>
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
