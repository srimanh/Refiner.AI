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

export async function analyzeCode(fileContent, fileName = 'untitled') {
    const safeContent = String(fileContent);

    const prompt = `You are CodeEd Assistant, an educational code improvement tool for React developers. 
    Analyze this React code and provide a detailed analysis in markdown format.

    FILE: ${fileName}

    CODE:
    \`\`\`
    ${safeContent}
    \`\`\`

    Provide your analysis in the following format using markdown:

    # Code Analysis Report

    ## Purpose and Overview
    [Describe the primary purpose of the component/file and main React concepts used]

    ## Code Quality Assessment
    - Score: [1-5]
    - Explanation: [Why this score was given]

    ### Strengths
    - [List strengths]

    ### Areas for Improvement
    - [List areas needing improvement]

    ## React Best Practices
    ### Followed
    - [List practices followed]

    ### Missing
    - [List practices that should be implemented]

    ## Performance Considerations
    - [List performance issues and recommendations]

    ## Accessibility
    - [List accessibility concerns and improvements]

    ## Modern React Patterns
    - [List patterns that could be applied]

    ## Detailed Recommendations
    [For each major issue:]
    1. **Issue**: [Description]
    - Why it matters: [Explanation]
    - How to fix: [Code example]
    - Industry context: [Best practices context]

    ## Learning Resources
    1. [Resource name](url) - [Why it's relevant]
    2. [Resource name](url) - [Why it's relevant]
    3. [Resource name](url) - [Why it's relevant]

    ## Conclusion
    [Summary of key points and main recommendations]

    Make sure to:
    1. Use proper markdown formatting
    2. Include code examples where relevant
    3. Be specific and actionable in recommendations
    4. Keep explanations clear and educational`;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        return {
            analysis: response.text.trim()
        };
    } catch (error) {
        console.error("Error in analyzeCode:", error);
        throw new Error("Failed to analyze code: " + error.message);
    }
}

