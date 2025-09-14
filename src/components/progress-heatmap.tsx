"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ProgressHeatmapProps {
    data: DailyProgress[];
}

export function ProgressHeatmap({ data }: ProgressHeatmapProps) {
    const [selectedDate, setSelectedDate] = useState<DailyProgress | null>(null);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Create a map of dates to progress data
    const progressMap = useMemo(() => {
        const map: { [key: string]: DailyProgress } = {};
        data.forEach(item => {
            map[item.date] = item;
        });
        return map;
    }, [data]);

    // Generate the last 365 days
    const dates = useMemo(() => {
        const result: string[] = [];
        const today = new Date();

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            result.push(date.toISOString().split('T')[0]);
        }

        return result;
    }, []);

    // Get intensity level based on points
    const getIntensityLevel = (points: number): string => {
        if (points === 0) return "bg-muted";
        if (points <= 2) return "bg-green-200 dark:bg-green-900";
        if (points <= 5) return "bg-green-400 dark:bg-green-700";
        if (points <= 10) return "bg-green-600 dark:bg-green-500";
        return "bg-green-800 dark:bg-green-300";
    };

    // Group dates by weeks
    const weeks = useMemo(() => {
        const result: (string | null)[][] = [];
        let currentWeek: (string | null)[] = [];

        dates.forEach((date, index) => {
            const dayOfWeek = new Date(date).getDay();

            if (index === 0) {
                // Add empty cells for the first week
                for (let i = 0; i < dayOfWeek; i++) {
                    currentWeek.push(null);
                }
            }

            currentWeek.push(date);

            if (dayOfWeek === 6 || index === dates.length - 1) {
                // Complete the week if it's incomplete
                while (currentWeek.length < 7) {
                    currentWeek.push(null);
                }
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        return result;
    }, [dates]);

    const formatTooltipDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleMouseEnter = (date: string, event: React.MouseEvent) => {
        setHoveredDate(date);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredDate(null);
    };

    const handleClick = (date: string) => {
        const progress = progressMap[date];
        if (progress && progress.subsections.length > 0) {
            setSelectedDate(progress);
        }
    };

    const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <>
            <div className="space-y-4">
                {/* Heatmap */}
                <div className="relative">
                    {/* Month labels */}
                    <div className="flex mb-2 text-xs text-muted-foreground">
                        {Array.from({ length: Math.ceil(weeks.length / 4) }, (_, i) => {
                            const weekIndex = i * 4;
                            if (weekIndex < weeks.length && weeks[weekIndex][0]) {
                                const month = new Date(weeks[weekIndex][0]!).getMonth();
                                return (
                                    <div key={i} className="flex-1 text-left" style={{ minWidth: `${100 / Math.ceil(weeks.length / 4)}%` }}>
                                        {monthLabels[month]}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <div className="flex gap-1">
                        {/* Day labels */}
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground mr-2">
                            {dayLabels.map((day, index) => (
                                <div key={day} className="h-3 flex items-center" style={{ opacity: index % 2 === 0 ? 1 : 0 }}>
                                    {index % 2 === 0 ? day : ''}
                                </div>
                            ))}
                        </div>

                        {/* Heatmap grid */}
                        <div className="flex gap-1">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-1">
                                    {week.map((date: string | null, dayIndex: number) => {
                                        if (!date) {
                                            return <div key={`empty-${dayIndex}`} className="w-3 h-3" />;
                                        }

                                        const progress = progressMap[date];
                                        const points = progress?.points || 0;
                                        const intensityClass = getIntensityLevel(points);

                                        return (
                                            <div
                                                key={date}
                                                className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary ${intensityClass}`}
                                                onMouseEnter={(e) => handleMouseEnter(date, e)}
                                                onMouseMove={handleMouseMove}
                                                onMouseLeave={handleMouseLeave}
                                                onClick={() => handleClick(date)}
                                                title={`${formatTooltipDate(date)}: ${points} points`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted" />
                        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                        <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-300" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredDate && (
                <div
                    className="fixed z-50 pointer-events-none bg-background border rounded-lg shadow-md px-3 py-2 text-sm"
                    style={{
                        left: mousePosition.x + 10,
                        top: mousePosition.y - 10,
                    }}
                >
                    <div className="font-medium">{formatTooltipDate(hoveredDate)}</div>
                    <div className="text-muted-foreground">
                        {progressMap[hoveredDate]?.points || 0} points from {progressMap[hoveredDate]?.subsections.length || 0} subsections
                    </div>
                </div>
            )}

            {/* Modal for detailed view */}
            <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Progress for {selectedDate && formatTooltipDate(selectedDate.date)}
                        </DialogTitle>
                        <DialogDescription>
                            Completed {selectedDate?.subsections.length} subsections for {selectedDate?.points} points
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDate && (
                        <ScrollArea className="max-h-96">
                            <div className="space-y-4">
                                {selectedDate.subsections.map((subsection) => (
                                    <div key={subsection.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-1">
                                            <h4 className="font-medium">{subsection.title}</h4>
                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                <Badge variant="outline">{subsection.chapterTitle}</Badge>
                                                <span>•</span>
                                                <span>{subsection.sectionTitle}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/courses/dsa-python/${subsection.chapterSlug}/${subsection.sectionSlug}#${subsection.subsectionSlug}`}
                                            className="text-sm text-primary hover:underline"
                                            onClick={() => setSelectedDate(null)}
                                        >
                                            View Topic
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}