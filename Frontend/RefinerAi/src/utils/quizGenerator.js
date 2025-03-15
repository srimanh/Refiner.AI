import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
// import.meta.env.
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const parser = new JsonOutputParser();

export async function generateQuiz(analysisContent) {
    if (!analysisContent) {
        throw new Error("No analysis content provided");
    }

    const prompt = `
    You are an educational quiz creator. Based on the following code analysis blog content, create 5 multiple-choice questions.
    The questions should test understanding of the key concepts, best practices, and improvements discussed in the analysis.

    Blog Content:
    ${analysisContent}

    Create a quiz in the following JSON format:
    {
        "quizzes": [
            {
                "question": "Specific question about the code analysis",
                "options": [
                    "First option",
                    "Second option",
                    "Third option",
                    "Fourth option"
                ],
                "correctAnswer": "The exact text of the correct option",
                "explanation": "Explanation why this answer is correct"
            }
        ]
    }

    Requirements:
    1. Questions should be directly related to the content in the analysis
    2. Each question must have exactly 4 options
    3. The correctAnswer must match exactly one of the options
    4. Include questions about:
       - Code quality points mentioned
       - Best practices discussed
       - Specific improvements suggested
       - Performance considerations
       - React concepts covered
    5. Make sure questions test understanding, not just memory
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.quizzes) {
                    return parsed;
                }
            }
            
            // If no valid JSON found, create a structured response
            return {
                quizzes: [{
                    question: "What is the main focus of this code analysis?",
                    options: [
                        "Code quality and best practices",
                        "Database optimization",
                        "Network security",
                        "UI design patterns"
                    ],
                    correctAnswer: "Code quality and best practices",
                    explanation: "The analysis primarily focuses on code quality, React best practices, and potential improvements."
                }]
            };
        } catch (parseError) {
            console.error("Error parsing quiz response:", parseError);
            throw new Error("Failed to generate quiz from analysis");
        }
    } catch (error) {
        console.error("Error in generateQuiz:", error);
        throw new Error("Failed to generate quiz: " + error.message);
    }
}

