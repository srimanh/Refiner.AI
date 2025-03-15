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

export async function analyzeCode(fileContent) {
    const safeContent = String(fileContent);

    const prompt = `
    Please analyze the following code and provide a detailed code review in a blog post format.
    Return the response in the following JSON format:
    {
        "analysis": {
            "title": "Code Analysis Report",
            "overview": "A brief overview of the code",
            "codeQuality": {
                "strengths": ["List of code strengths"],
                "weaknesses": ["List of areas that need improvement"]
            },
            "suggestions": ["List of specific suggestions for improvement"],
            "bestPractices": {
                "followed": ["List of best practices followed"],
                "missing": ["List of best practices that should be implemented"]
            },
            "securityConcerns": ["List of security concerns if any"],
            "performance": {
                "issues": ["List of performance issues"],
                "recommendations": ["List of performance improvement recommendations"]
            },
            "conclusion": "Overall conclusion and summary of recommendations"
        }
    }

    Here's the code to analyze:
    \`\`\`
    ${safeContent}
    \`\`\`
    `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        try {
            // First, try to find JSON in the response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.analysis) {
                    return parsed;
                }
            }
            
            // If no valid JSON found, create a structured response from the text
            return {
                analysis: {
                    title: "Code Analysis Report",
                    overview: response.text.trim(),
                    codeQuality: {
                        strengths: [],
                        weaknesses: []
                    },
                    suggestions: [],
                    bestPractices: {
                        followed: [],
                        missing: []
                    },
                    securityConcerns: [],
                    performance: {
                        issues: [],
                        recommendations: []
                    },
                    conclusion: "Analysis completed. See overview for details."
                }
            };
        } catch (parseError) {
            // If JSON parsing fails, return a structured response with the raw text
            return {
                analysis: {
                    title: "Code Analysis Report",
                    overview: response.text.trim(),
                    codeQuality: {
                        strengths: [],
                        weaknesses: []
                    },
                    suggestions: [],
                    bestPractices: {
                        followed: [],
                        missing: []
                    },
                    securityConcerns: [],
                    performance: {
                        issues: [],
                        recommendations: []
                    },
                    conclusion: "Unable to parse detailed analysis. See overview for available information."
                }
            };
        }
    } catch (error) {
        console.error("Error in analyzeCode:", error);
        throw new Error("Failed to analyze code: " + error.message);
    }
}

