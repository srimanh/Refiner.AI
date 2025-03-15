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

export async function analyzeCode(fileContent,file_name) {
    // Convert fileContent to a string to ensure correct interpolation
    const safeContent = String(fileContent);

    const prompt = `You are CodeEd Assistant, an educational code improvement tool for React developers. Analyze this React code to help the developer improve their skills.

                    FILE: ${file_name}

                    CODE:
                    \`\`\`
                    ${safeContent}
                    \`\`\`

                    Please provide:

                    1. PURPOSE IDENTIFICATION
                    - Identify the primary purpose of this component/file
                    - Note the main React concepts being used

                    
                    2. Provide a structured analysis with these sections:
                    a) Code Quality Assessment (1-5 scale with explanation)
                    b) React Best Practices Review
                    c) Performance Considerations
                    d) Accessibility Concerns
                    e) Modern React Patterns that could be applied
                    
                    3. DETAILED ANALYSIS
                    For each issue or improvement opportunity:
                    a) WHAT: Clearly describe what could be improved
                    b) WHY: Explain the underlying React concepts and why this matters
                    c) HOW: Provide a specific code example showing the improvement
                    d) INDUSTRY CONTEXT: Connect this to professional development standards

                    4. KEY AREAS TO COVER:
                    - Component structure and organization
                    - State management approaches
                    - Props handling and validation
                    - Performance optimization
                    - React hooks usage
                    - JSX best practices
                    - Accessibility considerations
                    - Modern React patterns

                    5. LEARNING RESOURCES
                    Suggest 3 specific resources (articles, documentation, videos) that address the main improvement areas identified.
                    
                    RESPONSE FORMAT:
                    - Use markdown formatting
                    - Highlight code snippets appropriately
                    - Keep explanations clear and accessible
                    - Balance depth of analysis with approachability`

    // Construct a more specific prompt that asks for JSON response
    // const prompt = `
    // Please analyze and correct the following code, focusing on syntax errors, best practices, and potential improvements.
    // Return the response in the following JSON format:
    // {
    //     "code": "the corrected code here"
    // }

    // Here's the code to analyze:
    // \`\`\`
    // ${safeContent}
    // \`\`\`
    // `;

    try {
        const response = await model.call([{ role: "user", content: prompt }]);
        
        // Try to parse the response text as JSON
        try {
            // First, try to find JSON in the response
            // const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            // if (jsonMatch) {
            //     const jsonStr = jsonMatch[0];
            //     const parsed = JSON.parse(jsonStr);
            //     if (parsed && parsed.code) {
            //         return parsed;
            //     }
            // }
            
            // If no valid JSON found, wrap the entire response in a code property
            return {
                analysis: response.text.trim()
            };
        } catch (parseError) {
            // If JSON parsing fails, return the raw text as code
            return {
                code: response.text.trim()
            };
        }
    } catch (error) {
        console.error("Error in getCorrectedCode:", error);
        throw new Error("Failed to get corrected code: " + error.message);
    }
}

