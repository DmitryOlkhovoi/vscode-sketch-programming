# Sketch-programming (LLM-Transpiler) - WIP

POC extention as one of implementation of Sketch programming
https://github.com/DmitryOlkhovoi/Sketch-programming

VS Code Marketplace - https://marketplace.visualstudio.com/items?itemName=Sketch-programming.sketch-programming-llm-transpiler

### Extension commands

####  Sketch-programming: Initialize
```CTR + Shift + P``` and search for ```Sketch-programming: Initialize```. This command will create Sketch folder with a config and examples.

Common project structure:
```
├ project
│   ├── sketches
│   │   └── reactComponent.md
│   ├── src
│   │   ├── CountComponent - sketch code
│   │   └── sketch.config.js
├── src
│   ├── CountComponent.tsx - transpiled code
├── .env
└── package.json
```

### Example with React.js

![Снимок экрана 2025-03-14 232453](https://github.com/user-attachments/assets/0e881713-d010-4bf2-8b0c-585d8288d98c)


```
// @sketch:reactComponent
// @ext:tsx

Component Count

props add = 0
state count = 0

<div onclick="count += add"> Add {add} </div>
<div>
    Current count: {count}
</div>
```

On save transpiles to:

```typescript
import React, { useState } from 'react';

interface Props {
    add?: number;
}

const CountComponent: React.FC<Props> = ({ add = 0 }) => {
    const [count, setCount] = useState<number>(0);

    const handleClick = () => {
        setCount((prev: number) => prev + add);
    };

    return (
        <div>
            <div onClick={handleClick}>Add {add}</div>
            <div>Current count: {count}</div>
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
You need to creare Assistant, Vector store for it, and upload Sketch files that describe the syntax (for example https://github.com/DmitryOlkhovoi/Sketch-programming/blob/main/ReactComponentAskedModelToAddMoreRulesItself.md).

Work in progress, this process will be automated
