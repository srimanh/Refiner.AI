import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
// import.meta.env.
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash-latest",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const parser = new JsonOutputParser();

export async function getCorrectedCode(fileContent) {
    // Convert fileContent to a string to ensure correct interpolation
    const safeContent = String(fileContent);

    // Construct the prompt
    const prompt = `I have the following code:\n${safeContent}\nI want you to correct the syntax. Return the corrected code in JSON format.`;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        const correctedCode = await parser.parse(response.text); 
        return correctedCode; // Return the corrected code
    } catch (error) {
        console.error("Error in getCorrectedCode:", error);
        return "Error in getting corrected code.";
    }
}

