import express from 'express'

import { login, logout } from '../controllers/PenggunaController.js'
import { refreshToken } from '../controllers/RefreshToken.js'
import { verifyToken } from '../middleware/VerifyToken.js'
import { decodeRouteIdParam } from '../middleware/DecodeRouteIdParam.js'
import { decodeBodyFields } from '../middleware/DecodeBody.js'
import { getProperti, updateProperti, showProperti, createProperti } from '../controllers/PropertiController.js'
import { getKamar, showKamar, createKamar, updateKamar } from '../controllers/KamarController.js'
import { getPenyewa, showPenyewa, createPenyewa, updatePenyewa } from '../controllers/PenyewaController.js'
import { penyewaDokumenUpload } from '../middleware/uploadPenyewaDokumen.js'
import { getSewa, showSewa, createSewa } from '../controllers/SewaController.js'
import { getTagihan, showTagihan, createTagihan } from '../controllers/TagihanController.js'
import { createPembayaran, getPembayaran, showPembayaran } from '../controllers/PembayaranController.js'
import { pembayaranBuktiUpload } from '../middleware/uploadPembayaranBukti.js'
import { getProvinsi } from '../controllers/ProvinsiController.js'
import { getKabKota, showKabKota } from '../controllers/KabKotaController.js'
import { getKecamatan, showKecamatan } from '../controllers/KecamatanController.js'
import { getKelurahan, showKelurahan } from '../controllers/KelurahanController.js'
import { getStatusKamar } from '../controllers/StatusKamarController.js'
import { getPengenal } from '../controllers/Pengenal.js'
import { getStatusPernikahan } from '../controllers/StatusPernikahanController.js'
import { getJenisKelamin } from '../controllers/JenisKelaminController.js'
import { servePrivateFile } from '../controllers/SecureFileController.js'
import { getProfesi, showProfesi, createProfesi } from '../controllers/ProfesiController.js'
import { getInstitusi, showInstitusi, createInstitusi } from '../controllers/InstitusiController.js'
import { createKeluar } from '../controllers/KeluarController.js'
import { createPengeluaran, getPengeluaran, showPengeluaran } from '../controllers/PengeluaranController.js'
import { getKategoriPengeluaran } from '../controllers/KategoriPengeluaranController.js'
import { pengeluaranBuktiUpload } from '../middleware/uploadPengeluaranBukti.js'
import { getLaporanArusKas, exportPdfArusKas } from '../controllers/LaporanArusKasController.js'
import { getLaporanLabaRugi, exportPdfLabaRugi } from '../controllers/LaporanLabaRugiController.js'
import { getLaporanBukuBesar, exportPdfBukuBesar } from '../controllers/LaporanBukuBesarController.js'
import { getLaporanTagihan } from '../controllers/LaporanTagihanController.js'
import { getLaporanPiutang, exportPdfPiutang } from '../controllers/LaporanPiutangController.js'

const router = express.Router()

// Authentikasi
router.post('/api/v1/login', login)
router.delete('/api/v1/logout', logout)
router.get('/api/v1/token', refreshToken)

// File privat (dokumen penyewa, bukti pembayaran) — wajib JWT, bukan static publik
router.get('/api/v1/files/:folder/:filename', verifyToken, servePrivateFile)

// Provinsi
router.get('/api/v1/provinsi', verifyToken, getProvinsi)

// KabKota
router.get('/api/v1/kabkota', verifyToken, getKabKota)
router.get('/api/v1/kabkota/:id', verifyToken, showKabKota)

// Kecamatan
router.get('/api/v1/kecamatan', verifyToken, getKecamatan)
router.get('/api/v1/kecamatan/:id', verifyToken, showKecamatan)

// Kelurahan
router.get('/api/v1/kelurahan', verifyToken, getKelurahan)
router.get('/api/v1/kelurahan/:id', verifyToken, showKelurahan)

// Jenis Kelamin
router.get('/api/v1/jenis-kelamin', verifyToken, getJenisKelamin)

// Profesi
router.get('/api/v1/profesi', verifyToken, getProfesi)
router.get('/api/v1/profesi/:id', verifyToken, showProfesi)
router.post('/api/v1/profesi', verifyToken, createProfesi)

// Institusi
router.get('/api/v1/profesi', verifyToken, getInstitusi)
router.get('/api/v1/profesi/:id', verifyToken, showInstitusi)
router.post('/api/v1/profesi', verifyToken, createInstitusi)

// Status Pernikahan
router.get('/api/v1/status-pernikahan', verifyToken, getStatusPernikahan)

// Pengenal
router.get('/api/v1/pengenal', verifyToken, getPengenal)

// Properti
router.get('/api/v1/properti', verifyToken, getProperti)
router.get('/api/v1/properti/:id', verifyToken, decodeRouteIdParam('id'), showProperti)
router.post('/api/v1/properti', verifyToken, createProperti)
router.patch('/api/v1/properti/:id', verifyToken, decodeRouteIdParam('id'), updateProperti)

// Kamar
router.get('/api/v1/kamar', verifyToken, getKamar)
router.get('/api/v1/kamar/:id', verifyToken, decodeRouteIdParam('id'), showKamar)
router.post('/api/v1/kamar', verifyToken, createKamar)
router.patch('/api/v1/kamar/:id', verifyToken, decodeRouteIdParam('id'), updateKamar)

// Status Kamar
router.get('/api/v1/status-kamar', verifyToken, getStatusKamar)

// Penyewa
router.get('/api/v1/penyewa', verifyToken, getPenyewa)
router.get('/api/v1/penyewa/:id', verifyToken, decodeRouteIdParam('id'), showPenyewa)
router.post('/api/v1/penyewa', verifyToken, penyewaDokumenUpload({ requireFile: true }), createPenyewa)
router.patch('/api/v1/penyewa/:id', verifyToken, decodeRouteIdParam('id'), penyewaDokumenUpload(), updatePenyewa)

// Sewa
router.get('/api/v1/sewa', verifyToken, getSewa)
router.get('/api/v1/sewa/:id', verifyToken, showSewa)
router.post('/api/v1/sewa', verifyToken, decodeBodyFields(["idKamar"]), createSewa)

// Tagihan
router.get('/api/v1/tagihan', verifyToken, getTagihan)
router.get('/api/v1/tagihan/:id', verifyToken, showTagihan)
router.post('/api/v1/tagihan', verifyToken, createTagihan)

// Pembayaran
router.get('/api/v1/pembayaran', verifyToken, getPembayaran)
router.get('/api/v1/pembayaran/:id', verifyToken, showPembayaran)
router.post('/api/v1/pembayaran', verifyToken, pembayaranBuktiUpload, createPembayaran)

// Keluar
router.post('/api/v1/keluar', verifyToken, createKeluar)

// Kategori Pengeluaran
router.get('/api/v1/kategori-pengeluaran', verifyToken, getKategoriPengeluaran)

// Pengeluaran
router.get('/api/v1/pengeluaran', verifyToken, getPengeluaran)
router.get('/api/v1/pengeluaran/:id', verifyToken, showPengeluaran)
router.post('/api/v1/pengeluaran', verifyToken, pengeluaranBuktiUpload, createPengeluaran)

// Laporan
router.get('/api/v1/laporan/arus-kas/export/pdf', verifyToken, exportPdfArusKas)
router.get('/api/v1/laporan/arus-kas', verifyToken, getLaporanArusKas)
router.get('/api/v1/laporan/laba-rugi/export/pdf', verifyToken, exportPdfLabaRugi)
router.get('/api/v1/laporan/laba-rugi', verifyToken, getLaporanLabaRugi)
router.get('/api/v1/laporan/buku-besar/export/pdf', verifyToken, exportPdfBukuBesar)
router.get('/api/v1/laporan/buku-besar', verifyToken, getLaporanBukuBesar)
router.get('/api/v1/laporan/tagihan', verifyToken, getLaporanTagihan)
router.get('/api/v1/laporan/piutang', verifyToken, getLaporanPiutang)
router.get('/api/v1/laporan/piutang/export/pdf', verifyToken, exportPdfPiutang)

export default router