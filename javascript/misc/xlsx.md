To read `.xlsx` files in JavaScript, use **SheetJS (xlsx)** library:

**Installation:**
```bash
npm install xlsx
```

**Browser Usage:**
```javascript
import * as XLSX from 'xlsx';

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(jsonData);
    };
    
    reader.readAsArrayBuffer(file);
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
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const jsonData = XLSX.utils.sheet_to_json(
                        workbook.Sheets[workbook.SheetNames[0]]
                    );
                    resolve(jsonData);
                };
                reader.readAsArrayBuffer(file);
            });
        }
    }
}
```
