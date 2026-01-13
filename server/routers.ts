import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as authService from "./auth-service";
import { seedRouter } from "./seed-router";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  seed: seedRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // API جديدة للتحقق من تسجيل الدخول
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const user = await authService.authenticateUser(input.email, input.password);
          return {
            success: true,
            user: {
              id: user.id,
              openId: user.openId,
              name: user.name,
              email: user.email,
              role: user.role,
              loginMethod: user.loginMethod,
              lastSignedIn: user.lastSignedIn,
            },
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Login failed";
          throw new Error(message);
        }
      }),
  }),

  subjects: router({
    list: protectedProcedure.query(() => db.getSubjects()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getSubjectById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          numberOfDays: z.number().default(30),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createSubject({
          name: input.name,
          description: input.description,
          numberOfDays: input.numberOfDays,
          createdBy: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          numberOfDays: z.number().optional(),
        })
      )
      .mutation(({ input }) => db.updateSubject(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSubject(input.id)),
  }),

  lessons: router({
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(({ input }) => db.getLessonsBySubject(input.subjectId)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getLessonById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          subjectId: z.number(),
          title: z.string().min(1),
          content: z.string().min(1),
          dayNumber: z.number().min(1).max(30),
          order: z.number().default(1),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createLesson({
          subjectId: input.subjectId,
          title: input.title,
          content: input.content,
          dayNumber: input.dayNumber,
          order: input.order,
          createdBy: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          dayNumber: z.number().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(({ input }) => db.updateLesson(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteLesson(input.id)),
  }),

  quizzes: router({
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(({ input }) => db.getQuizzesBySubject(input.subjectId)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getQuizById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          subjectId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          type: z.enum(["daily", "monthly", "semester"]),
          dayNumber: z.number().optional(),
          scheduledDate: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createQuiz({
          subjectId: input.subjectId,
          title: input.title,
          description: input.description,
          type: input.type,
          dayNumber: input.dayNumber,
          scheduledDate: input.scheduledDate,
          createdBy: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          type: z.enum(["daily", "monthly", "semester"]).optional(),
          dayNumber: z.number().optional(),
          scheduledDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => db.updateQuiz(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteQuiz(input.id)),
  }),

  discounts: router({
    list: protectedProcedure.query(() => db.getActiveDiscounts()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          discountType: z.enum(["percentage", "fixed"]),
          discountValue: z.number().min(0),
          company: z.string().min(1),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createDiscount({
          title: input.title,
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue,
          company: input.company,
          imageUrl: input.imageUrl,
          isActive: 1,
          createdBy: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          discountType: z.enum(["percentage", "fixed"]).optional(),
          discountValue: z.number().optional(),
          company: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(({ input }) => db.updateDiscount(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDiscount(input.id)),
  }),

  accessPermissions: router({
    getStudentAccess: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .query(({ input }) =>
        db.getStudentSubjectAccess(input.studentId, input.subjectId)
      ),
    create: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          subjectId: z.number(),
          hasAccess: z.number().default(1),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createAccessPermission({
          studentId: input.studentId,
          subjectId: input.subjectId,
          hasAccess: input.hasAccess,
          startDate: input.startDate,
          endDate: input.endDate,
          createdBy: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          hasAccess: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => db.updateAccessPermission(input.id, input)),
  }),

  studentProgress: router({
    getProgress: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .query(({ input }) =>
        db.getStudentProgress(input.studentId, input.subjectId)
      ),
    markLessonComplete: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          subjectId: z.number(),
          lessonId: z.number(),
        })
      )
      .mutation(({ input }) =>
        db.createStudentProgress({
          studentId: input.studentId,
          subjectId: input.subjectId,
          lessonId: input.lessonId,
          isCompleted: 1,
          completedAt: new Date(),
        })
      ),
  }),

  chat: router({
    getHistory: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .query(({ input }) =>
        db.getChatHistory(input.studentId, input.subjectId)
      ),
    sendMessage: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          subjectId: z.number(),
          question: z.string().min(1),
          answer: z.string().min(1),
        })
      )
      .mutation(({ input }) =>
        db.createChatMessage({
          studentId: input.studentId,
          subjectId: input.subjectId,
          question: input.question,
          answer: input.answer,
        })
      ),
    ask: protectedProcedure
      .input(
        z.object({
          question: z.string().min(1),
          curriculum: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { askGemini } = await import("./services/gemini");
        const answer = await askGemini(input.question, input.curriculum);
        return { answer };
      }),
  }),

  notifications: router({
    getUserNotifications: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserNotifications(input.userId)),
    create: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          title: z.string().min(1),
          message: z.string().min(1),
          type: z.enum(["lesson", "quiz", "discount", "grade", "general"]),
          relatedId: z.number().optional(),
        })
      )
      .mutation(({ input }) =>
        db.createNotification({
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
          relatedId: input.relatedId,
          isRead: 0,
        })
      ),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.markNotificationAsRead(input.id)),
  }),

  studentAnswers: router({
    getAnswers: protectedProcedure
      .input(z.object({ studentId: z.number(), quizId: z.number() }))
      .query(({ input }) =>
        db.getStudentAnswers(input.studentId, input.quizId)
      ),
    submitAnswer: protectedProcedure
      .input(
        z.object({
          quizId: z.number(),
          studentId: z.number(),
          questionId: z.number(),
          selectedOptionId: z.number().optional(),
          textAnswer: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.createStudentAnswer({
          quizId: input.quizId,
          studentId: input.studentId,
          questionId: input.questionId,
          selectedOptionId: input.selectedOptionId,
          textAnswer: input.textAnswer,
          imageUrl: input.imageUrl,
          submittedAt: new Date(),
        })
      ),
    gradeAnswer: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          score: z.number(),
          feedback: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateStudentAnswer(input.id, {
          score: input.score,
          feedback: input.feedback,
          gradedAt: new Date(),
          gradedBy: ctx.user.id,
        })
      ),
  }),
});
export type AppRouter = typeof appRouter;
