export interface Subsection {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown content for the subsection
  order: number;
}

export interface Section {
  id: string;
  title: string;
  slug: string;
  order: number;
  subsections: Subsection[];
}

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  order: number;
  sections: Section[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  chapters: Chapter[];
}