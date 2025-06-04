# effective go

## ভূমিকা [cite: 1]

Go একটি নতুন ভাষা। এটি বিদ্যমান ভাষাগুলো থেকে ধারণা নিলেও, এর কিছু বৈশিষ্ট্য আছে যা Go প্রোগ্রামকে এর আত্মীয় ভাষাগুলোতে লেখা প্রোগ্রাম থেকে আলাদা করে তোলে। [cite: 1] একটি C++ বা Java প্রোগ্রামকে সরাসরি Go-তে অনুবাদ করলে ভালো ফল নাও আসতে পারে—Java প্রোগ্রাম Java-তে লেখা হয়, Go-তে নয়। [cite: 2] অন্যদিকে, Go দৃষ্টিকোণ থেকে সমস্যাটি নিয়ে ভাবলে একটি সফল কিন্তু বেশ ভিন্ন প্রোগ্রাম তৈরি হতে পারে। [cite: 3] অন্য কথায়, Go ভালোভাবে লিখতে হলে এর বৈশিষ্ট্য এবং idiom-গুলো বোঝা গুরুত্বপূর্ণ। [cite: 4] Go-তে প্রোগ্রামিং করার জন্য প্রতিষ্ঠিত নিয়মাবলী, যেমন নামকরণ, Formatting, প্রোগ্রাম তৈরি, ইত্যাদি সম্পর্কে জানাটাও গুরুত্বপূর্ণ, যাতে আপনার লেখা প্রোগ্রামগুলো অন্য Go প্রোগ্রামারদের কাছে সহজে বোধগম্য হয়। [cite: 5]

এই ডকুমেন্টটি সহজ, idiomatic Go কোড লেখার জন্য tips দেয়। [cite: 6] এটি ভাষা specification, Tour of Go, এবং How to Write Go Code-কে আরও বাড়িয়ে দেয়, যা আপনার প্রথমে পড়া উচিত। [cite: 7]

জানুয়ারী, 2022-এ যোগ করা নোট: এই ডকুমেন্টটি 2009 সালে Go-এর প্রকাশের জন্য লেখা হয়েছিল, এবং তখন থেকে উল্লেখযোগ্যভাবে আপডেট করা হয়নি। [cite: 8] যদিও এটি ভাষাটি কীভাবে ব্যবহার করতে হয় তা বোঝার জন্য একটি ভালো গাইড, ভাষার stability-এর কারণে, এটি library-গুলো সম্পর্কে সামান্যই বলে এবং Go ecosystem-এর উল্লেখযোগ্য পরিবর্তনগুলো সম্পর্কে কিছুই বলে না, যেমন build system, testing, module, এবং polymorphism। [cite: 9] এটি আপডেট করার কোনো পরিকল্পনা নেই, কারণ অনেক কিছু ঘটেছে এবং document, blog এবং book-এর একটি বড় এবং ক্রমবর্ধমান সেট আধুনিক Go ব্যবহার ভালোভাবে বর্ণনা করে। [cite: 10] Effective Go এখনও কার্যকর, তবে পাঠকের বোঝা উচিত যে এটি একটি সম্পূর্ণ গাইড থেকে অনেক দূরে। [cite: 11] আরও তথ্যের জন্য issue 28782 দেখুন। [cite: 12]

## উদাহরণ [cite: 12]

Go package-এর source-গুলো কেবল core library হিসেবে নয়, বরং ভাষাটি কীভাবে ব্যবহার করতে হয় তার উদাহরণ হিসেবেও কাজ করার উদ্দেশ্যে তৈরি। [cite: 13] উপরন্তু, অনেক package-এ working, self-contained executable উদাহরণ রয়েছে যা আপনি সরাসরি go.dev website থেকে চালাতে পারেন, যেমন এই একটি (যদি প্রয়োজন হয়, এটি খুলতে "Example" শব্দটিতে ক্লিক করুন)। [cite: 14] যদি আপনার কোনো সমস্যা কীভাবে সমাধান করবেন বা কিছু কীভাবে implement করবেন সে সম্পর্কে কোনো প্রশ্ন থাকে, তাহলে library-এর documentation, code এবং উদাহরণগুলো উত্তর, ধারণা এবং background দিতে পারে। [cite: 15]

## Formatting [cite: 16]

Formatting-এর সমস্যাগুলো সবচেয়ে বিতর্কিত কিন্তু সবচেয়ে কম গুরুত্বপূর্ণ। [cite: 16] লোকেরা বিভিন্ন Formatting style-এর সাথে মানিয়ে নিতে পারে কিন্তু যদি তাদের মানিয়ে নিতে না হয় তবে তা ভালো, এবং যদি সবাই একই style মেনে চলে তবে এই বিষয়ে কম সময় ব্যয় হয়। [cite: 17] সমস্যাটি হল একটি দীর্ঘ prescriptive style guide ছাড়া এই Utopia-এর কাছে কীভাবে পৌঁছানো যায়। [cite: 18] Go-তে আমরা একটি অস্বাভাবিক পদ্ধতি গ্রহণ করি এবং বেশিরভাগ Formatting-এর সমস্যা মেশিনকে যত্ন নিতে দিই। [cite: 19]

`gofmt` প্রোগ্রাম ( `go fmt` হিসেবেও পাওয়া যায়, যা source file level-এর পরিবর্তে package level-এ কাজ করে) একটি Go প্রোগ্রাম পড়ে এবং indentation এবং vertical alignment-এর একটি standard style-এ source-টি প্রকাশ করে, comment-গুলো বজায় রেখে এবং প্রয়োজনে reformat করে। [cite: 20] যদি আপনি কোনো নতুন layout পরিস্থিতি কীভাবে handle করবেন তা জানতে চান, `gofmt` চালান; [cite: 21] যদি উত্তরটি সঠিক না মনে হয়, তাহলে আপনার প্রোগ্রামটি reorganize করুন (বা `gofmt` সম্পর্কে একটি bug file করুন), এটি এড়িয়ে যাবেন না। [cite: 22] উদাহরণস্বরূপ, একটি structure-এর field-গুলোর comment-গুলো line up করার জন্য সময় ব্যয় করার প্রয়োজন নেই। [cite: 23] `Gofmt` আপনার জন্য এটি করবে। এই declaration দেওয়া হলে:

```go
type T struct {
    name string // name of the object
    value int // its value
}
```

`gofmt` column-গুলো line up করবে:

```go
type T struct {
    name    string // name of the object
    value   int    // its value
}
```

Standard package-এর সমস্ত Go কোড `gofmt` দিয়ে formatted হয়েছে। [cite: 24] কিছু Formatting detail বাকি আছে। খুব সংক্ষেপে:

### Indentation

আমরা indentation-এর জন্য tab ব্যবহার করি এবং `gofmt` default-ভাবে সেগুলো প্রকাশ করে। [cite: 25] শুধুমাত্র যদি আপনার একান্ত প্রয়োজন হয় তবেই space ব্যবহার করুন। [cite: 26]

### Line length

Go-এর কোনো line length limit নেই। একটি punched card overflow করার বিষয়ে চিন্তা করবেন না। [cite: 27] যদি একটি line খুব দীর্ঘ মনে হয়, তাহলে এটি wrap করুন এবং একটি extra tab দিয়ে indent করুন। [cite: 27]

### Parentheses

Go-এর C এবং Java-এর চেয়ে কম parentheses দরকার: control structure-গুলোর ( `if` , `for` , `switch` ) syntax-এ parentheses নেই। [cite: 28] এছাড়াও, operator precedence hierarchy ছোট এবং পরিষ্কার, তাই [cite: 29]

```go
x<<8 + y<<16
```

অন্যান্য ভাষার মতো নয়, spacing যা বোঝায় তাই বোঝায়। [cite: 29]

## Commentary [cite: 30]

Go C-style `/* */` block comment এবং C++-style `//` line comment প্রদান করে। [cite: 30] Line comment-ই সাধারণ; block comment বেশিরভাগই package comment হিসেবে দেখা যায়, তবে একটি expression-এর মধ্যে বা বড় কোড অংশ disable করতে useful। [cite: 31] Top-level declaration-এর আগে, কোনো intervening newline ছাড়া, যে comment-গুলো দেখা যায় সেগুলোকে declaration-এর documentation হিসেবে ধরা হয়। [cite: 32] এই "doc comment"-গুলো একটি নির্দিষ্ট Go package বা command-এর প্রাথমিক documentation। [cite: 33] doc comment সম্পর্কে আরও জানতে, "Go Doc Comments" দেখুন। [cite: 34]

## Name [cite: 34]

Go-তেও name-গুলো অন্য যেকোনো ভাষার মতোই গুরুত্বপূর্ণ। [cite: 34] তাদের semantic effect-ও আছে: একটি package-এর বাইরে একটি name-এর visibility নির্ধারিত হয় এর প্রথম character upper case কিনা তার উপর ভিত্তি করে। [cite: 35] তাই Go প্রোগ্রামগুলোতে naming convention সম্পর্কে কিছুটা সময় নিয়ে আলোচনা করা সার্থক। [cite: 36]

### Package name [cite: 37]

যখন একটি package import করা হয়, তখন package name এর contents-এর জন্য একটি accessor হয়ে যায়। [cite: 37]

```go
import "bytes"
```

এর পরে, importing package `bytes.Buffer` সম্পর্কে কথা বলতে পারে। [cite: 38] এটি সহায়ক হয় যদি package ব্যবহারকারী প্রত্যেকে এর contents উল্লেখ করতে একই নাম ব্যবহার করতে পারে, যা বোঝায় যে package name-টি ভালো হওয়া উচিত: ছোট, সংক্ষিপ্ত, evocative। [cite: 39] Convention অনুযায়ী, package-গুলোকে lower case, single-word name দেওয়া হয়; underscore বা mixedCaps-এর কোনো প্রয়োজন থাকা উচিত নয়। [cite: 40] সংক্ষিপ্ততার দিকে ভুল করুন, কারণ আপনার package ব্যবহারকারী প্রত্যেকে সেই নামটি টাইপ করবে। [cite: 41] এবং `a priori` collision নিয়ে চিন্তা করবেন না। package name শুধুমাত্র import-এর জন্য default name; [cite: 42] এটি সমস্ত source code-এ অনন্য হওয়ার প্রয়োজন নেই, এবং collision-এর বিরল ক্ষেত্রে importing package স্থানীয়ভাবে ব্যবহার করার জন্য একটি ভিন্ন নাম বেছে নিতে পারে। [cite: 43] যে কোনো ক্ষেত্রে, confusion বিরল কারণ import-এর file name-টি ঠিক কোন package ব্যবহার করা হচ্ছে তা নির্ধারণ করে। [cite: 44]

আরেকটি convention হল যে package name তার source directory-এর base name; [cite: 45] `src/encoding/base64`-এর package-টি `"encoding/base64"` হিসাবে import করা হয় কিন্তু এর নাম `base64`, `encoding_base64` নয় এবং `encodingBase64` নয়। [cite: 46]

একটি package-এর importer তার contents উল্লেখ করতে নামটি ব্যবহার করবে, তাই package-এর exported name-গুলো repetition এড়াতে সেই fact ব্যবহার করতে পারে। [cite: 47] ( `import .` notation ব্যবহার করবেন না, যা যে package-টি পরীক্ষা করছে তার বাইরে চলতে হবে এমন test-গুলোকে সহজ করতে পারে, তবে অন্যথায় এটি এড়িয়ে চলা উচিত।) উদাহরণস্বরূপ, `bufio` package-এর buffered reader type-কে `Reader` বলা হয়, `BufReader` নয়, কারণ ব্যবহারকারীরা এটিকে `bufio.Reader` হিসাবে দেখে, যা একটি স্পষ্ট, সংক্ষিপ্ত নাম। [cite: 48] উপরন্তু, যেহেতু imported entity-গুলো সর্বদা তাদের package name দিয়ে address করা হয়, `bufio.Reader` `io.Reader`-এর সাথে conflict করে না। [cite: 49]

একইভাবে, `ring.Ring`-এর নতুন instance তৈরি করার function—যা Go-তে একটি constructor-এর definition—সাধারণত `NewRing` নামে পরিচিত হবে, কিন্তু যেহেতু `Ring` হল package দ্বারা export করা একমাত্র type, এবং যেহেতু package-কে `ring` বলা হয়, তাই এটিকে কেবল `New` বলা হয়, যা package-এর clients `ring.New` হিসাবে দেখে। [cite: 50] ভালো নাম বেছে নিতে আপনাকে package structure ব্যবহার করতে সাহায্য করুন। আরেকটি সংক্ষিপ্ত উদাহরণ হল `once.Do`; [cite: 51] `once.Do(setup)` ভালোভাবে পড়া যায় এবং `once.DoOrWaitUntilDone(setup)` লিখে এটি আরও ভালো হবে না। [cite: 52] দীর্ঘ নাম স্বয়ংক্রিয়ভাবে জিনিসগুলোকে আরও readable করে না। একটি সহায়ক doc comment প্রায়শই একটি অতিরিক্ত দীর্ঘ নামের চেয়ে বেশি মূল্যবান হতে পারে। [cite: 53]

### Getters [cite: 54]

Go getters এবং setters-এর জন্য automatic support প্রদান করে না। [cite: 54] আপনার নিজের getters এবং setters প্রদান করাতে কোনো ভুল নেই, এবং প্রায়শই এটি করা উপযুক্ত, তবে getters-এর নামে `Get` রাখা idiomatic বা প্রয়োজনীয় নয়। [cite: 55] যদি আপনার `owner` (lower case, unexported) নামে একটি field থাকে, তবে getter method-কে `Owner` (upper case, exported) বলা উচিত, `GetOwner` নয়। [cite: 56] export-এর জন্য upper-case name-এর ব্যবহার field-কে method থেকে আলাদা করার জন্য hook প্রদান করে। [cite: 57] একটি setter function, যদি প্রয়োজন হয়, সম্ভবত `SetOwner` নামে পরিচিত হবে। [cite: 58] উভয় নামই অনুশীলনে ভালোভাবে পড়া যায়: [cite: 59]

```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```

### Interface name [cite: 59]

Convention অনুযায়ী, one-method interface-এর নামকরণ করা হয় method name-এর সাথে একটি `-er` suffix বা agent noun তৈরি করার জন্য অনুরূপ পরিবর্তন দিয়ে: `Reader`, `Writer`, `Formatter`, `CloseNotifier` ইত্যাদি। এই ধরনের অনেকগুলি নাম আছে এবং তাদের এবং তাদের দ্বারা ক্যাপচার করা function name-গুলোর প্রতি সম্মান জানানো ফলপ্রসূ। [cite: 59] `Read`, `Write`, `Close`, `Flush`, `String` ইত্যাদির canonical signature এবং অর্থ আছে। [cite: 60] Confusion এড়াতে, আপনার method-কে সেই নামগুলির মধ্যে একটি দেবেন না যদি না এটির একই signature এবং অর্থ থাকে। [cite: 61] বিপরীতে, যদি আপনার type একটি well-known type-এর method-এর মতো একই অর্থ সহ একটি method implement করে, তবে এটিকে একই নাম এবং signature দিন; [cite: 62] আপনার string-converter method-কে `String` বলুন, `ToString` নয়। [cite: 63]

### MixedCaps [cite: 63]

অবশেষে, Go-তে convention হল multiword name লেখার জন্য underscore-এর পরিবর্তে `MixedCaps` বা `mixedCaps` ব্যবহার করা। [cite: 63]

### Semicolons [cite: 64]

C-এর মতো, Go-এর formal grammar statement-এর termination-এর জন্য semicolon ব্যবহার করে, কিন্তু C-এর বিপরীতে, সেই semicolon-গুলো source-এ প্রদর্শিত হয় না। [cite: 64] পরিবর্তে lexer scan করার সময় স্বয়ংক্রিয়ভাবে semicolon insert করার জন্য একটি simple rule ব্যবহার করে, তাই input text বেশিরভাগই semicolon-মুক্ত। [cite: 65] rule-টি হল এটি: যদি একটি newline-এর আগে শেষ token-টি একটি identifier (যার মধ্যে `int` এবং `float64` এর মতো শব্দ অন্তর্ভুক্ত), একটি basic literal যেমন একটি number বা string constant, বা নিম্নলিখিত token-গুলির মধ্যে একটি হয়: [cite: 66]

`break continue fallthrough return ++ -- ) }`

lexer সর্বদা token-এর পরে একটি semicolon insert করে। [cite: 66] এটিকে এভাবে সংক্ষিপ্ত করা যেতে পারে, "যদি newline একটি token-এর পরে আসে যা একটি statement শেষ করতে পারে, তাহলে একটি semicolon insert করুন"। [cite: 67] একটি closing brace-এর ঠিক আগে একটি semicolon বাদ দেওয়া যেতে পারে, তাই একটি statement যেমন: [cite: 68]

```go
   go func() { for { dst <- <-src } }()
```

কোনো semicolon-এর প্রয়োজন নেই। [cite: 68] Idiomatic Go প্রোগ্রামগুলিতে semicolon শুধুমাত্র `for` loop clause-এর মতো জায়গায় থাকে, initializer, condition, এবং continuation element-গুলোকে আলাদা করার জন্য। [cite: 69] যদি আপনি সেইভাবে কোড লেখেন তবে এক লাইনে একাধিক statement আলাদা করার জন্যও তাদের প্রয়োজন। [cite: 70]

semicolon insertion rule-এর একটি consequence হল যে আপনি একটি control structure-এর ( `if` , `for` , `switch` , বা `select` ) opening brace পরবর্তী লাইনে রাখতে পারবেন না। [cite: 71] যদি আপনি করেন, তাহলে brace-এর আগে একটি semicolon insert করা হবে, যা অবাঞ্ছিত প্রভাব ফেলতে পারে। [cite: 72] সেগুলোকে এভাবে লিখুন: [cite: 73]

```go
if i < f() {
    g()
}
```

এভাবে নয়:

```go
if i < f()  // wrong! [cite: 73]
{           // wrong! [cite: 74]
g()
}
```

## Control structure [cite: 74]

Go-এর control structure-গুলো C-এর control structure-গুলোর সাথে সম্পর্কিত কিন্তু গুরুত্বপূর্ণ উপায়ে ভিন্ন। [cite: 74] কোনো `do` বা `while` loop নেই, শুধুমাত্র একটি সামান্য generalized `for`; [cite: 75] `switch` আরও flexible; `if` এবং `switch` একটি optional initialization statement গ্রহণ করে যা `for`-এর মতো; [cite: 76] `break` এবং `continue` statement-গুলো কী break বা continue করতে হবে তা identify করার জন্য একটি optional label গ্রহণ করে; [cite: 77] এবং একটি type switch এবং একটি multiway communications multiplexer, `select` সহ নতুন control structure-গুলো রয়েছে। [cite: 78] Syntax-ও সামান্য ভিন্ন: কোনো parentheses নেই এবং body-গুলো সর্বদা brace-delimited হতে হবে। [cite: 79]

### If [cite: 80]

Go-তে একটি simple `if` দেখতে এরকম: [cite: 80]

```go
if x > 0 {
    return y
}
```

Mandatory brace-গুলো একাধিক লাইনে simple `if` statement লিখতে উৎসাহিত করে। [cite: 80] এটি যেকোনো উপায়ে ভালো style, বিশেষ করে যখন body-তে একটি control statement যেমন `return` বা `break` থাকে। [cite: 81] যেহেতু `if` এবং `switch` একটি initialization statement গ্রহণ করে, তাই local variable সেট আপ করার জন্য এটি ব্যবহার করা সাধারণ। [cite: 82]

```go
if err := file.Chmod(0664); err != nil {
    log.Print(err)
    return err
}
```

Go library-গুলোতে, আপনি দেখতে পাবেন যে যখন একটি `if` statement পরবর্তী statement-এ flow করে না—অর্থাৎ, body `break`, `continue`, `goto`, বা `return`-এ শেষ হয়—তখন অপ্রয়োজনীয় `else` বাদ দেওয়া হয়। [cite: 83]

```go
f, err := os.Open(name)
if err != nil {
    return err
}
codeUsing(f)
```

এটি একটি সাধারণ পরিস্থিতির উদাহরণ যেখানে code-কে error condition-এর sequence থেকে রক্ষা করতে হবে। [cite: 84] যদি control-এর সফল flow page-এর নিচে চলে যায়, তাহলে code ভালোভাবে পড়া যায়, যখন error case-গুলো দেখা যায় তখন সেগুলোকে eliminate করে। [cite: 85] যেহেতু error case-গুলো `return` statement-এ শেষ হয়, তাই resultant code-এর কোনো `else` statement-এর প্রয়োজন হয় না। [cite: 86]

```go
f, err := os.Open(name)
if err != nil {
    return err
}
d, err := f.Stat()
if err != nil {
    f.Close()
    return err
}
codeUsing(f, d)
```

### Redeclaration এবং reassignment [cite: 657]

একপাশে: আগের section-এর শেষ উদাহরণটি দেখায় যে `:=` short declaration form কীভাবে কাজ করে তার একটি detail। [cite: 657] `os.Open` call করে এমন declarationটি পড়ে, [cite: 658]

```go
f, err := os.Open(name)
```

এই statement-টি দুটি variable, `f` এবং `err` declare করে। [cite: 658] কয়েক লাইন পরে, `f.Stat`-এর call-টি পড়ে, [cite: 659]

```go
d, err := f.Stat()
```

যা দেখে মনে হয় এটি `d` এবং `err` declare করে। [cite: 660] তবে, লক্ষ্য করুন যে `err` উভয় statement-এই দেখা যায়। [cite: 660] এই duplication বৈধ: `err` প্রথম statement দ্বারা declared, কিন্তু দ্বিতীয়টিতে শুধুমাত্র re-assigned। [cite: 661] এর অর্থ হল `f.Stat`-এর call উপরের declared existing `err` variable ব্যবহার করে, এবং এটিকে কেবল একটি নতুন value দেয়। [cite: 662] একটি `:=` declaration-এ একটি variable `v` প্রদর্শিত হতে পারে যদিও এটি ইতিমধ্যে declared হয়েছে, যদি: [cite: 663]

* এই declaration-টি `v`-এর existing declaration-এর মতো একই scope-এ থাকে (যদি `v` ইতিমধ্যে একটি outer scope-এ declared হয়ে থাকে, তাহলে declarationটি একটি নতুন variable তৈরি করবে §),
* initialization-এর সংশ্লিষ্ট value `v`-এর জন্য assignable হয়, এবং
* declaration দ্বারা অন্তত একটি অন্য variable তৈরি হয়।

এই অস্বাভাবিক property pure pragmatism, একটি single `err` value ব্যবহার করা সহজ করে তোলে, উদাহরণস্বরূপ, একটি দীর্ঘ `if-else` chain-এ। [cite: 664] আপনি এটি প্রায়শই ব্যবহৃত হতে দেখবেন। [cite: 665]

§ এখানে উল্লেখ করা উচিত যে Go-তে function parameter এবং return value-এর scope function body-এর মতোই, যদিও তারা lexically body-কে ঘিরে থাকা braces-এর বাইরে প্রদর্শিত হয়। [cite: 665]

### For [cite: 666]

Go `for` loop C-এর মতো—তবে একই নয়। [cite: 666] এটি `for` এবং `while`-কে একত্রিত করে এবং কোনো `do-while` নেই। [cite: 667] তিনটি form আছে, যার মধ্যে শুধুমাত্র একটিতে semicolon আছে। [cite: 668]

```go
// Like a C for
for init; condition; [cite: 669]
post { }

// Like a C while
for condition { }

// Like a C for(;;)
for { }
```

Short declaration-গুলো loop-এর মধ্যেই index variable declare করা সহজ করে তোলে। [cite: 670]

```go
sum := 0
for i := 0; i < 10; i++ {
    sum += i
}
```

যদি আপনি একটি array, slice, string, বা map-এর উপর loop করেন, অথবা একটি channel থেকে পড়েন, তাহলে একটি `range` clause loop-টি manage করতে পারে। [cite: 671]

```go
for key, value := range oldMap {
    newMap[key] = value
}
```

যদি আপনার range-এর শুধুমাত্র প্রথম item (key বা index) প্রয়োজন হয়, তাহলে দ্বিতীয়টি বাদ দিন:

```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```

যদি আপনার range-এর শুধুমাত্র দ্বিতীয় item (value) প্রয়োজন হয়, তাহলে প্রথমটি discard করতে blank identifier, একটি underscore, ব্যবহার করুন:

```go
sum := 0
for _, value := range array {
    sum += value
}
```

blank identifier-এর অনেক ব্যবহার আছে, যা একটি পরবর্তী section-এ বর্ণনা করা হয়েছে। [cite: 672]

string-এর জন্য, `range` আপনার জন্য আরও কাজ করে, UTF-8 parse করে individual Unicode code point বের করে। [cite: 673] Erroneous encoding এক byte consume করে এবং replacement rune U+FFFD তৈরি করে। [cite: 674] ( `rune` নামটি (সংশ্লিষ্ট built-in type সহ) একটি single Unicode code point-এর জন্য Go terminology। বিস্তারিত জানার জন্য language specification দেখুন।) loop-টি: [cite: 674]

```go
for pos, char := range "日本\x80語" { // \x80 is an illegal UTF-8 encoding
    fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}
```

prints:

```
character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```

অবশেষে, Go-এর কোনো comma operator নেই এবং `++` ও `--` expression নয়, statement। [cite: 675] সুতরাং যদি আপনি একটি `for`-এ একাধিক variable চালাতে চান তাহলে আপনার parallel assignment ব্যবহার করা উচিত (যদিও এটি `++` এবং `--` কে preclude করে)। [cite: 676]

```go
// Reverse a
for i, j := 0, len(a)-1; i < j; [cite: 677]
i, j = i+1, j-1 {
    a[i], a[j] = a[j], a[i]
}
```

### Switch [cite: 678]

Go-এর `switch` C-এর চেয়ে আরও general। [cite: 678] Expression-গুলোর constant বা even integer হওয়ার প্রয়োজন নেই, case-গুলো top থেকে bottom পর্যন্ত evaluate করা হয় যতক্ষণ না একটি match পাওয়া যায়, এবং যদি `switch`-এর কোনো expression না থাকে তবে এটি `true`-এর উপর switch করে। [cite: 679] তাই, `if-else-if-else` chain-কে `switch` হিসাবে লেখা সম্ভব—এবং idiomatic। [cite: 680]

```go
func unhex(c byte) byte {
    switch {
    case '0' <= c && c <= '9':
        return c - '0'
    case 'a' <= c && c <= 'f':
        return c - 'a' + 10
    case 'A' <= c && c <= 'F':
        return c - 'A' + 10
    }
    return 0
}
```

কোনো automatic fall through নেই, তবে case-গুলো comma-separated list-এ উপস্থাপন করা যেতে পারে। [cite: 681]

```go
func shouldEscape(c byte) bool {
    switch c {
    case ' ', '?', '&', '=', '#', '+', '%':
        return true
    }
    return false
}
```

যদিও Go-তে অন্যান্য C-like ভাষার তুলনায় `break` statement-গুলো ততটা সাধারণ নয়, তবে একটি `switch` তাড়াতাড়ি terminate করতে `break` statement ব্যবহার করা যেতে পারে। [cite: 682] তবে, কখনও কখনও surrounding loop থেকে break করা প্রয়োজন হয়, switch থেকে নয়, এবং Go-তে এটি loop-এ একটি label দিয়ে এবং সেই label-এ "breaking" করে accomplish করা যেতে পারে। [cite: 683] এই উদাহরণটি উভয় ব্যবহার দেখায়। [cite: 683]

```go
Loop:
    for n := 0; n < len(src); [cite: 684]
n += size {
        switch {
        case src[n] < sizeOne:
            if validateOnly {
                break
            }
            size = 1
            update(src[n])

        case [cite: 685]
src[n] < sizeTwo:
            if n+1 >= len(src) {
                err = errShortInput
                break Loop
            }
            if validateOnly {
                break
     [cite: 686]
        }
            size = 2
            update(src[n] + src[n+1]<<shift)
        }
    }
```

অবশ্যই, `continue` statement-ও একটি optional label গ্রহণ করে তবে এটি শুধুমাত্র loop-এর ক্ষেত্রে প্রযোজ্য। [cite: 687]

এই section শেষ করতে, এখানে byte slice-এর জন্য একটি comparison routine রয়েছে যা দুটি `switch` statement ব্যবহার করে: [cite: 687]

```go
// Compare returns an integer comparing the two byte slices,
// lexicographically. [cite: 688]
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b
func Compare(a, b []byte) int {
    for i := 0; [cite: 689]
i < len(a) && i < len(b); i++ {
        switch {
        case a[i] > b[i]:
            return 1
        case a[i] < b[i]:
            return -1
        }
    }
    switch {
    case len(a) > len(b):
        return 1
  [cite: 690]
   case len(a) < len(b):
        return -1
    }
    return 0
}
```

### Type switch [cite: 691]

একটি switch একটি interface variable-এর dynamic type discover করতেও ব্যবহার করা যেতে পারে। [cite: 691] এই ধরনের একটি type switch parentheses-এর ভিতরে `type` keyword সহ একটি type assertion-এর syntax ব্যবহার করে। [cite: 692] যদি switch expression-এ একটি variable declare করে, তাহলে variable-টির প্রতিটি clause-এ সংশ্লিষ্ট type থাকবে। [cite: 693] এই ধরনের ক্ষেত্রে নামটি পুনরায় ব্যবহার করাও idiomatic, আসলে প্রতিটি case-এ একই নামের কিন্তু ভিন্ন type-এর একটি নতুন variable declare করা। [cite: 694]

```go
var t interface{}
t = functionOfSomeType()
switch t := t.(type) {
default:
    fmt.Printf("unexpected type %T\n", t)     // %T prints whatever type t has
case bool:
    fmt.Printf("boolean %t\n", t)             // t has type bool
case int:
    fmt.Printf("integer %d\n", t)             // t has type int
case *bool:
    fmt.Printf("pointer to boolean %t\n", *t) // t has type *bool
case *int:
    fmt.Printf("pointer to integer %d\n", t) // t [cite: 695]
has type *int
}
```

## Function [cite: 695]

### Multiple return value [cite: 696]

Go-এর unusual feature-গুলির মধ্যে একটি হল যে function এবং method একাধিক value return করতে পারে। [cite: 696] এই form C প্রোগ্রামগুলিতে কিছু clumsy idiom-এর উন্নতি করতে ব্যবহার করা যেতে পারে: in-band error return যেমন `EOF`-এর জন্য `-1` এবং address দ্বারা passed একটি argument modify করা। [cite: 697]

C-তে, একটি write error একটি negative count দ্বারা signaling করা হয় যেখানে error code একটি volatile location-এ গোপনে রাখা হয়। [cite: 698] Go-তে, `Write` একটি count এবং একটি error return করতে পারে: "হ্যাঁ, আপনি কিছু byte লিখেছেন কিন্তু সবগুলি লেখেননি কারণ আপনি device-টি পূর্ণ করেছেন"। [cite: 699] `os` package থেকে file-এর `Write` method-এর signature হল: [cite: 699]

```go
func (file *File) Write(b []byte) (n int, err error)
```

এবং documentation যা বলে, এটি লেখা byte-এর সংখ্যা এবং একটি non-nil error return করে যখন `n != len(b)`। [cite: 700] এটি একটি সাধারণ style; আরও উদাহরণের জন্য error handling section দেখুন। [cite: 700]

একটি অনুরূপ approach return value-তে একটি pointer pass করার প্রয়োজনকে obviate করে একটি reference parameter-এর মতো simulate করতে। [cite: 701] এখানে একটি simple-minded function রয়েছে যা একটি byte slice-এর একটি position থেকে একটি number grab করে, number এবং পরবর্তী position return করে। [cite: 702]

```go
func nextInt(b []byte, i int) (int, int) {
    for ; i < len(b) && !isDigit(b[i]); [cite: 703]
i++ {
    }
    x := 0
    for ; [cite: 704]
i < len(b) && isDigit(b[i]); i++ {
        x = x*10 + int(b[i]) - '0'
    }
    return x, i
}
```

আপনি এটি input slice `b`-তে number scan করতে ব্যবহার করতে পারেন যেমন: [cite: 705]

```go
   for i := 0; [cite: 706]
i < len(b); {
        x, i = nextInt(b, i)
        fmt.Println(x)
    }
```

### Named result parameter [cite: 707]

Go function-এর return বা result "parameter" নাম দেওয়া যেতে পারে এবং regular variable-এর মতো ব্যবহার করা যেতে পারে, ঠিক incoming parameter-এর মতো। [cite: 707] যখন নাম দেওয়া হয়, তখন function শুরু হওয়ার সময় তাদের type-এর জন্য zero value-তে initialize করা হয়; [cite: 708] যদি function-টি কোনো argument ছাড়া একটি `return` statement execute করে, তাহলে result parameter-এর current value-গুলি returned value হিসাবে ব্যবহার করা হয়। [cite: 709] নামগুলি mandatory নয় তবে তারা কোডকে ছোট এবং পরিষ্কার করতে পারে: তারা documentation। [cite: 710] যদি আমরা `nextInt`-এর results-কে নাম দিই তবে কোন returned `int` কোনটি তা স্পষ্ট হয়ে যায়। [cite: 711]

```go
func nextInt(b []byte, pos int) (value, nextPos int) {
```

কারণ named result-গুলো initialized এবং একটি unadorned return-এর সাথে tied, তারা সহজ করার পাশাপাশি clarify করতে পারে। [cite: 712] এখানে `io.ReadFull`-এর একটি version যা তাদের ভালোভাবে ব্যবহার করে: [cite: 712]

```go
func ReadFull(r Reader, buf []byte) (n int, err error) {
    for len(buf) > 0 && err == nil {
        var nr int
        nr, err = r.Read(buf)
        n += nr
        buf = buf[nr:]
    }
    return
}
```

### Defer [cite: 713]

Go-এর `defer` statement একটি function call ( deferred function) schedule করে যা `defer` execute করে এমন function return করার ঠিক আগে চালানো হবে। [cite: 713] এটি একটি unusual কিন্তু কার্যকর উপায় যা এমন পরিস্থিতি handle করার জন্য যেখানে resource-গুলি অবশ্যই release করতে হবে, function return করার কোন path-ই হোক না কেন। [cite: 714] Canonical উদাহরণগুলি হল একটি mutex unlock করা বা একটি file close করা। [cite: 714]

```go
// Contents returns the file's contents as a string. [cite: 715]
func Contents(filename string) (string, error) {
    f, err := os.Open(filename)
    if err != nil {
        return "", err
    }
    defer f.Close()  // f.Close will run when we're finished. [cite: 716]
var result []byte
    buf := make([]byte, 100)
    for {
        n, err := f.Read(buf[0:])
        result = append(result, buf[0:n]...) // append is discussed later. [cite: 717]
if err != nil {
            if err == io.EOF {
                break
            }
            return "", err  // f will be closed if we return here. [cite: 718]
}
    }
    return string(result), nil // f will be closed if we return here. [cite: 719]
}
```

`Close`-এর মতো একটি function-এ call defer করার দুটি সুবিধা রয়েছে। [cite: 720] প্রথমত, এটি guarantee দেয় যে আপনি file close করতে ভুলবেন না, যা একটি নতুন return path যোগ করার জন্য function-টি পরে edit করলে সহজে ভুল করা যায়। [cite: 721] দ্বিতীয়ত, এর অর্থ হল `close` `open`-এর কাছাকাছি থাকে, যা function-এর শেষে এটি স্থাপন করার চেয়ে অনেক বেশি স্পষ্ট। [cite: 722]

deferred function-এর argument-গুলো (যদি function-টি একটি method হয় তবে receiver সহ) `defer` execute করার সময় evaluate করা হয়, `call` execute করার সময় নয়। [cite: 723] function execute হওয়ার সময় variable-এর value পরিবর্তন হওয়ার বিষয়ে worries এড়ানোর পাশাপাশি, এর অর্থ হল একটি single deferred call site একাধিক function execution defer করতে পারে। [cite: 724] এখানে একটি silly উদাহরণ। [cite: 724]

```go
for i := 0; i < 5; [cite: 725]
i++ {
    defer fmt.Printf("%d ", i)
}
```

Deferred function-গুলো LIFO order-এ execute হয়, তাই এই কোডটি function return করার সময় `4 3 2 1 0` প্রিন্ট করবে। [cite: 726] একটি আরও plausible উদাহরণ হল প্রোগ্রাম জুড়ে function execution trace করার একটি simple উপায়। [cite: 727] আমরা দুটি simple tracing routine এভাবে লিখতে পারি: [cite: 727]

```go
func trace(s string)   { fmt.Println("entering:", s) }
func untrace(s string) { fmt.Println("leaving:", s) }

// Use them like this:
func a() {
    trace("a")
    defer untrace("a")
    // do something....
}
```

আমরা `defer` execute করার সময় deferred function-এর argument-গুলো evaluate করা হয় এই fact-টি কাজে লাগিয়ে আরও ভালো কিছু করতে পারি। [cite: 728] tracing routine-টি untracing routine-এর জন্য argument সেট আপ করতে পারে। [cite: 729] এই উদাহরণটি: [cite: 729]

```go
func trace(s string) string {
    fmt.Println("entering:", s)
    return s
}

func un(s string) {
    fmt.Println("leaving:", s)
}

func a() {
    defer un(trace("a"))
    fmt.Println("in a")
}

func b() {
    defer un(trace("b"))
    fmt.Println("in b")
    a()
}

func main() {
    b()
}
```

prints:

```
entering: b
in b
entering: a
in a
leaving: a
leaving: b
```

অন্যান্য ভাষা থেকে block-level resource management-এ অভ্যস্ত প্রোগ্রামারদের কাছে `defer` অদ্ভুত মনে হতে পারে, তবে এর সবচেয়ে interesting এবং powerful application-গুলো ঠিক এই fact থেকে আসে যে এটি block-based নয় বরং function-based। [cite: 730] `panic` এবং `recover` section-এ আমরা এর possibilities-এর আরেকটি উদাহরণ দেখতে পাব। [cite: 731]

## Data [cite: 731]

### Allocation with `new` [cite: 732]

Go-এর দুটি allocation primitive আছে, built-in function `new` এবং `make`। [cite: 732] তারা ভিন্ন কাজ করে এবং ভিন্ন type-এর ক্ষেত্রে প্রযোজ্য, যা confusing হতে পারে, তবে rule-গুলো simple। [cite: 733]

প্রথমে `new` নিয়ে কথা বলি। এটি একটি built-in function যা memory allocate করে, কিন্তু অন্যান্য ভাষার namesake-গুলোর মতো এটি memory initialize করে না, এটি কেবল zero করে। [cite: 733] অর্থাৎ, `new(T)` type `T`-এর একটি নতুন item-এর জন্য zeroed storage allocate করে এবং এর address return করে, একটি `*T` type-এর value। [cite: 734] Go terminology-তে, এটি type `T`-এর একটি newly allocated zero value-এর pointer return করে। [cite: 735]

যেহেতু `new` দ্বারা returned memory zeroed হয়, তাই আপনার data structure design করার সময় প্রতিটি type-এর zero value আরও initialization ছাড়াই ব্যবহার করা যেতে পারে তা নিশ্চিত করা সহায়ক। [cite: 736] এর অর্থ হল data structure-এর একজন user `new` দিয়ে একটি তৈরি করতে পারে এবং সরাসরি কাজ শুরু করতে পারে। [cite: 737] উদাহরণস্বরূপ, `bytes.Buffer`-এর documentation বলে যে "Buffer-এর জন্য zero value হল একটি empty buffer যা ব্যবহারের জন্য ready।" [cite: 738]

একইভাবে, `sync.Mutex`-এর কোনো explicit constructor বা `Init` method নেই। [cite: 739] পরিবর্তে, `sync.Mutex`-এর জন্য zero value একটি unlocked mutex হিসাবে define করা হয়। [cite: 740] zero-value-is-useful property transitive-ভাবে কাজ করে। এই type declaration বিবেচনা করুন। [cite: 741]

```go
type SyncedBuffer struct {
    lock    sync.Mutex
    buffer  bytes.Buffer
}
```

`SyncedBuffer` type-এর value-গুলি allocation বা কেবল declaration-এর পরেই অবিলম্বে ব্যবহারের জন্য ready। [cite: 742] পরবর্তী snippet-এ, `p` এবং `v` উভয়ই আরও ব্যবস্থা ছাড়াই সঠিকভাবে কাজ করবে। [cite: 743]

```go
p := new(SyncedBuffer)  // type *SyncedBuffer
var v SyncedBuffer      // type  SyncedBuffer
```

### Constructor এবং composite literal [cite: 744]

কখনও কখনও zero value যথেষ্ট হয় না এবং একটি initializing constructor প্রয়োজন হয়, যেমন `os` package থেকে প্রাপ্ত এই উদাহরণে। [cite: 744]

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := new(File)
    f.fd = fd
    f.name = name
    f.dirinfo = nil
    f.nepipe = 0
    return f
}
```

এখানে প্রচুর boilerplate আছে। [cite: 745] আমরা একটি composite literal ব্যবহার করে এটি simple করতে পারি, যা একটি expression যা evaluate করা হলে প্রতিবার একটি নতুন instance তৈরি করে। [cite: 746]

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```

লক্ষ্য করুন যে, C-এর বিপরীতে, একটি local variable-এর address return করা পুরোপুরি ঠিক আছে; [cite: 747] variable-এর সাথে সংশ্লিষ্ট storage function return করার পরেও টিকে থাকে। [cite: 748] প্রকৃতপক্ষে, একটি composite literal-এর address নিলে প্রতিবার evaluate করা হলে একটি fresh instance allocate হয়, তাই আমরা এই শেষ দুটি line একত্রিত করতে পারি। [cite: 749]

```go
return &File{fd, name, nil, 0}
```

একটি composite literal-এর field-গুলো order-এ সাজানো থাকে এবং সবগুলি অবশ্যই উপস্থিত থাকতে হবে। [cite: 750] তবে, element-গুলোকে explicitly `field: value` pair হিসাবে label করে, initializer-গুলো যেকোনো order-এ প্রদর্শিত হতে পারে, অনুপস্থিতগুলি তাদের নিজ নিজ zero value হিসাবে রেখে। [cite: 751]

সুতরাং আমরা বলতে পারি:

```go
   return &File{fd: fd, name: name}
```

একটি limiting case হিসাবে, যদি একটি composite literal-এ কোনো field না থাকে, তাহলে এটি type-এর জন্য একটি zero value তৈরি করে। [cite: 752] `new(File)` এবং `&File{}` expression-গুলো equivalent। [cite: 752]

composite literal-গুলো array, slice এবং map-এর জন্যও তৈরি করা যেতে পারে, field label-গুলো index বা map key হিসাবে উপযুক্তভাবে। [cite: 753] এই উদাহরণগুলিতে, initialization `Enone`, `Eio`, এবং `Einval`-এর value নির্বিশেষে কাজ করে, যতক্ষণ না তারা distinct হয়। [cite: 754]

```go
a := [...]string   {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
s := []string      {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
m := map[int]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
```

### Allocation with `make` [cite: 756]

Allocation-এ ফিরে আসি। [cite: 756] built-in function `make(T, args)` `new(T)` থেকে ভিন্ন purpose-এ কাজ করে। [cite: 757] এটি শুধুমাত্র slice, map, এবং channel তৈরি করে, এবং এটি type `T`-এর একটি initialized (zeroed নয়) value return করে (`*T` নয়)। [cite: 758] পার্থক্যের কারণ হল এই তিনটি type, internal-ভাবে, data structure-এর reference represent করে যা ব্যবহারের আগে initialize করতে হবে। [cite: 759] উদাহরণস্বরূপ, একটি slice হল একটি তিন-item descriptor যার মধ্যে data (একটি array-এর ভিতরে), length, এবং capacity-এর একটি pointer থাকে, এবং যতক্ষণ না এই item-গুলো initialized হয়, slice-টি `nil`। [cite: 760] slice, map, এবং channel-এর জন্য, `make` internal data structure initialize করে এবং ব্যবহারের জন্য value তৈরি করে। [cite: 761] উদাহরণস্বরূপ, [cite: 761]

```go
make([]int, 10, 100)
```

100টি int-এর একটি array allocate করে এবং তারপর length 10 এবং capacity 100 সহ একটি slice structure তৈরি করে যা array-এর প্রথম 10টি element-কে নির্দেশ করে। [cite: 762] (একটি slice তৈরি করার সময়, capacity বাদ দেওয়া যেতে পারে; আরও তথ্যের জন্য slices section দেখুন।) বিপরীতে, `new([]int)` একটি newly allocated, zeroed slice structure-এর একটি pointer return করে, অর্থাৎ, একটি `nil` slice value-এর একটি pointer। [cite: 762] এই উদাহরণগুলি `new` এবং `make`-এর মধ্যে পার্থক্য তুলে ধরে। [cite: 763]

```go
var p *[]int = new([]int)       // allocates slice structure; *p == nil; [cite: 764]
rarely useful
var v  []int = make([]int, 100) // the slice v now refers to a new array of 100 ints

// Unnecessarily complex:
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// Idiomatic:
v := make([]int, 100)
```

মনে রাখবেন যে `make` শুধুমাত্র map, slice এবং channel-এর ক্ষেত্রে প্রযোজ্য এবং একটি pointer return করে না। [cite: 766] একটি explicit pointer পেতে `new` দিয়ে allocate করুন বা একটি variable-এর address explicit-ভাবে নিন। [cite: 766]

### Array [cite: 767]

Array-গুলো memory-এর detailed layout planning করার সময় useful এবং কখনও কখনও allocation এড়াতে সাহায্য করতে পারে, তবে প্রাথমিকভাবে তারা slice-এর জন্য একটি building block, যা পরবর্তী section-এর বিষয়। [cite: 767] সেই topic-এর জন্য foundation তৈরি করতে, এখানে array সম্পর্কে কয়েকটি কথা। [cite: 768] Go এবং C-তে array-গুলো যেভাবে কাজ করে তার মধ্যে major পার্থক্য রয়েছে। Go-তে, [cite: 769]

* Array-গুলো value। [cite: 769]
* একটি array অন্য array-তে assign করা সমস্ত element copy করে। [cite: 770]
বিশেষ করে, যদি আপনি একটি array একটি function-এ pass করেন, তাহলে এটি array-এর একটি copy পাবে, এর pointer নয়। [cite: 771]
* একটি array-এর size তার type-এর অংশ। [cite: 771]
* `[10]int` এবং `[20]int` type-গুলো distinct। [cite: 772]

value property useful হতে পারে কিন্তু ব্যয়বহুলও হতে পারে; [cite: 773] যদি আপনি C-like behavior এবং efficiency চান, তাহলে আপনি array-এর একটি pointer pass করতে পারেন। [cite: 774]

```go
func Sum(a *[3]float64) (sum float64) {
    for _, v := range *a {
        sum += v
    }
    return
}

array := [...]float64{7.0, 8.5, 9.1}
x := Sum(&array)  // Note the explicit address-of operator
```

কিন্তু এই style-টিও idiomatic Go নয়। [cite: 775] পরিবর্তে slices ব্যবহার করুন। [cite: 775]

### Slice [cite: 776]

Slice-গুলো data sequence-এর জন্য একটি আরও general, powerful, এবং convenient interface দিতে array-গুলো wrap করে। [cite: 776] transformation matrix-এর মতো explicit dimension সহ item ছাড়া, Go-তে বেশিরভাগ array programming simple array-এর পরিবর্তে slices দিয়ে করা হয়। [cite: 777] Slice-গুলো underlying array-এর reference ধারণ করে, এবং যদি আপনি একটি slice অন্য slice-এ assign করেন, তাহলে উভয়ই একই array-কে reference করে। [cite: 778] যদি একটি function একটি slice argument গ্রহণ করে, তাহলে slice-এর element-গুলিতে যে পরিবর্তনগুলি করে তা caller-এর কাছে visible হবে, যা underlying array-এর একটি pointer pass করার অনুরূপ। [cite: 779] একটি `Read` function তাই একটি pointer এবং একটি count-এর পরিবর্তে একটি slice argument গ্রহণ করতে পারে; [cite: 780] slice-এর মধ্যে length কত data পড়তে হবে তার একটি upper limit সেট করে। [cite: 781] এখানে `os` package-এর `File` type-এর `Read` method-এর signature: [cite: 781]

```go
func (f *File) Read(buf []byte) (n int, err error)
```

method-টি পড়া byte-এর সংখ্যা এবং একটি error value, যদি থাকে, return করে। [cite: 782] একটি বৃহত্তর buffer `buf`-এর প্রথম 32 byte-এ পড়তে, buffer-টি slice করুন (এখানে একটি verb হিসাবে ব্যবহৃত)। [cite: 783]

```go
n, err := f.Read(buf[0:32])
```

এই ধরনের slicing সাধারণ এবং efficient। প্রকৃতপক্ষে, efficiency বাদ দিলে, নিম্নলিখিত snippet-টিও buffer-এর প্রথম 32 byte পড়বে। [cite: 784]

```go
var n int
    var err error
    for i := 0; i < 32; [cite: 785]
i++ {
        nbytes, e := f.Read(buf[i:i+1])  // Read one byte. [cite: 786]
n += nbytes
        if nbytes == 0 or [cite: 787]
e != nil {
            err = e
            break
        }
    }
```

একটি slice-এর length পরিবর্তন করা যেতে পারে যতক্ষণ না এটি এখনও fits within the capacity of the underlying array। আমরা `s[lo:hi]` syntax ব্যবহার করে একটি slice-এর length বাড়াতে পারি যাতে `hi` 0 থেকে capacity পর্যন্ত হতে পারে। উদাহরণস্বরূপ, যদি আমরা `buf` slice-কে তার সম্পূর্ণ capacity পর্যন্ত extend করতে চাই, তাহলে আমরা লিখতে পারি:

```go
buf = buf[0:cap(buf)]
```

অথবা তারচেয়ে ছোট,

```go
buf = buf[:cap(buf)]
```

সাধারণত, slicing নতুন array তৈরি করে না কিন্তু existing array-তে একটি নতুন header তৈরি করে। যদি slice-টি underlying array-এর বাইরে চলে যায়, তাহলে একটি `panic` ঘটবে।

`append` built-in function হল slice-এর একটি সাধারণ case। এটি একটি slice-এ element যোগ করে এবং যদি প্রয়োজন হয় তাহলে একটি বৃহত্তর underlying array allocate করে।

```go
slice = append(slice, elem1, elem2)
slice = append(slice, anotherSlice...)
```

একটি slice-এ element append করার জন্য, `append` function-টি একটি slice এবং element-গুলোর একটি series গ্রহণ করে এবং একটি নতুন slice return করে যা extend করা slice। যদি `append`-এর জন্য underlying array-এর ধারণক্ষমতা অপর্যাপ্ত হয়, তাহলে এটি একটি নতুন, বড় array allocate করে। নতুন array-এর pointer returned slice-এর header-এ লেখা হয়। এই কারণে, returned slice-কে original slice-এর উপর assign করা আবশ্যক।

```go
a = append(a, 1, 2, 3)
```

এটি idiomatic কারণ `append` function-টি তার capacity বাড়ানোর জন্য একটি নতুন underlying array তৈরি করতে পারে।

একটি slice-এর `nil` value থাকে। একটি `nil` slice-এর length এবং capacity শূন্য। এটি একটি empty slice-এর মতো এবং `append` সহ বেশিরভাগ function-এর জন্য ব্যবহারযোগ্য। উদাহরণস্বরূপ,

```go
var s []int
s = append(s, 1, 2, 3) // s now contains [1 2 3]
```

map-এর মতো, একটি slice-এর জন্য `make` function-টি একটি initialized slice তৈরি করে, যা শূন্য (zero) নয়।

```go
s := make([]byte, 5, 5) // len=5, cap=5
```

এই কোডটি length 5 এবং capacity 5 এর একটি slice তৈরি করে।

### Map

Map-গুলো একটি unordered group of type-র key-এর উপর ভিত্তি করে value access-এর জন্য একটি convenient, powerful built-in data structure। Go-তে map-এর জন্য `make` function-টি একটি initialized map তৈরি করে।

```go
m := make(map[string]int) // Creates a map from strings to ints
```

element-গুলো assign করতে এবং access করতে আপনি bracket syntax ব্যবহার করতে পারেন:

```go
m["key"] = 10
value := m["key"]
```

একটি map-এর একটি entry test করার জন্য, আপনি একটি comma-ok assignment ব্যবহার করতে পারেন।

```go
value, ok := m["key"]
if ok {
    fmt.Println(value)
}
```

map-এর element delete করতে `delete` built-in function ব্যবহার করুন।

```go
delete(m, "key")
```

range clause-এর সাথে আপনি একটি map-এর উপর iterate করতে পারেন:

```go
for key, value := range m {
    fmt.Println(key, value)
}
```

একটি `nil` map-এর length শূন্য এবং এটি `nil`। এটি map-এর উপর iteration এবং length query করার জন্য ব্যবহারযোগ্য কিন্তু এতে কোনো element যোগ করা যাবে না।

```go
var m map[string]int // len=0, nil
m["key"] = 10        // panic: assignment to entry in nil map
```

### Channel

Channel-গুলো Go-তে concurrent execution-এর জন্য একটি শক্তিশালী primitive। Channel-গুলো একটি value pass করার জন্য একটি conduit-এর মতো কাজ করে। Channel-গুলো একটি `make` function-এর সাথেও তৈরি হয়।

```go
ch := make(chan int) // Creates an unbuffered channel of ints
```

যদি একটি channel-এর capacity না থাকে (যেমন উপরের উদাহরণে), তাহলে এটিকে unbuffered বলা হয়। Unbuffered channel-এর সাথে communication synchronized হয়। মানে, sender এবং receiver উভয়েই তাদের respective send এবং receive operation সম্পন্ন না করা পর্যন্ত ব্লক থাকবে।

যদি একটি channel-এর capacity থাকে, তাহলে এটিকে buffered বলা হয়। Buffered channel-এর সাথে communication synchronized হয় না যতক্ষণ না buffer পূর্ণ হয়।

```go
ch := make(chan int, 100) // Creates a buffered channel of ints with capacity 100
```

channel-এর মাধ্যমে value পাঠাতে `<-` operator ব্যবহার করুন:

```go
ch <- value // Send value to channel ch
```

channel-এর মাধ্যমে value পেতে `<-` operator ব্যবহার করুন:

```go
value := <-ch // Receive value from channel ch
```

একটি channel বন্ধ করতে `close` built-in function ব্যবহার করুন:

```go
close(ch)
```

যদি একটি channel বন্ধ করা হয় এবং এটিতে আরও value থাকে, তাহলে আপনি সেই value-গুলো channel থেকে receive করতে পারবেন যতক্ষণ না channel-টি empty হয়ে যায়। একবার channel-টি empty হয়ে গেলে, receive operation-গুলো `nil` value return করবে এবং `ok` flag `false` হবে।

```go
value, ok := <-ch // Receive value from channel ch, ok is false if channel is closed and empty
```

range clause-এর সাথে আপনি একটি channel থেকে value-এর উপর iterate করতে পারেন:

```go
for value := range ch {
    fmt.Println(value)
}
```

আপনি যখন একটি channel close করবেন, তখন range loop শেষ হবে।

## Concurrency

Go-তে concurrency-এর জন্য `goroutine` এবং `channel`-এর মতো শক্তিশালী primitive রয়েছে। `goroutine` হল একটি light-weight thread যা Go runtime দ্বারা manage করা হয়। আপনি `go` keyword ব্যবহার করে একটি function call-কে একটি `goroutine`-এ চালাতে পারেন:

```go
go list.Sort() // run list.Sort in a new goroutine
```

`goroutine`-গুলো একই address space-এর মধ্যে চলে, তাই shared memory-তে access synchronize করা প্রয়োজন। এই synchronization-এর জন্য `channel`-গুলো Go-এর idiomatic উপায়।

### Sync package

যদিও `channel`-গুলো বেশিরভাগ ক্ষেত্রে concurrency manage করার জন্য Go-এর preferred approach, `sync` package-টি নিম্ন-স্তরের synchronization primitive-ও প্রদান করে, যেমন `Mutex`।

### Once

`sync.Once` type এমন code execute করার জন্য একটি convenient mechanism প্রদান করে যা ঠিক একবার চালানো উচিত।

```go
var once sync.Once
func setup() {
    // ...
}
func doOnce() {
    once.Do(setup)
}
```

এটি এমন পরিস্থিতিতে উপযোগী যেখানে initialization শুধুমাত্র প্রথমবার যখন একটি resource-এর প্রয়োজন হয় তখনই করা উচিত।

## Errors

Go-তে errors-গুলো interface type `error` দ্বারা represent করা হয়।

```go
type error interface {
    Error() string
}
```

standard library-তে `errors` package-টি `error` type-এর simple implementation প্রদান করে।

```go
func New(text string) error { return &errorString{text} }

// errorString is a trivial implementation of error.
type errorString struct {
    s string
}

func (e *errorString) Error() string {
    return e.s
}
```

তাই আপনি `errors.New` ব্যবহার করে একটি simple error value তৈরি করতে পারেন:

```go
err := errors.New("something went wrong")
```

Function-গুলো সাধারণত তাদের শেষ return value হিসেবে একটি `error` return করে। যদি কোনো error না হয়, তাহলে `nil` return করা হয়।

```go
func DoSomething() error {
    // ...
    if failureCondition {
        return errors.New("failed to do something")
    }
    return nil
}
```

caller তারপর `error` value পরীক্ষা করে error handle করতে পারে:

```go
err := DoSomething()
if err != nil {
    log.Println(err)
}
```

### Panic এবং Recover

Go-তে `panic` এবং `recover` mechanism-টি exceptional error condition handle করতে ব্যবহৃত হয় যা প্রোগ্রাম flow-কে বন্ধ করে দেয়। `panic` একটি runtime error-এর কারণে ঘটতে পারে, যেমন একটি `nil` pointer dereference, অথবা এটি explicitly `panic` built-in function-টি কল করে ট্রিগার করা যেতে পারে।

যখন একটি function `panic` করে, তখন এটি স্বাভাবিকভাবে return করা বন্ধ করে দেয় এবং deferred function-গুলো execution শুরু করে। Panicking function-এর caller-ও `panic` করে, এবং এটি continue থাকে যতক্ষণ না call stack-এর top-এ পৌঁছায়, যেখানে runtime crash করে।

`recover` built-in function-টি একটি deferred function-এর ভিতরে ব্যবহার করা যেতে পারে panicking goroutine-কে আবার নিয়ন্ত্রণ নিতে। যদি `recover` কল করা হয় এবং একটি `panic` active থাকে, তাহলে `recover` panic-এর argument return করে এবং normal execution আবার শুরু হয়। যদি কোনো `panic` active না থাকে, তাহলে `recover` `nil` return করে।

`panic` এবং `recover`-এর একটি সাধারণ ব্যবহার হল এমন situation-গুলোতে প্রোগ্রাম crash না করে gracefully handle করা যেখানে একটি library function-এর অভ্যন্তরীণ inconsistency থাকে।

```go
func safeDiv(x, y int) (quotient int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic: %v", r)
        }
    }()
    return x / y, nil
}
```

এই উদাহরণে, `safeDiv` function-টি একটি panic থেকে recover করে যা 0 দিয়ে ভাগ করার ফলে ঘটতে পারে এবং একটি error return করে।

## Web applications

Go-তে built-in `net/http` package-এর সাথে web applications তৈরি করা সহজ। এখানে একটি simple web server-এর উদাহরণ রয়েছে যা `QR` কোড তৈরি করে:

```go
package main

import (
    "fmt"
    "html/template"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", QR)
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func QR(w http.ResponseWriter, req *http.Request) {
    templ := template.Must(template.New("qr").Parse(templateStr))
    err := templ.Execute(w, req.FormValue("s"))
    if err != nil {
        log.Print(err)
    }
}

const templateStr = `
<html>
<head>
<title>QR Link Generator</title>
</head>
<body>
{{if .}}
<img src="http://chart.apis.google.com/chart?chs=300x300&cht=qr&choe=UTF-8&chl={{.}}" />
<br>
{{.}}
<br>
<br>
{{end}}
<form action="/" name=f method="GET">
<input maxLength="1024" name="s" size="70" value="" title="Text to QR Encode">
<input type="submit" value="Show QR" name="qr">
</form>
</body>
</html>
`
```

এই সার্ভার `http://chart.apis.google.com/chart` ব্যবহার করে QR কোড তৈরি করতে। `main` function flag-গুলো parse করে এবং আমরা উপরে আলোচনা করেছি mechanism ব্যবহার করে `QR` function-কে সার্ভারের root path-এ bind করে। তারপর `http.ListenAndServe` সার্ভার শুরু করার জন্য কল করা হয়; সার্ভার চলাকালীন এটি block করে।

`QR` কেবল request গ্রহণ করে, যার মধ্যে form data থাকে, এবং `s` নামের form value-এর ডেটা-তে template execute করে। `html/template` package-টি শক্তিশালী; এই প্রোগ্রামটি কেবল এর capabilities-এর উপর স্পর্শ করে। সংক্ষেপে, এটি ডেটা item থেকে প্রাপ্ত element-গুলোকে প্রতিস্থাপন করে একটি HTML text-এর টুকরোকে fly-তে আবার লেখে যা `templ.Execute`-তে পাস করা হয়, এই ক্ষেত্রে form value। template text (`templateStr`)-এর মধ্যে, double-brace-delimited pieces template action বোঝায়। `{{if .}}` থেকে `{{end}}` পর্যন্ত অংশটি তখনই execute হয় যখন current data item-এর value, যাকে `.` (dot) বলা হয়, non-empty হয়। অর্থাৎ, যখন string empty হয়, এই template-এর অংশটি suppressed হয়।

দুটি snippet `{{.}}` ওয়েব পেজে template-এ উপস্থাপিত ডেটা—query string—দেখাতে বলে। HTML template package স্বয়ংক্রিয়ভাবে উপযুক্ত escaping প্রদান করে যাতে text display করার জন্য নিরাপদ হয়।

template string-এর বাকি অংশটি হল HTML যা page load হওয়ার সময় দেখানোর জন্য। যদি এটি খুব দ্রুত ব্যাখ্যা হয়, তাহলে আরও পুঙ্খানুপুঙ্খ আলোচনার জন্য template package-এর documentation দেখুন।

এবং আপনার কাছে এটি আছে: কয়েক লাইন কোডে একটি দরকারী ওয়েব সার্ভার এবং কিছু ডেটা-চালিত HTML text। Go এত শক্তিশালী যে কয়েক লাইনে অনেক কিছু ঘটে।
