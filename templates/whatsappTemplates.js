// ======================
// TEMPLATE PER KATEGORI
// ======================
const messageTemplates = {

        // ======================
        // BEFORE (H-3 s/d H-1)
        // ======================
        BEFORE: [
                ({ nama, jatuhTempo }) => `Halo ${nama} 😊

📌 Pengingat Tagihan Sewa Kos  
Tagihan Anda jatuh tempo pada ${jatuhTempo}.

Mohon dipersiapkan pembayarannya 🙏`,

                ({ nama, jatuhTempo }) => `Hai ${nama} 👋

⏰ Tagihan sewa kos Anda mendekati jatuh tempo (${jatuhTempo}).

Mohon diperhatikan ya 🙏`,

                ({ nama, jatuhTempo }) => `Halo ${nama} 😊

📌 Reminder  
Tanggal jatuh tempo tagihan sewa kos Anda adalah ${jatuhTempo}.`,

                ({ nama, jatuhTempo }) => `Hai ${nama} 👋

💰 Mohon diingat, tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.`,

                ({ nama, jatuhTempo }) => `Halo ${nama} 😊

⏰ Tagihan sewa kos Anda akan segera jatuh tempo (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama} 👋

📌 Sekadar pengingat, tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.`,

                ({ nama, jatuhTempo }) => `Halo ${nama} 😊

💰 Mohon dapat mempersiapkan pembayaran sebelum ${jatuhTempo}.`,

                ({ nama, jatuhTempo }) => `Hai ${nama} 👋

⏰ Tagihan sewa kos Anda mendekati tanggal jatuh tempo (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama} 😊

📌 Jangan sampai terlewat  
Jatuh tempo: ${jatuhTempo} 🙏`,

                ({ nama, jatuhTempo }) => `Hai ${nama} 👋

💰 Reminder sederhana, jatuh tempo tagihan Anda ${jatuhTempo}.`
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

Tagihan sewa kos Anda jatuh tempo hari ini.

Mohon segera diproses.`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Mohon segera menyelesaikan tagihan sewa kos Anda yang jatuh tempo hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Hari ini merupakan batas pembayaran tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda perlu diselesaikan hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Mohon perhatian, tagihan sewa kos Anda jatuh tempo hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Jatuh tempo tagihan sewa kos Anda adalah hari ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Mohon segera melakukan pembayaran untuk tagihan hari ini.`
],

        // ======================
        // AFTER (H+)
        // ======================
        AFTER: [
                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos dengan jatuh tempo ${jatuhTempo} belum kami terima.

Mohon segera diselesaikan.`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Tagihan sewa kos Anda (${jatuhTempo}) masih belum dibayarkan.

Mohon segera ditindaklanjuti.`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda masih tertunda sejak ${jatuhTempo}.

Mohon segera dilakukan pembayaran.`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Kami mencatat bahwa tagihan sewa kos Anda (${jatuhTempo}) belum terselesaikan.`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda masih belum kami terima hingga saat ini (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Tagihan sewa kos Anda masih dalam status belum dibayar (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda telah melewati jatuh tempo (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Kami masih menunggu pembayaran untuk tagihan sewa kos Anda (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Halo ${nama},

Mohon segera menyelesaikan tagihan sewa kos yang tertunda (${jatuhTempo}).`,

                ({ nama, jatuhTempo }) => `Hai ${nama},

Tagihan sewa kos Anda masih belum diselesaikan (${jatuhTempo}).`
]
}

// ======================
// TRACK LAST INDEX PER CATEGORY
// ======================
let lastIndexMap = {
        BEFORE: -1,
        TODAY: -1,
        AFTER: -1
}

// ======================
// GET RANDOM TEMPLATE
// ======================
export const getRandomTemplate = ({ nama, jatuhTempo, category }) => {

        // fallback kalau category undefined
        const selectedCategory = category || 'BEFORE'

        const templates = messageTemplates[selectedCategory]

        // safety fallback
        if (!templates || templates.length === 0) {
                console.warn(`Template untuk category ${selectedCategory} tidak ditemukan`)
                return `Halo ${nama}, tagihan Anda jatuh tempo pada ${jatuhTempo}.`
        }

        let randomIndex

        do {
                randomIndex = Math.floor(Math.random() * templates.length)
        } while (randomIndex === lastIndexMap[selectedCategory])

        lastIndexMap[selectedCategory] = randomIndex

        return templates[randomIndex]({ nama, jatuhTempo })
}