import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";
import { pathToFileURL } from "url";

class Workspace {
    assistant: any
    storage: any;
    config: any

    public root: string;
    public isReady: boolean = false;

    constructor (root: string) {
        this.root = root;
    }

    initialize() {
       return this.loadSketchConfig();
    }

    async loadSketchConfig() {
        try {
            console.log("Loading sketch config...");
            const configPath = path.join(this.root, "sketch", "sketch.config.js");

            await fs.access(configPath);

            const fileURL = pathToFileURL(configPath);
            const config = await import(fileURL.href); 

            this.config = config.default;
            this.isReady = true;
        } catch (error) {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: ${this.root} - Error loading sketch config`);
            console.error(error, this.root);
        }
    }

    async transpile(content: string) {
        console.log("Transpiling...", this.config);
    }
}

export default Workspace;