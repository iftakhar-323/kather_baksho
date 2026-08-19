package main

import (
	"fmt"
	"katherbox/database"
	"katherbox/models"
)

func main() {
	database.Connect()

	// Update Posts
	var posts []models.CommunityPost
	database.DB.Where("author = ? OR author = ?", "", "Anonymous").Find(&posts)
	for _, p := range posts {
		var u models.User
		if err := database.DB.First(&u, p.UserID).Error; err == nil {
			if u.Name != "" {
				p.Author = u.Name
				database.DB.Save(&p)
			}
		}
	}

	// Update Comments
	var comments []models.CommunityComment
	database.DB.Where("author = ? OR author = ?", "", "Anonymous").Find(&comments)
	for _, c := range comments {
		var u models.User
		if err := database.DB.First(&u, c.UserID).Error; err == nil {
			if u.Name != "" {
				c.Author = u.Name
				database.DB.Save(&c)
			}
		}
	}
	fmt.Println("Done fixing authors.")
}
