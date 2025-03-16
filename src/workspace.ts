import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";
import { pathToFileURL } from "url";
import OpenAI from 'openai';
import Storage from './storage';
import { Config } from './types';
import Assistant from './assistant';
import { AssistantCreateParams } from 'openai/resources/beta/assistants.mjs';

class Workspace {
    private openAiClient: OpenAI | null = null;
    assistant: Assistant | null = null;
    storage: Storage | null = null;
    config: Config | null = null;

    public root: string;

    constructor (root: string) {
        this.root = root;
    }

    async initialize() {
        await this.loadSketchConfig();
        
        if (this.config) {
            this.openAiClient = new OpenAI({ apiKey: this.config.openAIApiKey });
            this.assistant = new Assistant(this.config.assistantName || this.config.projectId, this.openAiClient);
            this.storage = new Storage(this.root, this.config.vectorStoreName || this.config.projectId, this.openAiClient);
            
            await this.storage.initialize();
            await this.assistant.intialize();
        }
    }

    async loadSketchConfig() {
        try {
            const configPath = path.join(this.root, "sketch", "sketch.config.js");

            await fs.access(configPath);

            const fileURL = pathToFileURL(configPath);
            const config = await import(fileURL.href); 

            this.config = config.default;
        } catch (error) {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: ${this.root} - Error loading sketch config`);
        }
    }

    async transpile(content: string) {
        if (this.assistant && this.assistant.isReady) {
            console.log(`transpiling workspaces...`);
            return this.assistant.transpile(content);
        } else {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: Assistant not ready for transpilation.`);
        }
    }

    async hasAssistant(name: string): Promise<boolean> {
        if (this.openAiClient) {
            return Assistant.hasAssistant(name, this.openAiClient);
        } else {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: (hasAssistant) OpenAI client not available.`);
            throw new Error('OpenAI client not available.');
        }
    }

    async createAssistant(name: string, vectorStoreId: string, config: AssistantCreateParams | null) {
        if (this.openAiClient) {
            return Assistant.createAssistant(name, vectorStoreId, config, this.openAiClient);
        } else {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: (createAssistant) OpenAI client not available.`);
            throw new Error('OpenAI client not available.');
        }
    }

    getFileExtensionFromContent(content: string): string | null {
        const extMatch = content.match(/@ext:(\w+)/);
        return extMatch ? extMatch[1] : 'no@ext';
    }

    saveFile(document: vscode.TextDocument, content: string) {
        const normalizedPath = path.normalize(document.uri.fsPath.replace(this.root, '').replace(/[/\\]sketch/g, ''));
        const filePath = path.join(this.root, `${normalizedPath}.${this.getFileExtensionFromContent(document.getText())}`);
        console.log(`Sketch-programming Workspace: Saving file ${filePath}`);

        fs.mkdir(path.dirname(filePath), { recursive: true })
        fs.writeFile(filePath, content);
    }
}

export default Workspace;