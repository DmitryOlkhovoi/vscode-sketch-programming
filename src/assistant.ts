import * as vscode from 'vscode';
import OpenAI from "openai";

class Assistant {
    private id: string | null = null;
    private name: string;
    private openAiClient: OpenAI;
    isReady: boolean = false;

    constructor(name: string, openAiClient: OpenAI) {
        this.name = name;
        this.openAiClient = openAiClient;
    }

    async intialize() {
        this.id = await this.findInselfId()
        
        if (this.id) {
            this.isReady = true;
        }
    }

    private async findInselfId(): Promise<string | null> {
        const assistants = await this.openAiClient.beta.assistants.list();

        return assistants.data.find((assistant) => assistant.name === this.name)?.id || null;
    }

    private createThread(content: string) {
        return this.openAiClient.beta.threads.create({
            messages: [
              {
                role: "user",
                content,
              },
            ],
        });
    }

    private async runThreadAndGetResponse(threadId: string): Promise<string> {
        const run = await this.openAiClient.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: this.id!,
        });

        const messages = await this.openAiClient.beta.threads.messages.list(threadId, {
            run_id: run.id,
        });

        const message = messages.data.pop()!;

        if (message.content[0].type === "text") {
            const { text } = message.content[0];

            return JSON.parse(text.value).transpiled_code;
        }

        return "Error: Could not transpile the code.";
    }

    async transpile(content: string) {
        if (this.isReady) {
            console.log(`transpiling assistan...`);
            const thread = await this.createThread(content);
            return this.runThreadAndGetResponse(thread.id);
        } else {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: Assistant '${this.name}' not found.`);
        }
    }
}

export default Assistant;