import OpenAI from "openai";
import { APIPromise, PagePromise } from "openai/core.mjs";
import { VectorStore } from "openai/resources/index.mjs";
import fs from "fs";
import path from "path";

class Storage {
    private root: string;
    private openAiClient: OpenAI;
    private vectorStoreName: string;
    private vectorStoreId: string | null = null;
    isReady: boolean = false;

    constructor(root: string, vectorStoreName: string, openAIclient: OpenAI) {
      this.root = root;
      this.openAiClient = openAIclient;
      this.vectorStoreName = vectorStoreName;
    }

    async initialize(): Promise<void> {
      this.vectorStoreId = await this.getVectorStoreId();

      if (!this.vectorStoreId) {
        throw new Error(`Vector store "${this.vectorStoreName}" not found.`);
      }

      this.isReady = true;
    }

   async uploadFile(filePath: string): Promise<string> {
        let result;

        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
          // Download the file content from the URL
          const res = await fetch(filePath);
          const buffer = await res.arrayBuffer();
          
          const urlParts = filePath.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const file = new File([new Blob([buffer])], fileName, { lastModified: Date.now() });
          
          result = await this.openAiClient.files.create({
            file,
            purpose: "assistants",
          });
        } else {
          // Handle local file path
          const fileContent = fs.createReadStream(filePath);

          result = await this.openAiClient.files.create({
            file: fileContent,
            purpose: "assistants",
          });
        }

        return result.id;
    }

    removeFile(fileId: string): APIPromise<OpenAI.Files.FileDeleted> {
      return this.openAiClient.files.del(fileId);
    }

    removeFileFromVectorStore(fileId: string): APIPromise<OpenAI.VectorStores.Files.VectorStoreFileDeleted> {
      if (this.vectorStoreId) {
        return this.openAiClient.vectorStores.files.del(this.vectorStoreId, fileId);
      } else {
        throw new Error("No vector store selected");
      }
    }

    getListOfFiles(): PagePromise<OpenAI.Files.FileObjectsPage, OpenAI.Files.FileObject> {
      return this.openAiClient.files.list();
    }

    addFileToVectorStore(fileId: string): APIPromise<OpenAI.VectorStores.Files.VectorStoreFile> {
      if (this.vectorStoreId) {
        return this.openAiClient.vectorStores.files.create(
          this.vectorStoreId,
          {
              file_id: fileId,
          }
      );
      } else {
        throw new Error("No vector store selected");
      }
    }

    createNewVectorStore(name: string): APIPromise<VectorStore> {
      return this.openAiClient.vectorStores.create({
          name,
      });
    }

    getListOfVectorStores(): PagePromise<OpenAI.VectorStores.VectorStoresPage, OpenAI.VectorStores.VectorStore> {
      return this.openAiClient.vectorStores.list();
    }

    async hasVectorStore(name: string): Promise<boolean> {
      const stores = await this.getListOfVectorStores();
      return stores.data.some((store) => store.name === name);
    }

    getListOfFilesInStore(): PagePromise<OpenAI.VectorStores.Files.VectorStoreFilesPage, OpenAI.VectorStores.Files.VectorStoreFile> {
      if (this.vectorStoreId) {
        return this.openAiClient.vectorStores.files.list(this.vectorStoreId);
      } else {
        throw new Error("No vector store selected");
      }
    }

    getVectorStoreId() {
      return this.getListOfVectorStores().then(stores => {
        const vectorStore = stores.data.find(store => store.name === this.vectorStoreName);
        
        if (vectorStore) {
            return vectorStore.id;
        } else {
            throw new Error(`Vector store "${this.vectorStoreName}" not found`);
        }
      })
    }

    // TODO track if files were modifed and update accordingly (or removed).
    async uploadSketches(): Promise<string[]> {
      const folderPath = path.join(this.root, 'sketch', 'sketches');

      // Ensure folder path exists
      if (!fs.existsSync(folderPath)) {
          throw new Error(`Folder ${folderPath} does not exist`);
      }
  
      // Get current files in vector store and OpenAI files
      const existingVectorFiles = await this.getListOfFilesInStore();
      const existingFiles = await this.getListOfFiles();
      
      // Create maps for quick lookup
      const vectorFileIdSet = new Set<string>(); // Set of file_ids in vector store
      const fileMap = new Map<string, string>(); // filename -> file_id
      
      existingVectorFiles.data.forEach(file => {
          vectorFileIdSet.add(file.id);
      });
      
      existingFiles.data.forEach(file => {
          fileMap.set(file.filename, file.id);
      });
  
      const uploadedFileIds: string[] = [];
      const files = fs.readdirSync(folderPath);
  
      for (const filename of files) {
          const fullPath = `${folderPath}/${filename}`;
          
          // Skip if not a file
          if (!fs.statSync(fullPath).isFile()) {
              continue;
          }
  
          const existingFileId = fileMap.get(filename);
          
          try {
              // If file exists in OpenAI files
              if (existingFileId) {
                  // If it's also in vector store, remove it first
                  if (vectorFileIdSet.has(existingFileId)) {
                    await this.removeFileFromVectorStore(existingFileId);
                  }
                  // Remove from files
                  await this.removeFile(existingFileId);
              }
  
              // Upload the new version
              const newFileId = await this.uploadFile(fullPath);
              // Add to vector store
              await this.addFileToVectorStore(newFileId);
              
              uploadedFileIds.push(newFileId);
          } catch (error) {
              console.error(`Error processing file ${filename}:`, error);
              continue;
          }
      }
  
      return uploadedFileIds;
  }
}

export default Storage;