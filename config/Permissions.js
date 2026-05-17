export const rolePermissions = {
    OWNER: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        change_password: true,
        tambah_pengguna: true,
        kas_operasional: true,
        laporan: {
            arus_kas: true,
            laba_rugi: true,
            buku_besar: true,
            piutang: true,
            mutasi_kas_operasional: true,
        }
    },
    ADMIN: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        change_password: true,
        tambah_pengguna: true,
        kas_operasional: true,
        laporan: {
            arus_kas: true,
            laba_rugi: true,
            buku_besar: true,
            piutang: true,
            mutasi_kas_operasional: true,
        }
    },
    OPERATOR: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        change_password: true,
        tambah_pengguna: true,
        kas_operasional: true,
        laporan: {
            arus_kas: false,
            laba_rugi: false,
            buku_besar: false,
            piutang: false,
            mutasi_kas_operasional: true,
        }
    }
}