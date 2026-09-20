package routes

import (
	"katherbox/controllers"

	"github.com/gin-gonic/gin"
)

func AIRoutes(router *gin.Engine) {
	ai := router.Group("/api/ai")
	{
		ai.POST("/diagnose", controllers.DiagnosePlantSymptoms)
		ai.POST("/chat", controllers.ChatWithPlantDoctor)
	}
}
