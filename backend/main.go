package main

import (
	"log"
	"os"
	"strings"
	"time"

	"katherbox/database"
	"katherbox/models"
	"katherbox/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (silently ignore when missing so production
	// environments that set vars in the shell still work).
	_ = godotenv.Load()

	database.ConnectDatabase()
	if err := database.DB.AutoMigrate(
		&models.Product{},
		&models.User{},
		&models.Cart{},
		&models.CartItem{},
		&models.Order{},
		&models.OrderItem{},
		&models.WishlistItem{},
		&models.Notification{},
		&models.Coupon{},
		&models.CareReminder{},
		&models.Address{},
		&models.Subscription{},
		&models.Consultation{},
		&models.CorporateQuote{},
		&models.CommunityPost{},
		&models.CommunityComment{},
		&models.CommunityLike{},
		// Sprint D-I extensions
		&models.OrderEvent{},
		&models.ReturnRequest{},
		&models.SubscriptionDelivery{},
		&models.GrowthJournal{},
		&models.CareSchedule{},
		&models.CommunityFollow{},
		&models.CommunityBookmark{},
		&models.CommunityGroup{},
		&models.CommunityGroupMember{},
		&models.CommunityQuestion{},
		&models.CommunityAnswer{},
		&models.Achievement{},
		&models.UserAchievement{},
		&models.ReferralCode{},
		&models.Referral{},
		&models.MembershipTier{},
		&models.CouponReward{},
		&models.CorporateOrder{},
		&models.BlogPost{},
		&models.PageView{},
		&models.GuestOrder{},
		&models.GiftCard{},
		&models.ShippingRule{},
		&models.TaxRule{},
		&models.UserMembership{},
		&models.Review{},
		&models.Category{},
		&models.EmailVerification{},
	); err != nil {
		log.Fatalf("auto-migrate failed: %v", err)
	}

	router := gin.Default()

	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:80",
		"http://localhost",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174",
	}
	if customOrigins := os.Getenv("ALLOWED_ORIGINS"); customOrigins != "" {
		if customOrigins == "*" {
			allowedOrigins = []string{"*"}
		} else {
			allowedOrigins = append(allowedOrigins, strings.Split(customOrigins, ",")...)
		}
	}

	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if len(allowedOrigins) == 1 && allowedOrigins[0] == "*" {
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowCredentials = false
	} else {
		corsConfig.AllowOrigins = allowedOrigins
	}

	router.Use(cors.New(corsConfig))

	routes.ProductRoutes(router)
	routes.AuthRoutes(router)
	routes.CartRoutes(router)
	routes.OrderRoutes(router)
	routes.WishlistRoutes(router)
	routes.NotificationRoutes(router)
	routes.CouponRoutes(router)
	routes.ReminderRoutes(router)
	routes.GiftRoutes(router)
	routes.SeasonalRoutes(router)
	routes.SubscriptionRoutes(router)
	routes.ConsultationRoutes(router)
	routes.CorporateRoutes(router)
	routes.CommunityRoutes(router)
	routes.AdminRoutes(router)
	// Sprint D-I extensions
	routes.OrderExtensionRoutes(router)
	routes.CareJournalRoutes(router)
	routes.CommunityExtensionRoutes(router)
	routes.LoyaltyRoutes(router)
	routes.CorporateOrderRoutes(router)
	routes.BlogRoutes(router)
	routes.AnalyticsRoutes(router)
	routes.ShoppingRoutes(router)
	routes.CSVRoutes(router)
	routes.BackupRoutes(router)
	routes.AddressRoutes(router)
	routes.ReviewRoutes(router)
	routes.CategoryRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	router.Run(port)
}
