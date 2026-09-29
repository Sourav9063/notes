# Reading XLSX Files in JavaScript

To read `.xlsx` files in JavaScript, use **SheetJS (xlsx)** library:

**Installation:**
```bash
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

SheetJS publishes releases on its own CDN. The `xlsx` package on the npm registry is stuck at 0.18.5 and has known vulnerabilities (prototype pollution, ReDoS); avoid `npm install xlsx`.

**Browser Usage:**
```javascript
import * as XLSX from 'xlsx';

async function handleFileUpload(event) {
    const file = event.target.files[0];
    const workbook = XLSX.read(await file.arrayBuffer());
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(jsonData);
}
```

**Node.js Usage:**
```javascript
const XLSX = require('xlsx');
const workbook = XLSX.readFile('data.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
```

**Vue.js Integration:**
```javascript
import * as XLSX from 'xlsx';

export default {
    methods: {
        async handleFileUpload(file) {
            const workbook = XLSX.read(await file.arrayBuffer());
            return XLSX.utils.sheet_to_json(
                workbook.Sheets[workbook.SheetNames[0]]
            );
        }
    }
}
```
