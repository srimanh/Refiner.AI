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

export async function getCorrectedCode(fileContent) {
    // Convert fileContent to a string to ensure correct interpolation
    const safeContent = String(fileContent);

    // Construct a more specific prompt that asks for JSON response
    const prompt = `
    Please analyze and correct the following code, focusing on syntax errors, best practices, and potential improvements.
    Return the response in the following JSON format:
    {
        "code": "the corrected code here",
        "analysis": "A detailed analysis of the code, including:
        1. Main concepts and patterns used
        2. Potential improvements
        3. Best practices demonstrated
        4. Areas for learning and practice"
    }

    Here's the code to analyze:
    \`\`\`
    ${safeContent}
    \`\`\`
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        // Try to parse the response text as JSON
        try {
            // First, try to find JSON in the response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.code) {
                    return parsed;
                }
            }
            
            // If no valid JSON found, wrap the entire response in a code property
            return {
                code: response.text.trim(),
                analysis: "Code analysis not available in the expected format."
            };
        } catch (parseError) {
            // If JSON parsing fails, return the raw text as code
            return {
                code: response.text.trim(),
                analysis: "Code analysis not available in the expected format."
            };
        }
    } catch (error) {
        console.error("Error in getCorrectedCode:", error);
        throw new Error("Failed to get corrected code: " + error.message);
    }
}

