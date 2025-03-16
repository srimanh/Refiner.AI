import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
// import { JsonOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
// import.meta.env.
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// const parser = new JsonOutputParser();

export async function resultCode(problemStatement, fileContent) {
    const safeContent = String(fileContent);

    const prompt = `You are a code evaluator. Analyze the provided code solution against the problem statement and provide detailed feedback.

    PROBLEM STATEMENT:
    ${problemStatement}

    USER'S SOLUTION:
    \`\`\`
    ${safeContent}
    \`\`\`

    Please provide a detailed analysis in the following format:

    1. Test Cases Summary:
       - Number of test cases passed
       - Number of test cases failed
       - Overall pass rate

    2. Code Analysis:
       - Correctness of the solution
       - Time complexity
       - Space complexity
       - Code quality and readability

    3. Detailed Feedback:
       - What works well
       - Areas for improvement
       - Suggestions for optimization

    4. Final Verdict:
       - Whether the solution fully meets the requirements
       - Any edge cases that might not be handled
       - Recommendations for further improvements

    Please be specific and constructive in your feedback.`;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        return {
            analysis: response.text.trim()
        };
    } catch (error) {
        console.error("Error in resultCode:", error);
        throw new Error("Failed to evaluate code: " + error.message);
    }
}

