// ======================
// TEMPLATE PESAN
// ======================
const messageTemplates = [
    ({ nama, jatuhTempo }) => `Halo ${nama},

*Pengingat Tagihan Sewa Kos*

Tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.
Mohon segera melakukan pembayaran agar tetap nyaman.

Terima kasih 🙏`,

    ({ nama, jatuhTempo }) => `Hai ${nama},

Kami mengingatkan bahwa tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Mohon bantuannya untuk segera melakukan pembayaran ya.`,

    ({ nama, jatuhTempo }) => `Yth. ${nama},

Dengan hormat, kami informasikan bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Terima kasih atas perhatian dan kerja samanya.`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Jangan lupa ya 😊  
Tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Silakan segera diselesaikan.`,

    ({ nama, jatuhTempo }) => `Hai ${nama},

Tagihan sewa kos Anda akan segera jatuh tempo (${jatuhTempo}).

Kami tunggu konfirmasi pembayarannya 🙏`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Ini adalah pengingat bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Mohon segera diproses.

Terima kasih.`,

    ({ nama, jatuhTempo }) => `Yth. ${nama},

Kami ingin mengingatkan kembali bahwa tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Mohon kesediaannya untuk menyelesaikan tepat waktu.`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Reminder 📌  
Tanggal jatuh tempo tagihan sewa kos Anda adalah ${jatuhTempo}.

Terima kasih atas perhatiannya.`,

    ({ nama, jatuhTempo }) => `Hai ${nama},

Sekadar mengingatkan bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Mohon segera ditindaklanjuti ya 🙏`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Tagihan sewa kos Anda mendekati jatuh tempo (${jatuhTempo}).

Silakan melakukan pembayaran sebelum tanggal tersebut.`,

    ({ nama, jatuhTempo }) => `Yth. ${nama},

Kami informasikan bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Terima kasih atas kerja samanya.`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Pengingat sederhana 😊  
Tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Mohon segera diselesaikan.`,

    ({ nama, jatuhTempo }) => `Hai ${nama},

Mohon diingat bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Terima kasih 🙏`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Ini adalah notifikasi bahwa tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Harap segera melakukan pembayaran.`,

    ({ nama, jatuhTempo }) => `Yth. ${nama},

Kami menginformasikan bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Mohon untuk dapat segera dipenuhi.`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Reminder penting 📌  
Tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Terima kasih atas perhatian Anda.`,

    ({ nama, jatuhTempo }) => `Hai ${nama},

Tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Kami harap dapat segera diproses 🙏`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Mohon perhatian bahwa tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Silakan segera melakukan pembayaran.`,

    ({ nama, jatuhTempo }) => `Yth. ${nama},

Pengingat bahwa tagihan sewa kos Anda akan jatuh tempo pada ${jatuhTempo}.

Terima kasih atas kerja sama Anda.`,

    ({ nama, jatuhTempo }) => `Halo ${nama},

Jangan sampai terlewat 😊  
Tagihan sewa kos Anda jatuh tempo pada ${jatuhTempo}.

Terima kasih 🙏`
]

// ======================
// RANDOM TANPA ULANG BERURUTAN
// ======================
let lastIndex = -1

export const getRandomTemplate = (data) => {
    let randomIndex

    do {
        randomIndex = Math.floor(Math.random() * messageTemplates.length)
    } while (randomIndex === lastIndex)

    lastIndex = randomIndex

    return messageTemplates[randomIndex](data)
}