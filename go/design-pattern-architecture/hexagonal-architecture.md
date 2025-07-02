## A Practical Guide to Hexagonal Architecture in Golang

Hexagonal Architecture, also known as the Ports and Adapters pattern, is a software design principle that promotes creating loosely coupled application components. This architectural style enhances maintainability, testability, and the ability to evolve your application's technology stack without impacting its core business logic. This guide provides a clear code example in Golang, adhering to best practices, to illustrate the core concepts of this powerful architecture.

### Core Concepts

At its heart, Hexagonal Architecture separates the application into three main parts:

* **The Core (or Domain):** This is the application's heart, containing the business logic, entities, and use cases. It is completely independent of any external technologies or frameworks.
* **Ports:** These are interfaces defined within the core that act as entry and exit points for communication with the outside world. They represent the application's API from the core's perspective. There are two types of ports:
    * **Driving Ports (or Input Ports):** These define how external actors can interact with the application's core.
    * **Driven Ports (or Output Ports):** These define the interfaces for services that the core needs, such as databases, message queues, or external APIs.
* **Adapters:** These are the concrete implementations of the ports. They translate the specific technology of an external tool into a format that the port can understand.
    * **Driving Adapters:** These adapters drive the application by calling the input ports. Examples include HTTP handlers, gRPC servers, and command-line interfaces.
    * **Driven Adapters:** These adapters are driven by the application core through the output ports. Examples include database repositories, REST clients for external services, and message queue publishers.

The key principle is the **Dependency Rule**: all dependencies flow inwards. The adapters depend on the ports in the core, but the core does not depend on the adapters.

### Project Structure

A common and effective way to structure a Hexagonal Architecture project in Go is to leverage the `cmd`, `internal`, and `pkg` directories.

```
.
├── cmd
│   └── api
│       └── main.go
├── internal
│   ├── core
│   │   ├── domain
│   │   │   └── order.go
│   │   ├── ports
│   │   │   └── ports.go
│   │   └── service
│   │       └── order_service.go
│   └── adapters
│       ├── http
│       │   └── order_handler.go
│       └── inmem
│           └── order_repository.go
└── go.mod
```

* **`cmd/api/main.go`**: The entry point of our application. It is responsible for initializing the adapters and wiring them together with the application's core service.
* **`internal/core/domain/order.go`**: Defines the core business entity.
* **`internal/core/ports/ports.go`**: Defines the interfaces (ports) for our application's services and repositories.
* **`internal/core/service/order_service.go`**: The implementation of the core application logic. It depends on the port interfaces, not concrete implementations.
* **`internal/adapters/http/order_handler.go`**: The driving adapter that handles HTTP requests and calls the core service.
* **`internal/adapters/inmem/order_repository.go`**: A driven adapter that implements the `OrderRepository` port using an in-memory store.

### Code Example

Let's build a simple order management system to demonstrate these concepts.

#### 1. The Core Domain (`internal/core/domain/order.go`)

This file defines our `Order` entity, which is the central part of our business logic.

```go
package domain

import "time"

type Order struct {
	ID        string
	Product   string
	Quantity  int
	CreatedAt time.Time
}
```

#### 2. The Ports (`internal/core/ports/ports.go`)

Here, we define the interfaces that allow communication with the core.

```go
package ports

import (
	"context"
	"your_project/internal/core/domain"
)

// OrderService is the input port
type OrderService interface {
	CreateOrder(ctx context.Context, product string, quantity int) (*domain.Order, error)
	GetOrder(ctx context.Context, id string) (*domain.Order, error)
}

// OrderRepository is the output port
type OrderRepository interface {
	Save(ctx context.Context, order *domain.Order) error
	FindByID(ctx context.Context, id string) (*domain.Order, error)
}
```

#### 3. The Core Service (`internal/core/service/order_service.go`)

This is the implementation of our core business logic. Notice that it depends on the `OrderRepository` interface, not a concrete database implementation.

```go
package service

import (
	"context"
	"time"
	"your_project/internal/core/domain"
	"your_project/internal/core/ports"

	"github.com/google/uuid"
)

type orderService struct {
	repo ports.OrderRepository
}

func NewOrderService(repo ports.OrderRepository) ports.OrderService {
	return &orderService{
		repo: repo,
	}
}

func (s *orderService) CreateOrder(ctx context.Context, product string, quantity int) (*domain.Order, error) {
	order := &domain.Order{
		ID:        uuid.NewString(),
		Product:   product,
		Quantity:  quantity,
		CreatedAt: time.Now(),
	}

	if err := s.repo.Save(ctx, order); err != nil {
		return nil, err
	}

	return order, nil
}

func (s *orderService) GetOrder(ctx context.Context, id string) (*domain.Order, error) {
	return s.repo.FindByID(ctx, id)
}
```

#### 4. The Driven Adapter: In-Memory Repository (`internal/adapters/inmem/order_repository.go`)

This adapter provides a concrete implementation of the `OrderRepository` port using a simple in-memory map. This could be easily swapped out for a PostgreSQL or MongoDB adapter without changing any code in the core.

```go
package inmem

import (
	"context"
	"fmt"
	"sync"
	"your_project/internal/core/domain"
	"your_project/internal/core/ports"
)

type inMemoryOrderRepository struct {
	mu     sync.RWMutex
	orders map[string]*domain.Order
}

func NewInMemoryOrderRepository() ports.OrderRepository {
	return &inMemoryOrderRepository{
		orders: make(map[string]*domain.Order),
	}
}

func (r *inMemoryOrderRepository) Save(ctx context.Context, order *domain.Order) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.orders[order.ID] = order
	return nil
}

func (r *inMemoryOrderRepository) FindByID(ctx context.Context, id string) (*domain.Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	order, ok := r.orders[id]
	if !ok {
		return nil, fmt.Errorf("order with ID '%s' not found", id)
	}

	return order, nil
}
```

#### 5. The Driving Adapter: HTTP Handler (`internal/adapters/http/order_handler.go`)

This adapter exposes our application's functionality via an HTTP API. It depends on the `OrderService` interface.

```go
package http

import (
	"encoding/json"
	"net/http"
	"your_project/internal/core/ports"

	"github.com/go-chi/chi/v5"
)

type OrderHandler struct {
	service ports.OrderService
}

func NewOrderHandler(service ports.OrderService) *OrderHandler {
	return &OrderHandler{
		service: service,
	}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Product  string `json:"product"`
		Quantity int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	order, err := h.service.CreateOrder(r.Context(), req.Product, req.Quantity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	order, err := h.service.GetOrder(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}
```

#### 6. Wiring Everything Together (`cmd/api/main.go`)

Finally, the `main` function initializes the adapters and the core service, and injects the dependencies.

```go
package main

import (
	"log"
	"net/http"

	"your_project/internal/adapters/http_adapter"
	"your_project/internal/adapters/inmem"
	"your_project/internal/core/service"

	"github.com/go-chi/chi/v5"
	"github.comcom/go-chi/chi/v5/middleware"
)

func main() {
	// Initialize the driven adapter (repository)
	orderRepo := inmem.NewInMemoryOrderRepository()

	// Initialize the core service with the repository
	orderService := service.NewOrderService(orderRepo)

	// Initialize the driving adapter (HTTP handler) with the service
	orderHandler := http_adapter.NewOrderHandler(orderService)

	// Set up the router
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Post("/orders", orderHandler.CreateOrder)
	r.Get("/orders/{id}", orderHandler.GetOrder)

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("could not start server: %v", err)
	}
}
```

### Best Practices in this Example

* **Dependency Inversion:** The core service depends on an interface (`OrderRepository`), not a concrete implementation. This allows us to easily switch the data store without changing the core logic.
* **Clear Separation of Concerns:** Each component has a single responsibility. The domain holds business rules, the service orchestrates use cases, and adapters handle external communication.
* **Testability:** The core logic can be tested in isolation by mocking the repository interface. Similarly, the HTTP handler can be tested independently of the core service.
* **Idiomatic Go:** The use of interfaces for ports is a natural fit for Go's design philosophy. The project structure is also a widely adopted convention in the Go community.
