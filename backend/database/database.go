package database

import (
	"fmt"
	"log"
	"os"
	"time"

	sqlite "github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ConnectDatabase opens the database based on DB_DRIVER ("postgres" or default "sqlite").
// SQLite uses the pure-Go driver so the binary builds without a C toolchain (CGO_ENABLED=0).
// PostgreSQL uses the robust pgx/v5 driver with production-ready connection pooling.
func ConnectDatabase() {
	driver := os.Getenv("DB_DRIVER")

	// Quiet SQL logs in production, warnings elsewhere.
	logLevel := logger.Warn
	if os.Getenv("GIN_MODE") == "release" {
		logLevel = logger.Error
	}

	gormConfig := &gorm.Config{
		Logger:                                   logger.Default.LogMode(logLevel),
		PrepareStmt:                              false,
		DisableForeignKeyConstraintWhenMigrating: true,
	}

	if driver == "postgres" {
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "katherbox"
		}
		password := os.Getenv("DB_PASSWORD")
		if password == "" {
			password = "katherbox_secret"
		}
		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "katherbox"
		}
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}

		dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
			host, port, user, password, dbname, sslmode)

		db, err := gorm.Open(postgres.Open(dsn), gormConfig)
		if err != nil {
			log.Fatal("Failed to connect to PostgreSQL database: ", err)
		}

		if sqlDB, err := db.DB(); err == nil {
			sqlDB.SetMaxOpenConns(25)
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetConnMaxLifetime(time.Hour)
		}

		DB = db
		log.Printf("[Database] Connected to PostgreSQL at %s:%s/%s", host, port, dbname)
		return
	}

	// Default: pure-Go SQLite
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "kather_baksho.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), gormConfig)
	if err != nil {
		log.Fatal("Failed to connect database: ", err)
	}

	// SQLite tuning: foreign_keys enforces referential integrity; busy_timeout
	// makes callers wait for a briefly-held write lock instead of failing.
	for _, pragma := range []string{
		"PRAGMA foreign_keys = ON",
		"PRAGMA busy_timeout = 5000",
	} {
		if err := db.Exec(pragma).Error; err != nil {
			log.Fatalf("Failed to apply %q: %v", pragma, err)
		}
	}

	if sqlDB, err := db.DB(); err == nil {
		// SQLite permits many readers but only one writer; a single pooled
		// connection plus busy_timeout avoids "database is locked" errors.
		sqlDB.SetMaxOpenConns(1)
		sqlDB.SetMaxIdleConns(1)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	DB = db
	log.Printf("[Database] Connected to SQLite database at %s", dbPath)
}
