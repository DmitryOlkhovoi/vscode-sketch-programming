# sketch-programming--llm-transpiler WIP

POC extention as one of implementerion of Sketch programming
https://github.com/DmitryOlkhovoi/Sketch-programming

```
// @sketch:reactComponent

Component Count

props add = 0
state count = 0

<div onclick="count += add"> Add {add} </div>
<div>
    Current count: {count}
</div>
```

On save will save a new file

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

You should have a folder in the root project

```
├── project
│   ├── sketches
│   │   └── reactComponent.md
│   ├── src
│   │   ├── CountComponent.jsx - sketch code
│   │   └── sketch.config.js
├── src
│   ├── CountComponent.jsx - compiled code
├── .env
└── package.json
```

### Config example

sketch.config.js:
```
export default {
    openAIApiKey: 'YOUR-API-KEY',
    projectId: "foo" // name of the Assistant and VectorStore
}
```

### Current state
You need to creare Assistant, Vector store for it, and upload Sketch files that describse the syntax (for example https://github.com/DmitryOlkhovoi/Sketch-programming/blob/main/ReactComponentAskedModelToAddMoreRulesItself.md)
