package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

// NotifikasiService menyediakan fungsi domain terpusat untuk distribusi dan manajemen notifikasi LMS
type NotifikasiService struct{}

var notifServiceInstance = &NotifikasiService{}

// GetNotifikasiService mengembalikan instance singleton NotifikasiService
func GetNotifikasiService() *NotifikasiService {
	return notifServiceInstance
}

// KirimKeKelas mendistribusikan notifikasi secara isolatif HANYA kepada siswa yang terdaftar di kelas tertentu
func (s *NotifikasiService) KirimKeKelas(db *gorm.DB, kelasID uuid.UUID, judul, pesan, tipe, tautan string) (int, error) {
	if db == nil || kelasID == uuid.Nil {
		return 0, fmt.Errorf("database handle atau kelasID tidak valid")
	}

	var targetSiswa []model.Siswa
	if err := db.Where("kelas_id = ?", kelasID).Find(&targetSiswa).Error; err != nil {
		return 0, fmt.Errorf("gagal query siswa kelas %s: %w", kelasID, err)
	}

	if len(targetSiswa) == 0 {
		return 0, nil
	}

	now := time.Now()
	notifList := make([]model.Notifikasi, 0, len(targetSiswa))
	for _, siswa := range targetSiswa {
		if siswa.UserID != uuid.Nil {
			notifList = append(notifList, model.Notifikasi{
				ID:        uuid.New(),
				UserID:    siswa.UserID,
				Judul:     judul,
				Pesan:     pesan,
				Tipe:      tipe,
				Tautan:    tautan,
				IsRead:    false,
				CreatedAt: now,
			})
		}
	}

	if len(notifList) == 0 {
		return 0, nil
	}

	if err := db.CreateInBatches(&notifList, 100).Error; err != nil {
		log.Printf("[ERROR] NotifikasiService.KirimKeKelas gagal membuat batch notifikasi untuk kelas %s: %v\n", kelasID, err)
		return 0, err
	}

	return len(notifList), nil
}

// KirimKeUser mengirimkan notifikasi personal ke satu user tertentu
func (s *NotifikasiService) KirimKeUser(db *gorm.DB, userID uuid.UUID, judul, pesan, tipe, tautan string) error {
	if db == nil || userID == uuid.Nil {
		return fmt.Errorf("database handle atau userID tidak valid")
	}

	notif := model.Notifikasi{
		ID:        uuid.New(),
		UserID:    userID,
		Judul:     judul,
		Pesan:     pesan,
		Tipe:      tipe,
		Tautan:    tautan,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	return db.Create(&notif).Error
}

// KirimBatch mendistribusikan notifikasi yang sama ke kumpulan user ID tertentu
func (s *NotifikasiService) KirimBatch(db *gorm.DB, userIDs []uuid.UUID, judul, pesan, tipe, tautan string) (int, error) {
	if db == nil || len(userIDs) == 0 {
		return 0, nil
	}

	now := time.Now()
	notifList := make([]model.Notifikasi, 0, len(userIDs))
	for _, uid := range userIDs {
		if uid != uuid.Nil {
			notifList = append(notifList, model.Notifikasi{
				ID:        uuid.New(),
				UserID:    uid,
				Judul:     judul,
				Pesan:     pesan,
				Tipe:      tipe,
				Tautan:    tautan,
				IsRead:    false,
				CreatedAt: now,
			})
		}
	}

	if len(notifList) == 0 {
		return 0, nil
	}

	if err := db.CreateInBatches(&notifList, 100).Error; err != nil {
		return 0, err
	}

	return len(notifList), nil
}

// FormatNamaGuruWithGelar mengambil nama lengkap guru beserta gelar akademis secara cerdas tanpa duplikasi
func (s *NotifikasiService) FormatNamaGuruWithGelar(db *gorm.DB, guruUUID uuid.UUID) string {
	if db == nil || guruUUID == uuid.Nil {
		return "Guru Pengampu"
	}

	var guruInfo struct {
		NamaLengkap string `gorm:"column:nama_lengkap"`
		Gelar       string `gorm:"column:gelar"`
	}
	if err := db.Table("guru").
		Select("users.nama_lengkap, guru.gelar").
		Joins("JOIN users ON users.id = guru.user_id").
		Where("guru.id = ?", guruUUID).
		Scan(&guruInfo).Error; err == nil && strings.TrimSpace(guruInfo.NamaLengkap) != "" {
		nama := strings.TrimSpace(guruInfo.NamaLengkap)
		gelar := strings.TrimSpace(guruInfo.Gelar)
		gelar = strings.TrimPrefix(gelar, ",")
		gelar = strings.TrimSpace(gelar)
		if gelar != "" && !strings.Contains(strings.ToLower(nama), strings.ToLower(gelar)) {
			return fmt.Sprintf("%s, %s", nama, gelar)
		}
		return nama
	}
	return "Guru Pengampu"
}

// FormatDeadlineIndo memformat objek time.Time deadline ke dalam bahasa Indonesia (e.g. "15 November 2026, 23:59 WIB")
func (s *NotifikasiService) FormatDeadlineIndo(t time.Time) string {
	bulanIndo := [...]string{
		"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember",
	}
	m := int(t.Month())
	if m >= 1 && m <= 12 {
		return fmt.Sprintf("%02d %s %d, %02d:%02d WIB", t.Day(), bulanIndo[m], t.Year(), t.Hour(), t.Minute())
	}
	return t.Format("02/01/2006 15:04 WIB")
}

// Helper wrapper functions untuk pemanggilan langsung tingkat paket (package-level)
func KirimKeKelas(db *gorm.DB, kelasID uuid.UUID, judul, pesan, tipe, tautan string) (int, error) {
	return notifServiceInstance.KirimKeKelas(db, kelasID, judul, pesan, tipe, tautan)
}

func KirimKeUser(db *gorm.DB, userID uuid.UUID, judul, pesan, tipe, tautan string) error {
	return notifServiceInstance.KirimKeUser(db, userID, judul, pesan, tipe, tautan)
}

func FormatNamaGuruWithGelar(db *gorm.DB, guruUUID uuid.UUID) string {
	return notifServiceInstance.FormatNamaGuruWithGelar(db, guruUUID)
}

func FormatDeadlineIndo(t time.Time) string {
	return notifServiceInstance.FormatDeadlineIndo(t)
}
