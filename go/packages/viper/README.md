# Managing Environment Variables in Go with Viper

`Viper` is a complete configuration solution for Go applications, designed to work with 12-factor apps. It can read configuration from various sources, including environment variables, JSON, TOML, YAML, and more. This tutorial will focus on how to use `Viper` specifically for managing environment variables.

## Why use Viper for Environment Variables?

While the `os` package can read environment variables, `Viper` offers several advantages:

  * **Hierarchy and Overriding:** Easily define a hierarchy of configuration sources (e.g., environment variables override config files, which override defaults).

  * **Automatic Binding:** Automatically bind environment variables to specific keys in your configuration without manual `os.Getenv` calls for each variable.

  * **Case-Insensitive Keys:** `Get("db_host")` and `Get("DB_HOST")` read the same key.

  * **Prefixing:** Use prefixes to prevent conflicts with other system environment variables.

  * **Convenience:** Centralizes all configuration logic, making your code cleaner and more maintainable.

## Getting Started

### 1\. Install Viper

First, you need to install the `Viper` package:

```bash
go get github.com/spf13/viper
```

### 2\. Create a `.env` File (Optional, but common)

Viper reads environment variables from the process, not from `.env` files. For local development, you can load a `.env` file as a config file (Viper supports the `env` format). Create a file named `.env` in your project's root directory:

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

### 3\. Environment Variables, `.env`, and Struct Binding

Keys are case-insensitive (`viper.GetString("DB_HOST")` and `viper.GetString("db_host")` are the same). With `SetEnvPrefix("APP")`, key `db_host` is read from the env var `APP_DB_HOST`. The `.env` file keys have no prefix; real env vars with the `APP_` prefix override them.

**`main.go`:**

```go
package main

import (
	"errors"
	"fmt"
	"io/fs"
	"log"

	"github.com/spf13/viper"
)

type DatabaseConfig struct {
	Host     string `mapstructure:"db_host"`
	Port     int    `mapstructure:"db_port"`
	User     string `mapstructure:"db_user"`
	Password string `mapstructure:"db_password"`
}

type Config struct {
	AppName   string         `mapstructure:"app_name"`
	Database  DatabaseConfig `mapstructure:",squash"` // fields live at the top level (db_host, ...)
	DebugMode bool           `mapstructure:"debug_mode"`
}

func main() {
	viper.SetEnvPrefix("APP")
	viper.AutomaticEnv()

	viper.SetDefault("app_name", "Default Go App")
	viper.SetDefault("db_host", "127.0.0.1")
	viper.SetDefault("db_port", 3306)
	viper.SetDefault("db_user", "default_user")
	viper.SetDefault("debug_mode", false)
	if err := viper.BindEnv("db_password"); err != nil {
		log.Fatal(err)
	}

	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil && !errors.Is(err, fs.ErrNotExist) {
		log.Fatalf("read .env: %v", err)
	}

	fmt.Println("App Name:", viper.GetString("app_name"))
	fmt.Println("DB Host:", viper.GetString("DB_HOST"))
	fmt.Println("DB Port:", viper.GetInt("db_port"))
	fmt.Println("Debug:", viper.GetBool("debug_mode"))
	fmt.Println("Missing:", viper.GetString("non_existent_key") == "")

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatalf("decode config: %v", err)
	}
	fmt.Printf("%+v\n", cfg)
}
```

### 4\. Running the Example

```bash
go run .
```

```
App Name: My Go App
DB Host: localhost
DB Port: 5432
Debug: true
Missing: true
{AppName:My Go App Database:{Host:localhost Port:5432 User:admin Password:secret123} DebugMode:true}
```

Override with prefixed env vars:

```bash
APP_DB_HOST=prod APP_APP_NAME="Prod App" APP_DEBUG_MODE=false go run .
# App Name: Prod App, DB Host: prod, Debug: false
```

Without `.env`, defaults apply and `APP_DB_PASSWORD` still reaches the struct through `BindEnv`.

## Important Considerations

  * **`Unmarshal` and env vars:** `AutomaticEnv` only answers `Get` calls. `Unmarshal` sees an env var only if Viper already knows the key (via `SetDefault`, a config file, or `BindEnv`). Bind secrets that have no default, like `db_password` above.

  * **Nested structs:** `mapstructure:",squash"` flattens an embedded struct's fields into the parent. `mapstructure:"-"` would *skip* the field entirely.

  * **Nested keys and env vars:** For keys like `database.host`, add `viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))` so they map to `APP_DATABASE_HOST`.

  * **Order of Precedence** (highest first):

    1.  Explicit `viper.Set`
    2.  Flags
    3.  Environment variables
    4.  Config file
    5.  Key/value store
    6.  Defaults

  * **Production Deployment:** Pass secrets as real environment variables (Docker, Kubernetes) instead of `.env` files, and keep `.env` in `.gitignore`.

  * **Error Handling:** Always check errors from `viper.ReadInConfig()` and `viper.Unmarshal()`.
