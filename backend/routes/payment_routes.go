package routes

import (
	"katherbox/controllers"
	"katherbox/middleware"

	"github.com/gin-gonic/gin"
)

func PaymentRoutes(router *gin.Engine) {
	payments := router.Group("/api/payments")
	{
		// Callback from payment gateway (verified via HMAC signature)
		payments.POST("/callback", controllers.PaymentCallback)
		payments.POST("/webhook", controllers.PaymentCallback)

		// Authenticated payment initiation and status check
		authenticated := payments.Group("")
		authenticated.Use(middleware.AuthMiddleware())
		{
			authenticated.POST("/initiate", controllers.InitiatePayment)
			authenticated.GET("/status/:order_id", controllers.GetPaymentStatus)
		}
	}
}
