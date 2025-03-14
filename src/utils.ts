import * as path from "path";
import * as fs from "fs/promises";

export async function findSketchProjectRoot(filePath: string): Promise<string | undefined> {
     let currentPath = path.dirname(filePath);

    while (currentPath !== path.parse(currentPath).root) {
        const sketchFolderPath = path.join(currentPath, "sketch");

        try {
            const stat = await fs.stat(sketchFolderPath);
            
            if (stat.isDirectory()) {
                const configPath = path.join(sketchFolderPath, "sketch.config.js");

                await fs.access(configPath);

                return currentPath;
            }
        } catch (_) {
            // Continue searching upwards
        }

        currentPath = path.dirname(currentPath);
    }
}