import { createClient } from "@/lib/supabase/server";
import { dsaPythonCourse } from "@/data/dsa-python-course";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { chapterId, userId } = await request.json();

        if (!chapterId || !userId) {
            return NextResponse.json({ error: "Chapter ID and User ID are required" }, { status: 400 });
        }

        const supabase = createClient(cookies());

        // Find the chapter in our hardcoded data to get all subsection IDs
        const chapter = dsaPythonCourse.chapters.find((ch) => ch.id === chapterId);
        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        // Get all subsection IDs for this chapter
        const allSubsectionIds = chapter.sections.flatMap((section) =>
            section.subsections.map((subsection) => subsection.id)
        );

        // Check how many subsections the user has completed
        const { data: completedSubsections, error: fetchError } = await supabase
            .from("user_subsection_progress")
            .select("subsection_id")
            .eq("user_id", userId)
            .in("subsection_id", allSubsectionIds);

        if (fetchError) {
            console.error("Error fetching completed subsections:", fetchError);
            return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
        }

        const completedSubsectionIds = completedSubsections?.map(item => item.subsection_id) || [];

        // Check if all subsections are completed
        const isChapterComplete = allSubsectionIds.every(id => completedSubsectionIds.includes(id));

        if (isChapterComplete) {
            // Check if chapter completion record already exists
            const { data: existingProgress } = await supabase
                .from("user_chapter_progress")
                .select("id")
                .eq("user_id", userId)
                .eq("chapter_id", chapterId)
                .single();

            if (!existingProgress) {
                // Mark chapter as complete
                const { error: insertError } = await supabase
                    .from("user_chapter_progress")
                    .insert({
                        user_id: userId,
                        chapter_id: chapterId,
                    });

                if (insertError) {
                    console.error("Error marking chapter complete:", insertError);
                    return NextResponse.json({ error: "Failed to mark chapter complete" }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    chapterCompleted: true,
                    message: `Chapter "${chapter.title}" completed! 🎉`
                });
            }
        }

        return NextResponse.json({
            success: true,
            chapterCompleted: false,
            progress: `${completedSubsectionIds.length}/${allSubsectionIds.length} subsections completed`
        });

    } catch (error) {
        console.error("Error in check-chapter-completion:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}