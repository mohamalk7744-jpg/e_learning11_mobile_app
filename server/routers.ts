import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as authService from "./auth-service";
import { seedRouter } from "./seed-router";
import { sdk } from "./_core/sdk";
import { askGemini } from "./services/gemini";
import { storagePut } from "./storage";

export const appRouter = router({
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
          const token = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
          });

          return {
            success: true,
            token,
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

  storage: router({
    upload: protectedProcedure
      .input(z.object({
        base64: z.string(),
        fileName: z.string(),
        contentType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, 'base64');
        const { url } = await storagePut(input.fileName, buffer, input.contentType);
        return { url };
      }),
  }),

  users: router({
    listStudents: protectedProcedure.query(() => db.getStudents()),
    listAll: protectedProcedure.query(() => db.getAllUsers()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(["user", "admin"]).default("user"),
        })
      )
      .mutation(async ({ input }) => {
        const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
    getStats: protectedProcedure.query(({ ctx }) => db.getStudentStats(ctx.user.id)),
  }),

  subjects: router({
    list: protectedProcedure.query(() => db.getSubjects()),
    listMySubjects: protectedProcedure.query(({ ctx }) => db.getStudentSubjects(ctx.user.id)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getSubjectById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          numberOfDays: z.number().default(30),
          curriculum: z.string().optional(),
          curriculumUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createSubject({
          name: input.name,
          description: input.description,
          numberOfDays: input.numberOfDays,
          curriculum: input.curriculum,
          curriculumUrl: input.curriculumUrl,
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
          curriculum: z.string().optional(),
          curriculumUrl: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.updateSubject(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSubject(input.id)),
    
    listPermissions: protectedProcedure.query(() => db.getPermissions()),
    grantAccess: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .mutation(({ ctx, input }) => db.createAccessPermission({
        studentId: input.studentId,
        subjectId: input.subjectId,
        hasAccess: 1,
        createdBy: ctx.user.id
      })),
    revokeAccess: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .mutation(({ input }) => db.deleteAccessPermission(input.studentId, input.subjectId)),
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
    listBySubjectAndType: protectedProcedure
      .input(z.object({ subjectId: z.number(), type: z.string() }))
      .query(({ input }) => db.getQuizzesBySubjectAndType(input.subjectId, input.type)),
    listByDay: protectedProcedure
      .input(z.object({ subjectId: z.number(), dayNumber: z.number() }))
      .query(({ input }) => db.getQuizzesBySubjectAndDay(input.subjectId, input.dayNumber)),
    listAll: protectedProcedure.query(() => db.getAllQuizzes()),
    listExams: protectedProcedure.query(() => db.getNonDailyQuizzes()),
    getDailyForLesson: protectedProcedure
      .input(z.object({ subjectId: z.number(), dayNumber: z.number() }))
      .query(({ input }) => db.getDailyQuizByLesson(input.subjectId, input.dayNumber)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getFullQuiz(input.id)),
    getExamsWithStatus: protectedProcedure
      .input(z.object({ quizIds: z.array(z.number()) }))
      .query(({ ctx, input }) => db.getStudentQuizAttempts(ctx.user.id, input.quizIds)),
    listSubmissions: protectedProcedure.query(() => db.getAllSubmissions()),
    getQuizSubmissions: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(({ input }) => db.getSubmissionsByQuiz(input.quizId)),
    getSubmissionDetails: protectedProcedure
      .input(z.object({ studentId: z.number(), quizId: z.number() }))
      .query(({ input }) => db.getDetailedSubmission(input.studentId, input.quizId)),
    gradeAnswer: protectedProcedure
      .input(z.object({
        answerId: z.number(),
        score: z.number(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateStudentAnswer(input.answerId, {
          score: input.score,
          feedback: input.feedback,
          gradedAt: new Date(),
          gradedBy: ctx.user.id
        });
        return { success: true };
      }),
    updateQuizModelAnswer: protectedProcedure
      .input(z.object({
        quizId: z.number(),
        modelAnswerText: z.string().optional(),
        modelAnswerImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateQuiz(input.quizId, {
          modelAnswerText: input.modelAnswerText,
          modelAnswerImageUrl: input.modelAnswerImageUrl,
        });
        return { success: true };
      }),
    publishResults: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateQuiz(input.quizId, {
          resultsPublished: 1
        });
        return { success: true };
      }),
  }),

  discounts: router({
    list: protectedProcedure.query(() => db.getDiscounts()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          discountType: z.enum(["percentage", "fixed"]),
          discountValue: z.number(),
          company: z.string().min(1),
          contactNumber: z.string().optional(),
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
          contactNumber: input.contactNumber,
          imageUrl: input.imageUrl,
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
          contactNumber: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(({ input }) => db.updateDiscount(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDiscount(input.id)),
  }),

  notifications: router({
    getUserNotifications: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserNotifications(input.userId)),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.markNotificationAsRead(input.id)),
  }),

  chat: router({
    ask: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        question: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const access = await db.getStudentSubjectAccess(ctx.user.id, input.subjectId);
        if (!access || access.hasAccess === 0) {
          return {
            answer: "عذراً، لا تملك صلاحية الوصول لهذا المنهج. يرجى الاشتراك في المادة أولاً لتتمكن من سؤال البوت عنها.",
            success: false
          };
        }

        const subject = await db.getSubjectById(input.subjectId);
        if (!subject || (!subject.curriculum && !subject.curriculumUrl)) {
          return {
            answer: "عذراً، لم يتم رفع المنهاج لهذه المادة بعد. سأكون جاهزاً للرد قريباً!",
            success: false
          };
        }

        try {
          let curriculum = subject.curriculum || "";
          if (subject.curriculumUrl) {
            curriculum += `\n(ملاحظة: يتوفر ملف PDF للمنهاج على الرابط: ${subject.curriculumUrl})`;
          }
          const answer = await askGemini(input.question, curriculum);

          await db.createChatMessage({
            studentId: ctx.user.id,
            subjectId: input.subjectId,
            question: input.question,
            answer: answer,
          });

          return {
            answer,
            success: true
          };
        } catch (error) {
          console.error("Chat error:", error);
          return {
            answer: "عذراً، حدث خطأ أثناء محاولة الحصول على إجابة من البوت الذكي. يرجى المحاولة لاحقاً.",
            success: false
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
