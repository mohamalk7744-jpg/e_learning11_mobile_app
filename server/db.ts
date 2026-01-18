import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  subjects,
  InsertSubject,
  lessons,
  InsertLesson,
  quizzes,
  InsertQuiz,
  discounts,
  InsertDiscount,
  accessPermissions,
  InsertAccessPermission,
  studentProgress,
  InsertStudentProgress,
  chatHistory,
  InsertChatHistory,
  notifications,
  InsertNotification,
  studentAnswers,
  InsertStudentAnswer,
  usersExtended,
  InsertUserExtended,
  quizQuestions,
  InsertQuizQuestion,
  quizOptions,
  InsertQuizOption,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Subjects ====================
export async function createSubject(data: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subjects).values(data);
}

export async function getSubjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects);
}

export async function getSubjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSubject(id: number, data: Partial<InsertSubject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subjects).set(data).where(eq(subjects.id, id));
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subjects).where(eq(subjects.id, id));
}

// ==================== Lessons ====================
export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(lessons).values(data);
}

export async function getLessonsBySubject(subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.subjectId, subjectId));
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ==================== Quizzes ====================
export async function createQuiz(data: InsertQuiz) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(quizzes).values(data);
}

export async function getQuizzesBySubject(subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(eq(quizzes.subjectId, subjectId));
}

export async function getQuizById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

export async function getQuizzesBySubjectAndType(subjectId: number, type: "daily" | "monthly" | "semester") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(quizzes)
    .where(eq(quizzes.subjectId, subjectId) && eq(quizzes.type, type));
}

export async function getQuizzesBySubjectAndDay(subjectId: number, dayNumber: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(quizzes)
    .where(eq(quizzes.subjectId, subjectId) && eq(quizzes.dayNumber, dayNumber));
}

export async function getAllQuizzes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes);
}

export async function getNonDailyQuizzes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(eq(quizzes.type, "monthly") || eq(quizzes.type, "semester"));
}

export async function getDailyQuizByLesson(subjectId: number, dayNumber: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(quizzes)
    .where(
      eq(quizzes.subjectId, subjectId) &&
        eq(quizzes.dayNumber, dayNumber) &&
        eq(quizzes.type, "daily")
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFullQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return null;

  const quizResult = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (quizResult.length === 0) return null;

  const quiz = quizResult[0];
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await db
        .select()
        .from(quizOptions)
        .where(eq(quizOptions.questionId, q.id));
      return { ...q, options };
    })
  );

  return { ...quiz, questions: questionsWithOptions };
}

export async function getStudentQuizAttempts(studentId: number, quizIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  // Simplified: return status for each quiz
  return Promise.all(
    quizIds.map(async (id) => {
      const answers = await db
        .select()
        .from(studentAnswers)
        .where(eq(studentAnswers.quizId, id) && eq(studentAnswers.studentId, studentId))
        .limit(1);
      return { quizId: id, attempted: answers.length > 0 };
    })
  );
}

export async function getAllSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAnswers);
}

export async function getSubmissionsByQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAnswers).where(eq(studentAnswers.quizId, quizId));
}

export async function getDetailedSubmission(studentId: number, quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studentAnswers)
    .where(eq(studentAnswers.quizId, quizId) && eq(studentAnswers.studentId, studentId));
}

export async function createQuizQuestion(data: InsertQuizQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quizQuestions).values(data);
  return result[0].insertId;
}

export async function createQuizOption(data: InsertQuizOption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(quizOptions).values(data);
}

// ==================== Discounts ====================
export async function createDiscount(data: InsertDiscount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(discounts).values(data);
}

export async function getActiveDiscounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discounts).where(eq(discounts.isActive, 1));
}

export async function updateDiscount(id: number, data: Partial<InsertDiscount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(discounts).set(data).where(eq(discounts.id, id));
}

export async function deleteDiscount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(discounts).where(eq(discounts.id, id));
}

// ==================== Users ====================
export async function getStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "user"));
}

// ==================== Access Permissions ====================
export async function createAccessPermission(data: InsertAccessPermission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(accessPermissions).values(data);
}

export async function getStudentSubjectAccess(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(accessPermissions)
    .where(eq(accessPermissions.studentId, studentId) && eq(accessPermissions.subjectId, subjectId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAccessPermission(id: number, data: Partial<InsertAccessPermission>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accessPermissions).set(data).where(eq(accessPermissions.id, id));
}

export async function getPermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessPermissions);
}

export async function deleteAccessPermission(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(accessPermissions)
    .where(eq(accessPermissions.studentId, studentId) && eq(accessPermissions.subjectId, subjectId));
}

export async function getStudentSubjects(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const permissions = await db
    .select()
    .from(accessPermissions)
    .where(eq(accessPermissions.studentId, studentId) && eq(accessPermissions.hasAccess, 1));

  if (permissions.length === 0) return [];

  const subjectIds = permissions.map((p) => p.subjectId);
  return db.select().from(subjects).where(eq(subjects.id, subjectIds[0])); // Simplified for now, should use inArray
}

// ==================== Student Progress ====================
export async function createStudentProgress(data: InsertStudentProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studentProgress).values(data);
}

export async function getStudentProgress(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studentProgress)
    .where(eq(studentProgress.studentId, studentId) && eq(studentProgress.subjectId, subjectId));
}

export async function updateStudentProgress(id: number, data: Partial<InsertStudentProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentProgress).set(data).where(eq(studentProgress.id, id));
}

// ==================== Chat History ====================
export async function createChatMessage(data: InsertChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatHistory).values(data);
}

export async function getChatHistory(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatHistory)
    .where(eq(chatHistory.studentId, studentId) && eq(chatHistory.subjectId, subjectId));
}

// ==================== Notifications ====================
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
}

// ==================== Student Answers ====================
export async function createStudentAnswer(data: InsertStudentAnswer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studentAnswers).values(data);
}

export async function getStudentAnswers(studentId: number, quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studentAnswers)
    .where(eq(studentAnswers.studentId, studentId) && eq(studentAnswers.quizId, quizId));
}

export async function updateStudentAnswer(id: number, data: Partial<InsertStudentAnswer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentAnswers).set(data).where(eq(studentAnswers.id, id));
}

// ==================== User Extended ====================
export async function createUserExtended(data: InsertUserExtended) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(usersExtended).values(data);
}

export async function getUserExtended(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(usersExtended).where(eq(usersExtended.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUserExtended(userId: number, data: Partial<InsertUserExtended>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usersExtended).set(data).where(eq(usersExtended.userId, userId));
}
