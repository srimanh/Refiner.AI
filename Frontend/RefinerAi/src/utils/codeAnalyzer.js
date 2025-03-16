// src/utils/codeAnalyzer.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
const parser = new JsonOutputParser();


import mcp from "./mcp";

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function analyzeCode(code, language = 'javascript') {
    if (!code || code.trim() === '') {
        throw new Error("Code input is empty");
    }

    // Get prompt from MCP
    const prompt = mcp.getPrompt("analyzeCode", {
        code: code,
        language: language
    });

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        const parsedResponse = await parser.parse(response.text);
        return {
            analysis: parsedResponse
        };
    } catch (error) {
        console.error("Error in analyzeCode:", error);
        throw new Error("Failed to analyze code: " + error.message);
    }
}