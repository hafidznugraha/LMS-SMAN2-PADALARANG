package handler

import (
	"errors"
	"strings"
	"time"

	"github.com/altcha-org/altcha-lib-go"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`
	Altcha     string `json:"altcha"`
}

type LoginResponseData struct {
	AccessToken string      `json:"access_token"`
	TokenType   string      `json:"token_type"`
	ExpiresIn   int64       `json:"expires_in"`
	User        UserProfile `json:"user"`
}

type UserProfile struct {
	ID          uuid.UUID      `json:"id"`
	Username    string         `json:"username"`
	NamaLengkap string         `json:"nama_lengkap"`
	Email       string         `json:"email"`
	Role        model.UserRole `json:"role"`
	Extra       interface{}    `json:"extra,omitempty"`
}

func LoginHandler(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Format data request tidak valid",
			})
		}

		idVal := strings.TrimSpace(req.Identifier)
		if idVal == "" {
			idVal = strings.TrimSpace(req.Username)
		}

		if idVal == "" || strings.TrimSpace(req.Password) == "" {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Username dan password wajib diisi",
			})
		}

		if req.Altcha != "" {
			verified, err := altcha.VerifySolution(req.Altcha, cfg.JWTSecret, true)
			if err != nil || !verified {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "Verifikasi keamanan (CAPTCHA) tidak valid atau telah kedaluwarsa",
				})
			}
		} else if cfg.Environment != "test" {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Verifikasi keamanan (CAPTCHA) wajib diselesaikan",
			})
		}

		if repository.DB == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
				Success: false,
				Message: "Layanan database belum siap",
			})
		}

		var user model.User
		err := repository.DB.Where("LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", idVal, idVal).First(&user).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
					Success: false,
					Message: "Username atau password salah",
				})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Terjadi kesalahan pada sistem saat mencari data pengguna",
			})
		}

		if !user.IsActive {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Akun Anda telah dinonaktifkan. Silakan hubungi admin kurikulum.",
			})
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Username atau password salah",
			})
		}

		accessExp := time.Now().Add(24 * time.Hour)
		accessClaims := jwt.MapClaims{
			"user_id":      user.ID.String(),
			"username":     user.Username,
			"email":        user.Email,
			"nama_lengkap": user.NamaLengkap,
			"role":         string(user.Role),
			"exp":          accessExp.Unix(),
			"iat":          time.Now().Unix(),
		}
		accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
		accessToken, err := accessTokenObj.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal membuat access token",
			})
		}

		refreshDuration := 7 * 24 * time.Hour
		if req.RememberMe {
			refreshDuration = 30 * 24 * time.Hour
		}
		refreshExp := time.Now().Add(refreshDuration)
		refreshClaims := jwt.MapClaims{
			"user_id": user.ID.String(),
			"role":    string(user.Role),
			"exp":     refreshExp.Unix(),
			"iat":     time.Now().Unix(),
		}
		refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
		refreshToken, err := refreshTokenObj.SignedString([]byte(cfg.JWTRefresh))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal membuat refresh token",
			})
		}

		isSecure := cfg.Environment == "production"
		c.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Expires:  refreshExp,
			HTTPOnly: true,
			Secure:   isSecure,
			SameSite: "Lax",
			Path:     "/",
		})

		extraData := fetchExtraUserData(user.ID, user.Role)

		profile := UserProfile{
			ID:          user.ID,
			Username:    user.Username,
			NamaLengkap: user.NamaLengkap,
			Email:       user.Email,
			Role:        user.Role,
			Extra:       extraData,
		}

		return c.Status(fiber.StatusOK).JSON(model.APIResponse{
			Success: true,
			Message: "Autentikasi berhasil",
			Data: LoginResponseData{
				AccessToken: accessToken,
				TokenType:   "Bearer",
				ExpiresIn:   86400,
				User:        profile,
			},
		})
	}
}

func RefreshTokenHandler(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		refreshToken := c.Cookies("refresh_token")
		if refreshToken == "" {
			authHeader := c.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				refreshToken = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if refreshToken == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Sesi telah berakhir atau refresh token tidak ditemukan",
			})
		}

		token, err := jwt.Parse(refreshToken, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWTRefresh), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Refresh token tidak valid atau telah kedaluwarsa",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Klaim token tidak valid",
			})
		}

		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Format token tidak valid",
			})
		}

		var user model.User
		if err := repository.DB.First(&user, "id = ?", userIDStr).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Pengguna tidak ditemukan",
			})
		}

		if !user.IsActive {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Akun telah dinonaktifkan",
			})
		}

		accessExp := time.Now().Add(24 * time.Hour)
		accessClaims := jwt.MapClaims{
			"user_id":      user.ID.String(),
			"username":     user.Username,
			"email":        user.Email,
			"nama_lengkap": user.NamaLengkap,
			"role":         string(user.Role),
			"exp":          accessExp.Unix(),
			"iat":          time.Now().Unix(),
		}
		newAccessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
		newAccessToken, err := newAccessTokenObj.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal memperbarui access token",
			})
		}

		return c.Status(fiber.StatusOK).JSON(model.APIResponse{
			Success: true,
			Message: "Access token berhasil diperbarui",
			Data: fiber.Map{
				"access_token": newAccessToken,
				"token_type":   "Bearer",
				"expires_in":   86400,
			},
		})
	}
}

func LogoutHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    "",
			Expires:  time.Now().Add(-24 * time.Hour),
			HTTPOnly: true,
			SameSite: "Lax",
			Path:     "/",
		})

		return c.Status(fiber.StatusOK).JSON(model.APIResponse{
			Success: true,
			Message: "Logout berhasil, sesi telah dihapus",
		})
	}
}

func AltchaChallengeHandler(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		expires := time.Now().Add(10 * time.Minute)
		chal, err := altcha.CreateChallenge(altcha.ChallengeOptions{
			Algorithm: altcha.SHA256,
			MaxNumber: 50000,
			HMACKey:   cfg.JWTSecret,
			Expires:   &expires,
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal membuat challenge keamanan",
				Error:   err.Error(),
			})
		}
		return c.JSON(chal)
	}
}

func MeHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("user_id")
		if userIDVal == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
				Success: false,
				Message: "Data sesi tidak ditemukan",
			})
		}

		userIDStr, ok := userIDVal.(string)
		if !ok {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Format User ID di sesi tidak valid",
			})
		}

		if repository.DB == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
				Success: false,
				Message: "Database belum siap",
			})
		}

		var user model.User
		if err := repository.DB.First(&user, "id = ?", userIDStr).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
				Success: false,
				Message: "Data profil pengguna tidak ditemukan",
			})
		}

		extraData := fetchExtraUserData(user.ID, user.Role)

		profile := UserProfile{
			ID:          user.ID,
			Username:    user.Username,
			NamaLengkap: user.NamaLengkap,
			Email:       user.Email,
			Role:        user.Role,
			Extra:       extraData,
		}

		return c.Status(fiber.StatusOK).JSON(model.APIResponse{
			Success: true,
			Message: "Data profil pengguna berhasil dimuat",
			Data:    profile,
		})
	}
}

func fetchExtraUserData(userID uuid.UUID, role model.UserRole) interface{} {
	if repository.DB == nil {
		return nil
	}

	switch role {
	case model.RoleSiswa:
		var siswa model.Siswa
		if err := repository.DB.Preload("Kelas").Where("user_id = ?", userID).First(&siswa).Error; err == nil {
			return fiber.Map{
				"siswa_id":      siswa.ID,
				"nis":           siswa.NIS,
				"nisn":          siswa.NISN,
				"jenis_kelamin": siswa.JenisKelamin,
				"kelas":         siswa.Kelas,
			}
		}
	case model.RoleGuru, model.RoleWaliKelas:
		var guru model.Guru
		if err := repository.DB.Preload("KelasBinaan").Where("user_id = ?", userID).First(&guru).Error; err == nil {
			return fiber.Map{
				"guru_id":       guru.ID,
				"nip":           guru.NIP,
				"gelar":         guru.Gelar,
				"no_telepon":    guru.NoTelepon,
				"is_wali_kelas": len(guru.KelasBinaan) > 0,
				"kelas_binaan":  guru.KelasBinaan,
			}
		}
	}

	return nil
}
