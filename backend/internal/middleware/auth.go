package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

// JWTProtected middleware untuk memverifikasi access token JWT di header Authorization
func JWTProtected(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Token autentikasi tidak ditemukan",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Format token harus 'Bearer <token>'",
			})
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Token tidak valid atau telah kedaluwarsa",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Klaim token tidak valid",
			})
		}

		// Simpan user context ke Locals Fiber
		c.Locals("user_id", claims["user_id"])
		c.Locals("username", claims["username"])
		c.Locals("role", claims["role"])

		return c.Next()
	}
}

// RequireRole middleware granular RBAC untuk membatasi endpoint berdasarkan peran
func RequireRole(allowedRoles ...model.UserRole) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoleStr, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Peran pengguna tidak teridentifikasi",
			})
		}

		userRole := model.UserRole(userRoleStr)
		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
			Success: false,
			Message: "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini",
		})
	}
}
