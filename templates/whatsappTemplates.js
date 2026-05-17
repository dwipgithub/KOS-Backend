// ======================
// TEMPLATE PER KATEGORI
// ======================
const messageTemplates = {

        // ======================
        // BEFORE (H-3 s/d H-1)
        // ======================
        BEFORE: [

                ({ nama, jatuhTempo, dayDiff }) => `Halo ${nama} 😊

📌 Pengingat Tagihan Sewa Kos

Tagihan sewa kos Anda akan jatuh tempo ${dayDiff} hari lagi, yaitu pada ${jatuhTempo}.

Mohon dipersiapkan pembayarannya 🙏`,

                ({ nama, jatuhTempo, dayDiff }) => `Hai ${nama} 👋

⏰ Tagihan sewa kos Anda akan jatuh tempo dalam ${dayDiff} hari (${jatuhTempo}).

Mohon diperhatikan ya 🙏`,

                ({ nama, jatuhTempo, dayDiff }) => `Halo ${nama} 😊

📌 Reminder

${dayDiff} hari lagi merupakan tanggal jatuh tempo tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo, dayDiff }) => `Hai ${nama} 👋

💰 Mohon diingat, tagihan sewa kos Anda akan jatuh tempo ${dayDiff} hari lagi (${jatuhTempo}).`,

                ({ nama, jatuhTempo, dayDiff }) => `Halo ${nama} 😊

⏳ Sisa ${dayDiff} hari lagi menuju jatuh tempo tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo, dayDiff }) => `Hai ${nama} 👋

📌 Jangan lupa, tagihan sewa kos Anda akan jatuh tempo ${dayDiff} hari lagi.`,

                ({ nama, jatuhTempo, dayDiff }) => `Halo ${nama} 😊

💡 Pengingat pembayaran sewa kos:
Jatuh tempo pada ${jatuhTempo} (${dayDiff} hari lagi).`,

                ({ nama, jatuhTempo, dayDiff }) => `Hai ${nama} 👋

📅 Tagihan sewa kos Anda akan segera jatuh tempo dalam ${dayDiff} hari (${jatuhTempo}).`
        ],

        // ======================
        // TODAY (H)
        // ======================
        TODAY: [

                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda jatuh tempo hari ini (${jatuhTempo}).

Mohon segera diselesaikan.`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Hari ini adalah tanggal jatuh tempo tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Ini adalah pengingat bahwa tagihan sewa kos Anda jatuh tempo hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Mohon segera melakukan pembayaran tagihan sewa kos hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

📌 Hari ini merupakan batas pembayaran tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

⏰ Tagihan sewa kos Anda jatuh tempo hari ini.
Mohon segera diproses.`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

💰 Mohon perhatian, pembayaran sewa kos Anda jatuh tempo hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

📅 Jatuh tempo tagihan sewa kos Anda adalah hari ini (${jatuhTempo}).`
        ],

        // ======================
        // AFTER (H+1 s/d H+3)
        // ======================
        AFTER: [

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Tagihan sewa kos Anda telah melewati jatuh tempo selama ${lateDays} hari (${jatuhTempo}).

Mohon segera diselesaikan.`
                },

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

Tagihan sewa kos Anda terlambat ${lateDays} hari dari tanggal jatuh tempo (${jatuhTempo}).

Mohon segera ditindaklanjuti.`
                },

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Tagihan sewa kos Anda masih belum dibayarkan sejak ${jatuhTempo} (${lateDays} hari yang lalu).`
                },

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

📌 Pembayaran sewa kos Anda telah melewati jatuh tempo selama ${lateDays} hari.`

                },

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

⏰ Kami masih menunggu pembayaran tagihan sewa kos Anda yang jatuh tempo pada ${jatuhTempo} (${lateDays} hari yang lalu).`
                },

                ({ nama, jatuhTempo, dayDiff }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

💰 Tagihan sewa kos Anda belum diselesaikan hingga ${lateDays} hari setelah jatuh tempo (${jatuhTempo}).`
                }
        ],

        // ======================
        // AFTER >= H+4
        // ======================
        // ======================
        // AFTER >= H+4
        // ======================
        AFTER_OVERDUE: [

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Tagihan sewa kos Anda telah melewati jatuh tempo selama ${lateDays} hari (${jatuhTempo}).

Mohon segera mengosongkan / meninggalkan tempat kos sesuai ketentuan yang berlaku.

Silahkan menghubungi pemilik melalui WhatsApp di ${ownerPhone}.`
                },

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

Pembayaran sewa kos Anda belum diselesaikan hingga ${lateDays} hari setelah jatuh tempo (${jatuhTempo}).

Mohon segera meninggalkan tempat kos.

Untuk konfirmasi atau informasi lebih lanjut silahkan hubungi pemilik di ${ownerPhone}.`
                },

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Karena tagihan sewa kos belum diselesaikan hingga ${lateDays} hari setelah jatuh tempo (${jatuhTempo}), maka Anda dimohon segera meninggalkan tempat kos.

Silahkan menghubungi pemilik melalui WhatsApp ${ownerPhone}.`
                },

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

Tagihan sewa kos Anda telah menunggak selama ${lateDays} hari sejak tanggal jatuh tempo (${jatuhTempo}).

Sesuai ketentuan yang berlaku, Anda dimohon segera meninggalkan tempat kos.

Untuk koordinasi lebih lanjut silahkan hubungi pemilik di ${ownerPhone}.`
                },

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Kami belum menerima pembayaran tagihan sewa kos Anda hingga ${lateDays} hari setelah jatuh tempo (${jatuhTempo}).

Mohon segera mengosongkan kamar kos yang ditempati.

Silahkan menghubungi pemilik melalui nomor WhatsApp ${ownerPhone}.`
                },

                ({ nama, jatuhTempo, dayDiff, ownerPhone }) => {

                        const lateDays = Math.abs(dayDiff)

                        return `Hai ${nama},

📌 Tagihan sewa kos Anda telah melewati batas toleransi keterlambatan pembayaran (${lateDays} hari).

Mohon segera meninggalkan tempat kos.

Jika terdapat kendala, silahkan hubungi pemilik di ${ownerPhone}.`
                }
        ]
}

// ======================
// TRACK LAST INDEX PER CATEGORY
// ======================
let lastIndexMap = {
        BEFORE: -1,
        TODAY: -1,
        AFTER: -1,
        AFTER_OVERDUE: -1
}

// ======================
// GET RANDOM TEMPLATE
// ======================
export const getRandomTemplate = ({
        nama,
        jatuhTempo,
        category,
        dayDiff,
        ownerPhone
}) => {

        let selectedCategory = category || 'BEFORE'

        // ======================
        // OVERDUE >= H+4
        // ======================
        if (
                selectedCategory === 'AFTER' &&
                Math.abs(dayDiff) >= 4
        ) {
                selectedCategory = 'AFTER_OVERDUE'
        }

        const templates = messageTemplates[selectedCategory]

        // ======================
        // SAFETY FALLBACK
        // ======================
        if (!templates || templates.length === 0) {

                if (selectedCategory === 'AFTER_OVERDUE') {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Tagihan Anda telah melewati jatuh tempo ${lateDays} hari (${jatuhTempo}).

Mohon segera meninggalkan tempat kos.`
                }

                if (selectedCategory === 'AFTER') {

                        const lateDays = Math.abs(dayDiff)

                        return `Halo ${nama},

Tagihan Anda telah melewati jatuh tempo ${lateDays} hari (${jatuhTempo}).`
                }

                if (selectedCategory === 'BEFORE') {

                        return `Halo ${nama},

Tagihan Anda akan jatuh tempo ${dayDiff} hari lagi (${jatuhTempo}).`
                }

                return `Halo ${nama},

Tagihan Anda jatuh tempo hari ini (${jatuhTempo}).`
        }

        let randomIndex

        do {
                randomIndex = Math.floor(Math.random() * templates.length)
        } while (
                templates.length > 1 &&
                randomIndex === lastIndexMap[selectedCategory]
        )

        lastIndexMap[selectedCategory] = randomIndex

        return templates[randomIndex]({
                nama,
                jatuhTempo,
                dayDiff,
                ownerPhone
        })
}