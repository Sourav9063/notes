# Managing Environment Variables in Go with Viper

`Viper` is a complete configuration solution for Go applications, designed to work with 12-factor apps. It can read configuration from various sources, including environment variables, JSON, TOML, YAML, and more. This tutorial will focus on how to use `Viper` specifically for managing environment variables.

## Why use Viper for Environment Variables?

While the `os` package can read environment variables, `Viper` offers several advantages:

  * **Hierarchy and Overriding:** Easily define a hierarchy of configuration sources (e.g., environment variables override config files, which override defaults).

  * **Automatic Binding:** Automatically bind environment variables to specific keys in your configuration without manual `os.Getenv` calls for each variable.

  * **Case Insensitivity (Optional):** Can treat environment variable names as case-insensitive.

  * **Prefixing:** Use prefixes to prevent conflicts with other system environment variables.

  * **Convenience:** Centralizes all configuration logic, making your code cleaner and more maintainable.

## Getting Started

### 1\. Install Viper

First, you need to install the `Viper` package:

```bash
go get github.com/spf13/viper
```

### 2\. Create a `.env` File (Optional, but common)

While Viper can read environment variables directly from the shell, it's common practice to use a `.env` file for local development. Create a file named `.env` in your project's root directory:

**`.env`:**

```
APP_NAME="My Go App"
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secret123
DEBUG_MODE=true
```

**Important:** Remember to add `.env` to your `.gitignore` file:

```
# .gitignore
.env
```

### 3\. Basic Usage: Loading Environment Variables

Here's a basic example demonstrating how to load and read environment variables using `Viper`.

**`main.go`:**

```go
package main

import (
	"fmt"
	"log"
	"os" // os package is still used for setting env vars for demonstration

	"github.com/spf13/viper"
)

func main() {
	// 1. Set up Viper to read environment variables
	// Tell Viper to read from environment variables.
	viper.AutomaticEnv() 

	// Optional: Set a prefix for environment variables to avoid conflicts.
	// For example, if your env var is APP_DB_HOST, Viper will look for DB_HOST
	// after setting the prefix "APP".
	viper.SetEnvPrefix("APP")

	// 2. Set default values (optional, but good practice)
	// These values will be used if the environment variable is not found.
	viper.SetDefault("APP_NAME", "Default Go App")
	viper.SetDefault("DB_HOST", "127.0.0.1")
	viper.SetDefault("DB_PORT", 3306)
	viper.SetDefault("DEBUG_MODE", false)

	// --- Demonstration of how Viper handles env vars ---

	// Case 1: Environment variable set in .env (or shell)
	// Viper.AutomaticEnv() will pick these up.
	fmt.Println("--- Reading from .env / Shell ---")
	fmt.Println("App Name:", viper.GetString("APP_NAME")) // Reads "My Go App" from .env
	fmt.Println("DB Host:", viper.GetString("DB_HOST"))   // Reads "localhost" from .env
	fmt.Println("DB Port:", viper.GetInt("DB_PORT"))     // Reads 5432 from .env as int

	// Case 2: Environment variable not in .env, but has a default
	fmt.Println("Debug Mode (default or .env):", viper.GetBool("DEBUG_MODE")) // Reads true from .env

	// Case 3: Environment variable not set and no default (will return zero value)
	fmt.Println("Non-existent Key:", viper.GetString("NON_EXISTENT_KEY")) // Returns empty string

	// Case 4: Overriding an .env value with a shell environment variable
	// Set an environment variable in the shell before running:
	// export APP_DB_HOST=my_prod_db
	// go run main.go
	fmt.Println("\n--- Overriding with Shell Env Var (APP_DB_HOST example) ---")
	// If APP_DB_HOST is set in the shell, it will override any DB_HOST from .env
	// Note: Viper uses the key AFTER the prefix for `Get` methods.
	// So, if your env var is APP_DB_HOST and prefix is "APP", you access it as "DB_HOST".
	fmt.Println("DB Host (possibly overridden by shell):", viper.GetString("DB_HOST"))

	// Manual setting of an environment variable for this example
	os.Setenv("APP_OVERRIDE_PORT", "9000")
	fmt.Println("Override Port (set directly by os.Setenv):", viper.GetInt("OVERRIDE_PORT")) // Access as OVERRIDE_PORT
	os.Unsetenv("APP_OVERRIDE_PORT") // Clean up for demonstration

	fmt.Println("\n--- Loading an explicit .env file (common pattern) ---")
	// To explicitly load a .env file, combine with a file parser
	// Viper doesn't natively "load" .env files like godotenv.
	// You often need to pair it with something like godotenv or configure Viper to read the file.
	// For simplicity in this tutorial, we'll simulate loading a .env file
	// as if it were a config file, which Viper handles directly.
	// A more robust approach might use `godotenv.Load()` first, then `viper.AutomaticEnv()`.

	// Set the config file name and type (e.g., for .env, treat as JSON, YAML, etc., or plain text)
	// For environment variables, Viper's AutomaticEnv() is often enough.
	// If you want to load a `.env` file explicitly into Viper, you'd typically read it as a specific format
	// or use a helper like `godotenv.Load()` before `viper.AutomaticEnv()`.

	// Example if treating .env as a generic config file (less common for pure .env loading with Viper)
	// This would only work if your .env file was formatted like JSON, YAML, etc.
	// For raw .env parsing, `godotenv` is simpler.
	// viper.SetConfigName(".env")
	// viper.SetConfigType("env") // This type often requires specific parsers.
	// viper.AddConfigPath(".") // Look in current directory

	// err = viper.ReadInConfig()
	// if err != nil {
	// 	if _, ok := err.(viper.ConfigFileNotFoundError); ok {
	// 		fmt.Println("Config file .env not found, skipping...")
	// 	} else {
	// 		log.Fatalf("Error reading config file: %v", err)
	// 	}
	// } else {
	// 	fmt.Println("Loaded .env file as config.")
	// }


	// How Viper actually works best with .env:
	// It reads environment variables that are ALREADY SET in the shell or by other means (like godotenv).
	// So, if you ran `export DB_PASSWORD=new_secret; go run main.go`, Viper would pick it up.
	fmt.Println("\n--- Accessing sensitive data (DB_PASSWORD) ---")
	dbPassword := viper.GetString("DB_PASSWORD")
	fmt.Println("DB Password:", dbPassword) // Should read from .env if set, or be empty
	// For production, DB_PASSWORD should be set as a true environment variable on the server.
}
```

### 4\. Running the Example

1.  Save the `.env` file and `main.go` in the same directory.

2.  Open your terminal in that directory.

3.  Run the Go program:

    ```bash
    go run main.go
    ```

    You should see output similar to this:

    ```
    --- Reading from .env / Shell ---
    App Name: My Go App
    DB Host: localhost
    DB Port: 5432
    Debug Mode (default or .env): true
    Non-existent Key: 

    --- Overriding with Shell Env Var (APP_DB_HOST example) ---
    DB Host (possibly overridden by shell): localhost

    --- Loading an explicit .env file (common pattern) ---

    --- Accessing sensitive data (DB_PASSWORD) ---
    DB Password: secret123
    ```

    **To demonstrate overriding:**
    Try running the program with a shell environment variable set:

    ```bash
    export APP_DB_HOST=my_production_database_server
    export APP_APP_NAME="Production App"
    export APP_DEBUG_MODE=false # Note: Viper handles boolean strings like "true", "false", "1", "0"
    go run main.go
    ```

    Now, the output for `DB Host`, `App Name`, and `Debug Mode` should reflect the values set in the shell, demonstrating how environment variables take precedence.

### 5\. Automatic Binding to Structs

One of the powerful features of `Viper` is its ability to automatically bind environment variables (and other config sources) to Go structs. This provides type safety and a clean way to manage your configuration.

Let's refine the example to use a struct:

**`config.go` (or `main.go` for simplicity):**

```go
package main

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

// Config struct to hold our application settings
// Use `mapstructure` tags if the field names in the struct
// don't directly match the Viper keys (e.g., if you use camelCase in Go
// but snake_case in config, or if you're using a prefix).
type Config struct {
	AppName    string `mapstructure:"APP_NAME"`
	Database   struct {
		Host     string `mapstructure:"DB_HOST"`
		Port     int    `mapstructure:"DB_PORT"`
		User     string `mapstructure:"DB_USER"`
		Password string `mapstructure:"DB_PASSWORD"`
	} `mapstructure:"-"` // Use "-" to indicate this struct itself doesn't map to a single env var,
	                     // but its fields do.
	DebugMode  bool   `mapstructure:"DEBUG_MODE"`
}

func main() {
	// Set up Viper
	viper.AutomaticEnv() // Read from environment variables
	viper.SetEnvPrefix("APP") // Environment variables will be like APP_APP_NAME, APP_DB_HOST

	// Set default values (important for struct binding if not all env vars are present)
	viper.SetDefault("APP_NAME", "Default Go App")
	viper.SetDefault("DB_HOST", "127.0.0.1")
	viper.SetDefault("DB_PORT", 3306)
	viper.SetDefault("DB_USER", "default_user")
	viper.SetDefault("DB_PASSWORD", "") // Sensitive, usually empty default
	viper.SetDefault("DEBUG_MODE", false)

	// You can also explicitly set aliases for environment variable names
	// For example, if you want "APP_ENVIRONMENT" to map to "APP_ENV"
	// viper.BindEnv("ENVIRONMENT", "APP_ENVIRONMENT") // Not needed if using SetEnvPrefix directly

	// Create a Config struct instance
	var appConfig Config

	// Unmarshal the Viper configuration into the struct
	// This will populate the struct fields based on Viper's current state
	// (which includes environment variables, defaults, etc.).
	err := viper.Unmarshal(&appConfig)
	if err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}

	fmt.Println("--- Config loaded into Struct ---")
	fmt.Printf("Application Name: %s\n", appConfig.AppName)
	fmt.Printf("Database Host: %s\n", appConfig.Database.Host)
	fmt.Printf("Database Port: %d\n", appConfig.Database.Port)
	fmt.Printf("Database User: %s\n", appConfig.Database.User)
	fmt.Printf("Database Password: %s\n", appConfig.Database.Password)
	fmt.Printf("Debug Mode: %t\n", appConfig.DebugMode)

	// You can still access individual keys if needed
	fmt.Println("\n--- Direct access via Viper.Get ---")
	fmt.Println("App Name (direct):", viper.GetString("APP_NAME"))
}
```

**Running the Struct Example:**

1.  Make sure your `.env` file is present (as shown in step 2) or set the environment variables in your shell with the `APP_` prefix (e.g., `export APP_DB_HOST=localhost`).

2.  Run the Go program:

    ```bash
    go run main.go
    ```

    The output will show the configuration values populated directly into your `appConfig` struct.

## Important Considerations

  * **Order of Precedence:** Viper's strength lies in its ability to handle multiple configuration sources with a clear order of precedence. Generally, it's:

    1.  Explicitly set values (e.g., `viper.Set("key", value)`)

    2.  Command-line flags

    3.  Environment variables (after `viper.AutomaticEnv()` and `viper.SetEnvPrefix()`)

    4.  Config file values (e.g., from `viper.ReadInConfig()`)

    5.  Key/value store (Consul, Etcd, etc.)

    6.  Defaults (`viper.SetDefault()`)

    Environment variables will override values from config files and defaults if they are present.

  * **Case Sensitivity:** By default, environment variable names are case-sensitive. If your environment variables are `APP_NAME` and you call `viper.GetString("appName")`, it might not find it unless you've set up case-insensitivity or used the correct casing. `viper.SetEnvKeyReplacer` can help with this by replacing characters (e.g., `_` with `.`) and handling case.

  * **Production Deployment:** For production, it's best practice to pass sensitive configuration (like database passwords) directly as environment variables to your application's runtime environment (e.g., Docker containers, Kubernetes pods) rather than relying on `.env` files. This ensures secrets are not accidentally committed or exposed.

  * **Error Handling:** Always check for errors when loading configuration (e.g., `viper.ReadInConfig()`, `viper.Unmarshal()`).

`Viper` provides a robust and flexible way to manage your Go application's configuration, making it adaptable to various environments and deployment strategies.
