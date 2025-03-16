# Sketch-programming (LLM-Transpiler) - WIP

POC extention as one of implementation of Sketch programming
https://github.com/DmitryOlkhovoi/Sketch-programming

VS Code Marketplace - https://marketplace.visualstudio.com/items?itemName=Sketch-programming.sketch-programming-llm-transpiler

### Extension commands:

####  Sketch-programming: Initialize
```CTR + Shift + P``` and search for ```Sketch-programming: Initialize```. This command will create Sketch folder with a config and examples.

Common project structure (React example):
```
Project/
├── sketch/
│   ├── sketches/
│   │   └── reactComponent.md - Example (https://github.com/DmitryOlkhovoi/Sketch-programming/blob/main/ReactComponentAskedModelToAddMoreRulesItself.md)
│   ├── src/
│   │   ├── components/
│   │   │   └── ExampleReactComponent - Sketch code
│   └── sketch.config.js
├── src/
│   ├── components/
│   │   └── ExampleReactComponent.tsx - Transpiled file on save
│   ├── hooks/
│   ├── utils/
│   └── App.tsx
└── other_project_files/
```

####  Sketch-programming: Create assistant and vector stor
```CTR + Shift + P``` and search for ```Sketch-programming: Create assistant and vector store```. This command will create Assistant and a Vector store for it.

### Example with React.js

![Снимок экрана 2025-03-15 215915](https://github.com/user-attachments/assets/5311db86-1d5f-46f5-b122-a5b7e5c161a0)


```javascript
// @sketch:reactComponent
// @ext:tsx

Component Count

props add = 0
state count = 0

effect {
    console.log("Component mounted");
    
    cleanup {
        console.log("Cleanup");
    }
}

<div onclick="count += add"> Will add {add} </div>
<div>
    Current  count: {count}
</div>
```

transforms to

```typescript
import React, { useState, useEffect } from 'react';

interface Props {
    add?: number;
}

const CountComponent: React.FC<Props> = ({ add = 0 }) => {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        console.log("Component mounted");

        return () => {
            console.log("Cleanup");
        };
    }, []);

    const handleClick = () => {
        setCount((prev: number) => prev + add);
    };

    return (
        <div>
            <div onClick={handleClick}> Will add {add} </div>
            <div>
                Current count: {count}
            </div>
        </div>
    );
};

export default CountComponent;
```

### Config

sketch.config.js:
```
export default {
    openAIApiKey: 'YOUR-API-KEY',
    projectId: "foo" // name of the Assistant and VectorStore
}
```

### Current state
Supports only OpenAI
Potantially have some problems as extension doesn't track config file changes. Or one of Sketch files removing. Work in progress. Better notifications and such edge cases will be handled.

Use extension commands to Initialize, Create Assistant and Vector store, and then to upload Sketches
Example Sketch: https://github.com/DmitryOlkhovoi/Sketch-programming/blob/main/ReactComponentAskedModelToAddMoreRulesItself.md
Full tutorial will be written.

### Contributrion
Just do it if you want
