export type UserRole = "ADMIN" | "STUDENT";

export type UserPublic = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
};

export type CourseAuthor = {
  name: string | null;
  email: string;
};

export type CourseSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  priceCents: number | null;
  currency: string;
  updatedAt: string;
  lessonCount: number;
  author: CourseAuthor;
};

export type LessonTeaser = {
  id: string;
  title: string;
  sortOrder: number;
};

export type LessonFull = LessonTeaser & {
  videoUrl: string;
  captionUrl: string | null;
  materials: unknown;
};

export type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  priceCents: number | null;
  currency: string;
  published: boolean;
  author: { id: string; name: string | null; email: string };
  enrolled: boolean;
  /** True when user has a completed Flutterwave payment for this course */
  paidForCourse?: boolean;
  completedLessonIds: string[];
  lessons: (LessonTeaser | LessonFull)[];
};

export type EnrollmentRow = {
  id: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string | null;
    priceCents: number | null;
    currency: string;
    published: boolean;
    _count: { lessons: number };
  };
};
