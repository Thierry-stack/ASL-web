import type { Course } from "@prisma/client";
import { prisma } from "./prisma";

export function isCourseFree(course: Pick<Course, "priceCents">): boolean {
  return course.priceCents == null || course.priceCents <= 0;
}

export async function hasPaidAccess(userId: string, courseId: string): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: { userId, courseId, status: "COMPLETED" },
  });
  return !!payment;
}
