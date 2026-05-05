export const rolePermissions = {
    OWNER: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        laporan: {
            arus_kas: true,
            laba_rugi: true,
            buku_besar: true,
            piutang: true
        }
    },
    ADMIN: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        laporan: {
            arus_kas: true,
            laba_rugi: true,
            buku_besar: true,
            piutang: true
        }
    },
    OPERATOR: {
        properti: true,
        kamar: true,
        penyewa: true,
        pengeluaran: true,
        laporan: {
            arus_kas: false,
            laba_rugi: false,
            buku_besar: false,
            piutang: false
        }
    }
}