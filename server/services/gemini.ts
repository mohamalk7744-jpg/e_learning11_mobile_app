import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const client = new GoogleGenAI(apiKey);

export async function askGemini(question: string, curriculum: string = ""): Promise<string> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = curriculum
      ? `You are an educational assistant helping students learn from the curriculum: ${curriculum}. Answer questions clearly and educationally in Arabic.`
      : "You are an educational assistant helping students learn. Answer questions clearly and educationally in Arabic.";

    const message = `${systemPrompt}\n\nStudent question: ${question}`;

    const result = await model.generateContent(message);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get response from Gemini AI");
  }
}

export async function generateLessonSummary(
  lessonContent: string,
  subject: string
): Promise<string> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Please summarize the following ${subject} lesson in Arabic. Make it concise and educational:

${lessonContent}

Provide a summary in 3-4 paragraphs.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate lesson summary");
  }
}

export async function generateQuizQuestions(
  lessonContent: string,
  subject: string,
  count: number = 5
): Promise<string[]> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate ${count} multiple choice questions in Arabic based on the following ${subject} lesson:

${lessonContent}

Format each question as:
Q: [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the questions from the response
    const questions = text.split("\n\nQ:").filter((q: string) => q.trim());

    return questions.map((q: string) => "Q:" + q);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate quiz questions");
  }
}
