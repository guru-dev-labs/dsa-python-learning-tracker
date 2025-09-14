"use client";

import { dsaPythonCourse } from "@/data/dsa-python-course";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    BookOpenIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    GraduationCapIcon,
    TargetIcon
} from "lucide-react";

interface CoursePageProps {
    params: {
        courseSlug: string;
    };
}

export default function CoursePage({ params }: CoursePageProps) {
    const [courseSlug, setCourseSlug] = useState<string>('');
    const [user, setUser] = useState<any>(null);
    const [completedSubsections, setCompletedSubsections] = useState<Set<string>>(new Set());
    const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
    const [completedSectionsByChapter, setCompletedSectionsByChapter] = useState<{ [key: string]: number }>({});
    const supabase = createClient();

    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setCourseSlug(resolvedParams.courseSlug);
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

    // Don't render anything until courseSlug is loaded
    if (!courseSlug) {
        return null;
    }

    const fetchProgress = async () => {
        try {
            const { data: subsectionData } = await supabase
                .from("user_subsection_progress")
                .select("subsection_id")
                .eq("user_id", user.id);

            const { data: chapterData } = await supabase
                .from("user_chapter_progress")
                .select("chapter_id")
                .eq("user_id", user.id);

            if (subsectionData) {
                setCompletedSubsections(new Set(subsectionData.map(item => item.subsection_id)));

                // Calculate completed sections per chapter
                const sectionProgress: { [key: string]: number } = {};
                course.chapters.forEach(chapter => {
                    let completedSections = 0;
                    chapter.sections.forEach(section => {
                        const allSubsectionsCompleted = section.subsections.every(sub =>
                            subsectionData.some(completed => completed.subsection_id === sub.id)
                        );
                        if (allSubsectionsCompleted && section.subsections.length > 0) {
                            completedSections++;
                        }
                    });
                    sectionProgress[chapter.id] = completedSections;
                });
                setCompletedSectionsByChapter(sectionProgress);
            }
            if (chapterData) {
                setCompletedChapters(new Set(chapterData.map(item => item.chapter_id)));
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
        }
    };

    // Calculate overall progress
    const totalSubsections = course.chapters.reduce((sum, chapter) =>
        sum + chapter.sections.reduce((sectionSum, section) => sectionSum + section.subsections.length, 0), 0
    );
    const overallProgress = totalSubsections > 0 ? (completedSubsections.size / totalSubsections) * 100 : 0;

    // Chapter summaries and cover images (placeholder data)
    const getChapterMetadata = (chapterSlug: string) => {
        const metadata: { [key: string]: { summary: string; coverImage: string } } = {
            "python-programming-101": {
                summary: "Master the fundamentals of Python programming including objects, classes, and essential concepts needed for DSA.",
                coverImage: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=240&fit=crop&q=80"
            },
            "computational-complexity": {
                summary: "Learn Big-O notation, algorithm analysis, and understand time and space complexity for efficient code.",
                coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=240&fit=crop&q=80"
            },
            "recursion": {
                summary: "Dive deep into recursive thinking, function calls, and solving complex problems using recursive approaches.",
                coverImage: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=240&fit=crop&q=80"
            },
            "sequences": {
                summary: "Explore arrays, lists, sorting algorithms, and sequential data structures with practical implementations.",
                coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop&q=80"
            },
            "sets-and-maps": {
                summary: "Understanding hash tables, sets, dictionaries, and key-value data structures for efficient lookups.",
                coverImage: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=240&fit=crop&q=80"
            }
        };

        return metadata[chapterSlug] || {
            summary: "Comprehensive coverage of important data structures and algorithms concepts.",
            coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=240&fit=crop&q=80"
        };
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                <Link href="/courses" className="hover:text-blue-600 transition-colors">
                    Courses
                </Link>
                <ArrowRightIcon className="h-3 w-3" />
                <span className="text-foreground font-medium">{course.title}</span>
            </nav>

            {/* Course Header */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">{course.title}</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            {course.description}
                        </p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                        {course.chapters.length} Chapters
                    </Badge>
                </div>

                {/* Progress Section for logged-in users */}
                {user && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {Math.round(overallProgress)}%
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        Course Progress
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {completedSubsections.size}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        Completed Items
                                    </div>
                                </div>
                                <div className="text-center col-span-2 md:col-span-1">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {completedChapters.size}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        Chapters Done
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                                    <span>Overall Progress</span>
                                    <span>{Math.round(overallProgress)}%</span>
                                </div>
                                <Progress value={overallProgress} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Chapters Grid */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Course Chapters</h2>
                    <div className="text-sm text-muted-foreground">
                        {course.chapters.length} chapters • {course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.chapters.map((chapter, index) => {
                        const metadata = getChapterMetadata(chapter.slug);
                        const completedSections = completedSectionsByChapter[chapter.id] || 0;
                        const totalSections = chapter.sections.length;
                        const sectionProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
                        const isChapterComplete = completedChapters.has(chapter.id);

                        return (
                            <Card
                                key={chapter.id}
                                className="hover:shadow-lg transition-all duration-200 group h-full flex flex-col overflow-hidden"
                            >
                                {/* Cover Image */}
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={metadata.coverImage}
                                        alt={chapter.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                            // Fallback to default image if the specific image fails
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=240&fit=crop&q=80";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute top-4 left-4">
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg backdrop-blur-sm ${isChapterComplete
                                            ? 'bg-green-500/90 text-white'
                                            : 'bg-blue-500/90 text-white'
                                            }`}>
                                            {isChapterComplete ? (
                                                <CheckCircleIcon className="w-6 h-6" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                    </div>
                                    {isChapterComplete && (
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-green-500/90 text-white border-0">
                                                Completed
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                                        <Link href={`/courses/${courseSlug}/${chapter.slug}`}>
                                            {chapter.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="text-sm line-clamp-3">
                                        {metadata.summary}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                                    {/* Section Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Sections</span>
                                            <span>{completedSections} of {totalSections} completed</span>
                                        </div>
                                        <Progress value={sectionProgress} className="h-2" />
                                    </div>

                                    <Button asChild className="w-full group-hover:bg-blue-600 transition-colors">
                                        <Link href={`/courses/${courseSlug}/${chapter.slug}`}>
                                            {user && sectionProgress > 0
                                                ? `Continue Chapter ${index + 1}`
                                                : `Start Chapter ${index + 1}`
                                            }
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Course Completion Card */}
            {user && overallProgress === 100 && (
                <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-950 dark:to-blue-950 dark:border-green-800">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                                <GraduationCapIcon className="w-8 h-8 text-green-600 dark:text-green-300" />
                            </div>
                        </div>
                        <CardTitle className="text-green-800 dark:text-green-200">
                            🎉 Congratulations!
                        </CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-300">
                            You have completed the entire DSA Python course. Time to put your knowledge to practice!
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}