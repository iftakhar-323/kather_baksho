package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"katherbox/database"
	"katherbox/models"

	"github.com/gin-gonic/gin"
)

func getPaymentSecret() string {
	sec := os.Getenv("PAYMENT_SECRET")
	if sec == "" {
		sec = "katherbox_default_secure_payment_hmac_secret_2026"
	}
	return sec
}

// ComputeHMAC generates an HMAC-SHA256 signature for payload verification.
func ComputeHMAC(data string, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

type InitiatePaymentInput struct {
	OrderID       uint   `json:"order_id" binding:"required"`
	PaymentMethod string `json:"payment_method"` // bkash, nagad, sslcommerz, card
}

// POST /api/payments/initiate
func InitiatePayment(c *gin.Context) {
	var input InitiatePaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", input.OrderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.PaymentStatus == "Paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order is already paid"})
		return
	}

	method := input.PaymentMethod
	if method == "" {
		method = "bkash"
	}

	sessionID := fmt.Sprintf("PAY-SES-%d-%d", order.ID, time.Now().UnixNano())
	payload := fmt.Sprintf("%d|%.2f|%s", order.ID, order.TotalPrice, sessionID)
	signature := ComputeHMAC(payload, getPaymentSecret())

	c.JSON(http.StatusOK, gin.H{
		"session_id":     sessionID,
		"order_id":       order.ID,
		"amount":         order.TotalPrice,
		"payment_method": method,
		"signature":      signature,
		"gateway_url":    fmt.Sprintf("/api/payments/simulate-gateway?session_id=%s", sessionID),
	})
}

type PaymentCallbackInput struct {
	OrderID   uint   `json:"order_id" binding:"required"`
	SessionID string `json:"session_id" binding:"required"`
	Status    string `json:"status" binding:"required"` // SUCCESS, FAILED, CANCELLED
	Signature string `json:"signature" binding:"required"`
}

// POST /api/payments/callback
// Handles return callbacks and webhook deliveries with HMAC validation and idempotency.
func PaymentCallback(c *gin.Context) {
	var input PaymentCallbackInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := database.DB.Preload("Items").First(&order, input.OrderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Verify HMAC signature
	payload := fmt.Sprintf("%d|%.2f|%s", order.ID, order.TotalPrice, input.SessionID)
	expectedSignature := ComputeHMAC(payload, getPaymentSecret())
	if !hmac.Equal([]byte(input.Signature), []byte(expectedSignature)) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid payment signature"})
		return
	}

	// Idempotency check: if order is already marked as paid, return success without duplicate side effects
	if order.PaymentStatus == "Paid" {
		c.JSON(http.StatusOK, gin.H{
			"message":        "Order already processed",
			"order_id":       order.ID,
			"payment_status": order.PaymentStatus,
			"status":         order.Status,
			"idempotent":     true,
		})
		return
	}

	if input.Status == "SUCCESS" {
		order.PaymentStatus = "Paid"
		order.Status = "Processing"
		database.DB.Save(&order)

		// Record order event timeline
		database.DB.Create(&models.OrderEvent{
			OrderID:   order.ID,
			Event:     "Payment Received",
			Note:      fmt.Sprintf("Payment of ৳%.2f verified via session %s", order.TotalPrice, input.SessionID),
			CreatedBy: order.UserID,
		})

		c.JSON(http.StatusOK, gin.H{
			"message":        "Payment verified and order updated",
			"order_id":       order.ID,
			"payment_status": "Paid",
			"status":         "Processing",
		})
		return
	}

	// If failed, restore reserved stock and mark payment failed
	order.PaymentStatus = "Failed"
	order.Status = "Cancelled"
	database.DB.Save(&order)

	for _, item := range order.Items {
		database.DB.Model(&models.Product{}).Where("id = ?", item.ProductID).
			Update("stock", database.DB.Raw("stock + ?", item.Quantity))
	}

	database.DB.Create(&models.OrderEvent{
		OrderID:   order.ID,
		Event:     "Payment Failed",
		Note:      fmt.Sprintf("Payment failed for session %s, inventory restored", input.SessionID),
		CreatedBy: order.UserID,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":        "Payment failed, stock restored",
		"order_id":       order.ID,
		"payment_status": "Failed",
		"status":         "Cancelled",
	})
}

// GET /api/payments/status/:order_id
func GetPaymentStatus(c *gin.Context) {
	oid, err := strconv.Atoi(c.Param("order_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	var order models.Order
	if err := database.DB.Select("id, total_price, payment_method, payment_status, status").First(&order, oid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":       order.ID,
		"total_price":    order.TotalPrice,
		"payment_method": order.PaymentMethod,
		"payment_status": order.PaymentStatus,
		"order_status":   order.Status,
	})
}
