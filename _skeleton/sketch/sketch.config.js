module.exports = {
    openAIApiKey: 'YOUR_OPENAI_API_KEY',
    projectId: 'foo-bar',
    assistanName: 'foo-bar', // By default, the assistant name is the same as the project ID
    vectorStoreName: 'foo-bar', // By default, the vector store name is the same as the project ID,
    assistantCreateParams: null
    // This is default configuration for creating a new assistant. You can customize it according to your needs.
    // "name": name,
    //     "description": 'Sketch assistant for transpiling metacode to actual code.',
    //     "model": "gpt-4o",
    //     "instructions": "You are a transpiler, you get file with @sketch:sketch_name tag in the content.\nYou have files describing how to transpile metacode to actual code. \nAnswer the code in the json field \"transpiledCode\" without any additional text. Do not wrap code in any formatting.",
    //     "tools": [
    //         {
    //             "type": "code_interpreter"
    //         },
    //         {
    //             "type": "file_search",
    //             "file_search": {
    //                 "ranking_options": {
    //                     "ranker": "default_2024_08_21",
    //                     "score_threshold": 0
    //                 }
    //             }
    //         }
    //     ],
    //     "top_p": 1,
    //     "temperature": 1,
    //     "tool_resources": {
    //         "file_search": {
    //             "vector_store_ids": [
    //                 vectorStoreId
    //             ]
    //         },
    //         "code_interpreter": {
    //             "file_ids": []
    //         }
    //     },
    //     "response_format": {
    //         "type": "json_schema",
    //         "json_schema": {
    //             "name": "transpiled_code",
    //             "description": 'The response should be a JSON object with a single property "transpiled_code" of type string. This property should contain the transpiled code.',
    //             "schema": {
    //                 "type": "object",
    //                 "properties": {
    //                     "transpiled_code": {
    //                         "type": "string",
    //                         "description": "The code after transpilation process."
    //                     }
    //                 },
    //                 "required": [
    //                     "transpiled_code"
    //                 ],
    //                 "additionalProperties": false
    //             },
    //             "strict": true
    //         }
    //     }
    // }
}