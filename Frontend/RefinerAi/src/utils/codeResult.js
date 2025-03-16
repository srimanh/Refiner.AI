// src/utils/codeResult.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import mcp from "./mcp";
import dotenv from "dotenv";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const parser = new JsonOutputParser();

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function resultCode(problemStatement, fileContent) {
    const safeContent = String(fileContent);
    
    // Get prompt from MCP
    const prompt = mcp.getPrompt("resultCode", {
        problemStatement: problemStatement,
        code: safeContent
    });

    try {
        const response = await model.call([{ role: "user", content: prompt }]);

        const parsedResponse = await parser.parse(response.text);
        
        return {
            analysis: parsedResponse
        };
    } catch (error) {
        console.error("Error in resultCode:", error);
        throw new Error("Failed to evaluate code: " + error.message);
    }
}