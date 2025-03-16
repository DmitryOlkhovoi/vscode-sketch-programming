import OpenAI from "openai";
import { APIPromise, PagePromise } from "openai/core.mjs";
import { VectorStore } from "openai/resources/index.mjs";
import fs from "fs";

class Storage {
    private openAiClient: OpenAI;
    private vectorStoreName: string;

    constructor(vectorStoreName: string, openAIclient: OpenAI) {
        this.openAiClient = openAIclient;
        this.vectorStoreName = vectorStoreName;
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

    getListOfFiles(): PagePromise<OpenAI.Files.FileObjectsPage, OpenAI.Files.FileObject> {
      return this.openAiClient.files.list();
    }

    addFileToVectorStore(fileId: string): APIPromise<OpenAI.VectorStores.Files.VectorStoreFile> {
        return this.openAiClient.vectorStores.files.create(
            this.vectorStoreName,
            {
                file_id: fileId,
            }
        );
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
      return this.openAiClient.vectorStores.files.list(this.vectorStoreName);
    }
}

export default Storage;