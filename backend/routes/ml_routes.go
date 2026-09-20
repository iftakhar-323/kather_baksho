package routes

import (
	"katherbox/controllers"

	"github.com/gin-gonic/gin"
)

func MLRoutes(router *gin.Engine) {
	ml := router.Group("/api/ml")
	{
		ml.POST("/compare", controllers.CompareModels)
		ml.GET("/compare", controllers.CompareModels)
	}
}
