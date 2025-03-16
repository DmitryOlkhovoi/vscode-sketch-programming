import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

class ProjectInit {
    constructor() {}

    private isDirectoryEmpty(directory: string): boolean {
        try {
            const files = fs.readdirSync(directory);
            return files.length === 0;
        } catch (error) {
            return true; // If directory doesn't exist, consider it empty
        }
    }

    copyExampleProjectFiles() {
        const extensionPath = vscode.extensions.getExtension('sketch-programming.sketch-programming-llm-transpiler')?.extensionPath;
        
        if (!extensionPath) {
            vscode.window.showErrorMessage('Sketch-programming Extension: Unable to find extension path');
            return;
        }

        const skeletonPath = path.join(extensionPath, 'src', '_skeleton');
        const projectPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!projectPath) {
            vscode.window.showErrorMessage('Sketch-programming Extension: No workspace folder found');
            return;
        }

        try {
            if (this.isDirectoryEmpty(path.join(projectPath, 'sketch'))) {
                this.copyFolderRecursiveSync(skeletonPath, projectPath);
                vscode.window.showInformationMessage('Sketch-programming Extension: Project files copied successfully');
                return true;
            } else {
                vscode.window.showInformationMessage('Sketch-programming Extension: Project files already exist');
                return false;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Sketch-programming Extension: Failed to copy example files: ${error}`);
            return false;
        }
    }

    private copyFolderRecursiveSync(source: string, target: string) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target);
        }

        const files = fs.readdirSync(source);

        files.forEach((file) => {
            const currentSource = path.join(source, file);
            const currentTarget = path.join(target, file);

            if (fs.lstatSync(currentSource).isDirectory()) {
                this.copyFolderRecursiveSync(currentSource, currentTarget);
            } else {
                fs.copyFileSync(currentSource, currentTarget);
            }
        });
    }
}

export default ProjectInit;