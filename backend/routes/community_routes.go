package routes

import (
	"kather_baksho/controllers"
	"kather_baksho/middleware"

	"github.com/gin-gonic/gin"
)

func CommunityRoutes(router *gin.Engine) {
	g := router.Group("/api/community")
	{
		g.GET("/posts", controllers.ListPosts)
		g.GET("/posts/:id/comments", controllers.ListComments)
	}

	auth := router.Group("/api/community")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.POST("/posts", controllers.CreatePost)
		auth.POST("/posts/:id/comments", controllers.AddComment)
		auth.POST("/posts/:id/like", controllers.ToggleLike)
		auth.DELETE("/posts/:id", controllers.DeletePost)
	}
}
