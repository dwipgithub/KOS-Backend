import express from 'express'

// ======================
// AUTH CONTROLLER
// ======================
import { createPengguna, changePassword, login, logout } from '../controllers/PenggunaController.js'
import { refreshToken } from '../controllers/RefreshToken.js'

// ======================
// MIDDLEWARE
// ======================
import { verifyToken } from '../middleware/VerifyToken.js'
import { authorize } from '../middleware/Authorize.js'
import { decodeRouteIdParam } from '../middleware/DecodeRouteIdParam.js'
import { decodeBodyFields } from '../middleware/DecodeBody.js'

// ======================
// CONTROLLERS
// ======================
import * as Properti from '../controllers/PropertiController.js'
import * as Kamar from '../controllers/KamarController.js'
import * as Penyewa from '../controllers/PenyewaController.js'
import * as Sewa from '../controllers/SewaController.js'
import * as Tagihan from '../controllers/TagihanController.js'
import * as Pembayaran from '../controllers/PembayaranController.js'
import * as Pengeluaran from '../controllers/PengeluaranController.js'
import * as Kas from '../controllers/KasController.js'
import * as MutasiKasOperasional from '../controllers/MutasiKasOperasionalController.js'

// laporan
import * as LaporanArusKas from '../controllers/LaporanArusKasController.js'
import * as LaporanLabaRugi from '../controllers/LaporanLabaRugiController.js'
import * as LaporanBukuBesar from '../controllers/LaporanBukuBesarController.js'
import * as LaporanPiutang from '../controllers/LaporanPiutangController.js'
import * as LaporanTagihan from '../controllers/LaporanTagihanController.js'
import * as LaporanMutasiKasOperasional from '../controllers/LaporanMutasiKasOperasional.js'

// master data
import { getProvinsi } from '../controllers/ProvinsiController.js'
import { getKabKota, showKabKota } from '../controllers/KabKotaController.js'
import { getKecamatan, showKecamatan } from '../controllers/KecamatanController.js'
import { getKelurahan, showKelurahan } from '../controllers/KelurahanController.js'
import { getJenisKelamin } from '../controllers/JenisKelaminController.js'
import { getStatusPernikahan } from '../controllers/StatusPernikahanController.js'
import { getPengenal } from '../controllers/Pengenal.js'
import { getStatusKamar } from '../controllers/StatusKamarController.js'
import { getProfesi, showProfesi, createProfesi } from '../controllers/ProfesiController.js'
import { getInstitusi, showInstitusi, createInstitusi } from '../controllers/InstitusiController.js'
import { getKategoriPengeluaran } from '../controllers/KategoriPengeluaranController.js'
import { createKeluar } from '../controllers/KeluarController.js'

// file private
import { servePrivateFile } from '../controllers/SecureFileController.js'

// upload
import { penyewaDokumenUpload } from '../middleware/uploadPenyewaDokumen.js'
import { pembayaranBuktiUpload } from '../middleware/uploadPembayaranBukti.js'
import { pengeluaranBuktiUpload } from '../middleware/uploadPengeluaranBukti.js'

const router = express.Router()

// ======================
// AUTH (PUBLIC)
// ======================
router.post('/login', login)
router.delete('/logout', logout)
router.get('/token', refreshToken)

// ======================
// WAJIB LOGIN SETELAH INI
// ======================
router.use(verifyToken)

// ======================
// ROLE HELPER
// ======================
const allowAll = authorize(['OWNER', 'ADMIN', 'OPERATOR'])
const allowReport = authorize(['OWNER', 'ADMIN'])

// ======================
// FILE PRIVATE
// ======================
router.get('/files/:folder/:filename', servePrivateFile)

// ======================
// MASTER DATA
// ======================
router.get('/provinsi', getProvinsi)

router.get('/kabkota', getKabKota)
router.get('/kabkota/:id', showKabKota)

router.get('/kecamatan', getKecamatan)
router.get('/kecamatan/:id', showKecamatan)

router.get('/kelurahan', getKelurahan)
router.get('/kelurahan/:id', showKelurahan)

router.get('/jenis-kelamin', getJenisKelamin)
router.get('/status-pernikahan', getStatusPernikahan)
router.get('/pengenal', getPengenal)

router.get('/kas', allowAll, Kas.getKas)

router.get('/status-kamar', allowAll, getStatusKamar)

// ======================
// PENGGUNA
// ======================
router.post('/pengguna', allowAll, createPengguna)
router.patch('/pengguna/change-password', allowAll, changePassword)

// ======================
// PROFESI & INSTITUSI
// ======================
router.get('/profesi', getProfesi)
router.get('/profesi/:id', showProfesi)
router.post('/profesi', allowAll, createProfesi)

router.get('/institusi', getInstitusi)
router.get('/institusi/:id', showInstitusi)
router.post('/institusi', allowAll, createInstitusi)

// ======================
// PROPERTI
// ======================
router.get('/properti', allowAll, Properti.getProperti)
router.get('/properti/:id', allowAll, decodeRouteIdParam('id'), Properti.showProperti)
router.post('/properti', allowAll, Properti.createProperti)
router.patch('/properti/:id', allowAll, decodeRouteIdParam('id'), Properti.updateProperti)

// ======================
// KAMAR
// ======================
router.get('/kamar', allowAll, Kamar.getKamar)
router.get('/kamar/:id', allowAll, decodeRouteIdParam('id'), Kamar.showKamar)
router.post('/kamar', allowAll, Kamar.createKamar)
router.patch('/kamar/:id', allowAll, decodeRouteIdParam('id'), Kamar.updateKamar)

// ======================
// PENYEWA
// ======================
router.get('/penyewa', allowAll, Penyewa.getPenyewa)
router.get('/penyewa/:id', allowAll, decodeRouteIdParam('id'), Penyewa.showPenyewa)
router.post('/penyewa', allowAll, penyewaDokumenUpload({ requireFile: true }), Penyewa.createPenyewa)
router.patch('/penyewa/:id', allowAll, decodeRouteIdParam('id'), penyewaDokumenUpload(), Penyewa.updatePenyewa)

// ======================
// SEWA
// ======================
router.get('/sewa', allowAll, Sewa.getSewa)
router.get('/sewa/:id', allowAll, Sewa.showSewa)
router.post('/sewa', allowAll, decodeBodyFields(["idKamar"]), Sewa.createSewa)

// ======================
// TAGIHAN
// ======================
router.get('/tagihan', allowAll, Tagihan.getTagihan)
router.get('/tagihan/:id', allowAll, Tagihan.showTagihan)
router.post('/tagihan', allowAll, Tagihan.createTagihan)

// ======================
// PEMBAYARAN
// ======================
router.get('/pembayaran', allowAll, Pembayaran.getPembayaran)
router.get('/pembayaran/:id', allowAll, Pembayaran.showPembayaran)
router.post('/pembayaran', allowAll, pembayaranBuktiUpload, Pembayaran.createPembayaran)

// ======================
// KELUAR
// ======================
router.post('/keluar', allowAll, createKeluar)

// ======================
// PENGELUARAN
// ======================
router.get('/kategori-pengeluaran', allowAll, getKategoriPengeluaran)

router.get('/pengeluaran', allowAll, Pengeluaran.getPengeluaran)
router.get('/pengeluaran/:id', allowAll, Pengeluaran.showPengeluaran)
router.post('/pengeluaran', allowAll, pengeluaranBuktiUpload, Pengeluaran.createPengeluaran)

// ======================
// KAS
// ======================
router.get('/kas', allowAll, Kas.getKas)

// ======================
// MUTASI KAS
// ======================
router.get('/mutasi-kas', allowAll, MutasiKasOperasional.getMutasiKas)
router.get('/mutasi-kas/:id', allowAll, decodeRouteIdParam('id'), MutasiKasOperasional.showMutasiKas)
router.post('/mutasi-kas', allowAll, MutasiKasOperasional.createMutasiKas)
router.patch('/mutasi-kas/:id', allowAll, decodeRouteIdParam('id'), MutasiKasOperasional.updateMutasiKas)

// ======================
// LAPORAN (RESTRICTED)
// ======================
router.get('/laporan/arus-kas', allowReport, LaporanArusKas.getLaporanArusKas)
router.get('/laporan/arus-kas/export/pdf', allowReport, LaporanArusKas.exportPdfArusKas)

router.get('/laporan/laba-rugi', allowReport, LaporanLabaRugi.getLaporanLabaRugi)
router.get('/laporan/laba-rugi/export/pdf', allowReport, LaporanLabaRugi.exportPdfLabaRugi)

router.get('/laporan/buku-besar', allowReport, LaporanBukuBesar.getLaporanBukuBesar)
router.get('/laporan/buku-besar/export/pdf', allowReport, LaporanBukuBesar.exportPdfBukuBesar)

router.get('/laporan/piutang', allowReport, LaporanPiutang.getLaporanPiutang)
router.get('/laporan/piutang/export/pdf', allowReport, LaporanPiutang.exportPdfPiutang)

router.get('/laporan/tagihan', allowReport, LaporanTagihan.getLaporanTagihan)

// ======================
// LAPORAN (UNRESTRICTED)
// ======================
router.get('/laporan/mutasi-kas-operasional', allowAll, LaporanMutasiKasOperasional.getLaporanMutasiKasOperasional)
router.get('/laporan/mutasi-kas-operasional/export/pdf', allowAll, LaporanMutasiKasOperasional.exportPdfMutasiKasOperasional)
export default router