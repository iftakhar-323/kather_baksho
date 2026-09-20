package middleware

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gin-gonic/gin"
)

const RequestIDHeader = "X-Request-ID"
const RequestIDKey = "request_id"

// generateRequestID produces a 32-character hexadecimal random request ID.
func generateRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "req-fallback-id"
	}
	return hex.EncodeToString(b)
}

// RequestIDMiddleware extracts or injects a unique X-Request-ID for every incoming request.
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader(RequestIDHeader)
		if reqID == "" {
			reqID = generateRequestID()
		}
		c.Set(RequestIDKey, reqID)
		c.Writer.Header().Set(RequestIDHeader, reqID)
		c.Next()
	}
}
