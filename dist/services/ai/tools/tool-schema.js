export class ToolSchemaConverter {
    static toResponsesAPI(chatCompletionTool) {
        return {
            type: "function",
            name: chatCompletionTool.function.name,
            description: chatCompletionTool.function.description,
            parameters: chatCompletionTool.function.parameters,
        };
    }
    static toAnthropic(chatCompletionTool) {
        return {
            name: chatCompletionTool.function.name,
            description: chatCompletionTool.function.description,
            input_schema: chatCompletionTool.function.parameters,
        };
    }
    static fromChatCompletion(tool) {
        return {
            chatCompletion: tool,
            responsesAPI: this.toResponsesAPI(tool),
            anthropic: this.toAnthropic(tool),
        };
    }
}
