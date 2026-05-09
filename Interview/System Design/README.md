 # Step 1: Fundamentals

## 1. What happens when you type a URL in the browser and press Enter?

The browser first checks the URL. Then it finds the server IP using DNS. After that, it opens a connection to the server, usually using TCP and TLS for HTTPS. Then it sends an HTTP request. The server returns an HTTP response, usually HTML, CSS, JavaScript, images, or JSON. The browser then renders the page.

Example:

```txt
You type: https://example.com

Browser → DNS → IP address
Browser → Server connection
Browser → HTTP request
Server → HTTP response
Browser → Render page
```

---

## 2. How does HTTP differ from TCP?

**TCP** is a lower-level protocol. It creates a reliable connection between two machines.

**HTTP** is a higher-level protocol. It defines how clients and servers exchange web data.

Simple way:

```txt
TCP = road
HTTP = delivery message moving on the road
```

As a JavaScript developer, when you use:

```js
fetch("/api/users")
```

you are using HTTP. Under the hood, HTTP usually uses TCP.

---

## 3. What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?

**HTTP/1.1** sends requests mostly one by one over a connection. It can suffer from blocking.

**HTTP/2** allows many requests at the same time over one connection. This is called multiplexing.

**HTTP/3** uses QUIC over UDP instead of TCP. It is faster in unstable networks and reduces connection delay.

Simple comparison:

```txt
HTTP/1.1 = older, slower with many files
HTTP/2   = faster, multiple requests together
HTTP/3   = newer, better for mobile/unstable networks
```

---

## 4. How does DNS resolution work?

DNS converts a domain name into an IP address.

Example:

```txt
google.com → 142.250.x.x
```

Steps:

```txt
Browser cache
↓
Operating system cache
↓
DNS resolver
↓
Root DNS
↓
TLD DNS like .com
↓
Authoritative DNS
↓
IP address returned
```

Then the browser connects to that IP.

---

## 5. What is the difference between authentication and authorization?

**Authentication** means checking who you are.

**Authorization** means checking what you are allowed to do.

Example:

```txt
Authentication: Are you Sourav?
Authorization: Can Sourav access admin settings?
```

In JavaScript apps:

```js
// Authentication
const user = await login(email, password);

// Authorization
if (user.role === "admin") {
  showAdminPanel();
}
```

---

## 6. How would you design rate limiting for an API?

Rate limiting controls how many requests a user can make in a time period.

Example:

```txt
100 requests per minute per user
```

Basic design:

```txt
Client → API Gateway → Rate Limiter → Backend
```

Use Redis to store counters:

```txt
user:123 → 45 requests in current minute
```

If the user exceeds the limit, return:

```txt
HTTP 429 Too Many Requests
```

Common algorithms:

```txt
Fixed window
Sliding window
Token bucket
Leaky bucket
```

For interviews, token bucket is a good answer because it handles bursts better.

---

## 7. What are idempotent APIs, and why are they important?

An API is **idempotent** if calling it multiple times has the same result as calling it once.

Example:

```http
DELETE /users/5
```

If you call it once, user 5 is deleted.

If you call it again, user 5 is still deleted. The result is the same.

Why important?

Because networks fail. Clients may retry requests. Idempotency prevents duplicate operations.

Bad example:

```http
POST /payments
```

If retried, it may charge the user twice.

Better design:

```http
POST /payments
Idempotency-Key: abc123
```

The server checks the key and avoids duplicate payment.

---

## 8. When would you use REST instead of GraphQL?

Use **REST** when:

```txt
API is simple
Resources are clear
Caching is important
Team wants simpler tooling
```

Use **GraphQL** when:

```txt
Frontend needs flexible data
Many clients need different fields
You want to avoid over-fetching or under-fetching
```

Example REST:

```http
GET /users/1
GET /users/1/posts
```

Example GraphQL:

```graphql
{
  user(id: 1) {
    name
    posts {
      title
    }
  }
}
```

As a JavaScript developer, GraphQL can be nice for frontend-heavy apps, but REST is easier to scale and cache.

---

## 9. What is database indexing, and how does it improve performance?

An index helps the database find rows faster.

Without an index, the database may scan every row.

Example table:

```txt
users(id, email, name)
```

Query:

```sql
SELECT * FROM users WHERE email = 'a@test.com';
```

If `email` has an index, the database can find it quickly.

Simple analogy:

```txt
Book without index = search every page
Book with index = jump to the right page
```

But indexes have trade-offs:

```txt
Reads become faster
Writes become slightly slower
Indexes use extra storage
```

---

## 10. What is the difference between SQL and NoSQL databases?

**SQL databases** store structured data in tables.

Examples:

```txt
PostgreSQL
MySQL
SQL Server
```

Good for:

```txt
Transactions
Relationships
Complex queries
Strong consistency
```

**NoSQL databases** store data in flexible formats like documents, key-value pairs, or wide columns.

Examples:

```txt
MongoDB
Redis
Cassandra
DynamoDB
```

Good for:

```txt
High scale
Flexible schema
Fast reads/writes
Distributed systems
```

Simple answer:

```txt
SQL = structured and relational
NoSQL = flexible and scalable
```

---

## 11. What are cache hits and cache misses?

A **cache hit** means the requested data is found in cache.

A **cache miss** means the data is not in cache, so the system must fetch it from the database or backend.

Example:

```js
const cachedUser = await redis.get("user:1");

if (cachedUser) {
  return JSON.parse(cachedUser); // cache hit
}

const user = await db.users.findById(1); // cache miss
await redis.set("user:1", JSON.stringify(user));
return user;
```

Cache hit is faster. Cache miss is slower.

---

## 12. What is cache invalidation, and why is it hard?

Cache invalidation means removing or updating old cached data.

It is hard because data changes.

Example:

```txt
User changes name from "Sam" to "Alex"
Database has Alex
Cache still has Sam
```

Now users may see old data.

Common solutions:

```txt
Set TTL
Delete cache when data changes
Update cache when data changes
Use event-based invalidation
```

TTL means time to live:

```txt
Cache this user for 5 minutes
```

---

## 13. What is the difference between client-side caching, server-side caching, and CDN caching?

**Client-side caching** happens in the browser.

Example:

```txt
Browser caches JS, CSS, images
```

**Server-side caching** happens in your backend.

Example:

```txt
Node.js server uses Redis to cache user data
```

**CDN caching** happens near the user geographically.

Example:

```txt
Cloudflare caches images and static files
```

Simple comparison:

```txt
Browser cache = on user device
Server cache = near backend
CDN cache = near user location
```

# Step 2: Scalability & Performance

## 14. How would you scale a web application from 1,000 users to 10 million users?

Start simple, then scale step by step.

At first:

```txt
One frontend
One backend
One database
```

Then add:

```txt
Load balancer
Multiple backend servers
Database indexes
Redis cache
CDN
Read replicas
Message queues
Sharding
Monitoring
Auto-scaling
```

Typical architecture:

```txt
Users
↓
CDN
↓
Load Balancer
↓
Backend Servers
↓
Cache + Database + Queue
```

Important idea:

Do not start with a complex system too early. Scale based on real bottlenecks.

---

## 15. What is the difference between vertical and horizontal scaling?

**Vertical scaling** means making one server more powerful.

Example:

```txt
More CPU
More RAM
Bigger machine
```

**Horizontal scaling** means adding more servers.

Example:

```txt
1 server → 10 servers → 100 servers
```

Simple comparison:

```txt
Vertical = bigger machine
Horizontal = more machines
```

Horizontal scaling is usually better for large systems.

---

## 16. How does a load balancer distribute traffic?

A load balancer receives requests and sends them to healthy backend servers.

Example:

```txt
Client
↓
Load Balancer
↓
Server 1
Server 2
Server 3
```

It helps with:

```txt
Scalability
Fault tolerance
Better resource usage
```

If one server is down, the load balancer stops sending traffic to it.

---

## 17. What are different load balancing algorithms?

Common algorithms:

**Round Robin**

```txt
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
```

**Least Connections**

Sends traffic to the server with the fewest active connections.

**Weighted Round Robin**

Powerful servers receive more traffic.

**IP Hash**

Same user IP goes to the same server.

**Random**

Picks a random healthy server.

For interviews, mention:

```txt
Round robin is simple.
Least connections is better when requests have different durations.
```

---

## 18. How would you handle sudden traffic spikes?

Use multiple techniques:

```txt
Auto-scaling
CDN caching
Rate limiting
Queue-based processing
Load shedding
Database read replicas
Caching hot data
```

Example:

```txt
Traffic spike → Queue requests → Process slowly in background
```

For non-critical work like emails or notifications, use queues.

For critical APIs, protect the system using rate limits.

---

## 19. What is database replication?

Replication means copying data from one database server to another.

Common setup:

```txt
Primary database → Replica database
```

Writes go to the primary.

Reads can go to replicas.

Benefits:

```txt
Better read performance
High availability
Backup safety
```

Problem:

Replicas may lag behind the primary.

---

## 20. What is database sharding?

Sharding means splitting data across multiple databases.

Example:

```txt
Users 1-1M → Shard A
Users 1M-2M → Shard B
Users 2M-3M → Shard C
```

Or by user ID:

```txt
shard = userId % numberOfShards
```

Why use sharding?

```txt
One database is too large
Too many reads/writes
Need horizontal database scaling
```

Trade-off:

```txt
More complexity
Harder joins
Harder migrations
```

---

## 21. When should you use read replicas?

Use read replicas when your application has many reads.

Example:

```txt
Social media profile views
Product catalog reads
News feed reads
```

Architecture:

```txt
Writes → Primary DB
Reads → Read Replicas
```

Good for:

```txt
Reducing load on primary database
Improving read performance
Increasing availability
```

Be careful with replication lag.

A user may update data and not immediately see the change if reading from a replica.

---

## 22. How do message queues help with scalability?

Message queues allow systems to process work asynchronously.

Example:

```txt
User uploads image
↓
API stores upload
↓
Queue gets image-processing job
↓
Worker processes image later
```

This helps because the API does not need to wait for slow work.

Common queues:

```txt
Kafka
RabbitMQ
AWS SQS
Redis Queue
BullMQ for Node.js
```

Good for:

```txt
Emails
Notifications
Image processing
Payment retries
Analytics events
```

---

## 23. What is the difference between Kafka, RabbitMQ, and SQS?

**Kafka** is good for high-volume event streaming.

Use Kafka for:

```txt
Logs
Analytics
Event pipelines
Real-time data streams
```

**RabbitMQ** is good for task queues and routing messages.

Use RabbitMQ for:

```txt
Background jobs
Complex routing
Work queues
```

**SQS** is AWS-managed queue.

Use SQS when:

```txt
You are on AWS
You want simple managed queues
You do not want to manage servers
```

Simple version:

```txt
Kafka = event streaming
RabbitMQ = message broker
SQS = managed cloud queue
```

---

## 24. How would you design a background job processing system?

Basic design:

```txt
API Server
↓
Queue
↓
Worker Servers
↓
Database / External Service
```

Example: sending emails.

```js
// API
await queue.add("send-email", {
  to: user.email,
  template: "welcome",
});
```

Worker:

```js
queue.process("send-email", async job => {
  await sendEmail(job.data.to, job.data.template);
});
```

Important features:

```txt
Retries
Dead-letter queue
Job status
Monitoring
Rate limits
Idempotency
```

---

## 25. How do you reduce API latency?

Ways to reduce latency:

```txt
Add caching
Optimize database queries
Use indexes
Reduce payload size
Use CDN
Avoid unnecessary network calls
Use pagination
Use compression
Use connection pooling
Move services closer to users
```

Example:

Instead of returning 10,000 records:

```http
GET /users
```

Use pagination:

```http
GET /users?page=1&limit=50
```

Also avoid over-fetching:

```txt
Return only fields needed by frontend
```

---

## 26. How would you identify and fix system bottlenecks?

First, measure. Do not guess.

Check:

```txt
CPU usage
Memory usage
Database query time
API latency
Error rate
Queue size
Cache hit rate
Network latency
```

Use tools:

```txt
Logs
Metrics
Tracing
APM tools
Database explain plans
```

Example:

If API is slow:

```txt
Check endpoint latency
Check database query time
Check external API calls
Check cache usage
```

Then fix the biggest bottleneck first.

# Step 3: Architecture Patterns

## 27. When should you use a monolith instead of microservices?

Use a monolith when:

```txt
Team is small
Product is early
Requirements change fast
System is not huge yet
You want simple deployment
```

A monolith is not bad. It is often the best starting point.

Example:

```txt
One Node.js app
One database
One deployment
```

Later, split services only when needed.

---

## 28. What are the disadvantages of microservices?

Microservices add complexity.

Problems:

```txt
Harder debugging
Network failures
More deployments
Data consistency issues
More DevOps work
Service communication complexity
Harder local development
```

In interviews, say:

```txt
Microservices help scaling teams and systems, but they increase operational complexity.
```

---

## 29. How do services communicate in a microservices architecture?

Two common ways:

**Synchronous communication**

```txt
Service A → HTTP/gRPC → Service B
```

Good when response is needed immediately.

**Asynchronous communication**

```txt
Service A → Message Queue/Event Bus → Service B
```

Good when work can happen later.

Example:

```txt
Order Service → Payment Service
Order Service → emits OrderCreated event
Notification Service → sends email
```

---

## 30. What is the difference between synchronous and asynchronous communication?

**Synchronous** means waiting for a response.

Example:

```js
const payment = await paymentService.charge(order);
```

The caller waits.

**Asynchronous** means sending a message and continuing.

Example:

```js
await queue.add("send-email", { userId });
return { status: "signup_success" };
```

The email sends later.

Simple:

```txt
Synchronous = wait now
Asynchronous = process later
```

---

## 31. What is event-driven architecture?

In event-driven architecture, services communicate through events.

Example:

```txt
UserSignedUp
OrderCreated
PaymentCompleted
VideoUploaded
```

Flow:

```txt
Order Service creates order
↓
Publishes OrderCreated event
↓
Payment Service listens
↓
Notification Service listens
↓
Analytics Service listens
```

Benefit:

Services are loosely coupled.

Problem:

Harder debugging and eventual consistency.

---

## 32. How would you design a notification system using events?

Architecture:

```txt
Application
↓
Event Bus / Queue
↓
Notification Service
↓
Email / SMS / Push Provider
```

Example events:

```txt
UserSignedUp
OrderShipped
PasswordChanged
PaymentFailed
```

Notification service:

```txt
Reads event
Checks user preferences
Chooses channel
Sends notification
Stores status
Retries failures
```

Important features:

```txt
Retry
Deduplication
Rate limiting
User preferences
Templates
Delivery status
```

---

## 33. What is CQRS, and when should you use it?

CQRS means **Command Query Responsibility Segregation**.

It separates writes and reads.

```txt
Command = change data
Query = read data
```

Example:

```txt
Write model: normalized order tables
Read model: optimized order summary view
```

Use CQRS when:

```txt
Read and write needs are very different
System has high read traffic
Queries are complex
You need optimized read models
```

Do not use CQRS for simple CRUD apps. It adds complexity.

---

## 34. What is event sourcing?

Event sourcing stores changes as events instead of only storing current state.

Normal database:

```txt
Account balance = $100
```

Event sourcing:

```txt
AccountCreated
MoneyDeposited $200
MoneyWithdrawn $100
```

Current state is calculated from events.

Good for:

```txt
Audit logs
Financial systems
Order history
Debugging past state
```

Trade-off:

```txt
More complex
Need event replay
Need schema evolution
```

---

## 35. How do you make a system fault-tolerant?

Fault-tolerant means the system continues working even when something fails.

Use:

```txt
Multiple servers
Load balancers
Database replication
Retries with backoff
Circuit breakers
Timeouts
Fallbacks
Queues
Health checks
Monitoring
Backups
```

Example:

```txt
If email service is down, put email job back in queue and retry later.
```

Do not let one failure crash the whole system.

---

## 36. What is graceful degradation?

Graceful degradation means the system still works in a limited way when some parts fail.

Example:

```txt
Main feed works
Recommendations fail
Show default recommendations
```

Another example:

```txt
Payment page works
Coupon service fails
Disable coupons temporarily
```

The user still gets core functionality.

---

## 37. What is a circuit breaker pattern?

A circuit breaker prevents repeated calls to a failing service.

Example:

```txt
Payment service is down
API keeps calling it
Every call fails
System becomes slower
```

Circuit breaker says:

```txt
Stop calling payment service for 30 seconds
Return fallback response
Try again later
```

States:

```txt
Closed = normal
Open = blocked
Half-open = testing recovery
```

---

## 38. How would you design a highly available service?

High availability means the service is up most of the time.

Use:

```txt
Multiple app servers
Multiple availability zones
Load balancer
Health checks
Database replication
Auto-scaling
Backups
Monitoring
Failover
No single point of failure
```

Architecture:

```txt
Users
↓
Load Balancer
↓
Servers in Zone A + Zone B
↓
Replicated Database
```

Also deploy safely using rolling deployments or blue-green deployments.

---

## 39. How do you prevent a single point of failure?

Avoid having only one critical component.

Bad:

```txt
One server
One database
One load balancer
One region
```

Better:

```txt
Multiple servers
Database replicas
Multiple load balancers
Multiple zones
Backup systems
Failover plans
```

Question to ask:

```txt
If this component dies, does the whole system stop?
```

If yes, it is a single point of failure.

# Step 4: Data Management

## 40. What is the CAP theorem?

CAP theorem says a distributed system can strongly guarantee only two of these three:

```txt
Consistency
Availability
Partition tolerance
```

**Consistency**: every user sees the latest data.

**Availability**: system always responds.

**Partition tolerance**: system works even when network parts fail.

In distributed systems, network failures can happen, so you usually choose between:

```txt
Consistency and partition tolerance
or
Availability and partition tolerance
```

---

## 41. What is the difference between strong consistency and eventual consistency?

**Strong consistency** means users always see the latest data.

Example:

```txt
You update profile name
Immediately everyone sees new name
```

**Eventual consistency** means data may be temporarily old, but becomes correct later.

Example:

```txt
You update profile photo
Some users see old photo for a few seconds
Then everyone sees new photo
```

Strong consistency is safer but can be slower.

Eventual consistency is faster and more scalable.

---

## 42. When is eventual consistency acceptable?

Eventual consistency is acceptable when small delays are okay.

Examples:

```txt
Like counts
View counts
Comments count
Profile photo update
Search index update
Recommendation systems
Analytics dashboards
```

Not good for:

```txt
Bank balance
Payment status
Inventory checkout
Password changes
Security permissions
```

Simple rule:

```txt
Use strong consistency for money and security.
Use eventual consistency for social and analytics data.
```

---

## 43. How would you choose between PostgreSQL, MongoDB, Cassandra, and Redis?

**PostgreSQL**

Use for structured relational data.

```txt
Payments
Orders
Users
Transactions
Admin dashboards
```

**MongoDB**

Use for flexible document data.

```txt
Product catalogs
User profiles
CMS content
JSON-like data
```

**Cassandra**

Use for huge write-heavy distributed data.

```txt
IoT events
Logs
Time-series data
Global-scale writes
```

**Redis**

Use for fast in-memory data.

```txt
Cache
Sessions
Rate limits
Leaderboards
Temporary data
Queues
```

Simple:

```txt
PostgreSQL = default choice for most apps
MongoDB = flexible documents
Cassandra = massive distributed writes
Redis = fast cache
```

---

## 44. How do you design a database schema for a large-scale application?

Start with access patterns.

Ask:

```txt
What data do we store?
How will we query it?
How often will it change?
Which queries must be fast?
```

Example for e-commerce:

```txt
users
products
orders
order_items
payments
shipments
```

Add:

```txt
Primary keys
Foreign keys
Indexes
Created/updated timestamps
Status fields
Soft delete if needed
```

For scale:

```txt
Avoid unnecessary joins in hot paths
Add indexes carefully
Use pagination
Consider partitioning large tables
Archive old data
```

---

## 45. How would you partition user data across multiple databases?

Common approach: shard by user ID.

Example:

```js
const shardId = userId % numberOfShards;
```

Then:

```txt
User 1 → Shard 1
User 2 → Shard 2
User 3 → Shard 3
```

Another approach: geographic partitioning.

```txt
US users → US database
EU users → EU database
Asia users → Asia database
```

Important:

```txt
Choose a shard key with even distribution
Avoid hot shards
Keep related data together when possible
```

---

## 46. What are hot partitions, and how do you avoid them?

A hot partition happens when too much traffic goes to one partition or shard.

Example:

```txt
Celebrity user gets millions of profile views
All requests hit same shard
That shard becomes overloaded
```

Ways to avoid:

```txt
Choose better partition key
Add random suffix
Split hot keys
Cache hot data
Replicate hot data
Use consistent hashing
```

Example:

Instead of:

```txt
partition = celebrityUserId
```

Use:

```txt
partition = celebrityUserId + randomBucket
```

---

## 47. What is database denormalization?

Denormalization means storing duplicate data to make reads faster.

Example normalized data:

```txt
orders table has user_id
users table has user_name
Need join to show order with user name
```

Denormalized:

```txt
orders table also stores user_name
```

Benefit:

```txt
Faster reads
Fewer joins
```

Problem:

```txt
Duplicate data
Harder updates
Possible inconsistency
```

Use it when read performance is more important than perfect normalization.

---

## 48. How do you optimize slow database queries?

Steps:

```txt
Check query execution plan
Add proper indexes
Avoid SELECT *
Use pagination
Avoid unnecessary joins
Reduce returned rows
Use caching
Denormalize if needed
Partition large tables
Archive old data
```

Example bad query:

```sql
SELECT * FROM orders WHERE user_id = 5;
```

Better:

```sql
SELECT id, total, status, created_at
FROM orders
WHERE user_id = 5
ORDER BY created_at DESC
LIMIT 20;
```

Add index:

```sql
CREATE INDEX idx_orders_user_created
ON orders(user_id, created_at);
```

---

## 49. What is a secondary index?

A primary index is usually on the primary key.

Example:

```sql
id
```

A secondary index is an index on another column.

Example:

```sql
CREATE INDEX idx_users_email ON users(email);
```

Now this query is faster:

```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

Secondary indexes improve reads but add storage and slow down writes slightly.

---

## 50. How do distributed databases handle replication?

Distributed databases copy data across nodes.

Common replication models:

```txt
Leader-follower
Leader-leader
Quorum-based replication
```

**Leader-follower**

```txt
Writes go to leader
Followers copy data
Reads can go to followers
```

**Quorum**

Example:

```txt
Write is successful after 2 out of 3 replicas confirm
```

Important issues:

```txt
Replication lag
Conflict resolution
Failover
Consistency level
```

---

## 51. How do you backup and restore large datasets?

For backups:

```txt
Take regular snapshots
Use incremental backups
Store backups in different regions
Encrypt backups
Test restores
Keep backup retention policy
```

For restore:

```txt
Create new database from backup
Replay transaction logs
Validate data
Switch traffic carefully
```

Important terms:

```txt
RPO = how much data loss is acceptable
RTO = how much downtime is acceptable
```

Backups are only useful if restore is tested.

---

## 52. How would you migrate a database without downtime?

Use a safe migration plan.

Common approach:

```txt
1. Add new schema without removing old schema
2. Write to both old and new columns/tables
3. Backfill old data into new schema
4. Read from new schema
5. Stop writing old schema
6. Remove old schema later
```

This is called expand and contract.

Example:

```txt
Add column first
Deploy code that uses both
Backfill
Switch reads
Cleanup later
```

Avoid big locking migrations during peak traffic.

# Step 5: Hands-on System Design

# Beginner Level

## 53. Design a URL shortener like Bitly.

Requirements:

```txt
User enters long URL
System returns short URL
Short URL redirects to long URL
Track clicks optionally
```

API:

```http
POST /shorten
GET /:shortCode
```

Database:

```txt
short_code
long_url
created_at
user_id
click_count
```

Flow:

```txt
User → API → Generate short code → Store mapping → Return short URL
```

Redirect:

```txt
User opens /abc123
API finds long URL
Returns 301 or 302 redirect
```

Use cache for popular links:

```txt
shortCode → longUrl
```

Main trade-off:

```txt
Random short code vs encoded database ID
```

---

## 54. Design a file storage system like Google Drive.

Features:

```txt
Upload file
Download file
Create folders
Share files
Manage permissions
Search files
Version history
```

Architecture:

```txt
Client
↓
API Server
↓
Metadata DB + Object Storage
```

Use object storage for actual files:

```txt
S3 / GCS / Azure Blob
```

Use database for metadata:

```txt
file_id
owner_id
file_name
folder_id
storage_url
permissions
created_at
```

For large files:

```txt
Use multipart upload
Resume failed uploads
Store file chunks
```

For sharing:

```txt
Permission table:
file_id, user_id, role
```

---

## 55. Design a pastebin service.

Features:

```txt
Create paste
Read paste
Set expiration
Private/public paste
Optional syntax highlighting
```

API:

```http
POST /pastes
GET /pastes/:id
```

Database:

```txt
paste_id
content
created_at
expires_at
visibility
user_id
```

For large scale:

```txt
Cache popular pastes
Use object storage for large text
Cleanup expired pastes
Rate limit paste creation
```

---

## 56. Design a basic chat application.

Features:

```txt
Send message
Receive message in real time
Show chat history
Online status
Read receipts optionally
```

Architecture:

```txt
Client
↓ WebSocket
Chat Server
↓
Database
↓
Message Queue
```

Database:

```txt
conversations
messages
participants
```

Message flow:

```txt
User sends message
Server stores message
Server pushes message to recipient via WebSocket
```

If recipient is offline:

```txt
Store message
Send push notification
Deliver when online
```

---

## 57. Design a simple notification system.

Features:

```txt
Send email, SMS, push
User preferences
Templates
Retries
Delivery status
```

Architecture:

```txt
App Services
↓
Queue
↓
Notification Workers
↓
Email/SMS/Push Providers
```

Database:

```txt
notifications
user_preferences
templates
delivery_logs
```

Important:

```txt
Retry failed sends
Deduplicate messages
Respect user preferences
Rate limit providers
```

---

## 58. Design a blog platform.

Features:

```txt
Create post
Edit post
Delete post
View post
Comment
Like
Tag
Search
```

Database:

```txt
users
posts
comments
tags
post_tags
likes
```

For performance:

```txt
Cache popular posts
Use CDN for images
Use search engine for full-text search
Paginate comments
```

API:

```http
POST /posts
GET /posts/:id
GET /users/:id/posts
POST /posts/:id/comments
```

---

## 59. Design a user authentication system.

Features:

```txt
Signup
Login
Logout
Password reset
Session management
Role-based access
```

Database:

```txt
users
sessions
password_reset_tokens
roles
```

Never store plain passwords.

Store password hash:

```txt
bcrypt / argon2
```

Login flow:

```txt
User sends email/password
Server verifies password
Server creates session or JWT
Client stores token securely
```

For web apps, HTTP-only cookies are usually safer than localStorage.

---

## 60. Design a rate limiter.

Requirements:

```txt
Limit requests per user/IP/API key
Return 429 if limit exceeded
Work across multiple servers
```

Use Redis.

Example:

```txt
rate:user:123:minute → count
```

Algorithm options:

```txt
Fixed window
Sliding window
Token bucket
```

Token bucket idea:

```txt
User has 100 tokens
Each request uses 1 token
Tokens refill over time
```

Good response:

```http
429 Too Many Requests
Retry-After: 30
```

---

## 61. Design a logging system.

Features:

```txt
Collect logs
Search logs
Filter by service/time/error
Alert on errors
Store logs
```

Architecture:

```txt
App Servers
↓
Log Agent
↓
Queue
↓
Log Processor
↓
Search Storage
```

Common stack:

```txt
ELK: Elasticsearch, Logstash, Kibana
```

Log fields:

```txt
timestamp
service
level
message
request_id
user_id
trace_id
```

Important:

```txt
Use structured JSON logs
Add request IDs
Avoid logging passwords/tokens
```

---

## 62. Design an API gateway.

API gateway sits between clients and backend services.

Responsibilities:

```txt
Routing
Authentication
Rate limiting
Logging
Request validation
Load balancing
Response transformation
```

Architecture:

```txt
Client
↓
API Gateway
↓
User Service
Order Service
Payment Service
```

Benefits:

```txt
One entry point
Central security
Central rate limiting
Simpler clients
```

Risk:

```txt
Gateway can become bottleneck
Needs high availability
```

# Intermediate Level

## 63. Design Instagram.

Core features:

```txt
Upload photos/videos
Follow users
View feed
Like/comment
Stories optionally
Notifications
```

Storage:

```txt
Object storage for media
Database for metadata
Cache for feed and profiles
```

Architecture:

```txt
Client
↓
API Gateway
↓
User Service
Post Service
Feed Service
Media Service
Notification Service
```

Feed options:

```txt
Fan-out on write: push post to followers' feeds
Fan-out on read: build feed when user opens app
```

For celebrities, use hybrid approach.

Use CDN for images/videos.

---

## 64. Design Twitter/X feed.

Features:

```txt
Post tweet
Follow users
View home timeline
Like/repost/reply
```

Feed design:

**Fan-out on write**

```txt
When user tweets, push tweet ID to followers' timelines
```

Good for normal users.

Problem with celebrities:

```txt
One tweet may go to millions of followers
```

Solution:

```txt
Hybrid feed
Precompute normal users
Fetch celebrity tweets at read time
```

Use:

```txt
Redis for timeline cache
Database for tweets
Queue for fan-out workers
```

---

## 65. Design YouTube.

Features:

```txt
Upload video
Transcode video
Stream video
Search video
Recommend video
Comments/likes
```

Upload flow:

```txt
User uploads video
Store original video
Put transcoding job in queue
Workers create multiple resolutions
Store in object storage
Serve through CDN
```

Streaming:

```txt
Use adaptive bitrate streaming
Different resolutions: 144p, 360p, 720p, 1080p
```

Metadata DB:

```txt
video_id
title
description
owner_id
status
storage_paths
```

Use CDN heavily.

---

## 66. Design WhatsApp.

Features:

```txt
One-to-one chat
Group chat
Online status
Message delivery status
End-to-end encryption
Media sharing
Push notifications
```

Architecture:

```txt
Client
↓ WebSocket
Chat Server
↓
Message Store
↓
Queue
↓
Push Notification Service
```

Message flow:

```txt
Sender sends encrypted message
Server stores encrypted message
Server delivers to recipient
Recipient sends delivery/read receipt
```

Important:

```txt
Messages should be encrypted
Server should not read message content
Offline users receive messages later
```

---

## 67. Design Uber.

Features:

```txt
Rider requests ride
Find nearby drivers
Match driver
Track location
Calculate fare
Handle payment
Notify users
```

Architecture:

```txt
Rider App
Driver App
↓
API Gateway
↓
Location Service
Matching Service
Trip Service
Payment Service
Notification Service
```

Location:

```txt
Drivers send location every few seconds
Store current location in fast geo index
```

Matching:

```txt
Find nearby available drivers
Rank by distance, rating, availability
Send request to driver
```

Use geospatial indexing.

---

## 68. Design Airbnb.

Features:

```txt
Search listings
View listing
Book stay
Payments
Reviews
Host management
Availability calendar
```

Database:

```txt
users
listings
locations
availability
bookings
payments
reviews
```

Important problem:

Prevent double booking.

Solution:

```txt
Use transaction/lock when booking
Check availability
Create booking
Mark dates unavailable
```

Search:

```txt
Use search engine with filters:
location, price, dates, guests
```

---

## 69. Design Dropbox.

Features:

```txt
Upload files
Sync files
Download files
Share files
Version history
Conflict handling
```

Architecture:

```txt
Client Sync Agent
↓
Metadata Service
↓
Block Storage Service
↓
Object Storage
```

Optimization:

```txt
Split files into chunks
Upload only changed chunks
Deduplicate chunks
```

Database:

```txt
files
folders
file_versions
chunks
permissions
```

Conflict example:

```txt
Two devices edit same file offline
Create conflicted copy
```

---

## 70. Design Google Calendar.

Features:

```txt
Create event
Invite users
Recurring events
Reminders
Free/busy lookup
Notifications
```

Database:

```txt
events
attendees
calendars
recurrence_rules
reminders
```

Important:

```txt
Recurring events should not create infinite rows immediately
Use recurrence rule
Expand events when viewing calendar
```

Example:

```txt
Every Monday at 10 AM
RRULE:FREQ=WEEKLY;BYDAY=MO
```

Notifications:

```txt
Reminder jobs scheduled before event time
```

---

## 71. Design a payment system.

Features:

```txt
Create payment
Process payment
Handle success/failure
Refund
Reconcile
Prevent duplicate charges
```

Important concepts:

```txt
Idempotency key
Transaction status
Webhook handling
Audit logs
```

Flow:

```txt
Client → Payment API
Payment API → Payment Provider
Provider → Webhook → Update status
```

Database:

```txt
payments
payment_attempts
refunds
ledger_entries
```

Never trust only frontend success. Always verify using backend or provider webhook.

---

## 72. Design an e-commerce checkout system.

Features:

```txt
Cart
Inventory check
Apply coupon
Calculate price
Payment
Create order
Send confirmation
```

Flow:

```txt
Validate cart
Reserve inventory
Create order
Process payment
Confirm order
Send notification
```

Important issue:

Prevent overselling.

Use:

```txt
Inventory reservation
Database transaction
Expiration for unpaid reservations
```

Services:

```txt
Cart Service
Order Service
Inventory Service
Payment Service
Notification Service
```

---

## 73. Design a recommendation system.

Features:

```txt
Recommend products/videos/posts
Personalized ranking
Real-time updates optionally
```

Data sources:

```txt
Clicks
Views
Likes
Purchases
Searches
Follows
```

Architecture:

```txt
Event Tracking
↓
Data Pipeline
↓
Model Training
↓
Recommendation Service
↓
Client
```

Simple approach:

```txt
Popular items
Similar users
Similar items
Recently viewed category
```

Advanced:

```txt
Machine learning ranking model
```

---

## 74. Design a search autocomplete system.

Features:

```txt
User types prefix
System returns suggestions quickly
```

Example:

```txt
Input: "jav"
Suggestions: javascript, java, java tutorial
```

Data structure:

```txt
Trie
Prefix index
Search engine
```

Architecture:

```txt
Client → Autocomplete API → Cache/Search Index
```

Important:

```txt
Low latency
Rank by popularity
Personalize optionally
Handle typos optionally
```

Use debounce in frontend:

```js
const debouncedSearch = debounce(fetchSuggestions, 300);
```

---

## 75. Design a distributed cache.

A distributed cache stores data across multiple cache nodes.

Example:

```txt
Redis Cluster
Memcached Cluster
```

Use consistent hashing:

```txt
key → cache node
```

Features:

```txt
Get/set/delete
TTL
Eviction
Replication
Failover
```

Problems:

```txt
Cache stampede
Hot keys
Node failure
Data inconsistency
```

Use:

```txt
TTL jitter
Request coalescing
Replication for hot keys
```

---

## 76. Design a real-time analytics dashboard.

Features:

```txt
Track events
Show metrics in near real time
Filter by time/product/location
```

Architecture:

```txt
Client/App
↓
Event Collector
↓
Kafka/Queue
↓
Stream Processor
↓
Analytics Store
↓
Dashboard API
```

Metrics:

```txt
Active users
Revenue
Clicks
Errors
Conversion rate
```

Storage:

```txt
ClickHouse
Druid
BigQuery
Elasticsearch
```

Use pre-aggregation for fast dashboard queries.

---

## 77. Design a news feed system.

Features:

```txt
User follows others
Create posts
View personalized feed
Like/comment
```

Feed generation:

```txt
Fan-out on write
Fan-out on read
Hybrid
```

Basic architecture:

```txt
Post Service
Follow Service
Feed Service
Cache
Queue
```

Fan-out on write:

```txt
User posts
Queue workers push post ID to followers' feed cache
```

Use ranking:

```txt
Recency
Engagement
Relationship strength
User interests
```

# Advanced Level

## 78. Design Google Search.

Main parts:

```txt
Crawler
Indexer
Ranking system
Query service
```

Flow:

```txt
Crawler discovers pages
Pages are parsed
Index is built
User searches
Query service finds matching documents
Ranking system orders results
```

Index:

```txt
word → list of documents
```

Ranking signals:

```txt
Text match
Page quality
Freshness
Links
User location
Performance
```

System must be:

```txt
Very fast
Massively distributed
Highly available
Constantly updated
```

---

## 79. Design Netflix video streaming.

Features:

```txt
Upload content
Encode videos
Store videos
Stream to users
Resume playback
Recommend content
```

Architecture:

```txt
Video Storage
↓
Transcoding Pipeline
↓
CDN
↓
User Device
```

Use adaptive bitrate streaming:

```txt
Network slow → lower quality
Network fast → higher quality
```

Metadata:

```txt
movies
episodes
users
watch_history
playback_position
```

CDN is critical because video traffic is huge.

---

## 80. Design a distributed message queue.

Features:

```txt
Publish message
Consume message
Retry message
Preserve order if needed
Scale consumers
```

Architecture:

```txt
Producer
↓
Broker Cluster
↓
Topic/Queue Partitions
↓
Consumers
```

Important concepts:

```txt
Partitioning
Replication
Consumer groups
Offsets
Acknowledgments
Dead-letter queue
```

For ordering:

```txt
Messages with same key go to same partition
```

For reliability:

```txt
Replicate messages across brokers
Require acknowledgment
```

---

## 81. Design a distributed database.

Features:

```txt
Store data across nodes
Replicate data
Handle node failures
Support reads/writes
```

Core ideas:

```txt
Partitioning
Replication
Consensus
Consistency levels
Failover
```

Architecture:

```txt
Client
↓
Coordinator Node
↓
Data Nodes
```

Data placement:

```txt
Use consistent hashing or range partitioning
```

Replication:

```txt
Each partition copied to multiple nodes
```

Consistency:

```txt
Strong consistency using consensus
Eventual consistency using async replication
```

---

## 82. Design a large-scale monitoring system.

Features:

```txt
Collect metrics
Collect logs
Collect traces
Create alerts
Show dashboards
```

Architecture:

```txt
Services
↓
Agents/SDKs
↓
Collectors
↓
Queue
↓
Storage
↓
Query/Dashboard/Alerting
```

Metrics examples:

```txt
CPU
Memory
Request latency
Error rate
QPS
Database latency
Queue depth
```

Use:

```txt
Prometheus-like metrics
Log storage
Distributed tracing
Alert manager
```

Important:

```txt
High write volume
Downsampling old data
Retention policy
```

---

## 83. Design a global CDN.

A CDN stores content close to users.

Architecture:

```txt
Origin Server
↓
CDN Edge Locations
↓
Users
```

Flow:

```txt
User requests image
Nearest edge checks cache
If found, returns image
If not found, fetches from origin
Caches it
Returns to user
```

Features:

```txt
Cache static files
TLS termination
DDoS protection
Geo routing
Cache invalidation
```

Important:

```txt
Use TTL
Purge content when needed
Handle cache misses
```

---

## 84. Design a multiplayer gaming backend.

Features:

```txt
Real-time gameplay
Matchmaking
Game rooms
Player state
Leaderboards
Anti-cheat
```

Architecture:

```txt
Game Client
↓
Matchmaking Service
↓
Game Server
↓
State Store / Event Log
```

Real-time communication:

```txt
UDP or WebSocket
```

Important:

```txt
Low latency
Regional servers
Authoritative server
Fast state sync
```

Authoritative server means the server decides the true game state, not the client.

---

## 85. Design a stock trading platform.

Features:

```txt
Place order
Cancel order
Match orders
Show portfolio
Show market data
Risk checks
Audit logs
```

Critical needs:

```txt
Low latency
Strong consistency
Security
Auditability
No duplicate orders
```

Architecture:

```txt
Client
↓
Order API
↓
Risk Check
↓
Order Matching Engine
↓
Ledger/Trade Store
↓
Market Data Publisher
```

Use idempotency keys to prevent duplicate orders.

Use append-only logs for audit.

---

## 86. Design a fraud detection system.

Features:

```txt
Detect suspicious transactions
Score risk
Block or review transactions
Learn from past fraud
```

Data:

```txt
User behavior
Device info
IP location
Transaction amount
Velocity
Past chargebacks
```

Architecture:

```txt
Transaction Event
↓
Feature Service
↓
Rules Engine + ML Model
↓
Decision Service
```

Example rules:

```txt
Too many transactions in 1 minute
New device + high amount
Location mismatch
```

Output:

```txt
Approve
Reject
Manual review
```

---

## 87. Design a ride-sharing dispatch system.

This is the matching part of Uber.

Inputs:

```txt
Rider location
Driver locations
Driver availability
ETA
Pricing
Driver rating
```

Flow:

```txt
Rider requests ride
Find nearby drivers
Rank drivers
Send offer to best driver
If rejected/timeout, try next driver
```

Data structure:

```txt
Geospatial index
```

Important:

```txt
Fast matching
Fairness
Low driver/rider wait time
Handle cancellations
```

---

## 88. Design a collaborative document editor like Google Docs.

Features:

```txt
Multiple users edit same document
Changes appear in real time
Comments
Version history
Permissions
```

Hard problem:

```txt
Concurrent editing
```

Use:

```txt
Operational Transformation
or
CRDT
```

Architecture:

```txt
Client
↓ WebSocket
Collaboration Server
↓
Document Store
↓
Event Log
```

Flow:

```txt
User types
Client sends operation
Server orders operations
Server broadcasts updates
Clients update document
```

---

## 89. Design a large-scale ad serving system.

Features:

```txt
Show ads
Target users
Run auction
Track impressions/clicks
Budget control
Reporting
```

Flow:

```txt
User opens page
Ad request sent
Candidate ads selected
Auction/ranking happens
Winning ad returned
Impression tracked
```

Important:

```txt
Very low latency
Budget accuracy
Fraud detection
Click tracking
Frequency capping
```

Data:

```txt
campaigns
ads
targeting_rules
budgets
impressions
clicks
```

---

## 90. Design a feature flag system.

Features:

```txt
Turn features on/off
Target users
Percentage rollout
A/B testing
Kill switch
```

Architecture:

```txt
Admin UI
↓
Feature Flag Service
↓
SDK/Client App
```

Flag example:

```json
{
  "name": "new_checkout",
  "enabled": true,
  "rollout": 20
}
```

In JavaScript:

```js
if (flags.new_checkout) {
  showNewCheckout();
} else {
  showOldCheckout();
}
```

Important:

```txt
Low latency
Local caching
Audit logs
Safe defaults
```

---

## 91. Design a distributed lock service.

A distributed lock makes sure only one process does something at a time.

Example:

```txt
Only one worker should process payment settlement
```

Use:

```txt
Redis with expiry
ZooKeeper
etcd
Database row lock
```

Important features:

```txt
Lock expiry
Unique lock token
Safe release
Retry
Timeout
```

Redis example idea:

```txt
SET lock_key unique_value NX PX 30000
```

Meaning:

```txt
Create lock only if it does not exist
Expire after 30 seconds
```

---

## 92. Design a high-frequency notification delivery system.

Features:

```txt
Send millions of notifications
Support push/email/SMS
User preferences
Rate limiting
Retries
Deduplication
```

Architecture:

```txt
Event Producers
↓
Kafka/Queue
↓
Notification Workers
↓
Provider APIs
```

Important:

```txt
Batch sending
Provider rate limits
Priority queues
Dead-letter queues
Retry with backoff
Delivery tracking
```

Use separate queues:

```txt
High priority: OTP, security alerts
Low priority: marketing
```

# Trade-off Questions

## 93. SQL or NoSQL: how do you decide?

Use SQL when:

```txt
Data is structured
Relationships matter
Transactions are important
Consistency is important
```

Use NoSQL when:

```txt
Schema changes often
Need massive scale
Need high write throughput
Data is document/key-value style
```

For most normal business apps, start with PostgreSQL.

---

## 94. Monolith or microservices: which one is better for a startup?

Usually monolith is better for a startup.

Because:

```txt
Faster development
Simpler deployment
Easier debugging
Less DevOps work
```

Move to microservices later when:

```txt
Team grows
System becomes too large
Different parts need independent scaling
Deployment conflicts become painful
```

---

## 95. Cache or database optimization: which should come first?

Usually database optimization comes first.

First:

```txt
Fix bad queries
Add indexes
Use pagination
Avoid SELECT *
```

Then add cache if needed.

Why?

Because cache can hide problems but not solve bad data design.

Good order:

```txt
Measure → optimize DB → add cache → monitor
```

---

## 96. Strong consistency or eventual consistency?

Use strong consistency for:

```txt
Payments
Bank balance
Inventory checkout
Security permissions
Password changes
```

Use eventual consistency for:

```txt
Likes
Views
Feeds
Search indexing
Analytics
Recommendations
```

Simple rule:

```txt
If wrong data can cost money or security, use strong consistency.
```

---

## 97. Synchronous API calls or asynchronous messaging?

Use synchronous calls when:

```txt
You need an immediate response
User is waiting
Operation is simple and fast
```

Example:

```txt
Login
Get user profile
Check payment status
```

Use asynchronous messaging when:

```txt
Work is slow
Work can happen later
Need better reliability
Need to decouple services
```

Example:

```txt
Send email
Process image
Generate report
Update analytics
```

---

## 98. Push model or pull model?

**Push model** means server sends updates to clients.

Good for:

```txt
Chat
Live sports score
Stock prices
Notifications
```

Use WebSocket, SSE, or push notifications.

**Pull model** means client asks repeatedly.

Good for:

```txt
Simple dashboards
Low-frequency updates
Less real-time systems
```

Example:

```js
setInterval(fetchUpdates, 5000);
```

Push is more real-time. Pull is simpler.

---

## 99. Sharding or replication?

Use replication when:

```txt
Need more read capacity
Need backup/failover
Data still fits on one primary
```

Use sharding when:

```txt
One database is too large
Write traffic is too high
Storage limit is reached
```

Simple:

```txt
Replication = copy same data
Sharding = split different data
```

Often large systems use both.

---

## 100. CDN caching or application-level caching?

Use CDN caching for:

```txt
Images
Videos
CSS
JavaScript
Public API responses
Static content
```

Use application-level caching for:

```txt
User sessions
Database query results
Personalized data
Rate limits
Computed results
```

Simple:

```txt
CDN cache = near the user
App cache = near the backend
```

---

## 101. Batch processing or stream processing?

Batch processing handles data in groups.

Example:

```txt
Run report every night
Process yesterday's orders
Train recommendation model daily
```

Stream processing handles data continuously.

Example:

```txt
Fraud detection
Real-time dashboard
Live user activity tracking
```

Simple:

```txt
Batch = later
Stream = now
```

---

## 102. Serverless or container-based deployment?

Use serverless when:

```txt
Traffic is unpredictable
You want less infrastructure management
Tasks are short-lived
```

Examples:

```txt
AWS Lambda
Cloudflare Workers
Vercel Functions
```

Use containers when:

```txt
Long-running services
Need more control
Complex backend
Consistent high traffic
```

Examples:

```txt
Docker
Kubernetes
ECS
```

Simple:

```txt
Serverless = easier operations
Containers = more control
```

# Interview Follow-up Questions

## 103. What are the bottlenecks in your design?

Possible bottlenecks:

```txt
Database
Cache
Load balancer
Message queue
External APIs
Network
Single hot partition
Slow queries
Large payloads
```

Good answer:

```txt
I would monitor latency, throughput, error rate, database query time, cache hit rate, and queue depth to find the real bottleneck.
```

---

## 104. How would your system handle 10x traffic growth?

Steps:

```txt
Add more backend servers
Use load balancer
Add caching
Use CDN
Optimize database
Add read replicas
Use queues for async work
Shard database if needed
Auto-scale infrastructure
```

Also:

```txt
Measure bottlenecks before scaling blindly
```

---

## 105. What happens if the database goes down?

Depends on system design.

Possible behavior:

```txt
Writes fail temporarily
Reads may use cache
Read replicas may serve read traffic
Queue can store write requests for later
System returns friendly error
```

Recovery:

```txt
Failover to replica
Restore from backup
Replay logs
Alert engineers
```

Important:

```txt
Do not silently lose data
```

---

## 106. What happens if the cache goes down?

The system should still work, but slower.

Flow:

```txt
Cache down
↓
Requests go to database
↓
Database load increases
```

Protection:

```txt
Rate limit
Fallback to DB carefully
Circuit breaker
Increase DB capacity
Use local cache
```

Cache should not be the only source of truth unless designed that way.

---

## 107. How do you monitor this system?

Monitor:

```txt
Request rate
Error rate
Latency
CPU
Memory
Database query time
Cache hit rate
Queue depth
Disk usage
External API failures
```

Use:

```txt
Logs
Metrics
Traces
Dashboards
Alerts
```

Golden signals:

```txt
Latency
Traffic
Errors
Saturation
```

---

## 108. How do you debug production issues?

Steps:

```txt
Check alerts
Check logs
Check recent deployments
Check metrics
Check traces
Reproduce if possible
Rollback if needed
Fix root cause
Add test/alert to prevent repeat
```

Use request ID or trace ID.

Example:

```txt
User reports checkout failed
Find request ID
Trace API call
Check payment service logs
Find timeout
```

---

## 109. How would you deploy this system safely?

Use:

```txt
CI/CD
Automated tests
Staging environment
Canary deployment
Blue-green deployment
Feature flags
Rollback plan
Monitoring after deployment
```

Safe deployment flow:

```txt
Deploy to 5% users
Check metrics
Deploy to 25%
Check again
Deploy to 100%
```

---

## 110. How would you handle data consistency?

Options:

```txt
Database transactions
Strong consistency for critical data
Eventual consistency for non-critical data
Idempotency keys
Distributed locks if needed
Saga pattern
Reconciliation jobs
```

Example:

```txt
Payment and order creation should be strongly controlled.
Like counts can be eventually consistent.
```

---

## 111. How would you prevent duplicate requests?

Use idempotency.

Example:

```http
POST /payments
Idempotency-Key: unique-key-123
```

Server stores:

```txt
key → result
```

If same request comes again, return the same result instead of doing the operation again.

Also use:

```txt
Unique constraints
Deduplication table
Request IDs
Client-side button disabling
```

---

## 112. How would you handle retries?

Use retries carefully.

Good retry strategy:

```txt
Retry only safe operations
Use exponential backoff
Add jitter
Limit max retries
Use dead-letter queue
Make operations idempotent
```

Example:

```txt
Retry after 1s, 2s, 4s, 8s
```

Do not retry forever.

Do not retry non-idempotent payment operations without idempotency keys.

---

## 113. How would you secure the system?

Use:

```txt
HTTPS
Authentication
Authorization
Input validation
Rate limiting
Password hashing
Secrets management
Encryption at rest
Encryption in transit
Audit logs
Least privilege access
```

For JavaScript apps:

```txt
Use HTTP-only cookies for sensitive tokens
Protect against XSS
Protect against CSRF
Validate input on backend
Never trust frontend data
```

---

## 114. How would you reduce cost?

Ways:

```txt
Use autoscaling
Cache expensive queries
Use CDN
Compress data
Archive old data
Right-size servers
Use spot instances for batch jobs
Reduce logging noise
Optimize database queries
Delete unused resources
```

Also:

```txt
Measure cost per feature or per request
```

Do not reduce cost by hurting reliability of critical systems.

---

## 115. What metrics would you track?

Track:

```txt
Requests per second
Latency p50, p95, p99
Error rate
Database latency
Cache hit rate
Queue depth
CPU
Memory
Disk
Network
Active users
Business metrics
```

Business metrics depend on the product.

Example e-commerce:

```txt
Checkout success rate
Payment failure rate
Cart abandonment rate
```

---

## 116. What alerts would you create?

Create alerts for:

```txt
High error rate
High latency
Database down
Cache down
Queue growing too large
Disk almost full
Memory too high
CPU too high
Payment failures
Low availability
```

Good alert rule:

```txt
Alert only when action is needed.
```

Avoid noisy alerts.

---

## 117. What would you improve if you had more time?

Good interview answer:

```txt
I would improve observability, add better caching, test failure scenarios, optimize database queries, add autoscaling, improve security, and document trade-offs.
```

For a specific design, say:

```txt
First I would monitor real bottlenecks.
Then I would improve the highest-impact area.
```

# Good Practice Format for Any System Design Answer

Use this structure in interviews:

```txt
1. Clarify requirements
2. Define functional requirements
3. Define non-functional requirements
4. Estimate scale
5. Design APIs
6. Design database schema
7. Draw high-level architecture
8. Explain data flow
9. Discuss bottlenecks
10. Discuss trade-offs
11. Improve for scale, reliability, and cost
```

As a developer, you can think like this:

```txt
Frontend → API → Services → Cache → Database → Queue → Workers
```

That mental model will help you answer most system design questions clearly.
