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
        // إنشاء openId فريد للمستخدم الجديد
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
        })
      )
      .mutation(({ ctx, input }) =>
        db.createSubject({
          name: input.name,
          description: input.description,
          numberOfDays: input.numberOfDays,
          curriculum: input.curriculum,
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
    
    // الحصول على الاختبارات مع حالة الطالب
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

    submit: protectedProcedure
      .input(z.object({
        quizId: z.number(),
        answers: z.array(z.object({
          questionId: z.number(),
          selectedOptionId: z.number().optional(),
          textAnswer: z.string().optional(),
          imageUrl: z.string().optional(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const fullQuiz = await db.getFullQuiz(input.quizId);
        if (!fullQuiz) throw new Error("Quiz not found");

        let correctAnswers = 0;
        let isAutoGradable = true;

        for (const answer of input.answers) {
          const question = fullQuiz.questions.find(q => q.id === answer.questionId);
          let score = null;

          if (question?.questionType === "multiple_choice") {
            const correctOption = question.options.find(o => o.isCorrect === 1);
            if (correctOption && correctOption.id === answer.selectedOptionId) {
              correctAnswers++;
              score = 1;
            } else {
              score = 0;
            }
          } else {
            isAutoGradable = false;
          }

          await db.createStudentAnswer({
            quizId: input.quizId,
            studentId: ctx.user.id,
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId,
            textAnswer: answer.textAnswer,
            imageUrl: answer.imageUrl,
            score: score
          });
        }

        const quizType = fullQuiz.type;
        if (isAutoGradable && quizType === "daily") {
          const totalQuestions = fullQuiz.questions.length;
          const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
          return {
            score: finalScore,
            totalQuestions,
            correctAnswers,
            status: "graded"
          };
        }

        return {
          status: "pending_manual_grading"
        };
      }),

    getUserResults: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        const quiz = await db.getQuizById(input.quizId);
        if (!quiz) return null;
        
        // Only return results if they are published (for monthly/semester) or if it's a daily quiz
        if (quiz.type !== "daily" && quiz.resultsPublished === 0) {
          return { status: "not_published" };
        }

        const answers = await db.getStudentAnswers(ctx.user.id, input.quizId);
        return { 
          status: "published",
          answers,
          modelAnswerText: quiz.modelAnswerText,
          modelAnswerImageUrl: quiz.modelAnswerImageUrl
        };
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          subjectId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          type: z.enum(["daily", "monthly", "semester"]),
          dayNumber: z.number().optional(),
          questions: z.array(z.object({
            question: z.string(),
            questionType: z.enum(["multiple_choice", "short_answer", "essay"]),
            correctAnswerText: z.string().optional(),
            correctAnswerImageUrl: z.string().optional(),
            options: z.array(z.object({
              text: z.string(),
              isCorrect: z.boolean(),
            })).optional(),
          })).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const quizId = await db.createQuiz({
          subjectId: input.subjectId,
          title: input.title,
          description: input.description,
          type: input.type,
          dayNumber: input.dayNumber,
          createdBy: ctx.user.id,
        });

        if (input.questions) {
          for (const [qIdx, q] of input.questions.entries()) {
            const questionId = await db.createQuizQuestion({
              quizId: Number(quizId),
              question: q.question,
              questionType: q.questionType,
              correctAnswerText: q.correctAnswerText,
              correctAnswerImageUrl: q.correctAnswerImageUrl,
              order: qIdx + 1,
            });

            if (q.questionType === "multiple_choice" && q.options) {
              for (const [oIdx, opt] of q.options.entries()) {
                await db.createQuizOption({
                  questionId: Number(questionId),
                  text: opt.text,
                  isCorrect: opt.isCorrect ? 1 : 0,
                  order: oIdx + 1,
                });
              }
            }
          }
        }
        return { quizId };
      }),
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
        if (!subject || !subject.curriculum) {
          return {
            answer: "عذراً، لم يتم رفع المنهاج لهذه المادة بعد. سأكون جاهزاً للرد قريباً!",
            success: false
          };
        }

        try {
          const answer = await askGemini(input.question, subject.curriculum);

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
