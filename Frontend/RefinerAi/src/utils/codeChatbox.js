import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    temperature: 0.7,
    maxOutputTokens: 2048,
});

export async function generateChatbot(analysisContent, chatHistory) {
    if (!analysisContent) {
        throw new Error("No analysis content provided");
    }

    // Format chat history for context
    const formattedHistory = chatHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

    const systemPrompt = `
    You are an expert code assistant that helps developers understand and improve their code.
    You have access to the following code analysis that you should use to provide accurate and helpful responses.
    
    CODE ANALYSIS:
    ${analysisContent}

    PREVIOUS CONVERSATION:
    ${formattedHistory}

    Please provide clear, concise, and technically accurate responses. You can:
    1. Explain code concepts and patterns
    2. Suggest improvements and best practices
    3. Help debug issues
    4. Answer questions about the code structure
    5. Provide examples when relevant

    Keep your responses focused and professional. If you're unsure about something, say so.
    Format code snippets with appropriate markdown.
    `;

    try {
        // Get the last user message
        const lastUserMessage = chatHistory[chatHistory.length - 1]?.content || '';

        const response = await model.call([
            { role: "system", content: systemPrompt },
            { role: "user", content: lastUserMessage }
        ]);

        // Clean and format the response
        let formattedResponse = response.text
            .trim()
            .replace(/^(Assistant:|Bot:|A:)/i, '')
            .trim();

        // If the response is too short, add more context
        if (formattedResponse.length < 20) {
            formattedResponse += "\n\nIs there anything specific about the code you'd like me to explain further?";
        }

        return formattedResponse;

    } catch (error) {
        console.error("Error in chatbot response:", error);
        throw new Error("Failed to generate response: " + error.message);
    }
}

