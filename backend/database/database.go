package database

import (
	"log"
	"os"
	"time"

	sqlite "github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ConnectDatabase opens the SQLite database, applies sensible pragmas and a
// conservative connection pool, and stores the handle in the package-level DB.
// It uses the pure-Go SQLite driver so the binary builds without a C toolchain
// (CGO_ENABLED=0) on any platform.
func ConnectDatabase() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "katherbox.db"
	}

	// Quiet SQL logs in production, warnings elsewhere.
	logLevel := logger.Warn
	if os.Getenv("GIN_MODE") == "release" {
		logLevel = logger.Error
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logLevel),
		PrepareStmt:                              true,
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatal("Failed to connect database: ", err)
	}

	// SQLite tuning: foreign_keys enforces referential integrity; busy_timeout
	// makes callers wait for a briefly-held write lock instead of failing.
	// (journal_mode is left at the file's default so the committed seed DB
	// isn't rewritten on every startup.)
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
}
