"use client";

import { dsaPythonCourse } from "@/data/dsa-python-course";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    BookOpenIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ShareIcon,
    CheckIcon,
    HashIcon
} from "lucide-react";
import { toast } from "sonner";

interface SectionPageProps {
    params: {
        courseSlug: string;
        chapterSlug: string;
        sectionSlug: string;
    };
}

export default function SectionPage({ params }: SectionPageProps) {
    const [courseSlug, setCourseSlug] = useState<string>('');
    const [chapterSlug, setChapterSlug] = useState<string>('');
    const [sectionSlug, setSectionSlug] = useState<string>('');
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [completedSubsections, setCompletedSubsections] = useState<Set<string>>(new Set());

    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setCourseSlug(resolvedParams.courseSlug);
            setChapterSlug(resolvedParams.chapterSlug);
            setSectionSlug(resolvedParams.sectionSlug);
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
            const fetchProgress = async () => {
                const { data, error } = await supabase
                    .from("user_subsection_progress")
                    .select("subsection_id")
                    .eq("user_id", user.id);

                if (data) {
                    setCompletedSubsections(new Set(data.map((item) => item.subsection_id)));
                }
                if (error) {
                    console.error("Error fetching progress:", error);
                }
            };
            fetchProgress();
        }
    }, [user, supabase]);

    useEffect(() => {
        // Handle scrolling to subsection if URL has hash
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, []);

    const course = dsaPythonCourse;

    if (courseSlug && course.slug !== courseSlug) {
        notFound();
    }

    const chapter = chapterSlug ? course.chapters.find((c) => c.slug === chapterSlug) : null;
    if (chapterSlug && !chapter) {
        notFound();
    }

    const section = chapter && sectionSlug ? chapter.sections.find((s) => s.slug === sectionSlug) : null;
    if (sectionSlug && chapter && !section) {
        notFound();
    }

    // Don't render anything until params are loaded
    if (!courseSlug || !chapterSlug || !sectionSlug || !chapter || !section) {
        return null;
    }

    // Find previous and next sections in the current chapter
    const currentSectionIndex = chapter.sections.findIndex(s => s.slug === sectionSlug);
    const previousSection = currentSectionIndex > 0 ? chapter.sections[currentSectionIndex - 1] : null;
    const nextSection = currentSectionIndex < chapter.sections.length - 1 ? chapter.sections[currentSectionIndex + 1] : null;

    const handleSubsectionComplete = async (subsectionId: string, isCompleted: boolean) => {
        if (!user) {
            toast.error("Please log in to track your progress.");
            return;
        }

        if (isCompleted) {
            const { error } = await supabase.from("user_subsection_progress").insert({
                user_id: user.id,
                subsection_id: subsectionId,
                points_earned: 1,
            });
            if (error) {
                console.error("Error marking subsection complete:", error);
                toast.error("Failed to mark as complete");
                return;
            } else {
                setCompletedSubsections((prev) => new Set(prev).add(subsectionId));
                toast.success("Great job! Subsection completed 🎉");
            }
        } else {
            const { error } = await supabase
                .from("user_subsection_progress")
                .delete()
                .eq("user_id", user.id)
                .eq("subsection_id", subsectionId);
            if (error) {
                console.error("Error unmarking subsection complete:", error);
                toast.error("Failed to update progress");
                return;
            } else {
                setCompletedSubsections((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(subsectionId);
                    return newSet;
                });
                toast.success("Progress updated");
            }
        }

        // Check if chapter is complete after updating subsection progress
        try {
            const response = await fetch("/api/check-chapter-completion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chapterId: chapter.id,
                    userId: user.id,
                }),
            });

            const result = await response.json();

            if (result.success && result.chapterCompleted) {
                toast.success(result.message);
            }
        } catch (error) {
            console.error("Error checking chapter completion:", error);
        }
    };

    const handleShare = async (subsectionSlug: string, subsectionTitle: string) => {
        const url = `${window.location.origin}/courses/${courseSlug}/${chapterSlug}/${sectionSlug}#${subsectionSlug}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${subsectionTitle} - ${course.title}`,
                    text: `Check out this learning material: ${subsectionTitle}`,
                    url,
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
            } catch (error) {
                console.error("Error copying to clipboard:", error);
                toast.error("Failed to copy link");
            }
        }
    };

    // Calculate progress
    const completedCount = section.subsections.filter(sub => completedSubsections.has(sub.id)).length;
    const sectionProgress = section.subsections.length > 0 ? (completedCount / section.subsections.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb Navigation */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto py-4 px-4">
                    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Link href="/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
                        <ArrowRightIcon className="h-3 w-3" />
                        <Link href={`/courses/${courseSlug}`} className="hover:text-blue-600 transition-colors">
                            {course.title}
                        </Link>
                        <ArrowRightIcon className="h-3 w-3" />
                        <Link href={`/courses/${courseSlug}/${chapterSlug}`} className="hover:text-blue-600 transition-colors">
                            {chapter.title}
                        </Link>
                        <ArrowRightIcon className="h-3 w-3" />
                        <span className="text-foreground font-medium">{section.title}</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto py-8 px-4 max-w-4xl">
                {/* Section Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-bold">{section.title}</h1>
                            <p className="text-lg text-muted-foreground">
                                {chapter.title}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {user && (
                                <Badge
                                    variant={sectionProgress === 100 ? "default" : "secondary"}
                                    className={sectionProgress === 100 ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                    {sectionProgress === 100 ? "Completed" : `${Math.round(sectionProgress)}% Complete`}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Progress Section */}
                    {user && (
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {completedCount}
                                        </div>
                                        <div className="text-sm text-blue-700 dark:text-blue-300">Completed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {section.subsections.length}
                                        </div>
                                        <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                                        <span>Section Progress</span>
                                        <span>{Math.round(sectionProgress)}%</span>
                                    </div>
                                    <Progress value={sectionProgress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Table of Contents */}
                {section.subsections.length > 1 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg">On this page</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {section.subsections.map((subsection, index) => {
                                    const isCompleted = completedSubsections.has(subsection.id);
                                    return (
                                        <li key={subsection.id}>
                                            <Link
                                                href={`#${subsection.slug}`}
                                                className="flex items-center space-x-2 text-sm hover:text-blue-600 transition-colors group"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`} />
                                                <span className="group-hover:underline">{subsection.title}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Subsections Content */}
                <div className="space-y-12">
                    {section.subsections.map((subsection, index) => {
                        const isCompleted = completedSubsections.has(subsection.id);

                        return (
                            <div key={subsection.id} id={subsection.slug} className="scroll-mt-8">
                                {index > 0 && <Separator className="mb-12" />}

                                {/* Subsection Header */}
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3">
                                            <h2 className="text-2xl sm:text-3xl font-bold">{subsection.title}</h2>
                                            <Button
                                                onClick={() => handleShare(subsection.slug, subsection.title)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <HashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {isCompleted && (
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                Completed
                                            </Badge>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleShare(subsection.slug, subsection.title)}
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        <ShareIcon className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </div>

                                {/* Content */}
                                <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
                                    {subsection.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: subsection.content }} />
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-blue-900">
                                                <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">Content Coming Soon</h3>
                                            <p className="text-muted-foreground">
                                                This subsection is being prepared and will be available soon.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Tracking */}
                                {user && (
                                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`checkbox-${subsection.id}`}
                                                        checked={isCompleted}
                                                        onCheckedChange={(checked: boolean) =>
                                                            handleSubsectionComplete(subsection.id, checked)
                                                        }
                                                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                    />
                                                    <div>
                                                        <label
                                                            htmlFor={`checkbox-${subsection.id}`}
                                                            className="text-sm font-medium cursor-pointer text-blue-900 dark:text-blue-100"
                                                        >
                                                            {isCompleted ? "Completed! Great job 🎉" : "Mark as Complete"}
                                                        </label>
                                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                            {isCompleted
                                                                ? "You've mastered this subsection. Keep up the great work!"
                                                                : "Check this box when you've understood the concept"
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                {isCompleted && (
                                                    <div className="text-green-600 dark:text-green-400">
                                                        <CheckCircleIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Section Complete Message */}
                {user && sectionProgress === 100 && (
                    <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-950 dark:to-blue-950 dark:border-green-800">
                        <CardContent className="pt-6 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900">
                                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                                🎉 Section Completed!
                            </h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                                Excellent work! You've completed all subsections in this section.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 pt-8 border-t">
                    <div className="order-2 sm:order-1">
                        {previousSection ? (
                            <Button variant="outline" asChild>
                                <Link href={`/courses/${courseSlug}/${chapterSlug}/${previousSection.slug}`}>
                                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                    <div className="text-left">
                                        <div className="text-xs text-muted-foreground">Previous</div>
                                        <div className="font-medium">{previousSection.title}</div>
                                    </div>
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" asChild>
                                <Link href={`/courses/${courseSlug}/${chapterSlug}`}>
                                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                    Back to Chapter
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="order-1 sm:order-2 text-center">
                        <p className="text-sm text-muted-foreground">
                            {completedCount} of {section.subsections.length} completed
                        </p>
                    </div>

                    <div className="order-3">
                        {nextSection ? (
                            <Button variant="outline" asChild>
                                <Link href={`/courses/${courseSlug}/${chapterSlug}/${nextSection.slug}`}>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Next</div>
                                        <div className="font-medium">{nextSection.title}</div>
                                    </div>
                                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" asChild>
                                <Link href={`/courses/${courseSlug}/${chapterSlug}`}>
                                    Back to Chapter
                                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}