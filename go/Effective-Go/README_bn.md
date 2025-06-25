# effective go

- [effective go](#effective-go)
  - [Introduction](#introduction)
    - [Examples](#examples)
  - [Formatting](#formatting)
  - [Commentary](#commentary)
  - [Names](#names)
    - [Package names](#package-names)
    - [Getters](#getters)
    - [Interface names](#interface-names)
    - [MixedCaps](#mixedcaps)
  - [Semicolons](#semicolons)
  - [Control structures](#control-structures)
    - [If](#if)
    - [Redeclaration and reassignment](#redeclaration-and-reassignment)
    - [For](#for)
    - [Switch](#switch)
    - [Type switch](#type-switch)
  - [Functions](#functions)
    - [Multiple return values](#multiple-return-values)
    - [Named result parameters](#named-result-parameters)
    - [Defer](#defer)
  - [Data](#data)
    - [Allocation with `new`](#allocation-with-new)
    - [Constructor এবং composite literal](#constructor-এবং-composite-literal)
    - [Allocation with `make`](#allocation-with-make)
    - [Array](#array)
    - [Slice](#slice)
    - [Two-dimensional slices](#two-dimensional-slices)
    - [Maps](#maps)
    - [Printing](#printing)
    - [Append](#append)
  - [Initialization](#initialization)
    - [Constants](#constants)
    - [Variables](#variables)
    - [`init` function](#init-function)
  - [Methods](#methods)
    - [Pointers vs. Values](#pointers-vs-values)
  - [Interfaces এবং অন্যান্য type](#interfaces-এবং-অন্যান্য-type)
    - [Interfaces](#interfaces)
    - [Conversions](#conversions)
    - [Interface conversions এবং type assertions](#interface-conversions-এবং-type-assertions)
    - [Generality](#generality)
    - [Interfaces এবং methods](#interfaces-এবং-methods)
  - [Blank identifier](#blank-identifier)
    - [Multiple assignment-এ blank identifier](#multiple-assignment-এ-blank-identifier)
    - [Unused imports এবং variables](#unused-imports-এবং-variables)
    - [Side effect-এর জন্য Import](#side-effect-এর-জন্য-import)
    - [Interface checks](#interface-checks)
  - [Embedding](#embedding)
  - [Concurrency](#concurrency)
    - [Share by communicating](#share-by-communicating)
    - [Goroutines](#goroutines)
    - [Channels](#channels)
    - [Channels of channels](#channels-of-channels)
    - [Parallelization](#parallelization)
    - [A leaky buffer](#a-leaky-buffer)
  - [Errors](#errors)
    - [Panic](#panic)
    - [Recover](#recover)
  - [A web server](#a-web-server)

## Introduction

Go একটি নতুন language। যদিও এটি বিদ্যমান language-গুলো থেকে ধারণা borrow করে, এটির unusual properties আছে যা effective Go program-গুলিকে এর আত্মীয় language-গুলোতে লেখা program-গুলো থেকে চরিত্রে ভিন্ন করে তোলে। একটি C++ বা Java program-এর সরল অনুবাদ Go-তে একটি satisfactory result তৈরি করবে না - Java program Java-তে লেখা হয়, Go-তে নয়। অন্যদিকে, একটি Go perspective থেকে সমস্যা সম্পর্কে চিন্তা করলে একটি successful কিন্তু বেশ ভিন্ন program তৈরি হতে পারে। অন্য কথায়, Go ভালোভাবে লিখতে হলে, এর properties এবং idiom বোঝা গুরুত্বপূর্ণ। Go-তে programming-এর জন্য প্রতিষ্ঠিত convention-গুলো যেমন naming, formatting, program construction, এবং অন্যান্য বিষয় জানা গুরুত্বপূর্ণ, যাতে আপনার লেখা program-গুলি অন্য Go programmer-দের পক্ষে বোঝা সহজ হয়।

এই documentটি clear, idiomatic Go code লেখার জন্য tips দেয়। এটি language specification, Tour of Go, এবং How to Write Go Code-কে augment করে, যার সবগুলিই আপনার প্রথমে পড়া উচিত।

জানুয়ারি, 2022-এ যোগ করা Note: এই documentটি 2009 সালে Go-এর release-এর জন্য লেখা হয়েছিল এবং তারপর থেকে উল্লেখযোগ্যভাবে update করা হয়নি। যদিও এটি languageটি নিজেই কীভাবে ব্যবহার করতে হয় তা বোঝার জন্য একটি ভালো guide, language-এর stability-এর কারণে, এটি library-গুলি সম্পর্কে খুব কমই বলে এবং লেখার পর থেকে Go ecosystem-এর উল্লেখযোগ্য পরিবর্তনগুলি সম্পর্কে কিছুই বলে না, যেমন build system, testing, module, এবং polymorphism। এটি update করার কোনো পরিকল্পনা নেই, কারণ অনেক কিছু ঘটেছে এবং document, blog এবং book-এর একটি বড় এবং ক্রমবর্ধমান সেট modern Go usage-এর একটি চমৎকার বিবরণ দেয়। Effective Go এখনও useful, কিন্তু পাঠককে বুঝতে হবে যে এটি একটি সম্পূর্ণ guide থেকে অনেক দূরে। context-এর জন্য issue 28782 দেখুন।

### Examples

Go package source-গুলি শুধুমাত্র core library হিসাবে নয় বরং languageটি কীভাবে ব্যবহার করতে হয় তার উদাহরণ হিসাবেও কাজ করার জন্য তৈরি করা হয়েছে। উপরন্তু, অনেক package-এ working, self-contained executable example রয়েছে যা আপনি সরাসরি go.dev web site থেকে চালাতে পারেন, যেমন এই একটি (যদি প্রয়োজন হয়, এটি খুলতে "Example" শব্দটিতে ক্লিক করুন)। যদি আপনার কোনো সমস্যা সমাধানের পদ্ধতি বা কিছু কীভাবে implement করা যেতে পারে সে সম্পর্কে প্রশ্ন থাকে, তাহলে library-এর documentation, code এবং example উত্তর, ধারণা এবং background সরবরাহ করতে পারে।

## Formatting

Formatting-এর সমস্যাগুলি সবচেয়ে contentious কিন্তু সবচেয়ে কম consequential। লোকেরা বিভিন্ন formatting style-এর সাথে মানিয়ে নিতে পারে তবে তাদের যদি এটি না করতে হয় তবে তা ভালো, এবং যদি সবাই একই style মেনে চলে তবে এই বিষয়ে কম সময় ব্যয় হয়। সমস্যাটি হল একটি দীর্ঘ prescriptive style guide ছাড়া এই Utopia-তে কীভাবে পৌঁছানো যায়।

Go-এর সাথে আমরা একটি unusual approach নিই এবং machine-কে বেশিরভাগ formatting-এর সমস্যাগুলির যত্ন নিতে দিই। `gofmt` program (যা `go fmt` হিসাবেও উপলব্ধ, যা source file level-এর পরিবর্তে package level-এ কাজ করে) একটি Go program পড়ে এবং indentation এবং vertical alignment-এর একটি standard style-এ source output করে, comment-গুলি ধরে রাখে এবং প্রয়োজন হলে reformat করে। যদি আপনি জানতে চান যে কিছু নতুন layout situation কীভাবে handle করবেন, `gofmt` চালান; যদি উত্তরটি সঠিক বলে মনে না হয়, আপনার program (বা `gofmt` সম্পর্কে একটি bug file করুন) reorganize করুন, এটি work around করবেন না।

উদাহরণস্বরূপ, একটি structure-এর field-এর comment-গুলি lining up করতে সময় ব্যয় করার প্রয়োজন নেই। `Gofmt` আপনার জন্য এটি করবে। Declaration দেওয়া থাকলে:

```go
type T struct {
    name string // name of the object
    value int // its value
}
```

`gofmt` column-গুলি line up করবে:

```go
type T struct {
    name    string // name of the object
    value   int    // its value
}
```

standard package-এর সমস্ত Go code `gofmt` দ্বারা formatted হয়েছে।

কিছু formatting detail রয়ে গেছে। খুব সংক্ষেপে:

**Indentation**
আমরা indentation-এর জন্য tab ব্যবহার করি এবং `gofmt` default-ভাবে সেগুলো output করে। শুধুমাত্র প্রয়োজন হলেই space ব্যবহার করুন।

**Line length**
Go-এর কোনো line length limit নেই। একটি punched card overflow হওয়ার বিষয়ে চিন্তা করবেন না। যদি একটি line খুব দীর্ঘ মনে হয়, তবে সেটি wrap করুন এবং একটি extra tab দিয়ে indent করুন।

**Parentheses**
Go-এর C এবং Java-এর চেয়ে কম parentheses প্রয়োজন: control structure (if, for, switch) তাদের syntax-এ parentheses থাকে না। এছাড়াও, operator precedence hierarchy ছোট এবং clear, so

```go
x<<8 + y<<16
```

অন্যান্য language-এর মত নয়, spacing যা বোঝায় তাই মানে।

## Commentary

Go C-style `/* */` block comment এবং C++-style `//` line comment প্রদান করে। Line comment-গুলিই norm; block comment-গুলি বেশিরভাগই package comment হিসাবে প্রদর্শিত হয়, তবে একটি expression-এর মধ্যে বা large swathes of code disable করার জন্য useful।

Top-level declaration-এর আগে, কোনো intervening newline ছাড়া যে comment-গুলি প্রদর্শিত হয়, সেগুলোকে declarationটি itself document করে বলে মনে করা হয়। এই “doc comment”-গুলি একটি given Go package বা command-এর primary documentation। doc comment সম্পর্কে আরও জানতে, “Go Doc Comment” দেখুন।

## Names

Go-তে name-গুলি অন্য যেকোনো language-এর মতোই গুরুত্বপূর্ণ। তাদের semantic effect-ও আছে: একটি package-এর বাইরে একটি name-এর visibility নির্ধারিত হয় এর প্রথম character upper case কিনা তার উপর। তাই Go program-এ naming convention সম্পর্কে একটু সময় ব্যয় করা worth it।

### Package names

যখন একটি package import করা হয়, তখন package name content-এর জন্য একটি accessor হয়ে যায়।

```go
import "bytes"
```

এর পরে importing package `bytes.Buffer` সম্পর্কে কথা বলতে পারে। এটি helpful হয় যদি packageটি ব্যবহারকারী সবাই এর content-এর জন্য একই name ব্যবহার করতে পারে, যার অর্থ package nameটি ভালো হওয়া উচিত: short, concise, evocative। convention অনুযায়ী, package-গুলিকে lower case, single-word name দেওয়া হয়; underscore বা mixedCaps-এর প্রয়োজন নেই। সংক্ষেপে ভুল করুন, কারণ আপনার package ব্যবহারকারী সবাই সেই nameটি type করবে। এবং `a priori` collision নিয়ে চিন্তা করবেন না। package name শুধুমাত্র import-এর জন্য default name; এটি সমস্ত source code জুড়ে unique হওয়ার প্রয়োজন নেই, এবং collision-এর বিরল ক্ষেত্রে importing package locally ব্যবহার করার জন্য একটি ভিন্ন name বেছে নিতে পারে। যেকোনো ক্ষেত্রে, confusion বিরল কারণ import-এর file nameটি নির্ধারণ করে কোন package ব্যবহার করা হচ্ছে।

আরেকটি convention হল যে package nameটি এর source directory-এর base name; `src/encoding/base64`-এর packageটি `"encoding/base64"` হিসাবে import করা হয় কিন্তু এর name `base64`, `encoding_base64` নয় এবং `encodingBase64` নয়।

একটি package-এর importer এর content-কে refer করার জন্য nameটি ব্যবহার করবে, তাই package-এর exported name-গুলি পুনরাবৃত্তি এড়াতে সেই fact ব্যবহার করতে পারে। (`import .` notation ব্যবহার করবেন না, যা যে package-গুলো testing করা হচ্ছে তার বাইরে running test-গুলো সহজ করতে পারে, কিন্তু অন্যথায় এড়ানো উচিত।) উদাহরণস্বরূপ, `bufio` package-এর buffered reader type-কে `Reader` বলা হয়, `BufReader` নয়, কারণ ব্যবহারকারীরা এটিকে `bufio.Reader` হিসাবে দেখে, যা একটি clear, concise name। উপরন্তু, যেহেতু imported entity-গুলি সর্বদা তাদের package name দিয়ে address করা হয়, `bufio.Reader` `io.Reader`-এর সাথে conflict করে না। একইভাবে, `ring.Ring`-এর নতুন instance তৈরি করার function - যা Go-তে একটি constructor-এর definition - সাধারণত `NewRing` নামে পরিচিত হবে, কিন্তু যেহেতু `Ring` package দ্বারা export করা একমাত্র type, এবং যেহেতু packageটির নাম `ring`, এটিকে কেবল `New` বলা হয়, যা package-এর client-রা `ring.New` হিসাবে দেখে। ভালো name বেছে নিতে আপনাকে সাহায্য করার জন্য package structure ব্যবহার করুন।

আরেকটি short উদাহরণ হল `once.Do`; `once.Do(setup)` ভালোভাবে পড়া যায় এবং `once.DoOrWaitUntilDone(setup)` লিখে এটিকে উন্নত করা যাবে না। Long name স্বয়ংক্রিয়ভাবে জিনিসগুলিকে আরও readable করে তোলে না। একটি helpful doc comment প্রায়শই একটি extra long name-এর চেয়ে বেশি valuable হতে পারে।

### Getters

Go getter এবং setter-এর জন্য automatic support প্রদান করে না। আপনার নিজের getter এবং setter প্রদান করা ঠিক আছে, এবং এটি প্রায়শই উপযুক্ত হয়, কিন্তু getter-এর name-এ `Get` রাখা idiomatic বা necessary নয়। যদি আপনার একটি field `owner` (lower case, unexported) থাকে, তাহলে getter method-কে `Owner` (upper case, exported) বলা উচিত, `GetOwner` নয়। export-এর জন্য upper-case name ব্যবহার field থেকে method-কে discriminate করার জন্য hook প্রদান করে। একটি setter function, যদি প্রয়োজন হয়, সম্ভবত `SetOwner` নামে পরিচিত হবে। উভয় name practice-এ ভালোভাবে পড়া যায়:

```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```

### Interface names

convention অনুযায়ী, one-method interface-এর নাম method name-এর সাথে একটি `-er` suffix বা agent noun তৈরি করার জন্য অনুরূপ modification দ্বারা রাখা হয়: `Reader`, `Writer`, `Formatter`, `CloseNotifier` ইত্যাদি।

এই ধরনের অনেক name আছে এবং তাদের এবং তারা যে function name-গুলো capture করে সেগুলিকে সম্মান করা productive। `Read`, `Write`, `Close`, `Flush`, `String` এবং অন্যান্যগুলির canonical signature এবং meaning আছে। confusion এড়াতে, আপনার method-কে সেই name-গুলোর মধ্যে একটি দেবেন না যদি না এটির একই signature এবং meaning না থাকে। বিপরীতভাবে, যদি আপনার type একটি well-known type-এর একটি method-এর মতো একই meaning সহ একটি method implement করে, তাহলে এটিকে একই name এবং signature দিন; আপনার string-converter method-কে `String` বলুন `ToString` নয়।

### MixedCaps

অবশেষে, Go-তে convention হল multiword name লেখার জন্য underscore-এর পরিবর্তে `MixedCaps` বা `mixedCaps` ব্যবহার করা।

## Semicolons

C-এর মতো, Go-এর formal grammar statement terminate করার জন্য semicolon ব্যবহার করে, কিন্তু C-এর বিপরীতে, সেই semicolon-গুলি source-এ প্রদর্শিত হয় না। পরিবর্তে lexer scan করার সময় স্বয়ংক্রিয়ভাবে semicolon insert করার জন্য একটি simple rule ব্যবহার করে, তাই input text বেশিরভাগই সেগুলি থেকে মুক্ত।

ruleটি হল এটি। যদি একটি newline-এর আগে শেষ tokenটি একটি identifier হয় (যার মধ্যে `int` এবং `float64` এর মতো শব্দ অন্তর্ভুক্ত), একটি basic literal যেমন একটি number বা string constant, বা token-গুলির মধ্যে একটি হয়:

`break continue fallthrough return ++ -- ) }`

lexer সর্বদা token-এর পরে একটি semicolon insert করে। এটিকে এভাবে summarize করা যেতে পারে, “যদি newline একটি token-এর পরে আসে যা একটি statement শেষ করতে পারে, একটি semicolon insert করুন”।

একটি closing brace-এর ঠিক আগে একটি semicolon বাদ দেওয়া যেতে পারে, তাই একটি statement যেমন:

```go
    go func() { for { dst <- <-src } }()
```

কোনো semicolon-এর প্রয়োজন নেই। Idiomatic Go program-গুলিতে semicolon শুধুমাত্র `for` loop clause-এর মতো জায়গায় থাকে, initializer, condition এবং continuation element-গুলিকে separate করতে। যদি আপনি সেভাবে code লেখেন তবে একটি line-এ একাধিক statement separate করার জন্যও সেগুলি প্রয়োজনীয়।

semicolon insertion rule-এর একটি consequence হল যে আপনি একটি control structure (if, for, switch, বা select)-এর opening brace পরের line-এ রাখতে পারবেন না। যদি আপনি তা করেন, তাহলে brace-এর আগে একটি semicolon insert করা হবে, যা unwanted effect ঘটাতে পারে। সেগুলোকে এভাবে লিখুন:

```go
if i < f() {
    g()
}
```

এভাবে নয়:

```go
if i < f()  // wrong!
{           // wrong!
    g()
}
```

## Control structures

Go-এর control structure-গুলি C-এর সাথে সম্পর্কিত কিন্তু গুরুত্বপূর্ণ উপায়ে ভিন্ন। কোনো `do` বা `while` loop নেই, শুধুমাত্র একটি সামান্য generalized `for`; `switch` আরও flexible; `if` এবং `switch` একটি optional initialization statement গ্রহণ করে `for`-এর মতো; `break` এবং `continue` statement-গুলি কী break বা continue করতে হবে তা identify করার জন্য একটি optional label নেয়; এবং একটি type switch এবং একটি multiway communication multiplexer, `select` সহ নতুন control structure রয়েছে। syntax-ও সামান্য ভিন্ন: কোনো parentheses নেই এবং body-গুলি সর্বদা brace-delimited হতে হবে।

### If

Go-তে একটি simple `if` দেখতে এমন:

```go
if x > 0 {
    return y
}
```

Mandatory brace-গুলি multiple line-এ simple `if` statement লিখতে উৎসাহিত করে। যাইহোক, এটি করা ভালো style, বিশেষ করে যখন body-তে `return` বা `break`-এর মতো একটি control statement থাকে।

যেহেতু `if` এবং `switch` একটি initialization statement গ্রহণ করে, তাই একটি local variable সেট আপ করতে এটি ব্যবহার করা সাধারণ।

```go
if err := file.Chmod(0664); err != nil {
    log.Print(err)
    return err
}
```

Go library-গুলিতে, আপনি দেখতে পাবেন যে যখন একটি `if` statement পরের statement-এ flow করে না — অর্থাৎ, body `break`, `continue`, `goto`, বা `return`-এ শেষ হয় — তখন অপ্রয়োজনীয় `else` বাদ দেওয়া হয়।

```go
f, err := os.Open(name)
if err != nil {
    return err
}
codeUsing(f)
```

এটি একটি সাধারণ পরিস্থিতির উদাহরণ যেখানে code-কে error condition-এর একটি sequence-এর বিরুদ্ধে guard করতে হবে। যদি control-এর successful flow page-এর নিচে চলে যায়, তাহলে error case-গুলি যেমনটি ঘটে তেমনি eliminate করে codeটি ভালোভাবে পড়া যায়। যেহেতু error case-গুলি `return` statement-এ শেষ হয়, তাই resulting code-এর কোনো `else` statement-এর প্রয়োজন হয় না।

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

### Redeclaration and reassignment

একটি aside: আগের section-এর শেষ উদাহরণটি `:=` short declaration form কীভাবে কাজ করে তার একটি detail দেখায়। `os.Open` call করা declarationটি এমন:

```go
f, err := os.Open(name)
```

এই statementটি দুটি variable, `f` এবং `err` declare করে। কয়েকটি line পরে, `f.Stat` callটি এমন:

```go
d, err := f.Stat()
```

যা দেখে মনে হচ্ছে এটি `d` এবং `err` declare করে। তবে, খেয়াল করুন, `err` উভয় statement-এই প্রদর্শিত হয়। এই duplicationটি legal: `err` প্রথম statement দ্বারা declared হয়েছে, কিন্তু দ্বিতীয়টিতে শুধুমাত্র `re-assigned` হয়েছে। এর মানে হল যে `f.Stat` call উপরে declared বিদ্যমান `err` variable ব্যবহার করে, এবং এটিকে কেবল একটি নতুন value দেয়।

একটি `:=` declaration-এ একটি variable `v` প্রদর্শিত হতে পারে যদিও এটি ইতিমধ্যেই declared হয়েছে, যদি:

* এই declarationটি `v`-এর বিদ্যমান declaration-এর মতো একই scope-এ থাকে (যদি `v` ইতিমধ্যেই একটি outer scope-এ declared থাকে, তাহলে declarationটি একটি নতুন variable তৈরি করবে §),
* initialization-এর corresponding value `v`-তে assignable হয়, এবং
* declaration দ্বারা অন্তত আরও একটি variable তৈরি হয়।

এই unusual propertyটি pure pragmatism, যা একটি single `err` value ব্যবহার করা সহজ করে তোলে, উদাহরণস্বরূপ, একটি দীর্ঘ `if-else` chain-এ। আপনি এটি প্রায়শই ব্যবহার হতে দেখবেন।

§ এখানে উল্লেখ করা উচিত যে Go-তে function parameter এবং return value-এর scope function body-এর মতোই, যদিও তারা body-কে ঘিরে থাকা brace-এর বাইরে lexically প্রদর্শিত হয়।

### For

Go `for` loop C-এর মতো — কিন্তু একই নয়। এটি `for` এবং `while`-কে একত্রিত করে এবং কোনো `do-while` নেই। তিনটি form আছে, যার মধ্যে শুধুমাত্র একটিতে semicolon আছে।

```go
// Like a C for
for init; condition; post { }

// Like a while
for condition { }

// Like a C for(;;)
for { }
```

Short declaration-গুলি loop-এর মধ্যে index variable declare করা সহজ করে তোলে।

```go
sum := 0
for i := 0; i < 10; i++ {
    sum += i
}
```

যদি আপনি একটি array, slice, string, বা map-এর উপর looping করছেন, অথবা একটি channel থেকে পড়ছেন, তাহলে একটি `range` clause loopটি manage করতে পারে।

```go
for key, value := range oldMap {
    newMap[key] = value
}
```

যদি আপনার range-এর মধ্যে শুধুমাত্র প্রথম item (key বা index) প্রয়োজন হয়, তাহলে দ্বিতীয়টি বাদ দিন:

```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```

যদি আপনার range-এর মধ্যে শুধুমাত্র দ্বিতীয় item (value) প্রয়োজন হয়, তাহলে প্রথমটি discard করার জন্য blank identifier, একটি underscore, ব্যবহার করুন:

```go
sum := 0
for _, value := range array {
    sum += value
}
```

Blank identifier-এর অনেক ব্যবহার আছে, যা একটি later section-এ বর্ণনা করা হয়েছে।

string-এর জন্য, `range` আপনার জন্য আরও কাজ করে, UTF-8 parse করে individual Unicode code point ভেঙে বের করে। Erroneous encoding এক byte consume করে এবং replacement rune U+FFFD তৈরি করে। (name (associated builtin type সহ) `rune` হল একটি single Unicode code point-এর জন্য Go terminology। বিস্তারিত জানার জন্য language specification দেখুন।) loop:

```go
for pos, char := range "日本\x80語" { // \x80 is an illegal UTF-8 encoding
    fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}
```

print করে:

```
character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```

অবশেষে, Go-এর কোনো comma operator নেই এবং `++` এবং `--` expression নয় বরং statement। সুতরাং যদি আপনি একটি `for`-এ একাধিক variable চালাতে চান তবে আপনার parallel assignment ব্যবহার করা উচিত (যদিও এটি `++` এবং `--` precludes করে)।

```go
// Reverse a
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
    a[i], a[j] = a[j], a[i]
}
```

### Switch

Go-এর `switch` C-এর চেয়ে বেশি general। expression-গুলির constant বা এমনকি integer হওয়ার প্রয়োজন নেই, case-গুলি match পাওয়া পর্যন্ত top to bottom evaluate করা হয়, এবং যদি `switch`-এর কোনো expression না থাকে তবে এটি `true`-তে switch করে। তাই একটি `if-else-if-else` chain-কে একটি `switch` হিসাবে লেখা সম্ভব — এবং idiomatic।

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

কোনো automatic fall through নেই, তবে case-গুলি comma-separated list-এ উপস্থাপন করা যেতে পারে।

```go
func shouldEscape(c byte) bool {
    switch c {
    case ' ', '?', '&', '=', '#', '+', '%':
        return true
    }
    return false
}
```

যদিও তারা Go-তে C-এর মতো অন্যান্য language-এর তুলনায় ততটা common নয়, `break` statement-গুলি একটি `switch` তাড়াতাড়ি terminate করতে ব্যবহার করা যেতে পারে। কখনও কখনও, switch নয় বরং একটি surrounding loop থেকে break করা প্রয়োজন হয়, এবং Go-তে এটি loop-এ একটি label রেখে এবং সেই label-এ "breaking" করে অর্জন করা যায়। এই উদাহরণটি উভয় ব্যবহার দেখায়।

```go
Loop:
    for n := 0; n < len(src); n += size {
        switch {
        case src[n] < sizeOne:
            if validateOnly {
                break
            }
            size = 1
            update(src[n])

        case src[n] < sizeTwo:
            if n+1 >= len(src) {
                err = errShortInput
                break Loop
            }
            if validateOnly {
                break
            }
            size = 2
            update(src[n] + src[n+1]<<shift)
        }
    }
```

অবশ্যই, `continue` statement-ও একটি optional label গ্রহণ করে কিন্তু এটি শুধুমাত্র loop-এর ক্ষেত্রে প্রযোজ্য।

এই sectionটি শেষ করতে, এখানে byte slice-এর জন্য একটি comparison routine রয়েছে যা দুটি `switch` statement ব্যবহার করে:

```go
// Compare returns an integer comparing the two byte slices,
// lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b
func Compare(a, b []byte) int {
    for i := 0; i < len(a) && i < len(b); i++ {
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
    case len(a) < len(b):
        return -1
    }
    return 0
}
```

### Type switch

একটি switch একটি interface variable-এর dynamic type আবিষ্কার করতেও ব্যবহার করা যেতে পারে। এই ধরনের একটি `type switch` parentheses-এর ভিতরে `type` keyword সহ একটি type assertion-এর syntax ব্যবহার করে। যদি switch expression-এ একটি variable declare করে, তাহলে variableটি প্রতিটি clause-এ corresponding type থাকবে। এই ধরনের ক্ষেত্রে nameটি reuse করাও idiomatic, কার্যকরভাবে প্রতিটি case-এ একই name কিন্তু ভিন্ন type সহ একটি নতুন variable declare করে।

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
    fmt.Printf("pointer to integer %d\n", *t) // t has type *int
}
```

## Functions

### Multiple return values

Go-এর একটি unusual feature হল যে function এবং method-গুলি multiple value return করতে পারে। এই formটি C program-এর কয়েকটি clumsy idiom উন্নত করতে ব্যবহার করা যেতে পারে: in-band error return যেমন EOF-এর জন্য `-1` এবং address দ্বারা passed একটি argument modify করা।

C-তে, একটি write error একটি negative count দ্বারা signal করা হয় যেখানে error code একটি volatile location-এ গোপনে রাখা হয়। Go-তে, `Write` একটি count `এবং` একটি error return করতে পারে: “হ্যাঁ, আপনি কিছু byte লিখেছেন কিন্তু সবগুলি নয় কারণ আপনি deviceটি full করেছেন”। `os` package থেকে file-এর উপর `Write` method-এর signature হল:

```go
func (file *File) Write(b []byte) (n int, err error)
```

এবং documentation যেমনটি বলে, এটি লেখা byte-এর সংখ্যা এবং একটি non-nil `error` return করে যখন `n` != `len(b)`। এটি একটি common style; আরও উদাহরণের জন্য error handling-এর section দেখুন।

একটি অনুরূপ approach reference parameter simulate করার জন্য return value-এর একটি pointer pass করার প্রয়োজনীয়তা obviate করে। এখানে একটি simple-minded function রয়েছে যা একটি byte slice-এর একটি position থেকে একটি number নিতে পারে, number এবং পরের position return করে।

```go
func nextInt(b []byte, i int) (int, int) {
    for ; i < len(b) && !isDigit(b[i]); i++ {
    }
    x := 0
    for ; i < len(b) && isDigit(b[i]); i++ {
        x = x*10 + int(b[i]) - '0'
    }
    return x, i
}
```

আপনি ইনপুট slice `b`-তে number scan করতে এটি এভাবে ব্যবহার করতে পারেন:

```go
    for i := 0; i < len(b); {
        x, i = nextInt(b, i)
        fmt.Println(x)
    }
```

### Named result parameters

Go function-এর return বা result "parameter"-গুলিকে নাম দেওয়া যেতে পারে এবং regular variable-এর মতো ব্যবহার করা যেতে পারে, ঠিক incoming parameter-এর মতো। যখন named হয়, তখন function শুরু হওয়ার সময় তাদের type-এর জন্য zero value-তে initialized হয়; যদি functionটি কোনো arguments ছাড়া একটি `return` statement execute করে, তাহলে result parameter-এর current value-গুলি returned value হিসাবে ব্যবহৃত হয়।

নামগুলি mandatory নয় তবে তারা code-কে ছোট এবং clear করতে পারে: তারা documentation। যদি আমরা `nextInt`-এর result-গুলি name দিই, তাহলে স্পষ্ট হয়ে যায় যে কোন returned `int` কোনটি।

```go
func nextInt(b []byte, pos int) (value, nextPos int) {
```

কারণ named result-গুলি initialized হয় এবং একটি unadorned return-এর সাথে tied হয়, তারা সরলীকরণ এবং clarify উভয়ই করতে পারে। এখানে `io.ReadFull`-এর একটি সংস্করণ রয়েছে যা সেগুলিকে ভালোভাবে ব্যবহার করে:

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

### Defer

Go-এর `defer` statement একটি function call (deferred function) schedule করে যা `defer` execute করা function return করার ঠিক আগে চালানো হবে। এটি একটি unusual কিন্তু effective উপায় যা এমন পরিস্থিতি মোকাবেলা করার জন্য যেখানে resource-গুলি অবশ্যই release করতে হবে regardless of which path a function takes to return। canonical উদাহরণগুলি হল একটি mutex unlock করা বা একটি file close করা।

```go
// Contents returns the file's contents as a string.
func Contents(filename string) (string, error) {
    f, err := os.Open(filename)
    if err != nil {
        return "", err
    }
    defer f.Close()  // f.Close will run when we're finished.

    var result []byte
    buf := make([]byte, 100)
    for {
        n, err := f.Read(buf[0:])
        result = append(result, buf[0:n]...) // append is discussed later.
        if err != nil {
            if err == io.EOF {
                break
            }
            return "", err  // f will be closed if we return here.
        }
    }
    return string(result), nil // f will be closed if we return here.
}
```

`Close`-এর মতো একটি function-এর call defer করার দুটি সুবিধা রয়েছে। প্রথমত, এটি guarantee করে যে আপনি fileটি close করতে ভুলবেন না, যা একটি ভুল যা আপনি যদি পরে functionটি edit করে একটি নতুন return path যোগ করেন তবে সহজেই ঘটতে পারে। দ্বিতীয়ত, এর মানে হল যে closeটি open-এর কাছাকাছি থাকে, যা function-এর শেষে স্থাপন করার চেয়ে অনেক clearer।

deferred function-এর argument-গুলি (যার মধ্যে receiverও অন্তর্ভুক্ত থাকে যদি functionটি একটি method হয়) `defer` execute হওয়ার সময় evaluate হয়, `call` execute হওয়ার সময় নয়। function execute হওয়ার সময় variable-এর value পরিবর্তিত হওয়ার বিষয়ে worry এড়ানো ছাড়াও, এর মানে হল যে একটি single deferred call site একাধিক function execution defer করতে পারে। এখানে একটি silly উদাহরণ দেওয়া হল।

```go
for i := 0; i < 5; i++ {
    defer fmt.Printf("%d ", i)
}
```

Deferred function-গুলি LIFO order-এ execute হয়, তাই এই codeটি function return করার সময় `4 3 2 1 0` print করবে। একটি আরও plausible উদাহরণ হল program জুড়ে function execution trace করার একটি simple উপায়। আমরা দুটি simple tracing routine এভাবে লিখতে পারি:

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

deferred function-এর argument-গুলি `defer` execute হওয়ার সময় evaluate হয় এই fact-টি ব্যবহার করে আমরা আরও ভালো কিছু করতে পারি। tracing routineটি untracing routine-এর জন্য argument সেট আপ করতে পারে। এই উদাহরণটি:

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

print করে:

```
entering: b
in b
entering: a
in a
leaving: a
leaving: b
```

অন্যান্য language থেকে block-level resource management-এ অভ্যস্ত programmer-দের জন্য, `defer` অদ্ভুত মনে হতে পারে, কিন্তু এর সবচেয়ে interesting এবং powerful application-গুলি ঠিক এই fact থেকেই আসে যে এটি block-based নয় বরং function-based। `panic` এবং `recover` সম্পর্কে section-এ আমরা এর সম্ভাবনার আরেকটি উদাহরণ দেখব।

## Data

### Allocation with `new`

Go-তে দুটি allocating primitive আছে, built-in function `new` এবং `make`। তারা ভিন্ন কাজ করে এবং ভিন্ন type-এর ক্ষেত্রে প্রযোজ্য, যা confusing হতে পারে, তবে rule-গুলো simple। `new` নিয়ে কথা বলি। এটি একটি built-in function যা memory allocate করে, কিন্তু অন্যান্য ভাষার namesake-গুলোর মতো এটি memory initialize করে না, এটি কেবল zero করে। অর্থাৎ, `new(T)` type `T`-এর একটি নতুন item-এর জন্য zeroed storage allocate করে এবং এর address return করে, একটি `*T` type-এর value। Go terminology-তে, এটি type `T`-এর একটি newly allocated zero value-এর pointer return করে।

যেহেতু `new` দ্বারা returned memory zeroed হয়, তাই আপনার data structure design করার সময় প্রতিটি type-এর zero value আরও initialization ছাড়াই ব্যবহার করা যেতে পারে তা নিশ্চিত করা সহায়ক। এর অর্থ হল data structure-এর একজন user `new` দিয়ে একটি তৈরি করতে পারে এবং সরাসরি কাজ শুরু করতে পারে। উদাহরণস্বরূপ, documentation বলে যে "Buffer-এর জন্য zero value হল একটি empty buffer যা ব্যবহারের জন্য ready।" একইভাবে, `sync.Mutex`-এর কোনো explicit constructor বা `Init` method নেই। পরিবর্তে, `sync.Mutex`-এর জন্য zero value একটি unlocked mutex হিসাবে define করা হয়।

zero-value-is-useful property transitive-ভাবে কাজ করে। এই type declaration বিবেচনা করুন।

```go
type SyncedBuffer struct {
    lock    sync.Mutex
    buffer  bytes.Buffer
}
```

`SyncedBuffer` type-এর value-গুলি allocation বা কেবল declaration-এর পরেই অবিলম্বে ব্যবহারের জন্য ready। পরবর্তী snippet-এ, `p` এবং `v` উভয়ই আরও ব্যবস্থা ছাড়াই সঠিকভাবে কাজ করবে।

```go
p := new(SyncedBuffer)  // type *SyncedBuffer
var v SyncedBuffer      // type  SyncedBuffer
```

### Constructor এবং composite literal

কখনও কখনও zero value যথেষ্ট হয় না এবং একটি initializing constructor প্রয়োজন হয়, যেমন এই উদাহরণ।

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

এখানে প্রচুর boilerplate আছে। আমরা একটি composite literal ব্যবহার করে এটি simple করতে পারি, যা একটি expression যা evaluate করা হলে প্রতিবার একটি নতুন instance তৈরি করে।

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```

লক্ষ্য করুন যে, C-এর বিপরীতে, একটি local variable-এর address return করা পুরোপুরি ঠিক আছে; variable-এর সাথে সংশ্লিষ্ট storage function return করার পরেও টিকে থাকে। প্রকৃতপক্ষে, একটি composite literal-এর address নিলে প্রতিবার evaluate করা হলে একটি fresh instance allocate হয়, তাই আমরা এই শেষ দুটি line একত্রিত করতে পারি।

```go
return &File{fd, name, nil, 0}
```

একটি composite literal-এর field-গুলো order-এ সাজানো থাকে এবং সবগুলি অবশ্যই উপস্থিত থাকতে হবে। তবে, element-গুলোকে explicitly `field: value` pair হিসাবে label করে, initializer-গুলো যেকোনো order-এ প্রদর্শিত হতে পারে, অনুপস্থিতগুলি তাদের নিজ নিজ zero value হিসাবে রেখে।

সুতরাং আমরা বলতে পারি:

```go
return &File{fd: fd, name: name}
```

একটি limiting case হিসাবে, যদি একটি composite literal-এ কোনো field না থাকে, তাহলে এটি type-এর জন্য একটি zero value তৈরি করে। `new(File)` এবং `&File{}` expression-গুলো equivalent।

composite literal-গুলো array, slice এবং map-এর জন্যও তৈরি করা যেতে পারে, field label-গুলো index বা map key হিসাবে উপযুক্তভাবে। এই উদাহরণগুলিতে, initialization `Enone`, `Eio`, এবং `Einval`-এর value নির্বিশেষে কাজ করে, যতক্ষণ না তারা distinct হয়।

```go
a := [...]string   {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
s := []string      {Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
m := map[int]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
```

### Allocation with `make`

Allocation-এ ফিরে আসি। built-in function `make(T, args)` `new(T)` থেকে ভিন্ন purpose-এ কাজ করে। এটি শুধুমাত্র slice, map, এবং channel তৈরি করে, এবং এটি type `T`-এর একটি initialized (zeroed নয়) value return করে (`*T` নয়)। পার্থক্যের কারণ হল এই তিনটি type, internal-ভাবে, data structure-এর reference represent করে যা ব্যবহারের আগে initialize করতে হবে। উদাহরণস্বরূপ, একটি slice হল একটি তিন-item descriptor যার মধ্যে data (একটি array-এর ভিতরে), length, এবং capacity-এর একটি pointer থাকে, এবং যতক্ষণ না এই item-গুলো initialized হয়, slice-টি `nil`। slice, map, এবং channel-এর জন্য, `make` internal data structure initialize করে এবং ব্যবহারের জন্য value তৈরি করে। উদাহরণস্বরূপ,

```go
make([]int, 10, 100)
```

100টি int-এর একটি array allocate করে এবং তারপর length 10 এবং capacity 100 সহ একটি slice structure তৈরি করে যা array-এর প্রথম 10টি element-কে নির্দেশ করে। (একটি slice তৈরি করার সময়, capacity বাদ দেওয়া যেতে পারে; আরও তথ্যের জন্য slices section দেখুন।) বিপরীতে, `new([]int)` একটি newly allocated, zeroed slice structure-এর একটি pointer return করে, অর্থাৎ, একটি `nil` slice value-এর একটি pointer।

এই উদাহরণগুলি `new` এবং `make`-এর মধ্যে পার্থক্য তুলে ধরে।

```go
var p *[]int = new([]int)       // allocates slice structure; *p == nil; rarely useful
var v  []int = make([]int, 100) // the slice v now refers to a new array of 100 ints

// Unnecessarily complex:
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// Idiomatic:
v := make([]int, 100)
```

মনে রাখবেন যে `make` শুধুমাত্র map, slice এবং channel-এর ক্ষেত্রে প্রযোজ্য এবং একটি pointer return করে না। একটি explicit pointer পেতে `new` দিয়ে allocate করুন বা একটি variable-এর address explicit-ভাবে নিন।

### Array

Array-গুলো memory-এর detailed layout planning করার সময় useful এবং কখনও কখনও allocation এড়াতে সাহায্য করতে পারে, তবে প্রাথমিকভাবে তারা slice-এর জন্য একটি building block, যা পরবর্তী section-এর বিষয়। সেই topic-এর জন্য foundation তৈরি করতে, এখানে array সম্পর্কে কয়েকটি কথা। Go এবং C-তে array-গুলো যেভাবে কাজ করে তার মধ্যে major পার্থক্য রয়েছে। Go-তে,

* Array-গুলো value। একটি array অন্য array-তে assign করা সমস্ত element copy করে।
বিশেষ করে, যদি আপনি একটি array একটি function-এ pass করেন, তাহলে এটি array-এর একটি copy পাবে, এর pointer নয়।
* একটি array-এর size তার type-এর অংশ। The types `[10]int` এবং `[20]int` type-গুলো distinct।

value property useful হতে পারে কিন্তু ব্যয়বহুলও হতে পারে; যদি আপনি C-like behavior এবং efficiency চান, তাহলে আপনি array-এর একটি pointer pass করতে পারেন।

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

কিন্তু এই style-টিও idiomatic Go নয়। পরিবর্তে slices ব্যবহার করুন।

### Slice

Slice-গুলো array-গুলোকে wrap করে data sequence-এর জন্য একটি আরও general, powerful, এবং convenient interface দিতে। transformation matrix-এর মতো explicit dimension সহ item ছাড়া, Go-তে বেশিরভাগ array programming simple array-এর পরিবর্তে slices দিয়ে করা হয়।

স্লাইসগুলো underlying array-এর reference ধারণ করে, এবং যদি আপনি একটি slice অন্য slice-এ assign করেন, তাহলে উভয়ই একই array-কে reference করে। যদি একটি function একটি slice argument গ্রহণ করে, তাহলে slice-এর element-গুলিতে যে পরিবর্তনগুলি করে তা caller-এর কাছে visible হবে, analogous to passing a pointer to the underlying array। একটি `Read` function তাই একটি slice argument গ্রহণ করতে পারে যার মধ্যে length কত data পড়তে হবে তার একটি upper limit সেট করে। এখানে file-এর `Read` method-এর signature:

```go
func (f *File) Read(buf []byte) (n int, err error)
```

method-টি পড়া byte-এর সংখ্যা এবং একটি error value, যদি থাকে, return করে। একটি বৃহত্তর buffer `buf`-এর প্রথম 32 byte-এ পড়তে, buffer-টি slice করুন (এখানে একটি verb হিসাবে ব্যবহৃত)।

```go
n, err := f.Read(buf[0:32])
```

এই ধরনের slicing সাধারণ এবং efficient। প্রকৃতপক্ষে, efficiency বাদ দিলে, নিম্নলিখিত snippet-টিও buffer-এর প্রথম 32 byte পড়বে।

```go
var n int
    var err error
    for i := 0; i < 32; i++ {
        nbytes, e := f.Read(buf[i:i+1])  // Read one byte.
        n += nbytes
        if nbytes == 0 || e != nil {
            err = e
            break
        }
    }
```

একটি slice-এর length পরিবর্তন করা যেতে পারে যতক্ষণ না এটি এখনও underlying array-এর limits-এর মধ্যে fits; just assign it to a slice of itself। একটি slice-এর capacity, built-in function `cap` দ্বারা accessible, slice-টি যে সর্বাধিক length নিতে পারে তা রিপোর্ট করে। এখানে একটি function যা একটি slice-এ data append করে। যদি data capacity ছাড়িয়ে যায়, তাহলে slice-টি reallocate করা হয়। ফলে slice-টি return করা হয়। function-টি এই fact ব্যবহার করে যে `len` এবং `cap` `nil` slice-এর উপর প্রয়োগ করা হলে legal হয়, এবং 0 return করে।

```go
func Append(slice, data []byte) []byte {
    l := len(slice)
    if l + len(data) > cap(slice) {  // reallocate
        // Allocate double what's needed, for future growth.
        newSlice := make([]byte, (l+len(data))*2)
        // The copy function is predeclared and works for any slice type.
        copy(newSlice, slice)
        slice = newSlice
    }
    slice = slice[0:l+len(data)]
    copy(slice[l:], data)
    return slice
}
```

আমরা slice-টি পরে return করতে হবে কারণ, যদিও `Append` slice-এর element-গুলো modify করতে পারে, slice নিজেই (pointer, length, এবং capacity ধারণকারী run-time data structure) value দ্বারা pass করা হয়।

একটি slice-এ append করার ধারণাটি এতটাই উপযোগী যে এটি `append` built-in function দ্বারা capture করা হয়েছে। তবে, সেই function-এর design বুঝতে হলে আমাদের আরও কিছু information দরকার, তাই আমরা পরে এটিতে ফিরে আসব।

### Two-dimensional slices

Go-এর arrays এবং slices এক-মাত্রিক। একটি 2D array বা slice-এর equivalent তৈরি করতে, array-of-arrays বা slice-of-slices define করা প্রয়োজন, যেমন:

```go
type Transform [3][3]float64  // A 3x3 array, really an array of arrays.
type LinesOfText [][]byte     // A slice of byte slices.
```

যেহেতু slices variable-length, তাই প্রতিটি inner slice ভিন্ন length-এর হতে পারে। এটি একটি সাধারণ situation হতে পারে, যেমন আমাদের `LinesOfText` উদাহরণে: প্রতিটি line-এর একটি স্বাধীন length আছে।

```go
text := LinesOfText{
    []byte("Now is the time"),
    []byte("for all good gophers"),
    []byte("to bring some fun to the party."),
}
```

কখনও কখনও একটি 2D slice allocate করা প্রয়োজন, যেমন pixel-এর scan lines processing করার সময় এমন পরিস্থিতি তৈরি হতে পারে। এটি achieve করার দুটি উপায় আছে। একটি হল প্রতিটি slice independently allocate করা; অন্যটি হল একটি single array allocate করা এবং individual slices-কে সেদিকে point করা। কোনটি ব্যবহার করবেন তা আপনার application-এর উপর নির্ভর করে। যদি slices grow বা shrink হতে পারে, তাহলে তাদের independently allocate করা উচিত যাতে পরবর্তী line overwriting এড়ানো যায়; যদি না হয়, তাহলে single allocation দিয়ে object construct করা আরও efficient হতে পারে। reference-এর জন্য, এখানে দুটি method-এর sketch রয়েছে। প্রথমে, একবারে একটি line:

```go
// Allocate the top-level slice.
picture := make([][]uint8, YSize) // One row per unit of y.
// Loop over the rows, allocating the slice for each row.
for i := range picture {
    picture[i] = make([]uint8, XSize)
}
```

এবং এখন একটি allocation হিসাবে, lines-এ slice করা হয়েছে:

```go
// Allocate the top-level slice, the same as before.
picture := make([][]uint8, YSize) // One row per unit of y.
// Allocate one large slice to hold all the pixels.
pixels := make([]uint8, XSize*YSize) // Has type []uint8 even though picture is [][]uint8.
// Loop over the rows, slicing each row from the front of the remaining pixels slice.
for i := range picture {
    picture[i], pixels = pixels[:XSize], pixels[XSize:]
}
```

### Maps

Maps হল একটি convenient এবং powerful built-in data structure যা এক type-এর value-কে (key) অন্য type-এর value-এর সাথে (element বা value) associate করে। key এমন যেকোনো type হতে পারে যার জন্য equality operator define করা আছে, যেমন integers, floating point এবং complex numbers, strings, pointers, interfaces (যদি dynamic type equality support করে), structs এবং arrays। Slices map keys হিসাবে ব্যবহার করা যাবে না, কারণ তাদের উপর equality define করা নেই। Slices-এর মতো, maps underlying data structure-এর reference ধারণ করে। যদি আপনি একটি map একটি function-এ pass করেন যা map-এর contents পরিবর্তন করে, তাহলে changes caller-এ visible হবে।

Maps usual composite literal syntax ব্যবহার করে colon-separated key-value pair-এর সাথে construct করা যেতে পারে, তাই initialization-এর সময় তাদের build করা সহজ।

```go
var timeZone = map[string]int{
    "UTC":  0*60*60,
    "EST": -5*60*60,
    "CST": -6*60*60,
    "MST": -7*60*60,
    "PST": -8*60*60,
}
```

Map value assign করা এবং fetch করা syntactically array এবং slices-এর জন্য একই রকম দেখা যায় তবে index-টি integer হওয়ার দরকার নেই।

```go
offset := timeZone["EST"]
```

একটি map-এর মধ্যে একটি key যা উপস্থিত নেই এমন একটি map value fetch করার চেষ্টা করলে map-এর entries-এর type-এর জন্য zero value return করবে। উদাহরণস্বরূপ, যদি map-টিতে integers থাকে, তাহলে non-existent key search করলে `0` return করবে। একটি set map হিসাবে implement করা যেতে পারে যার value type `bool`। value-টি set-এ রাখতে map entry-কে `true` সেট করুন, এবং তারপর simple indexing দ্বারা এটি test করুন।

```go
attended := map[string]bool{
    "Ann": true,
    "Joe": true,
    ...
}

if attended[person] { // will be false if person is not in the map
    fmt.Println(person, "was at the meeting")
}
```

কখনও কখনও আপনাকে missing entry থেকে zero value-কে আলাদা করতে হবে। "UTC" এর জন্য একটি entry আছে নাকি এটি 0 কারণ এটি map-এ নেই? আপনি multiple assignment-এর একটি form দিয়ে discriminate করতে পারেন।

```go
var seconds int
var ok bool
seconds, ok = timeZone[tz]
```

স্পষ্ট কারণে এটিকে "comma ok" idiom বলা হয়। এই উদাহরণে, যদি `tz` উপস্থিত থাকে, তাহলে `seconds` appropriately সেট করা হবে এবং `ok` true হবে; যদি না হয়, তাহলে `seconds` zero-তে সেট করা হবে এবং `ok` false হবে। এখানে একটি function যা একটি nice error report-এর সাথে এটি একত্রিত করে:

```go
func offset(tz string) int {
    if seconds, ok := timeZone[tz]; ok {
        return seconds
    }
    log.Println("unknown time zone:", tz)
    return 0
}
```

actual value সম্পর্কে worry না করে map-এর উপস্থিতি test করতে, আপনি value-এর জন্য usual variable-এর পরিবর্তে blank identifier (`_`) ব্যবহার করতে পারেন।

```go
_, present := timeZone[tz]
```

একটি map entry delete করতে, `delete` built-in function ব্যবহার করুন, যার arguments হল map এবং delete করার key। key map থেকে অনুপস্থিত থাকলেও এটি করা safe।

```go
delete(timeZone, "PDT")  // Now on Standard Time
```

### Printing

Go-তে formatted printing C-এর `printf` family-এর মতো style ব্যবহার করে কিন্তু এটি আরও richer এবং general। function-গুলো `fmt` package-এ থাকে এবং capitalized name আছে: `fmt.Printf`, `fmt.Fprintf`, `fmt.Sprintf` এবং আরও অনেক। string function-গুলো (`Sprintf` ইত্যাদি) একটি string return করে যা একটি provided buffer-এ fill করে না।

আপনাকে একটি format string প্রদান করতে হবে না। `Printf`, `Fprintf` এবং `Sprintf` প্রত্যেকের জন্য function-এর অন্য একটি pair আছে, উদাহরণস্বরূপ `Print` এবং `Println`। এই function-গুলো একটি format string নেয় না কিন্তু প্রতিটি argument-এর জন্য একটি default format generate করে। `Println` version-গুলো arguments-এর মধ্যে একটি blank insert করে এবং output-এ একটি newline append করে যখন `Print` version-গুলো blank যোগ করে শুধুমাত্র যদি operand-এর কোনো side-ই string না হয়। এই উদাহরণে প্রতিটি line একই output produce করে।

```go
fmt.Printf("Hello %d\n", 23)
fmt.Fprint(os.Stdout, "Hello ", 23, "\n")
fmt.Println("Hello", 23)
fmt.Println(fmt.Sprint("Hello ", 23))
```

Formatted print function-গুলো `fmt.Fprint` এবং friends একটি প্রথম argument হিসাবে যেকোনো object নেয় যা `io.Writer` interface implement করে; variable `os.Stdout` এবং `os.Stderr` familiar instances।

এখানে C থেকে জিনিসগুলি diverge হতে শুরু করে। প্রথমত, `printf` মতো numeric format যেমন `%d` signedness বা size-এর জন্য flag নেয় না; পরিবর্তে, printing routine-গুলো argument-এর type ব্যবহার করে এই properties decide করতে।

```go
var x uint64 = 1<<64 - 1
fmt.Printf("%d %x; %d %x\n", x, x, int64(x), int64(x))
```

prints

```
18446744073709551615 ffffffffffffffff; -1 -1
```

যদি আপনি শুধুমাত্র default conversion চান, যেমন integers-এর জন্য decimal, আপনি catchall format `%v` (for “value”) ব্যবহার করতে পারেন; result ঠিক যা `Print` এবং `Println` produce করবে। উপরন্তু, সেই format যেকোনো value print করতে পারে, এমনকি arrays, slices, structs, এবং maps। এখানে time zone map-এর জন্য একটি print statement যা আগের section-এ define করা হয়েছিল।

```go
fmt.Printf("%v\n", timeZone)  // or just fmt.Println(timeZone)
```

which gives output:

```
map[CST:-21600 EST:-18000 MST:-25200 PST:-28800 UTC:0]
```

Maps-এর জন্য, `Printf` এবং friends output-কে key দ্বারা lexicographically sort করে।

একটি struct print করার সময়, modified format `%+v` structure-এর field-গুলোকে তাদের name দিয়ে annotate করে, এবং যেকোনো value-এর জন্য alternate format `%#v` value-টি full Go syntax-এ print করে।

```go
type T struct {
    a int
    b float64
    c string
}
t := &T{ 7, -2.35, "abc\tdef" }
fmt.Printf("%v\n", t)
fmt.Printf("%+v\n", t)
fmt.Printf("%#v\n", t)
fmt.Printf("%#v\n", timeZone)
```

prints

```
&{7 -2.35 abc   def}
&{a:7 b:-2.35 c:abc     def}
&main.T{a:7, b:-2.35, c:"abc\tdef"}
map[string]int{"CST":-21600, "EST":-18000, "MST":-25200, "PST":-28800, "UTC":0}
```

(Note the ampersands.) সেই quoted string format `string` বা `[]byte` type-এর value-এর উপর প্রয়োগ করা হলে `%q` এর মাধ্যমেও পাওয়া যায়। alternate format `%#q` সম্ভব হলে backquotes ব্যবহার করবে। (`%q` format integers এবং runes-এর জন্যও প্রযোজ্য, single-quoted rune constant তৈরি করে।) এছাড়াও, `%x` strings, byte arrays এবং byte slices-এর পাশাপাশি integers-এর উপরও কাজ করে, একটি long hexadecimal string তৈরি করে, এবং format-এ একটি space (`% x`) দিয়ে এটি bytes-এর মধ্যে spaces দেয়।

আরেকটি handy format হল `%T`, যা একটি value-এর type print করে।

```go
fmt.Printf("%T\n", timeZone)
```

prints

```
map[string]int
```

যদি আপনি একটি custom type-এর জন্য default format control করতে চান, তবে `String() string` signature সহ একটি method define করা প্রয়োজন। আমাদের simple type `T`-এর জন্য, এটি দেখতে এরকম হতে পারে।

```go
func (t *T) String() string {
    return fmt.Sprintf("%d/%g/%q", t.a, t.b, t.c)
}
fmt.Printf("%v\n", t)
```

to print in the format

```
7/-2.35/"abc\tdef"
```

(যদি আপনাকে `T` type-এর value-এর পাশাপাশি `T`-এর pointers print করতে হয়, তাহলে `String` এর receiver value type-এর হতে হবে; এই উদাহরণে একটি pointer ব্যবহার করা হয়েছে কারণ struct type-এর জন্য এটি আরও efficient এবং idiomatic। আরও তথ্যের জন্য `pointers vs. value receivers` section দেখুন।)

আমাদের `String` method `Sprintf` কল করতে সক্ষম কারণ print routine-গুলো fully reentrant এবং এইভাবে wrap করা যেতে পারে। তবে, এই approach সম্পর্কে একটি গুরুত্বপূর্ণ detail বুঝতে হবে: `String` method এমনভাবে `Sprintf` কল করে তৈরি করবেন না যা আপনার `String` method-এর মধ্যে indefinitely recur করবে। এটি ঘটতে পারে যদি `Sprintf` কল receiver-কে সরাসরি string হিসাবে print করার চেষ্টা করে, যা बदले আবার method-কে invoke করবে। এটি একটি common এবং easy mistake, যা এই উদাহরণ দেখায়।

```go
type MyString string

func (m MyString) String() string {
    return fmt.Sprintf("MyString=%s", m) // Error: will recur forever.
}
```

এটি ঠিক করাও সহজ: argument-কে basic string type-এ convert করুন, যার method নেই।

```go
type MyString string
func (m MyString) String() string {
    return fmt.Sprintf("MyString=%s", string(m)) // OK: note conversion.
}
```

`initialization section`-এ আমরা এই recursion এড়ানোর আরেকটি technique দেখতে পাব।

আরেকটি printing technique হল একটি print routine-এর arguments সরাসরি অন্য এমন routine-এ pass করা। `Printf`-এর signature `...interface{}` type ব্যবহার করে তার final argument-এর জন্য এটি specify করতে যে arbitrary number of parameters (of arbitrary type) format-এর পরে উপস্থিত হতে পারে।

```go
func Printf(format string, v ...interface{}) (n int, err error) {
```

function `Printf`-এর মধ্যে, `v` type `[]interface{}` এর variable-এর মতো কাজ করে কিন্তু যদি এটি অন্য variadic function-এ pass করা হয়, তাহলে এটি arguments-এর regular list-এর মতো কাজ করে। এখানে `log.Println` function-এর implementation যা আমরা উপরে ব্যবহার করেছি। এটি তার arguments সরাসরি `fmt.Sprintln`-এ pass করে actual formatting-এর জন্য।

```go
// Println prints to the standard logger in the manner of fmt.Println.
func Println(v ...interface{}) {
    std.Output(2, fmt.Sprintln(v...))  // Output takes parameters (int, string)
}
```

আমরা nested call to `Sprintln`-এ `v` এর পরে `...` লিখি compiler-কে বলতে যে `v`-কে arguments-এর list হিসাবে treat করতে; অন্যথায় এটি `v`-কে single slice argument হিসাবে pass করবে।

এখানে আমরা যা covered করেছি তার চেয়ে printing-এ আরও অনেক কিছু আছে। details-এর জন্য package `fmt`-এর `godoc` documentation দেখুন।

By the way, একটি `...` parameter একটি specific type-এর হতে পারে, উদাহরণস্বরূপ `...int` একটি min function-এর জন্য যা integers-এর list থেকে least-টি বেছে নেয়:

```go
func Min(a ...int) int {
    min := int(^uint(0) >> 1)  // largest int
    for _, i := range a {
        if i < min {
            min = i
        }
    }
    return min
}
```

### Append

এখন আমাদের কাছে `append` built-in function-এর design ব্যাখ্যা করার জন্য প্রয়োজনীয় missing piece আছে। `append`-এর signature আমাদের উপরের custom `Append` function থেকে ভিন্ন। Schematically, এটি এরকম:

```go
func append(slice []T, elements ...T) []T
```

যেখানে `T` যেকোনো প্রদত্ত type-এর জন্য একটি placeholder। আপনি Go-তে এমন একটি function লিখতে পারবেন না যেখানে type `T` caller দ্বারা determined হয়। এই কারণেই `append` built in: এটি compiler থেকে support প্রয়োজন।

`append` যা করে তা হল elements-গুলো slice-এর শেষে append করে এবং result return করে। result return করা প্রয়োজন কারণ, আমাদের হাতে লেখা `Append`-এর মতো, underlying array পরিবর্তিত হতে পারে। এই simple উদাহরণ

```go
x := []int{1,2,3}
x = append(x, 4, 5, 6)
fmt.Println(x)
```

prints `[1 2 3 4 5 6]`। সুতরাং `append` কিছুটা `Printf`-এর মতো কাজ করে, arbitrary number of arguments collect করে।

কিন্তু যদি আমরা আমাদের `Append` যা করে তা করতে চাই এবং একটি slice-কে একটি slice-এ append করতে চাই? Easy: call site-এ `...` ব্যবহার করুন, ঠিক যেমনটি আমরা উপরের `Output` কল-এ করেছি। এই snippet উপরেরটির মতো identical output produce করে।

```go
x := []int{1,2,3}
y := []int{4,5,6}
x = append(x, y...)
fmt.Println(x)
```

সেই `...` ছাড়া, এটি compile হবে না কারণ types ভুল হবে; `y` type `int` এর নয়।

## Initialization

যদিও C বা C++-এর initialization থেকে superficially খুব বেশি ভিন্ন মনে হয় না, Go-তে initialization আরও powerful। Complex structure-গুলো initialization-এর সময় তৈরি করা যেতে পারে এবং initialized object-এর মধ্যে ordering issue-গুলো, এমনকি ভিন্ন package-এর মধ্যেও, সঠিকভাবে handle করা হয়।

### Constants

Go-তে Constants ঠিক তাই - constant। তারা compile time-এ তৈরি হয়, এমনকি function-এর মধ্যে local হিসাবে define করা হলেও, এবং শুধুমাত্র number, character (runes), string বা boolean হতে পারে। compile-time-এর সীমাবদ্ধতার কারণে, তাদের define করা expression-গুলো constant expression হতে হবে, যা compiler দ্বারা evaluatable। উদাহরণস্বরূপ, `1<<3` একটি constant expression, যখন `math.Sin(math.Pi/4)` নয় কারণ `math.Sin` function call-টি run time-এ ঘটতে হবে।

Go-তে, enumerated constant-গুলো `iota` enumerator ব্যবহার করে তৈরি হয়। যেহেতু `iota` একটি expression-এর অংশ হতে পারে এবং expression-গুলো implicitly repeated হতে পারে, intricate set of value তৈরি করা সহজ।

```go
type ByteSize float64

const (
    _           = iota // ignore first value by assigning to blank identifier
    KB ByteSize = 1 << (10 * iota)
    MB
    GB
    TB
    PB
    EB
    ZB
    YB
)
```

যে কোনো user-defined type-এর সাথে `String` এর মতো একটি method attach করার ক্ষমতা arbitrary value-গুলোকে স্বয়ংক্রিয়ভাবে printing-এর জন্য format করতে সক্ষম করে তোলে। যদিও আপনি এটি প্রায়শই struct-এর ক্ষেত্রে প্রয়োগ হতে দেখবেন, এই technique `ByteSize`-এর মতো floating-point type-এর মতো scalar type-এর জন্যও useful।

```go
func (b ByteSize) String() string {
    switch {
    case b >= YB:
        return fmt.Sprintf("%.2fYB", b/YB)
    case b >= ZB:
        return fmt.Sprintf("%.2fZB", b/ZB)
    case b >= EB:
        return fmt.Sprintf("%.2fEB", b/EB)
    case b >= PB:
        return fmt.Sprintf("%.2fPB", b/PB)
    case b >= TB:
        return fmt.Sprintf("%.2fTB", b/TB)
    case b >= GB:
        return fmt.Sprintf("%.2fGB", b/GB)
    case b >= MB:
        return fmt.Sprintf("%.2fMB", b/MB)
    case b >= KB:
        return fmt.Sprintf("%.2fKB", b/KB)
    }
    return fmt.Sprintf("%.2fB", b)
}
```

`YB` expression `1.00YB` হিসাবে print করে, যখন `ByteSize(1e13)` `9.09TB` হিসাবে print করে।

`ByteSize`-এর `String` method implement করার জন্য `Sprintf`-এর ব্যবহার এখানে safe (indefinitely recurring এড়ায়) একটি conversion-এর কারণে নয় বরং এটি `Sprintf`-কে `%f` দিয়ে call করে, যা একটি string format নয়: `Sprintf` শুধুমাত্র `String` method-কে call করবে যখন এটি একটি string চায়, এবং `%f` একটি floating-point value চায়।

### Variables

Variable-গুলো constant-এর মতোই initialize করা যেতে পারে কিন্তু initializer-টি run time-এ computed একটি general expression হতে পারে।

```go
var (
    home   = os.Getenv("HOME")
    user   = os.Getenv("USER")
    gopath = os.Getenv("GOPATH")
)
```

### `init` function

অবশেষে, প্রতিটি source file তার নিজস্ব niladic `init` function define করতে পারে যা প্রয়োজনীয় যে কোনো state সেট আপ করার জন্য। (আসলে প্রতিটি file-এ একাধিক `init` function থাকতে পারে।) এবং অবশেষে মানে অবশেষে: `init` function-টি package-এর সমস্ত variable declaration তাদের initializer evaluate করার পরে call করা হয়, এবং সেগুলা evaluate করা হয় শুধুমাত্র সমস্ত imported package-গুলো initialized হওয়ার পরে।

যে initialization-গুলো declaration হিসাবে প্রকাশ করা যায় না, তা ছাড়াও, `init` function-এর একটি common ব্যবহার হল real execution শুরু হওয়ার আগে program state-এর correctness verify বা repair করা।

```go
func init() {
    if user == "" {
        log.Fatal("$USER not set")
    }
    if home == "" {
        home = "/home/" + user
    }
    if gopath == "" {
        gopath = home + "/go"
    }
    // gopath may be overridden by --gopath flag on command line.
    flag.StringVar(&gopath, "gopath", gopath, "override default GOPATH")
}
```

## Methods

### Pointers vs. Values

যেমনটি আমরা `ByteSize`-এর ক্ষেত্রে দেখেছি, methods যে কোনো named type-এর জন্য define করা যেতে পারে (pointer বা interface ব্যতীত); receiver-টি struct হতে হবে না।

উপরে slices-এর আলোচনায়, আমরা একটি `Append` function লিখেছিলাম। আমরা এর পরিবর্তে এটি slices-এর একটি method হিসাবে define করতে পারি। এটি করার জন্য, আমরা প্রথমে একটি named type declare করি যার সাথে আমরা method-টি bind করতে পারি, এবং তারপর method-এর জন্য receiver-কে সেই type-এর একটি value করি।

```go
type ByteSlice []byte

func (slice ByteSlice) Append(data []byte) []byte {
    // Body exactly the same as the Append function defined above.
}
```

এটি এখনও method-কে updated slice return করতে হবে। আমরা method-কে একটি `ByteSlice`-এর pointer হিসাবে তার receiver হিসাবে নিতে redefine করে সেই clumsiness দূর করতে পারি, যাতে method caller-এর slice overwrite করতে পারে।

```go
func (p *ByteSlice) Append(data []byte) {
    slice := *p
    // Body as above, without the return.
    *p = slice
}
```

আসলে, আমরা আরও ভালো কিছু করতে পারি। যদি আমরা আমাদের function-কে modify করি যাতে এটি একটি standard `Write` method-এর মতো দেখায়, যেমনটি,

```go
func (p *ByteSlice) Write(data []byte) (n int, err error) {
    slice := *p
    // Again as above.
    *p = slice
    return len(data), nil
}
```

তাহলে type `*ByteSlice` standard interface `io.Writer` satisfy করে, যা handy। উদাহরণস্বরূপ, আমরা একটিতে print করতে পারি।

```go
var b ByteSlice
fmt.Fprintf(&b, "This hour has %d days\n", 7)
```

আমরা একটি `ByteSlice`-এর address pass করি কারণ শুধুমাত্র `*ByteSlice` `io.Writer` satisfy করে। receiver-এর জন্য pointer vs. value সম্পর্কে rule হল যে value method-গুলো pointer এবং value-এর উপর invoke করা যেতে পারে, কিন্তু pointer method-গুলো শুধুমাত্র pointer-এর উপর invoke করা যেতে পারে।

এই ruleটি আসে কারণ pointer method-গুলো receiver-কে modify করতে পারে; value-এর উপর তাদের invoke করলে method-টি value-এর একটি copy পাবে, তাই যে কোনো modification বাতিল হয়ে যাবে। language তাই এই ভুলটি allow করে না। তবে, একটি handy exception আছে। যখন value addressable হয়, তখন language স্বয়ংক্রিয়ভাবে address operator insert করে value-এর উপর একটি pointer method invoke করার common caseটি handle করে। আমাদের উদাহরণে, `b` variable addressable, তাই আমরা এর `Write` method-কে শুধুমাত্র `b.Write` দিয়ে call করতে পারি। compiler এটি আমাদের জন্য `(&b).Write`-এ rewrite করবে।

By the way, bytes-এর একটি slice-এর উপর `Write` ব্যবহার করার ধারণাটি `bytes.Buffer`-এর implementation-এর জন্য central।

## Interfaces এবং অন্যান্য type

### Interfaces

Go-তে Interfaces একটি object-এর behavior specify করার একটি উপায় প্রদান করে: যদি কিছু `this` করতে পারে, তাহলে এটি `here` ব্যবহার করা যেতে পারে। আমরা ইতিমধ্যেই কয়েকটি simple উদাহরণ দেখেছি; custom printer-গুলো একটি `String` method দ্বারা implement করা যেতে পারে যখন `Fprintf` একটি `Write` method সহ যেকোনো কিছুতে output generate করতে পারে। শুধুমাত্র এক বা দুটি method সহ Interfaces Go code-এ common, এবং সাধারণত method থেকে প্রাপ্ত একটি name দেওয়া হয়, যেমন `io.Writer` যা `Write` implement করে।

একটি type একাধিক interface implement করতে পারে। উদাহরণস্বরূপ, একটি collection `sort` package-এর routine দ্বারা sorted করা যেতে পারে যদি এটি `sort.Interface` implement করে, যার মধ্যে `Len()`, `Less(i, j int) bool`, এবং `Swap(i, j int)` আছে, এবং এর একটি custom formatter-ও থাকতে পারে। এই contrived উদাহরণে `Sequence` উভয়কেই satisfy করে।

```go
type Sequence []int

// Methods required by sort.Interface.
func (s Sequence) Len() int {
    return len(s)
}
func (s Sequence) Less(i, j int) bool {
    return s[i] < s[j]
}
func (s Sequence) Swap(i, j int) {
    s[i], s[j] = s[j], s[i]
}

// Copy returns a copy of the Sequence.
func (s Sequence) Copy() Sequence {
    copy := make(Sequence, 0, len(s))
    return append(copy, s...)
}

// Method for printing - sorts the elements before printing.
func (s Sequence) String() string {
    s = s.Copy() // Make a copy; don't overwrite argument.
    sort.Sort(s)
    str := "["
    for i, elem := range s { // Loop is O(N²); will fix that in next example.
        if i > 0 {
            str += " "
        }
        str += fmt.Sprint(elem)
    }
    return str + "]"
}
```

### Conversions

`Sequence`-এর `String` method সেই কাজটি আবার তৈরি করছে যা `Sprint` ইতিমধ্যেই slices-এর জন্য করে। (এটিতে O(N²) complexity-ও আছে, যা poor।) আমরা `Sprint` কল করার আগে `Sequence`-কে একটি plain `[]int`-এ convert করলে আমরা effort (এবং এটি speed up)-কে share করতে পারি।

```go
func (s Sequence) String() string {
    s = s.Copy()
    sort.Sort(s)
    return fmt.Sprint([]int(s))
}
```

এই methodটি একটি `String` method থেকে নিরাপদে `Sprintf` কল করার জন্য conversion technique-এর আরেকটি উদাহরণ। কারণ দুটি type (`Sequence` এবং `[]int`) একই রকম যদি আমরা type name ignore করি, তাহলে তাদের মধ্যে convert করা legal। conversion একটি নতুন value তৈরি করে না, এটি কেবল temporarily বিদ্যমান value-এর একটি নতুন type আছে বলে মনে করে। (অন্যান্য legal conversion আছে, যেমন integer থেকে floating point-এ, যা একটি নতুন value তৈরি করে।)

Go program-এ একটি expression-এর type convert করা একটি idiom যাতে method-এর ভিন্ন set access করা যায়। উদাহরণস্বরূপ, আমরা existing type `sort.IntSlice` ব্যবহার করে পুরো উদাহরণটি এতে কমাতে পারি:

```go
type Sequence []int

// Method for printing - sorts the elements before printing
func (s Sequence) String() string {
    s = s.Copy()
    sort.IntSlice(s).Sort()
    return fmt.Sprint([]int(s))
}
```

এখন, `Sequence` একাধিক interface (sorting এবং printing) implement করার পরিবর্তে, আমরা একটি data item-এর একাধিক type (`Sequence`, `sort.IntSlice` এবং `[]int`)-এ convert হওয়ার ক্ষমতা ব্যবহার করছি, যার প্রতিটি কাজের কিছু অংশ করে। এটি practice-এ আরও unusual কিন্তু effective হতে পারে।

### Interface conversions এবং type assertions

Type switch-গুলো conversion-এর একটি form: তারা একটি interface নেয় এবং, switch-এর প্রতিটি case-এর জন্য, এক অর্থে এটিকে সেই case-এর type-এ convert করে। এখানে `fmt.Printf`-এর অধীনে code কীভাবে একটি value-কে type switch ব্যবহার করে একটি string-এ পরিণত করে তার একটি simplified version। যদি এটি ইতিমধ্যেই একটি string হয়, আমরা interface দ্বারা ধারণ করা actual string value চাই, যখন যদি এটির একটি `String` method থাকে তাহলে আমরা method-কে call করার result চাই।

```go
type Stringer interface {
    String() string
}

var value interface{} // Value provided by caller.
switch str := value.(type) {
case string:
    return str
case Stringer:
    return str.String()
}
```

প্রথম case একটি concrete value খুঁজে পায়; দ্বিতীয়টি interface-কে আরেকটি interface-এ convert করে। এইভাবে type-গুলো mix করা পুরোপুরি ঠিক আছে।

যদি আমাদের কাছে শুধুমাত্র একটি type থাকে যা আমরা care করি? যদি আমরা জানি value-টি একটি `string` ধারণ করে এবং আমরা কেবল এটি extract করতে চাই? একটি one-case type switch কাজ করবে, কিন্তু একটি type assertion-ও করবে। একটি type assertion একটি interface value নেয় এবং এটি থেকে specified explicit type-এর একটি value extract করে। syntax-টি type switch opening clause থেকে ধার করা হয়েছে, কিন্তু `type` keyword-এর পরিবর্তে একটি explicit type সহ:

```go
value.(typeName)
```

এবং result হল static type `typeName` সহ একটি নতুন value। সেই type-টি হয় interface দ্বারা ধারণ করা concrete type হতে হবে, অথবা একটি দ্বিতীয় interface type হতে হবে যেখানে value-টি convert করা যেতে পারে। value-এর মধ্যে থাকা string extract করতে, আমরা লিখতে পারি:

```go
str := value.(string)
```

কিন্তু যদি দেখা যায় যে value-টি একটি string ধারণ করে না, তাহলে program run-time error সহ crash করবে। এটি থেকে রক্ষা পেতে, "comma, ok" idiom ব্যবহার করুন test করতে, নিরাপদে, value-টি একটি string কিনা:

```go
str, ok := value.(string)
if ok {
    fmt.Printf("string value is: %q\n", str)
} else {
    fmt.Printf("value is not a string\n")
}
```

যদি type assertion ব্যর্থ হয়, তাহলে `str` এখনও থাকবে এবং string type-এর হবে, কিন্তু এর zero value থাকবে, একটি empty string।

ক্ষমতার একটি illustration হিসাবে, এখানে একটি `if-else` statement যা type switch-এর equivalent যা এই section শুরু করেছে।

```go
if str, ok := value.(string); ok {
    return str
} else if str, ok := value.(Stringer); ok {
    return str.String()
}
```

### Generality

যদি একটি type শুধুমাত্র একটি interface implement করার জন্য থাকে এবং সেই interface-এর বাইরে কখনও exported method না থাকে, তাহলে type itself export করার প্রয়োজন নেই। শুধুমাত্র interface export করা clear করে যে value-এর interface-এ বর্ণিত আচরণ ছাড়া অন্য কোনো interesting behavior নেই। এটি একটি common method-এর প্রতিটি instance-এ documentation repeat করার প্রয়োজনও এড়ায়।

এই ধরনের ক্ষেত্রে, constructor-কে implementing type-এর পরিবর্তে একটি interface value return করা উচিত। উদাহরণস্বরূপ, hash library-গুলোতে `crc32.NewIEEE` এবং `adler32.New` উভয়ই `hash.Hash32` interface type return করে। Go program-এ Adler-32-এর জন্য CRC-32 algorithm substitute করার জন্য শুধুমাত্র constructor call পরিবর্তন করার প্রয়োজন হয়; code-এর বাকি অংশ algorithm পরিবর্তনের দ্বারা প্রভাবিত হয় না।

একটি similar approach `crypto` package-এর streaming cipher algorithm-গুলোকে block cipher-গুলো থেকে আলাদা করতে দেয় যা তারা chain করে। `crypto/cipher` package-এর `Block` interface একটি block cipher-এর behavior specify করে, যা data-এর একটি single block-এর encryption প্রদান করে। তারপর, `bufio` package-এর analogy-তে, cipher package-গুলো যা এই interface implement করে তা streaming cipher construct করতে ব্যবহার করা যেতে পারে, যা `Stream` interface দ্বারা represent করা হয়, block encryption-এর details না জেনে।

`crypto/cipher` interface-গুলো এরকম দেখায়:

```go
type Block interface {
    BlockSize() int
    Encrypt(dst, src []byte)
    Decrypt(dst, src []1 byte)
}

type Stream interface {
    XORKeyStream(dst, src []byte)
}
```

এখানে counter mode (CTR) stream-এর definition, যা একটি block cipher-কে একটি streaming cipher-এ পরিণত করে; লক্ষ্য করুন যে block cipher-এর details abstracted away:

```go
// NewCTR returns a Stream that encrypts/decrypts using the given Block in
// counter mode. The length of iv must be the same as the Block's block size.
func NewCTR(block Block, iv []byte) Stream
```

`NewCTR` শুধুমাত্র একটি specific encryption algorithm এবং data source-এর জন্য নয় বরং `Block` interface এবং যেকোনো `Stream`-এর যে কোনো implementation-এর জন্য প্রযোজ্য। যেহেতু তারা interface value return করে, CTR encryption-কে অন্যান্য encryption mode দিয়ে replace করা একটি localized change। constructor call-গুলো edit করতে হবে, কিন্তু যেহেতু surrounding code-কে result-টিকে শুধুমাত্র একটি `Stream` হিসাবে treat করতে হবে, এটি পার্থক্য notice করবে না।

### Interfaces এবং methods

যেহেতু প্রায় যেকোনো কিছুর সাথে methods attach করা যেতে পারে, প্রায় যেকোনো কিছু একটি interface satisfy করতে পারে। একটি illustrative উদাহরণ হল `http` package-এ, যা `Handler` interface define করে। যে কোনো object যা `Handler` implement করে তা HTTP request serve করতে পারে।

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

`ResponseWriter` নিজেই একটি interface যা client-এর কাছে response return করার জন্য প্রয়োজনীয় method-গুলোতে access প্রদান করে। সেই method-গুলোর মধ্যে standard `Write` method অন্তর্ভুক্ত, তাই একটি `http.ResponseWriter` ব্যবহার করা যেতে পারে যেখানে `io.Writer` ব্যবহার করা যেতে পারে। `Request` হল একটি struct যা client থেকে request-এর একটি parsed representation ধারণ করে।

সংক্ষেপে, POST-গুলো ignore করি এবং assume করি HTTP request-গুলো সবসময় GET; এই simplification handler-গুলো যেভাবে সেট আপ করা হয় তা প্রভাবিত করে না। এখানে একটি handler-এর একটি trivial implementation রয়েছে যা page-টি কতবার visit করা হয়েছে তা count করে।

```go
// Simple counter server.
type Counter struct {
    n int
}

func (ctr *Counter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    ctr.n++
    fmt.Fprintf(w, "counter = %d\n", ctr.n)
}
```

(আমাদের theme-এর সাথে সঙ্গতি রেখে, লক্ষ্য করুন কিভাবে `Fprintf` একটি `http.ResponseWriter`-এ print করতে পারে।) একটি real server-এ, `ctr.n`-এ access-এর জন্য concurrent access থেকে protection প্রয়োজন হবে। suggestions-এর জন্য `sync` এবং `atomic` package দেখুন।

reference-এর জন্য, এখানে একটি URL tree-এর একটি node-এর সাথে এমন একটি server attach করার পদ্ধতি।

```go
import "net/http"
...
ctr := new(Counter)
http.Handle("/counter", ctr)
```

কিন্তু `Counter`-কে struct কেন তৈরি করবেন? একটি integer-ই যথেষ্ট। (receiver-কে pointer হতে হবে যাতে increment caller-এর কাছে visible হয়।)

```go
// Simpler counter server.
type Counter int

func (ctr *Counter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    *ctr++
    fmt.Fprintf(w, "counter = %d\n", *ctr)
}
```

যদি আপনার program-এর কিছু internal state থাকে যা একটি page visit করা হয়েছে তা notified হতে হবে? web page-এর সাথে একটি channel বাঁধুন।

```go
// A channel that sends a notification on each visit.
// (Probably want the channel to be buffered.)
type Chan chan *http.Request

func (ch Chan) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    ch <- req
    fmt.Fprint(w, "notification sent")
}
```

অবশেষে, ধরুন আমরা `/args`-এ server binary invoke করার সময় ব্যবহৃত arguments present করতে চাই। arguments print করার জন্য একটি function লেখা সহজ।

```go
func ArgServer() {
    fmt.Println(os.Args)
}
```

আমরা কিভাবে এটিকে একটি HTTP server-এ পরিণত করব? আমরা `ArgServer`-কে এমন কোনো type-এর method করতে পারি যার value আমরা ignore করি, কিন্তু একটি cleaner উপায় আছে। যেহেতু আমরা pointers এবং interface ব্যতীত যেকোনো type-এর জন্য একটি method define করতে পারি, আমরা একটি function-এর জন্য একটি method লিখতে পারি। `http` package-এ এই code রয়েছে:

```go
// The HandlerFunc type is an adapter to allow the use of
// ordinary functions as HTTP handlers.  If f is a function
// with the appropriate signature, HandlerFunc(f) is a
// Handler object that calls f.
type HandlerFunc func(ResponseWriter, *Request)

// ServeHTTP calls f(w, req).
func (f HandlerFunc) ServeHTTP(w ResponseWriter, req *Request) {
    f(w, req)
}
```

`HandlerFunc` হল একটি method সহ একটি type, `ServeHTTP`, তাই সেই type-এর value-গুলো HTTP request serve করতে পারে। method-এর implementation দেখুন: receiver হল একটি function, `f`, এবং method `f` কল করে। এটি অদ্ভুত মনে হতে পারে কিন্তু এটি channel-এর receiver এবং channel-এর উপর method sending থেকে খুব বেশি ভিন্ন নয়।

`ArgServer`-কে একটি HTTP server-এ পরিণত করতে, আমরা প্রথমে এটিকে সঠিক signature পেতে modify করি।

```go
// Argument server.
func ArgServer(w http.ResponseWriter, req *http.Request) {
    fmt.Fprintln(w, os.Args)
}
```

`ArgServer`-এর এখন `HandlerFunc`-এর মতো একই signature আছে, তাই এটি তার method access করার জন্য সেই type-এ convert করা যেতে পারে, ঠিক যেমন আমরা `Sequence`-কে `IntSlice`-এ convert করেছি `IntSlice.Sort` access করার জন্য। এটি সেট আপ করার code সংক্ষিপ্ত:

```go
http.Handle("/args", http.HandlerFunc(ArgServer))
```

যখন কেউ `/args` page-টি visit করে, তখন সেই page-এ installed handler-এর value `ArgServer` এবং type `HandlerFunc` থাকে। HTTP server সেই type-এর `ServeHTTP` method-টি invoke করবে, `ArgServer`-কে receiver হিসাবে রেখে, যা बदले `ArgServer` কে call করবে (`HandlerFunc.ServeHTTP`-এর ভিতরে `f(w, req)` invocation-এর মাধ্যমে)। Arguments তখন display করা হবে।

এই section-এ আমরা একটি struct, একটি integer, একটি channel, এবং একটি function থেকে একটি HTTP server তৈরি করেছি, সবই কারণ interface-গুলো কেবল method-এর set, যা (প্রায়) যে কোনো type-এর জন্য define করা যেতে পারে।

## Blank identifier

আমরা `for range` loop এবং `maps`-এর প্রসঙ্গে blank identifier কয়েকবার উল্লেখ করেছি। blank identifier যেকোনো type-এর যেকোনো value দিয়ে assign বা declare করা যেতে পারে, valueটি নিরাপদে discard করা হয়। এটি Unix `/dev/null` file-এ লেখার মতো: এটি একটি write-only value represent করে যা একটি place-holder হিসাবে ব্যবহার করা হয় যেখানে একটি variable প্রয়োজন হয় কিন্তু actual value irrelevant। এটি আমরা ইতিমধ্যেই দেখেছি তার বাইরেও ব্যবহার আছে।

### Multiple assignment-এ blank identifier

`for range` loop-এ blank identifier-এর ব্যবহার একটি general situation-এর special case: multiple assignment।

যদি একটি assignment-এর বাম দিকে একাধিক value-এর প্রয়োজন হয়, কিন্তু value-গুলোর মধ্যে একটি program দ্বারা ব্যবহৃত হবে না, তাহলে assignment-এর বাম দিকে একটি blank identifier একটি dummy variable তৈরি করার প্রয়োজন এড়ায় এবং এটি clear করে যে value-টি discard করা হবে। উদাহরণস্বরূপ, একটি function call করার সময় যা একটি value এবং একটি error return করে, কিন্তু শুধুমাত্র error-টি গুরুত্বপূর্ণ, irrelevant value discard করতে blank identifier ব্যবহার করুন।

```go
if _, err := os.Stat(path); os.IsNotExist(err) {
    fmt.Printf("%s does not exist\n", path)
}
```

কখনও কখনও আপনি এমন code দেখতে পাবেন যা error ignore করার জন্য error value discard করে; এটি terrible practice। সর্বদা error return check করুন; তারা একটি কারণের জন্য প্রদান করা হয়।

```go
// Bad! This code will crash if path does not exist.
fi, _ := os.Stat(path)
if fi.IsDir() {
    fmt.Printf("%s is a directory\n", path)
}
```

### Unused imports এবং variables

একটি package import করা বা একটি variable declare করা যা ব্যবহার করা হয় না তা একটি error। Unused import program-কে bloat করে এবং compilation slow করে, যখন একটি variable যা initialize করা হয় কিন্তু ব্যবহার করা হয় না তা অন্তত একটি wasted computation এবং সম্ভবত একটি larger bug-এর indicative। তবে, যখন একটি program active development-এর অধীনে থাকে, তখন unused import এবং variable প্রায়শই দেখা যায় এবং compilation proceed করার জন্য তাদের delete করা annoying হতে পারে, শুধুমাত্র পরে তাদের আবার প্রয়োজন হতে পারে। blank identifier একটি workaround প্রদান করে।

এই half-written program-এ দুটি unused import (`fmt` এবং `io`) এবং একটি unused variable (`fd`) আছে, তাই এটি compile হবে না, কিন্তু codeটি এখন পর্যন্ত সঠিক কিনা তা দেখতে ভালো লাগবে।

```go
package main

import (
    "fmt"
    "io"
    "log"
    "os"
)

func main() {
    fd, err := os.Open("test.go")
    if err != nil {
        log.Fatal(err)
    }
    // TODO: use fd.
}
```

unused import সম্পর্কে অভিযোগ silence করতে, imported package থেকে একটি symbol refer করতে একটি blank identifier ব্যবহার করুন। একইভাবে, unused variable `fd`-কে blank identifier-এ assign করলে unused variable error silence হবে। program-এর এই version compile হয়।

```go
package main

import (
    "fmt"
    "io"
    "log"
    "os"
)

var _ = fmt.Printf // For debugging; delete when done.
var _ io.Reader    // For debugging; delete when done.

func main() {
    fd, err := os.Open("test.go")
    if err != nil {
        log.Fatal(err)
    }
    // TODO: use fd.
    _ = fd
}
```

convention অনুযায়ী, import error silence করার জন্য global declaration-গুলো import-এর ঠিক পরেই আসা উচিত এবং commented হওয়া উচিত, উভয়ই তাদের সহজে খুঁজে পেতে এবং পরে জিনিসগুলি clean up করার একটি reminder হিসাবে।

### Side effect-এর জন্য Import

আগের উদাহরণে `fmt` বা `io`-এর মতো একটি unused import অবশেষে ব্যবহার করা বা remove করা উচিত: blank assignment code-কে work in progress হিসাবে identify করে। কিন্তু কখনও কখনও side effect-এর জন্য একটি package import করা useful হয়, কোনো explicit ব্যবহার ছাড়াই। উদাহরণস্বরূপ, তার `init` function-এর সময়, `net/http/pprof` package HTTP handler register করে যা debugging information প্রদান করে। এটির একটি exported API আছে, কিন্তু বেশিরভাগ client-এর শুধুমাত্র handler registration প্রয়োজন এবং web page-এর মাধ্যমে data access করে। শুধুমাত্র তার side effect-এর জন্য package import করতে, package-কে blank identifier-এ rename করুন:

```go
import _ "net/http/pprof"
```

import-এর এই form clear করে যে package-টি তার side effect-এর জন্য import করা হচ্ছে, কারণ package-এর অন্য কোনো possible ব্যবহার নেই: এই file-এ, এটির কোনো name নেই। (যদি এটির একটি name থাকত, এবং আমরা সেই name ব্যবহার না করতাম, তাহলে compiler program-কে reject করত।)

### Interface checks

যেমনটি আমরা উপরে `interfaces`-এর আলোচনায় দেখেছি, একটি type-কে explicitly declare করার প্রয়োজন নেই যে এটি একটি interface implement করে। পরিবর্তে, একটি type শুধুমাত্র interface-এর methods implement করে interface implement করে। practice-এ, বেশিরভাগ interface conversion static এবং তাই compile time-এ checked হয়। উদাহরণস্বরূপ, একটি `*os.File`-কে একটি function-এ pass করা যা `io.Reader` আশা করে তা compile হবে না যদি না `*os.File` `io.Reader` interface implement করে।

তবে, কিছু interface check run-time-এ ঘটে। একটি instance হল `encoding/json` package-এ, যা একটি `Marshaler` interface define করে। যখন JSON encoder একটি value পায় যা সেই interface implement করে, তখন encoder value-এর marshaling method invoke করে এটিকে JSON-এ convert করতে standard conversion করার পরিবর্তে। encoder run time-এ একটি type assertion-এর মতো এই property check করে:

```go
m, ok := val.(json.Marshaler)
```

যদি শুধুমাত্র একটি type একটি interface implement করে কিনা তা জিজ্ঞাসা করা প্রয়োজন হয়, actual interface itself ব্যবহার না করে, সম্ভবত একটি error check-এর অংশ হিসাবে, type-asserted value-কে ignore করতে blank identifier ব্যবহার করুন:

```go
if _, ok := val.(json.Marshaler); ok {
    fmt.Printf("value %v of type %T implements json.Marshaler\n", val, val)
}
```

এই পরিস্থিতিটি এমন জায়গায় দেখা যায় যেখানে package-এর মধ্যে type implement করা হয়েছে তা নিশ্চিত করা প্রয়োজন যে এটি আসলে interface satisfy করে। যদি একটি type - উদাহরণস্বরূপ, `json.RawMessage` - একটি custom JSON representation প্রয়োজন হয়, তবে এটি `json.Marshaler` implement করবে, কিন্তু কোনো static conversion নেই যা compiler-কে স্বয়ংক্রিয়ভাবে এটি verify করতে দেবে। যদি type inadvertent-ভাবে interface satisfy করতে ব্যর্থ হয়, তাহলে JSON encoder এখনও কাজ করবে, কিন্তু custom implementation ব্যবহার করবে না। implementation সঠিক তা নিশ্চিত করতে, package-এ blank identifier ব্যবহার করে একটি global declaration ব্যবহার করা যেতে পারে:

```go
var _ json.Marshaler = (*RawMessage)(nil)
```

এই declaration-এ, একটি `*RawMessage`-কে `Marshaler`-এ conversion সহ assignment-এর জন্য প্রয়োজন যে `*RawMessage` `Marshaler` implement করে, এবং সেই property compile time-এ check করা হবে। যদি `json.Marshaler` interface পরিবর্তিত হয়, তাহলে এই package আর compile হবে না এবং আমাদের জানানো হবে যে এটি update করা প্রয়োজন।

এই construct-এ blank identifier-এর উপস্থিতি নির্দেশ করে যে declarationটি শুধুমাত্র type checking-এর জন্য বিদ্যমান, variable তৈরি করার জন্য নয়। তবে, প্রতিটি type-এর জন্য এটি করবেন না যা একটি interface satisfy করে। convention অনুযায়ী, এই ধরনের declaration শুধুমাত্র তখনই ব্যবহার করা হয় যখন code-এ ইতিমধ্যেই কোনো static conversion উপস্থিত না থাকে, যা একটি rare event।

## Embedding

Go-তে subclassing-এর সাধারণ, type-driven ধারণা নেই, কিন্তু এটি একটি struct বা interface-এর মধ্যে type `embed` করে implementation-এর অংশগুলি "borrow" করার ক্ষমতা রাখে।

Interface embedding খুব simple। আমরা আগে `io.Reader` এবং `io.Writer` interface-এর কথা উল্লেখ করেছি; এখানে তাদের definition দেওয়া হল।

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}
```

`io` package আরও বেশ কয়েকটি interface export করে যা এমন object-গুলো specify করে যা এই ধরনের কয়েকটি method implement করতে পারে। উদাহরণস্বরূপ, `io.ReadWriter` আছে, এটি একটি interface যার মধ্যে `Read` এবং `Write` উভয়ই আছে। আমরা দুটি method স্পষ্টভাবে তালিকাভুক্ত করে `io.ReadWriter` specify করতে পারি, কিন্তু এটি আরও সহজ এবং আরও evocatives হয় দুটি interface-কে embed করে নতুন interfaceটি তৈরি করা, যেমন:

```go
// ReadWriter is the interface that combines the Reader and Writer interfaces.
type ReadWriter interface {
    Reader
    Writer
}
```

এটি ঠিক যেমনটি দেখাচ্ছে তেমনই বলছে: একটি `ReadWriter` যা একটি `Reader` করে `এবং` যা একটি `Writer` করে তা করতে পারে; এটি embedded interface-গুলোর একটি union। interface-এর মধ্যে শুধুমাত্র interface-গুলোই embed করা যেতে পারে।

একই মৌলিক ধারণা struct-এর ক্ষেত্রেও প্রযোজ্য, তবে এর সুদূরপ্রসারী প্রভাব রয়েছে। `bufio` package-এর দুটি struct type আছে, `bufio.Reader` এবং `bufio.Writer`, যার প্রতিটি অবশ্যই `io` package থেকে analogous interface implement করে। এবং `bufio` একটি buffered reader/writer-ও implement করে, যা এটি embedding ব্যবহার করে একটি reader এবং একটি writer-কে একটি struct-এর মধ্যে একত্রিত করে করে: এটি struct-এর মধ্যে type-গুলো তালিকাভুক্ত করে কিন্তু তাদের field name দেয় না।

```go
// ReadWriter stores pointers to a Reader and a Writer.
// It implements io.ReadWriter.
type ReadWriter struct {
    *Reader  // *bufio.Reader
    *Writer  // *bufio.Writer
}
```

embedded element-গুলো struct-এর pointer এবং অবশ্যই ব্যবহার করার আগে valid struct-এর দিকে point করার জন্য initialized হতে হবে। `ReadWriter` struct-টি এভাবে লেখা যেতে পারে:

```go
type ReadWriter struct {
    reader *Reader
    writer *Writer
}
```

কিন্তু তখন field-গুলির method-কে promote করতে এবং `io` interface-গুলো satisfy করতে, আমাদের forwarding method-ও প্রদান করতে হবে, যেমন:

```go
func (rw *ReadWriter) Read(p []byte) (n int, err error) {
    return rw.reader.Read(p)
}
```

struct-গুলো সরাসরি embed করার মাধ্যমে, আমরা এই bookkeeping এড়িয়ে যাই। embedded type-এর method-গুলো বিনামূল্যে পাওয়া যায়, যার মানে হল `bufio.ReadWriter`-এর শুধু `bufio.Reader` এবং `bufio.Writer`-এর method-গুলিই নেই, এটি তিনটি interface-ই satisfy করে: `io.Reader`, `io.Writer`, এবং `io.ReadWriter`।

embedding-এর সাথে subclassing-এর একটি গুরুত্বপূর্ণ পার্থক্য আছে। যখন আমরা একটি type embed করি, তখন সেই type-এর method-গুলি outer type-এর method হয়ে যায়, কিন্তু যখন তাদের invoke করা হয় তখন method-এর receiverটি inner type হয়, outer type নয়। আমাদের উদাহরণে, যখন একটি `bufio.ReadWriter`-এর `Read` method invoke করা হয়, তখন এটির ঠিক তেমনই প্রভাব থাকে যেমন উপরে লেখা forwarding method-এর; receiverটি `ReadWriter`-এর `reader` field, `ReadWriter` নিজেই নয়।

Embedding একটি সাধারণ সুবিধার জন্যও হতে পারে। এই উদাহরণটি একটি নিয়মিত, named field-এর পাশাপাশি একটি embedded field দেখাচ্ছে।

```go
type Job struct {
    Command string
    *log.Logger
}
```

`Job` type-এর এখন `*log.Logger`-এর `Print`, `Printf`, `Println` এবং অন্যান্য method আছে। আমরা `Logger`-কে একটি field name দিতে পারতাম, অবশ্যই, কিন্তু তা করার প্রয়োজন নেই। এবং এখন, একবার initialized হয়ে গেলে, আমরা `Job`-এ log করতে পারি:

```go
job.Println("starting now...")
```

`Logger` হল `Job` struct-এর একটি নিয়মিত field, তাই আমরা `Job`-এর constructor-এর ভিতরে এটিকে স্বাভাবিক উপায়ে initialize করতে পারি, যেমন:

```go
func NewJob(command string, logger *log.Logger) *Job {
    return &Job{command, logger}
}
```

অথবা একটি composite literal দিয়ে,

```go
job := &Job{command, log.New(os.Stderr, "Job: ", log.Ldate)}
```

যদি আমাদের সরাসরি একটি embedded field-কে refer করার প্রয়োজন হয়, তাহলে field-এর type name, package qualifier-কে উপেক্ষা করে, একটি field name হিসাবে কাজ করে, যেমনটি আমাদের `ReadWriter` struct-এর `Read` method-এ করেছিল। এখানে, যদি আমাদের একটি `Job` variable `job`-এর `*log.Logger` access করার প্রয়োজন হয়, তাহলে আমরা `job.Logger` লিখব, যা useful হবে যদি আমরা `Logger`-এর method-গুলি পরিমার্জন করতে চাই।

```go
func (job *Job) Printf(format string, args ...interface{}) {
    job.Logger.Printf("%q: %s", job.Command, fmt.Sprintf(format, args...))
}
```

Type embed করা name conflict-এর সমস্যা তৈরি করে কিন্তু সেগুলো সমাধান করার নিয়ম simple। প্রথমত, একটি field বা method `X` type-এর আরও গভীরভাবে nested অংশে যেকোনো অন্য item `X`-কে hide করে। যদি `log.Logger`-এ `Command` নামে একটি field বা method থাকত, তাহলে `Job`-এর `Command` field সেটিকে dominate করত।

দ্বিতীয়ত, যদি একই name একই nesting level-এ দেখা যায়, তাহলে এটি সাধারণত একটি error; যদি `Job` struct-এ `Logger` নামে অন্য কোনো field বা method থাকত তাহলে `log.Logger` embed করা ভুল হত। তবে, যদি duplicate name-টি type definition-এর বাইরে program-এ কখনও উল্লেখ না করা হয়, তাহলে এটি ঠিক আছে। এই qualification বাইরে থেকে embedded type-গুলিতে করা পরিবর্তনগুলির বিরুদ্ধে কিছু সুরক্ষা প্রদান করে; যদি এমন একটি field যোগ করা হয় যা অন্য subtype-এর অন্য field-এর সাথে conflict করে তাহলে কোনো সমস্যা হয় না যদি উভয় field কখনও ব্যবহার না করা হয়।

## Concurrency

### Share by communicating

Concurrent programming একটি বড় বিষয় এবং এখানে শুধুমাত্র কিছু Go-specific highlights-এর জন্য জায়গা আছে।

অনেক environment-এ concurrent programming shared variable-এ সঠিক access implement করার জন্য প্রয়োজনীয় সূক্ষ্মতার কারণে কঠিন হয়ে পড়ে। Go একটি ভিন্ন approach উৎসাহিত করে যেখানে shared value-গুলি channel-এর মাধ্যমে চারপাশে passed হয় এবং, আসলে, execution-এর পৃথক thread-গুলো দ্বারা কখনও সক্রিয়ভাবে shared হয় না। যেকোনো given time-এ শুধুমাত্র একটি goroutine-এর value-টিতে access থাকে। Data race design অনুযায়ী ঘটতে পারে না। এই চিন্তাভাবনাকে উৎসাহিত করার জন্য আমরা এটিকে একটি স্লোগানে নিয়ে এসেছি:

মেমরি share করে communicate করবেন না; বরং, communicate করে মেমরি share করুন।

এই approach-টি খুব বেশি ব্যবহার করা যেতে পারে। উদাহরণস্বরূপ, reference count একটি integer variable-এর চারপাশে একটি mutex রেখে সেরা ভাবে করা যেতে পারে। কিন্তু একটি high-level approach হিসাবে, access control করতে channel ব্যবহার করা clear, correct program লেখা সহজ করে তোলে।

এই মডেল সম্পর্কে চিন্তা করার একটি উপায় হল একটি typical single-threaded program একটি CPU-তে running অবস্থায় বিবেচনা করা। এটির synchronization primitive-এর প্রয়োজন নেই। এখন আরও একটি such instance চালান; এটিরও synchronization-এর প্রয়োজন নেই। এখন সেই দুটিকে communicate করতে দিন; যদি communication synchronizer হয়, তাহলে অন্য synchronization-এর এখনও প্রয়োজন নেই। Unix pipeline, উদাহরণস্বরূপ, এই মডেলের সাথে পুরোপুরি মিলে যায়। যদিও Go-এর concurrency-এর approach Hoare-এর Communicating Sequential Processes (CSP) থেকে উদ্ভূত, এটি Unix pipe-এর একটি type-safe generalization হিসাবেও দেখা যেতে পারে।

### Goroutines

এদের `goroutines` বলা হয় কারণ বিদ্যমান term - thread, coroutine, process, ইত্যাদি - inaccurate connotation বোঝায়। একটি goroutine-এর একটি simple মডেল আছে: এটি একই address space-এ অন্যান্য goroutine-এর সাথে concurrent-ভাবে execute হওয়া একটি function। এটি lightweight, stack space-এর allocation-এর চেয়ে সামান্য বেশি খরচ হয়। এবং stack-গুলো ছোট শুরু হয়, তাই তারা cheap, এবং প্রয়োজন অনুযায়ী heap storage allocate (এবং free) করে grow করে।

Goroutine-গুলি একাধিক OS thread-এ multiplexed হয় তাই যদি একটি block হয়ে যায়, যেমন I/O-এর জন্য অপেক্ষা করার সময়, অন্যরা চলতে থাকে। তাদের design thread তৈরি এবং management-এর অনেক জটিলতা লুকিয়ে রাখে।

একটি function বা method call-এর আগে `go` keyword ব্যবহার করুন একটি নতুন goroutine-এ call-টি চালানোর জন্য। যখন call-টি complete হয়, goroutine silently exit করে। (প্রভাবটি Unix shell-এর `&` notation-এর মতো যা background-এ একটি command চালানোর জন্য।)

```go
go list.Sort() // run list.Sort concurrently; don't wait for it.
```

একটি function literal একটি goroutine invocation-এ handy হতে পারে।

```go
func Announce(message string, delay time.Duration) {
    go func() {
        time.Sleep(delay)
        fmt.Println(message)
    }() // Note the parentheses - must call the function.
}
```

Go-তে, function literal-গুলি closure: implementation নিশ্চিত করে যে function দ্বারা refer করা variable-গুলি যতক্ষণ active থাকে ততক্ষণ টিকে থাকে।

এই উদাহরণগুলি খুব practical নয় কারণ function-গুলির completion signal করার কোনো উপায় নেই। এর জন্য, আমাদের channel প্রয়োজন।

### Channels

map-এর মতো, channel-গুলি `make` দিয়ে allocate করা হয়, এবং resulting value একটি underlying data structure-এর reference হিসাবে কাজ করে। যদি একটি optional integer parameter প্রদান করা হয়, তাহলে এটি channel-এর জন্য buffer size সেট করে। default হল শূন্য, একটি unbuffered বা synchronous channel-এর জন্য।

```go
ci := make(chan int)            // unbuffered channel of integers
cj := make(chan int, 0)         // unbuffered channel of integers
cs := make(chan *os.File, 100)  // buffered channel of pointers to Files
```

Unbuffered channel-গুলি communication – একটি value-এর exchange – কে synchronization – দুটি calculation (goroutine) একটি পরিচিত state-এ আছে তা নিশ্চিত করা – এর সাথে একত্রিত করে।

channel ব্যবহার করে অনেক সুন্দর idiom আছে। এখানে একটি আছে যা আমাদের শুরু করতে সাহায্য করবে। আগের section-এ আমরা background-এ একটি sort চালু করেছিলাম। একটি channel launching goroutine-কে sort complete হওয়ার জন্য অপেক্ষা করতে দিতে পারে।

```go
c := make(chan int)  // Allocate a channel.
// Start the sort in a goroutine; when it completes, signal on the channel.
go func() {
    list.Sort()
    c <- 1  // Send a signal; value does not matter.
}()
doSomethingForAWhile()
<-c   // Wait for sort to finish; discard sent value.
```

Receiver-গুলি সর্বদা block হয় যতক্ষণ না receive করার জন্য data থাকে। যদি channelটি unbuffered হয়, sender block হয় যতক্ষণ না receiver valueটি receive করে। যদি channel-এর একটি buffer থাকে, sender শুধুমাত্র block হয় যতক্ষণ না valueটি buffer-এ copy করা হয়; যদি buffer পূর্ণ থাকে, এর অর্থ হল কিছু receiver একটি value না নেওয়া পর্যন্ত অপেক্ষা করা।

একটি buffered channel একটি semaphore-এর মতো ব্যবহার করা যেতে পারে, উদাহরণস্বরূপ throughput limit করার জন্য। এই উদাহরণে, incoming request-গুলি `handle`-এ passed হয়, যা channel-এ একটি value পাঠায়, request-টি process করে, এবং তারপর পরবর্তী consumer-এর জন্য "semaphore" ready করার জন্য channel থেকে একটি value receive করে। channel buffer-এর capacity `process`-এর simultaneous call-এর সংখ্যা limit করে।

```go
var sem = make(chan int, MaxOutstanding)

func handle(r *Request) {
    sem <- 1    // Wait for active queue to drain.
    process(r)  // May take a long time.
    <-sem       // Done; enable next request to run.
}

func Serve(queue chan *Request) {
    for {
        req := <-queue
        go handle(req)  // Don't wait for handle to finish.
    }
}
```

একবার `MaxOutstanding` handler `process` execute করা শুরু করলে, আরও যেকোনো handler filled channel buffer-এ পাঠাতে গিয়ে block হবে, যতক্ষণ না বিদ্যমান handler-গুলোর মধ্যে একটি শেষ হয় এবং buffer থেকে receive করে।

তবে, এই design-এর একটি সমস্যা আছে: `Serve` প্রতিটি incoming request-এর জন্য একটি নতুন goroutine তৈরি করে, যদিও তাদের মধ্যে শুধুমাত্র `MaxOutstanding` যেকোনো মুহূর্তে চলতে পারে। ফলস্বরূপ, request-গুলি খুব দ্রুত আসলে program সীমাহীন resource consume করতে পারে। আমরা `Serve`-কে goroutine-এর creation gate করার জন্য পরিবর্তন করে সেই deficiency address করতে পারি:

```go
func Serve(queue chan *Request) {
    for req := range queue {
        sem <- 1
        go func() {
            process(req)
            <-sem
        }()
    }
}
```

(মনে রাখবেন Go version 1.22 এর আগে এই code-এ একটি bug আছে: loop variableটি সমস্ত goroutine-এর মধ্যে shared হয়। বিস্তারিত জানার জন্য Go wiki দেখুন।)

resource ভালোভাবে manage করার আরেকটি approach হল request channel থেকে সমস্ত `handle` goroutine-এর একটি fixed number শুরু করা। goroutine-এর সংখ্যা `process`-এর simultaneous call-এর সংখ্যা limit করে। এই `Serve` function-টিও একটি channel গ্রহণ করে যার উপর এটি exit করতে বলা হবে; goroutine-গুলি launch করার পরে এটি সেই channel থেকে receiving block করে।

```go
func handle(queue chan *Request) {
    for r := range queue {
        process(r)
    }
}

func Serve(clientRequests chan *Request, quit chan bool) {
    // Start handlers
    for i := 0; i < MaxOutstanding; i++ {
        go handle(clientRequests)
    }
    <-quit  // Wait to be told to exit.
}
```

### Channels of channels

Go-এর অন্যতম গুরুত্বপূর্ণ বৈশিষ্ট্য হল যে একটি channel একটি first-class value যা যেকোনো অন্যটির মতো allocate এবং pass করা যেতে পারে। এই property-এর একটি সাধারণ ব্যবহার হল safe, parallel demultiplexing implement করা।

আগের section-এর উদাহরণে, `handle` একটি request-এর জন্য একটি আদর্শ handler ছিল কিন্তু আমরা যে typeটি handle করছিল তা define করিনি। যদি সেই type-এ reply করার জন্য একটি channel অন্তর্ভুক্ত থাকে, প্রতিটি client উত্তরের জন্য তার নিজস্ব path প্রদান করতে পারে। এখানে `Request` type-এর একটি schematic definition দেওয়া হল।

```go
type Request struct {
    args        []int
    f           func([]int) int
    resultChan  chan int
}
```

Client একটি function এবং তার arguments প্রদান করে, সেইসাথে request object-এর ভিতরে একটি channel প্রদান করে যাতে উত্তর receive করা যায়।

```go
func sum(a []int) (s int) {
    for _, v := range a {
        s += v
    }
    return
}

request := &Request{[]int{3, 4, 5}, sum, make(chan int)}
// Send request
clientRequests <- request
// Wait for response.
fmt.Printf("answer: %d\n", <-request.resultChan)
```

server side-এ, handler function-টিই একমাত্র জিনিস যা পরিবর্তিত হয়।

```go
func handle(queue chan *Request) {
    for req := range queue {
        req.resultChan <- req.f(req.args)
    }
}
```

এটি বাস্তবসম্মত করার জন্য আরও অনেক কিছু করার আছে, কিন্তু এই codeটি একটি rate-limited, parallel, non-blocking RPC system-এর জন্য একটি framework, এবং কোনো mutex দেখা যাচ্ছে না।

### Parallelization

এই ধারণাগুলির আরেকটি application হল একটি calculation-কে একাধিক CPU core-এর মধ্যে parallelize করা। যদি calculation-টি স্বাধীনভাবে execute হতে পারে এমন পৃথক অংশে ভাঙা যায়, তবে এটিকে parallelize করা যেতে পারে, প্রতিটি অংশ complete হলে signal করার জন্য একটি channel ব্যবহার করে।

ধরুন আমাদের item-এর একটি vector-এ একটি ব্যয়বহুল operation perform করতে হবে, এবং প্রতিটি item-এর উপর operation-এর value স্বাধীন, যেমন এই আদর্শ উদাহরণে।

```go
type Vector []float64

// Apply the operation to v[i], v[i+1] ... up to v[n-1].
func (v Vector) DoSome(i, n int, u Vector, c chan int) {
    for ; i < n; i++ {
        v[i] += u.Op(v[i])
    }
    c <- 1    // signal that this piece is done
}
```

আমরা loop-এ স্বাধীনভাবে অংশগুলি চালু করি, প্রতি CPU-তে একটি। তারা যেকোনো ক্রমে complete হতে পারে কিন্তু তাতে কিছু যায় আসে না; আমরা কেবল সমস্ত goroutine চালু করার পরে channel-টি drain করে completion signal-গুলি count করি।

```go
const numCPU = 4 // number of CPU cores

func (v Vector) DoAll(u Vector) {
    c := make(chan int, numCPU)  // Buffering optional but sensible.
    for i := 0; i < numCPU; i++ {
        go v.DoSome(i*len(v)/numCPU, (i+1)*len(v)/numCPU, u, c)
    }
    // Drain the channel.
    for i := 0; i < numCPU; i++ {
        <-c    // wait for one task to complete
    }
    // All done.
}
```

`numCPU`-এর জন্য একটি constant value তৈরি করার পরিবর্তে, আমরা runtime-কে জিজ্ঞাসা করতে পারি কোন value উপযুক্ত। `runtime.NumCPU` function machine-এর hardware CPU core-এর সংখ্যা return করে, তাই আমরা লিখতে পারি:

```go
var numCPU = runtime.NumCPU()
```

একটি function `runtime.GOMAXPROCS`-ও আছে, যা একটি Go program একই সাথে চলতে পারে এমন user-specified core-এর সংখ্যা report করে (বা সেট করে)। এটি `runtime.NumCPU`-এর value-এর default হয় কিন্তু একইভাবে named shell environment variable সেট করে বা একটি positive number সহ function-কে call করে override করা যেতে পারে। শূন্য দিয়ে call করলে কেবল valueটি query করে। অতএব, যদি আমরা user-এর resource request সম্মান করতে চাই, তাহলে আমাদের লেখা উচিত:

```go
var numCPU = runtime.GOMAXPROCS(0)
```

Concurrency - একটি program-কে স্বাধীনভাবে execute হওয়া component হিসাবে structuring - এবং parallelism - একাধিক CPU-তে efficiency-এর জন্য calculation parallel-ভাবে execute করা - এর ধারণাগুলি গুলিয়ে ফেলবেন না। যদিও Go-এর concurrency feature-গুলি কিছু সমস্যাকে parallel computation হিসাবে structure করা সহজ করতে পারে, Go একটি concurrent language, parallel নয়, এবং সমস্ত parallelization problem Go-এর model-এর সাথে মানানসই হয় না। এই পার্থক্যের আলোচনার জন্য, এই blog post-এ উল্লিখিত talkটি দেখুন।

### A leaky buffer

Concurrent programming-এর সরঞ্জামগুলি এমনকি non-concurrent ধারণাগুলি প্রকাশ করা সহজ করে তুলতে পারে। এখানে একটি RPC package থেকে abstracted একটি উদাহরণ দেওয়া হল। client goroutine কিছু source থেকে data receive করে, সম্ভবত একটি network। buffer allocate এবং free করা এড়াতে, এটি একটি free list রাখে, এবং এটি represent করার জন্য একটি buffered channel ব্যবহার করে। যদি channelটি খালি থাকে, তাহলে একটি নতুন buffer allocate করা হয়। একবার message buffer ready হয়ে গেলে, এটি `serverChan`-এ server-এ পাঠানো হয়।

```go
var freeList = make(chan *Buffer, 100)
var serverChan = make(chan *Buffer)

func client() {
    for {
        var b *Buffer
        // Grab a buffer if available; allocate if not.
        select {
        case b = <-freeList:
            // Got one; nothing more to do.
        default:
            // None free, so allocate a new one.
            b = new(Buffer)
        }
        load(b)              // Read next message from the net.
        serverChan <- b      // Send to server.
    }
}
```

server loop client থেকে প্রতিটি message receive করে, এটি process করে, এবং buffer-টি free list-এ return করে।

```go
func server() {
    for {
        b := <-serverChan    // Wait for work.
        process(b)
        // Reuse buffer if there's room.
        select {
        case freeList <- b:
            // Buffer on free list; nothing more to do.
        default:
            // Free list full, just carry on.
        }
    }
}
```

client `freeList` থেকে একটি buffer retrieve করার চেষ্টা করে; যদি কোনোটি উপলব্ধ না থাকে, তাহলে এটি একটি fresh one allocate করে। server-এর `freeList`-এ send `b`-কে free list-এ ফিরিয়ে দেয় যদি না listটি পূর্ণ হয়, সেক্ষেত্রে bufferটি garbage collector দ্বারা reclaim করার জন্য floor-এ ফেলে দেওয়া হয়। (`select` statement-এর `default` clause-গুলি execute হয় যখন অন্য কোনো case ready না থাকে, যার অর্থ হল `select`-গুলি কখনও block হয় না।) এই implementationটি মাত্র কয়েকটি লাইনে একটি leaky bucket free list তৈরি করে, bookkeeping-এর জন্য buffered channel এবং garbage collector-এর উপর নির্ভর করে।

## Errors

Library routine-গুলোকে প্রায়শই caller-কে কিছু ধরনের error indication return করতে হয়। যেমনটি আগে উল্লেখ করা হয়েছে, Go-এর multivalue return সাধারণ return value-এর পাশাপাশি একটি detailed error description return করা সহজ করে তোলে। detailed error information প্রদান করার জন্য এই featureটি ব্যবহার করা একটি ভালো style। উদাহরণস্বরূপ, যেমনটি আমরা দেখব, `os.Open` ব্যর্থ হলে কেবল একটি `nil` pointer return করে না, এটি একটি error value-ও return করে যা কী ভুল হয়েছে তা বর্ণনা করে।

convention অনুযায়ী, error-এর type `error` হয়, যা একটি simple built-in interface।

```go
type error interface {
    Error() string
}
```

একজন library writer এই interface-কে covers-এর অধীনে একটি richer model দিয়ে implement করতে স্বাধীন, যা শুধুমাত্র error দেখতেই নয় বরং কিছু context প্রদান করাও সম্ভব করে তোলে। যেমনটি উল্লেখ করা হয়েছে, সাধারণ `*os.File` return value-এর পাশাপাশি, `os.Open` একটি error value-ও return করে। যদি fileটি সফলভাবে খোলা হয়, তাহলে errorটি `nil` হবে, কিন্তু যখন একটি সমস্যা থাকে, তখন এটি একটি `os.PathError` ধারণ করবে:

```go
// PathError records an error and the operation and
// file path that caused it.
type PathError struct {
    Op string    // "open", "unlink", etc.
    Path string  // The associated file.
    Err error    // Returned by the system call.
}

func (e *PathError) Error() string {
    return e.Op + " " + e.Path + ": " + e.Err.Error()
}
```

`PathError`-এর `Error` এরকম একটি string generate করে:

`open /etc/passwx: no such file or directory`

এই ধরনের একটি error, যার মধ্যে problematic file name, operation, এবং এটি দ্বারা triggered operating system error অন্তর্ভুক্ত, এটি যে call-এর কারণে ঘটেছে তার থেকে দূরে print করা হলেও useful; এটি plain "no such file or directory" থেকে অনেক বেশি informative।

যখন সম্ভব, error string-এর উৎস identify করা উচিত, যেমন error তৈরি করা operation বা package-এর নাম দিয়ে একটি prefix রাখা। উদাহরণস্বরূপ, `image` package-এ, একটি unknown format-এর কারণে একটি decoding error-এর string representation হল "image: unknown format"।

যে caller-গুলি precise error detail সম্পর্কে care করে তারা specific error খুঁজতে এবং detail extract করতে একটি type switch বা একটি type assertion ব্যবহার করতে পারে। `PathError`-এর জন্য এর মধ্যে recoverable failure-এর জন্য internal `Err` field পরীক্ষা করা অন্তর্ভুক্ত থাকতে পারে।

```go
for try := 0; try < 2; try++ {
    file, err = os.Create(filename)
    if err == nil {
        return
    }
    if e, ok := err.(*os.PathError); ok && e.Err == syscall.ENOSPC {
        deleteTempFiles()  // Recover some space.
        continue
    }
    return
}
```

এখানে দ্বিতীয় `if` statementটি আরেকটি `type assertion`। যদি এটি ব্যর্থ হয়, `ok` false হবে, এবং `e` `nil` হবে। যদি এটি সফল হয়, `ok` true হবে, যার মানে errorটি `*os.PathError` type-এর ছিল, এবং তখন `e`-ও তাই, যা আমরা error সম্পর্কে আরও তথ্যের জন্য পরীক্ষা করতে পারি।

### Panic

caller-কে একটি error report করার সাধারণ উপায় হল একটি `error` একটি অতিরিক্ত return value হিসাবে return করা। canonical `Read` method একটি সুপরিচিত instance; এটি একটি byte count এবং একটি `error` return করে। কিন্তু error যদি unrecoverable হয়? কখনও কখনও program কেবল চলতে পারে না।

এই উদ্দেশ্যে, একটি built-in function `panic` আছে যা কার্যকরভাবে একটি run-time error তৈরি করে যা program-কে থামিয়ে দেবে (তবে পরবর্তী section দেখুন)। functionটি arbitrary type-এর একটি single argument নেয় - প্রায়শই একটি string - যা program বন্ধ হয়ে গেলে print করা হবে। এটি এমনও নির্দেশ করার একটি উপায় যে কিছু অসম্ভব ঘটেছে, যেমন একটি infinite loop থেকে exit করা।

```go
// A toy implementation of cube root using Newton's method.
func CubeRoot(x float64) float64 {
    z := x/3   // Arbitrary initial value
    for i := 0; i < 1e6; i++ {
        prevz := z
        z -= (z*z*z-x) / (3*z*z)
        if veryClose(z, prevz) {
            return z
        }
    }
    // A million iterations has not converged; something is wrong.
    panic(fmt.Sprintf("CubeRoot(%g) did not converge", x))
}
```

এটি শুধুমাত্র একটি উদাহরণ কিন্তু real library function-গুলোর `panic` এড়ানো উচিত। যদি সমস্যাটি masked বা worked around করা যায়, তাহলে পুরো program বন্ধ করার চেয়ে জিনিসগুলি চলতে দেওয়া সর্বদা ভালো। একটি সম্ভাব্য counterexample হল initialization-এর সময়: যদি library সত্যিই নিজেকে সেট আপ করতে না পারে, তাহলে panic করা যুক্তিযুক্ত হতে পারে, তাই বলতে গেলে।

```go
var user = os.Getenv("USER")

func init() {
    if user == "" {
        panic("no value for $USER")
    }
}
```

### Recover

যখন `panic` call করা হয়, যার মধ্যে implicitly run-time error যেমন একটি slice-এর out of bounds index করা বা একটি type assertion ব্যর্থ হওয়া অন্তর্ভুক্ত, তখন এটি বর্তমান function-এর execution অবিলম্বে থামিয়ে দেয় এবং goroutine-এর stack unwinding শুরু করে, পথে যেকোনো deferred function চালায়। যদি সেই unwinding goroutine-এর stack-এর শীর্ষে পৌঁছায়, তাহলে program বন্ধ হয়ে যায়। তবে, built-in function `recover` ব্যবহার করে goroutine-এর নিয়ন্ত্রণ ফিরে পাওয়া এবং normal execution resume করা সম্ভব।

`recover`-এ একটি call unwinding থামিয়ে দেয় এবং `panic`-এ passed argumentটি return করে। যেহেতু unwinding চলাকালীন যে একমাত্র code চলে তা deferred function-এর ভিতরে থাকে, `recover` শুধুমাত্র deferred function-এর ভিতরেই useful।

`recover`-এর একটি application হল server-এর ভিতরে একটি failing goroutine বন্ধ করা অন্য executing goroutine-কে kill না করে।

```go
func server(workChan <-chan *Work) {
    for work := range workChan {
        go safelyDo(work)
    }
}

func safelyDo(work *Work) {
    defer func() {
        if err := recover(); err != nil {
            log.Println("work failed:", err)
        }
    }()
    do(work)
}
```

এই উদাহরণে, যদি `do(work)` panic করে, resultটি log করা হবে এবং goroutineটি অন্যগুলিকে disturbance না করে cleanly exit করবে। deferred closure-এ অন্য কিছু করার প্রয়োজন নেই; `recover` call করা condition-টিকে সম্পূর্ণরূপে handle করে।

যেহেতু `recover` সর্বদা `nil` return করে যদি না এটি সরাসরি একটি deferred function থেকে call করা হয়, deferred code library routine-গুলো call করতে পারে যা নিজেরাই `panic` এবং `recover` ব্যবহার করে ব্যর্থ না হয়ে। উদাহরণস্বরূপ, `safelyDo`-এর deferred function `recover` call করার আগে একটি logging function call করতে পারে, এবং সেই logging code panicking state দ্বারা unaffected থাকবে।

আমাদের recovery pattern কার্যকর থাকায়, `do` function (এবং এটি যা কিছু call করে) `panic` call করে যেকোনো খারাপ পরিস্থিতি থেকে cleanly বেরিয়ে আসতে পারে। আমরা complex software-এ error handling সহজ করতে সেই ধারণাটি ব্যবহার করতে পারি। আসুন একটি `regexp` package-এর একটি আদর্শ সংস্করণ দেখি, যা একটি local error type দিয়ে `panic` call করে parsing error report করে। এখানে `Error`-এর definition, একটি `error` method, এবং `Compile` function দেওয়া হল।

```go
// Error is the type of a parse error; it satisfies the error interface.
type Error string
func (e Error) Error() string {
    return string(e)
}

// error is a method of *Regexp that reports parsing errors by
// panicking with an Error.
func (regexp *Regexp) error(err string) {
    panic(Error(err))
}

// Compile returns a parsed representation of the regular expression.
func Compile(str string) (regexp *Regexp, err error) {
    regexp = new(Regexp)
    // doParse will panic if there is a parse error.
    defer func() {
        if e := recover(); e != nil {
            regexp = nil    // Clear return value.
            err = e.(Error) // Will re-panic if not a parse error.
        }
    }()
    return regexp.doParse(str), nil
}
```

যদি `doParse` panic করে, recovery block return value-কে `nil` সেট করবে - deferred function-গুলো named return value modify করতে পারে। এটি তখন, `err`-এ assignment-এর মাধ্যমে, `Error` local type আছে কিনা তা assert করে নিশ্চিত করবে যে সমস্যাটি একটি parse error ছিল। যদি তা না হয়, type assertion ব্যর্থ হবে, যার ফলে একটি run-time error হবে যা stack unwinding চালিয়ে যাবে যেন কিছুই এটিকে ব্যাহত করেনি। এই check-এর মানে হল যে যদি অপ্রত্যাশিত কিছু ঘটে, যেমন একটি index out of bounds, তাহলে codeটি ব্যর্থ হবে যদিও আমরা parse error handle করার জন্য `panic` এবং `recover` ব্যবহার করছি।

error handling কার্যকর থাকায়, `error` method (কারণ এটি একটি type-এর সাথে bound একটি method, তাই এটি বিল্টইন `error` type-এর মতো একই name রাখা ঠিক, এমনকি naturalও) hand-এ parse stack unwinding নিয়ে চিন্তা না করেই parse error report করা সহজ করে তোলে:

```go
if pos == 0 {
    re.error("'*' illegal at start of expression")
}
```

এই patternটি যতই useful হোক না কেন, এটি শুধুমাত্র একটি package-এর মধ্যে ব্যবহার করা উচিত। `Parse` তার internal `panic` call-গুলোকে `error` value-তে পরিণত করে; এটি তার client-কে `panic` expose করে না। এটি অনুসরণ করার একটি ভালো নিয়ম।

by the way, এই re-panic idiom একটি actual error ঘটলে panic value পরিবর্তন করে। তবে, original এবং নতুন উভয় failure-ই crash report-এ উপস্থাপন করা হবে, তাই সমস্যার মূল কারণ এখনও দৃশ্যমান থাকবে। সুতরাং এই simple re-panic approachটি সাধারণত যথেষ্ট - এটি সব পরে একটি crash - কিন্তু যদি আপনি শুধুমাত্র original value display করতে চান, তাহলে আপনি অপ্রত্যাশিত সমস্যাগুলি filter করতে এবং original error সহ re-panic করার জন্য আরও কিছুটা code লিখতে পারেন। এটি পাঠকের জন্য একটি exercise হিসাবে রাখা হল।

## A web server

আসুন একটি সম্পূর্ণ Go program, একটি web server দিয়ে শেষ করি। এটি আসলে এক ধরনের web re-server। Google `chart.apis.google.com` এ একটি service প্রদান করে যা chart এবং graph-এ data-এর automatic formatting করে। তবে, interactively ব্যবহার করা কঠিন, কারণ আপনাকে data-কে URL-এর মধ্যে একটি query হিসাবে রাখতে হবে। এখানে programটি data-এর একটি form-এর জন্য একটি nicer interface প্রদান করে: একটি ছোট text দেওয়া হলে, এটি chart server-কে একটি QR code তৈরি করতে call করে, এটি একটি matrix of box যা textটি encode করে। সেই imageটি আপনার cell phone-এর camera দিয়ে grabbed করা যেতে পারে এবং, উদাহরণস্বরূপ, একটি URL হিসাবে interpreted করা যেতে পারে, আপনার phone-এর tiny keyboard-এ URL typing save করে।

এখানে সম্পূর্ণ programটি দেওয়া হল। একটি ব্যাখ্যা অনুসরণ করবে।

```go
package main

import (
    "flag"
    "html/template"
    "log"
    "net/http"
)

var addr = flag.String("addr", ":1718", "http service address") // Q=17, R=18

var templ = template.Must(template.New("qr").Parse(templateStr))

func main() {
    flag.Parse()
    http.Handle("/", http.HandlerFunc(QR))
    err := http.ListenAndServe(*addr, nil)
    if err != nil {
        log.Fatal("ListenAndServe:", err)
    }
}

func QR(w http.ResponseWriter, req *http.Request) {
    templ.Execute(w, req.FormValue("s"))
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
    <input maxLength=1024 size=70 name=s value="" title="Text to QR Encode">
    <input type=submit value="Show QR" name=qr>
</form>
</body>
</html>
`
`main` পর্যন্ত অংশগুলি অনুসরণ করা সহজ হওয়া উচিত। একটি flag আমাদের server-এর জন্য একটি default HTTP port সেট করে। `templ` template variable-এ মজা হয়। এটি একটি HTML template তৈরি করে যা page display করার জন্য server দ্বারা execute করা হবে; এই বিষয়ে একটু পরে।

`main` function flag-গুলি parse করে এবং, আমরা উপরে যে mechanism-এর কথা বলেছিলাম তা ব্যবহার করে, function `QR`-কে server-এর root path-এর সাথে bind করে। তারপর server শুরু করার জন্য `http.ListenAndServe` call করা হয়; server চলাকালীন এটি block হয়।

`QR` শুধু request receive করে, যাতে form data থাকে, এবং `s` নামে form value-তে থাকা data-এর উপর template execute করে।

`html/template` template package-টি powerful; এই programটি এর ক্ষমতাগুলির শুধুমাত্র একটি অংশ স্পর্শ করে। সংক্ষেপে, এটি `templ.Execute`-এ passed data item থেকে প্রাপ্ত element-গুলি প্রতিস্থাপন করে HTML text-এর একটি অংশ fly-এ rewrite করে, এই ক্ষেত্রে form value। template text (`templateStr`)-এর মধ্যে, double-brace-delimited অংশগুলি template action নির্দেশ করে। `{{if .}}` থেকে `{{end}}` পর্যন্ত অংশটি তখনই execute হয় যখন বর্তমান data item-এর value, যাকে `.` (dot) বলা হয়, non-empty হয়। অর্থাৎ, যখন stringটি খালি থাকে, তখন template-এর এই অংশটি suppressed হয়।

দুটি snippet `{{.}}` বলতে template-কে presentation করা data - query string - web page-এ দেখাতে বোঝায়। HTML template package স্বয়ংক্রিয়ভাবে appropriate escaping প্রদান করে যাতে textটি display করা safe হয়।

template string-এর বাকি অংশটি কেবল HTML যা page load হলে দেখাতে হয়। যদি এই ব্যাখ্যাটি খুব দ্রুত হয়, তাহলে আরও thorough আলোচনার জন্য template package-এর documentation দেখুন।

এবং সেখানে এটি আছে: কয়েকটি লাইন code এবং কিছু data-driven HTML text সহ একটি useful web server। Go কয়েকটি লাইনে অনেক কিছু ঘটাতে যথেষ্ট powerful।
