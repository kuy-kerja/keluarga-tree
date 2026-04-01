package models

type Anggota struct {
	ID            int         `json:"id"`
	Nama          string      `json:"nama"`
	NamaPanggilan *string     `json:"nama_panggilan"`
	JenisKelamin  string      `json:"jenis_kelamin"`
	TanggalLahir  *string     `json:"tanggal_lahir"`
	TanggalWafat  *string     `json:"tanggal_wafat"`
	TempatLahir   *string     `json:"tempat_lahir"`
	Pekerjaan     *string     `json:"pekerjaan"`
	Foto          *string     `json:"foto"`
	IDAyah        *int        `json:"id_ayah"`
	IDIbu         *int        `json:"id_ibu"`
	IDPasangan    *int        `json:"id_pasangan"`
	TanggalNikah  *string     `json:"tanggal_nikah"`
	CreatedAt     string      `json:"created_at"`
	Anak          []Anggota   `json:"anak,omitempty"`
}
