package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time" // Make sure time package is imported for time.Time type
)

// (All the struct definitions from Step 2 go here)

// Order represents the top-level JSON object
type Order struct {
	OrderID      string       `json:"orderId"`
	Customer     Customer     `json:"customer"`
	Items        []Item       `json:"items"`
	PaymentInfo  PaymentInfo  `json:"paymentInfo"`
	ShippingInfo ShippingInfo `json:"shippingInfo"`
	OrderDate    time.Time    `json:"orderDate"` // Use time.Time for dates
	Status       string       `json:"status"`
	Notes        *string      `json:"notes"`   // Use *string for nullable strings
	IsGift       bool         `json:"isGift"`
}

// Customer represents the customer object
type Customer struct {
	CustomerID   string        `json:"customerId"`
	FirstName    string        `json:"firstName"`
	LastName     string        `json:"lastName"`
	Email        string        `json:"email"`
	PhoneNumbers []PhoneNumber `json:"phoneNumbers"`
	Address      Address       `json:"address"`
}

// PhoneNumber represents an object in the phoneNumbers array
type PhoneNumber struct {
	Type   string `json:"type"`
	Number string `json:"number"`
}

// Address represents the address object
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	ZipCode string `json:"zipCode"`
	Country string `json:"country"`
}

// Item represents an object in the items array
type Item struct {
	ItemID       string       `json:"itemId"`
	ProductName  string       `json:"productName"`
	Category     string       `json:"category"`
	Quantity     int          `json:"quantity"`
	UnitPrice    float64      `json:"unitPrice"`
	TotalPrice   float64      `json:"totalPrice"`
	Features     []string     `json:"features"`
	Availability Availability `json:"availability"`
}

// Availability represents the availability object within an item
type Availability struct {
	InStock             bool       `json:"inStock"`
	WarehouseLocation   string     `json:"warehouseLocation,omitempty"`
	EstimatedRestockDate *time.Time `json:"estimatedRestockDate,omitempty"`
}

// PaymentInfo represents the paymentInfo object
type PaymentInfo struct {
	Method          string  `json:"method"`
	CardNumberLast4 string  `json:"cardNumberLast4"`
	TransactionID   string  `json:"transactionId"`
	AmountPaid      float64 `json:"amountPaid"`
	Currency        string  `json:"currency"`
}

// ShippingInfo represents the shippingInfo object
type ShippingInfo struct {
	Method              string    `json:"method"`
	Cost                float64   `json:"cost"`
	TrackingNumber      string    `json:"trackingNumber"`
	Status              string    `json:"status"`
	EstimatedDeliveryDate time.Time `json:"estimatedDeliveryDate"`
}

func main() {
	jsonString := `{
  "orderId": "ORD-2025-07-02-001",
  "customer": {
    "customerId": "CUST-007",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@example.com",
    "phoneNumbers": [
      {
        "type": "home",
        "number": "+1-555-123-4567"
      },
      {
        "type": "work",
        "number": "+1-555-987-6543"
      }
    ],
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    }
  },
  "items": [
    {
      "itemId": "PROD-SKU-001",
      "productName": "Laptop Pro X",
      "category": "Electronics",
      "quantity": 1,
      "unitPrice": 1200.00,
      "totalPrice": 1200.00,
      "features": ["16GB RAM", "512GB SSD", "14-inch OLED"],
      "availability": {
        "inStock": true,
        "warehouseLocation": "A-7"
      }
    },
    {
      "itemId": "PROD-SKU-005",
      "productName": "Wireless Mouse Elite",
      "category": "Peripherals",
      "quantity": 2,
      "unitPrice": 45.50,
      "totalPrice": 91.00,
      "features": ["Ergonomic Design", "Bluetooth 5.0"],
      "availability": {
        "inStock": true,
        "warehouseLocation": "B-2"
      }
    },
    {
      "itemId": "PROD-SKU-010",
      "productName": "USB-C Hub",
      "category": "Accessories",
      "quantity": 1,
      "unitPrice": 29.99,
      "totalPrice": 29.99,
      "features": ["4-port", "Power Delivery"],
      "availability": {
        "inStock": false,
        "estimatedRestockDate": "2025-07-15"
      }
    }
  ],
  "paymentInfo": {
    "method": "Credit Card",
    "cardNumberLast4": "4242",
    "transactionId": "TRN-987654321",
    "amountPaid": 1320.99,
    "currency": "USD"
  },
  "shippingInfo": {
    "method": "Express",
    "cost": 10.00,
    "trackingNumber": "TRACK-XYZ-12345",
    "status": "Shipped",
    "estimatedDeliveryDate": "2025-07-05"
  },
  "orderDate": "2025-07-02T12:00:00Z",
  "status": "Processing",
  "notes": null,
  "isGift": false
}`

	var order Order
	err := json.Unmarshal([]byte(jsonString), &order)
	if err != nil {
		log.Fatalf("Error unmarshaling JSON: %v", err)
	}

	// --- Step 4: Verify the Unmarshaled Data ---
	fmt.Printf("Order ID: %s\n", order.OrderID)
	fmt.Printf("Customer Name: %s %s\n", order.Customer.FirstName, order.Customer.LastName)
	fmt.Printf("Customer Email: %s\n", order.Customer.Email)
	fmt.Printf("Number of items: %d\n", len(order.Items))
	fmt.Printf("First item name: %s\n", order.Items[0].ProductName)
	fmt.Printf("First item quantity: %d\n", order.Items[0].Quantity)
	fmt.Printf("Laptop Pro X features: %v\n", order.Items[0].Features)
	fmt.Printf("Wireless Mouse Elite in stock: %t\n", order.Items[1].Availability.InStock)

	// Accessing the estimated restock date for the USB-C Hub (if available)
	usbCHub := order.Items[2]
	if !usbCHub.Availability.InStock && usbCHub.Availability.EstimatedRestockDate != nil {
		fmt.Printf("USB-C Hub estimated restock date: %s\n", usbCHub.Availability.EstimatedRestockDate.Format("2006-01-02"))
	}

	fmt.Printf("Payment Method: %s\n", order.PaymentInfo.Method)
	fmt.Printf("Total Amount Paid: %.2f %s\n", order.PaymentInfo.AmountPaid, order.PaymentInfo.Currency)
	fmt.Printf("Shipping Status: %s\n", order.ShippingInfo.Status)
	fmt.Printf("Order Date: %s\n", order.OrderDate.Format(time.RFC3339)) // Format for printing

	// Checking for null `notes` field
	if order.Notes != nil {
		fmt.Printf("Notes: %s\n", *order.Notes)
	} else {
		fmt.Println("Notes: (null)")
	}

	// Iterate through phone numbers
	fmt.Println("\nCustomer Phone Numbers:")
	for _, pn := range order.Customer.PhoneNumbers {
		fmt.Printf("  Type: %s, Number: %s\n", pn.Type, pn.Number)
	}

	// Iterate through items
	fmt.Println("\nOrder Items:")
	for _, item := range order.Items {
		fmt.Printf("  - %s (x%d) @ %.2f each. Total: %.2f\n", item.ProductName, item.Quantity, item.UnitPrice, item.TotalPrice)
		fmt.Printf("    Features: %v\n", item.Features)
		if item.Availability.InStock {
			fmt.Printf("    Availability: In Stock at %s\n", item.Availability.WarehouseLocation)
		} else {
			if item.Availability.EstimatedRestockDate != nil {
				fmt.Printf("    Availability: Out of Stock, estimated restock: %s\n", item.Availability.EstimatedRestockDate.Format("2006-01-02"))
			} else {
				fmt.Println("    Availability: Out of Stock, no restock date available")
			}
		}
	}
}
