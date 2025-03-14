import * as path from "path";
import * as fs from "fs/promises";
import * as vscode from 'vscode';
import { pathToFileURL } from "url";

const REGEX_FOR_SKETCH = /\/\/\s*@sketch:\s*([^\s]+)/i;

async function loadSketchConfig(document: vscode.TextDocument) {
	let currentPath = path.dirname(document.uri.fsPath);

    while (currentPath !== path.parse(currentPath).root) {
        const sketchFolderPath = path.join(currentPath, "sketch");

        try {
            const stat = await fs.stat(sketchFolderPath);
            if (stat.isDirectory()) {
                const configPath = path.join(sketchFolderPath, "sketch.config.js");
                console.log("Trying to load config from:", configPath);

                await fs.access(configPath);

                const fileURL = pathToFileURL(configPath);
                const config = await import(fileURL.href); 

                vscode.window.showInformationMessage(`Loaded sketch config from: ${configPath}`);
                console.log("Sketch Config:", config.default);
                return config.default;
            }
        } catch (error) {
        }

        currentPath = path.dirname(currentPath);
    }

    vscode.window.showErrorMessage("sketch.config.js not found in any parent directories.");
}

export async function activate(context: vscode.ExtensionContext) {
	console.log(vscode.workspace.workspaceFolders)
	console.log('Sketch Programming -- LLM Transpiler extension is now active!');

	let config: any = null;
	let sketchName: string | null = null;

	function updateSketchName(editor: vscode.TextEditor) {
		if (!editor) {
			return;
		}

		const documentText = editor.document.getText();
		const match = documentText.match(REGEX_FOR_SKETCH);

		if (match) {
			sketchName = match[1];
		} else {
			sketchName = null;
		}
	}

	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		if (editor) {
			updateSketchName(editor)
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		if (vscode.window.activeTextEditor && !sketchName) {
			updateSketchName(vscode.window.activeTextEditor);
		}

		if (sketchName) {
			config = await loadSketchConfig(document)
		}
		
		if (config) {
			console.log("Transpiling", sketchName, "with config:", config);
            // TODO: Transpile the sketch using the provided config
		}
	});

	if (vscode.window.activeTextEditor) {
		updateSketchName(vscode.window.activeTextEditor);
	}
}

export function deactivate() {}
