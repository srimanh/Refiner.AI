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

export async function generateCodePractice(analysisContent) {
    if (!analysisContent) {
        throw new Error("No analysis content provided");
    }

    const prompt = `
    You are a code practice creator. Based on the following code analysis, create a coding practice problem that helps users understand and implement the concepts discussed in the analysis.

    Code Analysis:
    ${analysisContent}

    Create a practice problem in the following JSON format:
    {
        "problemStatement": "A clear description of the problem to solve",
        "requirements": [
            "List of specific requirements for the solution"
        ],
        "hints": [
            "List of helpful hints to guide the user"
        ],
        "testCases": [
            {
                "input": "Sample input",
                "output": "Expected output",
                "explanation": "Explanation of why this is correct"
            }
        ],
        "difficulty": "easy/medium/hard",
        "timeLimit": "Estimated time to solve in minutes"
    }

    Make sure the problem:
    1. Is directly related to the concepts in the code analysis
    2. Has clear and specific requirements
    3. Includes multiple test cases for validation
    4. Provides helpful hints without giving away the solution
    5. Has appropriate difficulty level based on the analysis
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        console.log('Model response:', response.text);
        
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('Extracted JSON:', jsonStr);
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.problemStatement) {
                    return parsed;
                }
            }
            
            // Fallback response if JSON parsing fails
            return {
                problemStatement: "Implement a function that demonstrates the main concepts from the code analysis",
                requirements: [
                    "Follow the best practices shown in the analysis",
                    "Include proper error handling",
                    "Add comments explaining the implementation"
                ],
                hints: [
                    "Review the code analysis for relevant patterns",
                    "Consider edge cases",
                    "Think about code organization"
                ],
                testCases: [
                    {
                        input: "Sample input",
                        output: "Expected output",
                        explanation: "This test case validates the basic functionality"
                    }
                ],
                difficulty: "medium",
                timeLimit: "30"
            };
        } catch (parseError) {
            console.error("Error parsing practice problem response:", parseError);
            throw new Error("Failed to generate practice problem");
        }
    } catch (error) {
        console.error("Error in generateCodePractice:", error);
        throw new Error("Failed to generate practice problem: " + error.message);
    }
}

