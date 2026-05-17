import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logoPath = path.resolve(__dirname, '../assets/logo.png')
const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' })
const logoSrc = `data:image/png;base64,${logoBase64}`

export const generatePdfArusKas = async (data, filters = {}) => {
    let browser = null

    try {
        console.log('Starting Puppeteer...')
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }

        // Try to use existing Chrome installation on macOS
        if (process.platform === 'darwin') {
            const chromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ]

            for (const path of chromePaths) {
                if (fs.existsSync(path)) {
                    console.log('Found Chrome at:', path)
                    launchOptions.executablePath = path
                    break
                }
            }
        }

        browser = await puppeteer.launch(launchOptions)
        console.log('Puppeteer launched successfully')

        const page = await browser.newPage()
        console.log('New page created')

        // Generate HTML content
        console.log('Generating HTML...')
        const htmlContent = generateArusKasHTML(data, filters)
        console.log('HTML generated, length:', htmlContent.length)

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
        console.log('Content set to page')

        // Generate PDF
        console.log('Generating PDF...')
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '5mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm'
            },
            printBackground: true
        })

        // console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        // // SIMPAN SEMENTARA
        // const tmpDir = path.resolve(__dirname, '../tmp');

        // // pastikan folder ada
        // if (!fs.existsSync(tmpDir)) {
        //     fs.mkdirSync(tmpDir, { recursive: true });
        // }

        // const fileName = `laporan-arus-kas-${Date.now()}.pdf`;
        // const outputPath = path.join(tmpDir, fileName);

        // await fs.promises.writeFile(outputPath, pdfBuffer);

        // console.log('PDF disimpan sementara di:', outputPath);

        return pdfBuffer

    } catch (error) {
        console.error('Error in generatePdfArusKas:', error.message)
        console.error('Error stack:', error.stack)
        throw error
    } finally {
        if (browser) {
            console.log('Closing browser...')
            try {
                await browser.close()
                console.log('Browser closed')
            } catch (closeError) {
                console.error('Error closing browser:', closeError.message)
            }
        }
    }
}

const getPuppeteerLaunchOptions = () => {
    const launchOptions = {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ]
    }

    if (process.platform === 'darwin') {
        const chromePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ]

        for (const chromePath of chromePaths) {
            if (fs.existsSync(chromePath)) {
                launchOptions.executablePath = chromePath
                break
            }
        }
    }

    return launchOptions
}

const renderPdfFromHtml = async (htmlContent, logLabel = 'PDF') => {
    let browser = null

    try {
        browser = await puppeteer.launch(getPuppeteerLaunchOptions())
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '5mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm'
            },
            printBackground: true
        })

        console.log(`${logLabel} generated successfully, size:`, pdfBuffer.length, 'bytes')
        return pdfBuffer
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

const generateArusKasHTML = (data, filters) => {
    const currentDate = new Date().toLocaleDateString('id-ID')

    let masuk = 0
    let keluar = 0

    const dataRows = data.map(item => {
        const jumlah = parseFloat(item.totalBayar || 0)
        if (item.tipe === 'Uang Masuk') {
            masuk += jumlah
        } else {
            keluar += jumlah
        }

        // Tentukan nama transaksi
        let namaTransaksi = item.nama || '-'
        if (item.tipe === 'Uang Masuk' && item.idTagihan) {
            namaTransaksi = `Pembayaran Tagihan ${item.idTagihan}`
        }

        return `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.tanggalBayar).toLocaleDateString('id-ID')}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${namaTransaksi}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.properti?.nama || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.kamar?.nama || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.penyewa?.nama || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.tipe}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.deskripsiTagihan?.nama || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(jumlah)}</td>
            </tr>
        `
    }).join('')

    const saldo = masuk - keluar

    let filterText = ''
    if (filters.startDate && filters.endDate) {
        filterText = `${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    } else if (filters.startDate) {
        filterText = `Dari ${new Date(filters.startDate).toLocaleDateString('id-ID')}`
    } else if (filters.endDate) {
        filterText = `Hingga ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }

    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Laporan Arus Kas</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #333;
                }

                .header {
                    display: flex;
                    align-items: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    gap: 6px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .logo {
                    width: 100px;
                    height: auto;
                    object-fit: contain;
                    display: block;
                }

                .header-center {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    margin-left: -3px;
                }

                .header-center h1 {
                    font-size: 18px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    line-height: 1.1;
                }

                .header-center p {
                    font-size: 10px;
                    color: #666;
                    margin: 2px 0;
                    line-height: 1.3;
                }

                .header-right {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    text-align: right;
                }

                .header-right h2 {
                    font-size: 20px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .header-right p {
                    font-size: 12px;
                    color: #666;
                }
                
                .header h1 {
                    font-size: 18px;
                    margin-bottom: 3px;
                    color: #2c3e50;
                }
                
                .header p {
                    font-size: 12px;
                    color: #666;
                }

                .report-title {
                    text-align: center;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                .report-title h1 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    font-weight: bold;
                }

                .report-title p {
                    font-size: 10px;
                    color: #666;
                }

                .periode-text {
                    margin-bottom: 5px;
                    font-size: 11px;
                    color: #555;
                }
                
                .filter-info {
                    margin-bottom: 12px;
                    padding: 8px;
                    background-color: #ecf0f1;
                    border-left: 4px solid #3498db;
                    font-size: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                
                thead {
                    background-color: #f1f5f9;
                    color: #334155;
                }

                thead th {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 10px;
                }
                
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                
                tbody tr:hover {
                    background-color: #ecf0f1;
                }
                
                .summary {
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    padding: 12px;
                    margin-top: 15px;
                    border-radius: 4px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 11px;
                }
                
                .summary-row.total {
                    border-top: 2px solid #34495e;
                    padding-top: 8px;
                    margin-top: 8px;
                    font-size: 12px;
                    color: #2c3e50;
                }
                
                .masuk {
                    color: #27ae60;
                }
                
                .keluar {
                    color: #e74c3c;
                }
                
                .saldo {
                    color: #2c3e50;
                }
                
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                }
                
                .signature {
                    margin-top: 30px;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .signature-box {
                    text-align: center;
                    width: 180px;
                }
                
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 35px;
                    margin-bottom: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-left">
                        <img src="${logoSrc}" alt="Logo" class="logo" />
                    </div>

                    <div class="header-center">
                        <h1>${filters.namaProperti}</h1>
                        <p>${filters.alamatProperti}</p>
                        <p>${filters.noTelpProperti}</p>
                    </div>
                </div>

                <div class="report-title">
                    <h1>LAPORAN ARUS KAS</h1>
                    <p>Tanggal Cetak: ${currentDate}</p>
                </div>

                <p class="periode-text">
                    Periode: ${filterText || 'Semua Data'}
                </p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Nama</th>
                            <th>Properti</th>
                            <th>Nama Kamar</th>
                            <th>Nama Penyewa</th>
                            <th>Tipe</th>
                            <th>Keterangan</th>
                            <th style="text-align: right;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataRows}
                    </tbody>
                </table>
                
                <div class="summary">
                    <div class="summary-row masuk">
                        <span>Total Uang Masuk:</span>
                        <span>${formatCurrency(masuk)}</span>
                    </div>
                    <div class="summary-row keluar">
                        <span>Total Uang Keluar:</span>
                        <span>${formatCurrency(keluar)}</span>
                    </div>
                    <div class="summary-row total saldo">
                        <span>Saldo Akhir:</span>
                        <span>${formatCurrency(saldo)}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Dokumen ini dicetak dari sistem Manajemen Kos</p>
                </div>
            </div>
        </body>
        </html>
    `
}

export const generatePdfLabaRugi = async (data, filters = {}) => {
    let browser = null

    try {
        console.log('Starting Puppeteer for Laba Rugi...')
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }

        if (process.platform === 'darwin') {
            const chromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ]

            for (const path of chromePaths) {
                if (fs.existsSync(path)) {
                    console.log('Found Chrome at:', path)
                    launchOptions.executablePath = path
                    break
                }
            }
        }

        browser = await puppeteer.launch(launchOptions)
        console.log('Puppeteer launched successfully')

        const page = await browser.newPage()
        console.log('New page created')

        const htmlContent = generateLabaRugiHTML(data, filters)
        console.log('HTML generated, length:', htmlContent.length)

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
        console.log('Content set to page')

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '5mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm'
            },
            printBackground: true
        })
        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        return pdfBuffer

    } catch (error) {
        console.error('Error in generatePdfLabaRugi:', error.message)
        console.error('Error stack:', error.stack)
        throw error
    } finally {
        if (browser) {
            console.log('Closing browser...')
            try {
                await browser.close()
                console.log('Browser closed')
            } catch (closeError) {
                console.error('Error closing browser:', closeError.message)
            }
        }
    }
}

const generateLabaRugiHTML = (data, filters) => {
    const currentDate = new Date().toLocaleDateString('id-ID')

    const pendapatan = data.pendapatan?.rincian || []
    const pengeluaran = data.pengeluaran?.rincian || []
    const totalPendapatan = data.pendapatan?.total || 0
    const totalPengeluaran = data.pengeluaran?.total || 0
    const labaBersih = data.labaBersih || 0

    const pendapatanRows = pendapatan.map(item => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.nama || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.total)}</td>
        </tr>
    `).join('')

    const pengeluaranRows = pengeluaran.map(item => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.nama || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.total)}</td>
        </tr>
    `).join('')

    let filterText = ''
    if (filters.startDate && filters.endDate) {
        filterText = `${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    } else if (filters.startDate) {
        filterText = `Dari ${new Date(filters.startDate).toLocaleDateString('id-ID')}`
    } else if (filters.endDate) {
        filterText = `Hingga ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }

    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Laba Rugi</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #333;
                }
                
                 .header {
                    display: flex;
                    align-items: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    gap: 6px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .logo {
                    width: 100px;
                    height: auto;
                    object-fit: contain;
                    display: block;
                }

                .header-center {
                    flex: 1;
                }

                .header-center h1 {
                    font-size: 20px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .header-center p {
                    font-size: 12px;
                    color: #666;
                    margin: 2px 0;
                }

                .report-title {
                    text-align: center;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                .report-title h1 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    font-weight: bold;
                }

                .report-title p {
                    font-size: 10px;
                    color: #666;
                }

                .periode-text {
                    margin-bottom: 5px;
                    font-size: 11px;
                    color: #555;
                }

                .header-right {
                    text-align: right;
                }

                .header-right h2 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .header-right p {
                    font-size: 10px;
                    color: #666;
                }
                
                .header h1 {
                    font-size: 18px;
                    margin-bottom: 3px;
                    color: #2c3e50;
                }
                
                .header p {
                    font-size: 10px;
                    color: #666;
                }
                
                .filter-info {
                    margin-bottom: 12px;
                    padding: 8px;
                    background-color: #ecf0f1;
                    border-left: 4px solid #3498db;
                    font-size: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                
                thead {
                    background-color: #f1f5f9;
                    color: #334155;
                }

                thead th {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 10px;
                }
                
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                
                .profit {
                    color: #27ae60;
                }
                
                .loss {
                    color: #e74c3c;
                }
                
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-left">
                        <img src="${logoSrc}" alt="Logo" class="logo" />
                    </div>

                    <div class="header-center">
                        <h1>${filters.namaProperti}</h1>
                        <p>${filters.alamatProperti}</p>
                        <p>${filters.noTelpProperti}</p>
                    </div>
                </div>
                
                <div class="report-title">
                    <h1>LAPORAN LABA RUGI</h1>
                    <p>Tanggal Cetak: ${currentDate}</p>
                </div>

                <p class="periode-text">
                    Periode: ${filterText || 'Semua Data'}
                </p>

                <table style="table-layout: fixed;">
                    <colgroup>
                        <col style="width: 70%;" />
                        <col style="width: 30%;" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Keterangan</th>
                            <th style="text-align: right;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendapatanRows}
                        <tr style="background-color: #ecf0f1; font-weight: bold;">
                            <td style="border: 1px solid #ddd; padding: 8px;">Total Pendapatan</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalPendapatan)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3 style="margin-top: 15px; margin-bottom: 10px; color: #2c3e50;">PENGELUARAN</h3>
                <table style="table-layout: fixed;">
                    <colgroup>
                        <col style="width: 70%;" />
                        <col style="width: 30%;" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Keterangan</th>
                            <th style="text-align: right;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pengeluaranRows}
                        <tr style="background-color: #ecf0f1; font-weight: bold;">
                            <td style="border: 1px solid #ddd; padding: 8px;">Total Pengeluaran</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalPengeluaran)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3 style="margin-top: 15px; margin-bottom: 10px; color: #2c3e50;">LABA BERSIH</h3>
                <table style="table-layout: fixed;">
                    <colgroup>
                        <col style="width: 70%;" />
                        <col style="width: 30%;" />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Total Pendapatan</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalPendapatan)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Total Pengeluaran</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">(${formatCurrency(totalPengeluaran)})</td>
                        </tr>
                        <tr style="background-color: #ecf0f1; font-weight: bold; border-top: 2px solid #34495e;">
                            <td style="border: 1px solid #ddd; padding: 8px;">${labaBersih > 0 ? 'Laba Bersih' : labaBersih < 0 ? 'Rugi Bersih' : 'Saldo Netral'}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; ${labaBersih > 0 ? 'color: #27ae60;' : labaBersih < 0 ? 'color: #e74c3c;' : 'color: #2c3e50;'}">${formatCurrency(labaBersih)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Dokumen ini dicetak dari sistem Manajemen Kos</p>
                </div>
            </div>
        </body>
        </html>
    `
}

export const generatePdfBukuBesar = async (data, filters = {}) => {
    let browser = null

    try {
        console.log('Starting Puppeteer for Buku Besar...')
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }

        if (process.platform === 'darwin') {
            const chromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ]

            for (const path of chromePaths) {
                if (fs.existsSync(path)) {
                    console.log('Found Chrome at:', path)
                    launchOptions.executablePath = path
                    break
                }
            }
        }

        browser = await puppeteer.launch(launchOptions)
        console.log('Puppeteer launched successfully')

        const page = await browser.newPage()
        console.log('New page created')

        const htmlContent = generateBukuBesarHTML(data, filters)
        console.log('HTML generated, length:', htmlContent.length)

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
        console.log('Content set to page')

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '5mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm'
            },
            printBackground: true
        })
        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        return pdfBuffer

    } catch (error) {
        console.error('Error in generatePdfBukuBesar:', error.message)
        console.error('Error stack:', error.stack)
        throw error
    } finally {
        if (browser) {
            console.log('Closing browser...')
            try {
                await browser.close()
                console.log('Browser closed')
            } catch (closeError) {
                console.error('Error closing browser:', closeError.message)
            }
        }
    }
}

const generateBukuBesarHTML = (data, filters) => {
    const currentDate = new Date().toLocaleDateString('id-ID')
    const akunList = data.data || []

    let totalDebit = 0
    let totalKredit = 0
    let totalSaldo = 0

    const akunRows = akunList.map(akun => {
        const transaksi = akun.transaksi || []
        let akunDebit = 0
        let akunKredit = 0
        let akunSaldo = akun.opening_balance || 0

        const transaksiRows = transaksi.map(trx => {
            const debit = parseFloat(trx.debit || 0)
            const kredit = parseFloat(trx.kredit || 0)
            akunDebit += debit
            akunKredit += kredit
            akunSaldo += (kredit - debit)
            totalDebit += debit
            totalKredit += kredit
            totalSaldo += (kredit - debit)

            const tanggalTransaksi = trx.tanggal_transaksi || trx.tanggal || trx.tanggalBayar
            const tanggalDisplay = tanggalTransaksi
                ? new Date(tanggalTransaksi).toLocaleDateString('id-ID')
                : '-'

            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${tanggalDisplay}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px; white-space: normal; word-wrap: break-word;">${trx.keterangan || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 10px;">${formatCurrency(debit)}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 10px;">${formatCurrency(kredit)}</td>
                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 10px; background-color: #f0f0f0;">${formatCurrency(akunSaldo)}</td>
                </tr>
            `
        }).join('')

        return `
            <h4 style="margin-top: 12px; margin-bottom: 8px; color: #2c3e50; font-size: 11px;">${akun.akun?.nama || '-'}</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; table-layout: fixed;">
                <colgroup>
                    <col style="width: 14%;" />
                    <col style="width: 42%;" />
                    <col style="width: 14%;" />
                    <col style="width: 14%;" />
                    <col style="width: 16%;" />
                </colgroup>
                <thead>
                    <tr style="background-color:  #f1f5f9; color: #334155;">
                        <th style="border: 1px solid  #f1f5f9; padding: 6px;">Tanggal</th>
                        <th style="border: 1px solid  #f1f5f9; padding: 6px;">Keterangan</th>
                        <th style="border: 1px solid  #f1f5f9; padding: 6px; text-align: right;">Debit</th>
                        <th style="border: 1px solid  #f1f5f9; padding: 6px; text-align: right;">Kredit</th>
                        <th style="border: 1px solid  #f1f5f9; padding: 6px; text-align: right;">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    ${transaksiRows}
                </tbody>
            </table>
        `
    }).join('')

    let filterText = ''
    if (filters.startDate && filters.endDate) {
        filterText = `${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    } else if (filters.startDate) {
        filterText = `Dari ${new Date(filters.startDate).toLocaleDateString('id-ID')}`
    } else if (filters.endDate) {
        filterText = `Hingga ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }

    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Buku Besar</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 10px;
                    line-height: 1.3;
                    color: #333;
                }

                 .header {
                    display: flex;
                    align-items: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    gap: 6px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .logo {
                    width: 100px;
                    height: auto;
                    object-fit: contain;
                    display: block;
                }
                
                .header-center {
                    flex: 1;
                }

                .header-center h1 {
                    font-size: 20px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .header-center p {
                    font-size: 12px;
                    color: #666;
                    margin: 2px 0;
                }

                .report-title {
                    text-align: center;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                .report-title h1 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    font-weight: bold;
                }

                .report-title p {
                    font-size: 10px;
                    color: #666;
                }

                .periode-text {
                    margin-bottom: 5px;
                    font-size: 11px;
                    color: #555;
                }

                .filter-info {
                    margin-bottom: 10px;
                    padding: 6px;
                    background-color: #ecf0f1;
                    border-left: 4px solid #3498db;
                    font-size: 9px;
                }
                
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 8px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 6px;
                }
                
                .summary-section {
                    margin-top: 15px;
                    padding: 10px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 10px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-left">
                        <img src="${logoSrc}" alt="Logo" class="logo" />
                    </div>

                    <div class="header-center">
                        <h1>${filters.namaProperti}</h1>
                        <p>${filters.alamatProperti}</p>
                        <p>${filters.noTelpProperti}</p>
                    </div>
                </div>
                
                <div class="report-title">
                    <h1>LAPORAN BUKU BESAR</h1>
                    <p>Tanggal Cetak: ${currentDate}</p>
                </div>

                <p class="periode-text">
                    Periode: ${filterText || 'Semua Data'}
                </p>
                
                ${akunRows}
                
                <div class="summary-section">
                    <div class="summary-row">
                        <span>Total Debit:</span>
                        <span>${formatCurrency(totalDebit)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Kredit:</span>
                        <span>${formatCurrency(totalKredit)}</span>
                    </div>
                    <div class="summary-row" style="border-top: 2px solid #34495e; padding-top: 6px; margin-top: 6px; color: #2c3e50;">
                        <span>Net Balance:</span>
                        <span>${formatCurrency(totalSaldo)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Dokumen ini dicetak dari sistem Manajemen Kos</p>
                </div>
            </div>
        </body>
        </html>
    `
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

export const generatePdfPiutang = async (data, filters = {}) => {
    let browser = null

    try {
        console.log('Starting Puppeteer for Piutang PDF...')
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }

        // Try to use existing Chrome installation on macOS
        if (process.platform === 'darwin') {
            const chromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ]

            for (const path of chromePaths) {
                if (fs.existsSync(path)) {
                    console.log('Found Chrome at:', path)
                    launchOptions.executablePath = path
                    break
                }
            }
        }

        browser = await puppeteer.launch(launchOptions)
        console.log('Puppeteer launched successfully for Piutang PDF')

        const page = await browser.newPage()
        console.log('New page created for Piutang PDF')

        // Generate HTML content
        console.log('Generating Piutang HTML...')
        const htmlContent = generatePiutangHTML(data, filters)
        console.log('Piutang HTML generated, length:', htmlContent.length)

        await page.setContent(htmlContent, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        })
        console.log('HTML content set')

        // Generate PDF
        console.log('Generating PDF...')
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '5mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm'
            },
            preferCSSPageSize: false,
            displayHeaderFooter: false
        })

        console.log('Piutang PDF generated successfully, size:', pdfBuffer.length, 'bytes')
        return pdfBuffer

    } catch (error) {
        console.error('Error generating Piutang PDF:', error)
        throw error
    } finally {
        if (browser) {
            try {
                await browser.close()
                console.log('Browser closed for Piutang PDF')
            } catch (closeError) {
                console.error('Error closing browser:', closeError)
            }
        }
    }
}

const generatePiutangHTML = (data, filters) => {
    const currentDate = new Date().toLocaleDateString('id-ID')

    // Sort penyewa by totalPiutang (descending)
    const sortedData = [...(data.data || [])].sort((a, b) => (b.totalPiutang || 0) - (a.totalPiutang || 0))

    const penyewaRows = sortedData.map(penyewa => {
        // Sort detail by umur (descending)
        const sortedDetail = [...(penyewa.detail || [])].sort((a, b) => (b.umur || 0) - (a.umur || 0))

        const detailRows = sortedDetail.map(detail => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px;">${detail.noTagihan || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px;">${detail.tanggalTagihan ? new Date(detail.tanggalTagihan).toLocaleDateString('id-ID') : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px;">${detail.jatuhTempo ? new Date(detail.jatuhTempo).toLocaleDateString('id-ID') : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px;">${detail.keterangan || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px; text-align: right;">${formatCurrency(detail.piutang || 0)}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px; text-align: center; ${detail.umur > 0 ? 'color: #e74c3c; font-weight: bold;' : ''}">${detail.umur || 0}</td>
                <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px; text-align: center;">${detail.status || '-'}</td>
            </tr>
        `).join('')

        const statusColor = (() => {
            switch (penyewa.status) {
                case 'BELUM JATUH TEMPO': return '#d1d5db'
                case 'HAMPIR JATUH TEMPO': return '#fcd34d'
                case 'JATUH TEMPO HARI INI': return '#fed7aa'
                case 'MENUNGGAK': return '#fca5a5'
                case 'KRITIS': return '#dc2626'
                default: return '#e5e7eb'
            }
        })()

        return `
            <div style="margin-bottom: 20px; border: 2px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 12px; border-bottom: 1px solid #cbd5e1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${penyewa.namaPenyewa || '-'}</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Total Piutang: <strong style="color: #dc2626;">${formatCurrency(penyewa.totalPiutang || 0)}</strong></p>
                        </div>
                        <div style="background: ${statusColor}; color: ${penyewa.status === 'KRITIS' ? '#fff' : '#374151'}; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold;">
                            ${penyewa.status || '-'}
                        </div>
                    </div>
                </div>

                <div style="padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                        <thead>
                            <tr style="background-color: #f1f5f9;">
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: left;">No Tagihan</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: left;">Tgl Tagihan</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: left;">Jatuh Tempo</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: left;">Keterangan</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: right;">Piutang</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: center;">Umur</th>
                                <th style="border: 1px solid #ddd; padding: 8px; font-weight: 600; text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detailRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    }).join('')

    let filterText = ''
    if (filters.startDate && filters.endDate) {
        filterText = `${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    } else if (filters.startDate) {
        filterText = `Dari ${new Date(filters.startDate).toLocaleDateString('id-ID')}`
    } else if (filters.endDate) {
        filterText = `Hingga ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }

    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Laporan Piutang</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #333;
                }

                 .header {
                    display: flex;
                    align-items: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    gap: 6px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .logo {
                    width: 100px;
                    height: auto;
                    object-fit: contain;
                    display: block;
                }
                
                .header-center {
                    flex: 1;
                }

                .header-center h1 {
                    font-size: 20px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .header-center p {
                    font-size: 12px;
                    color: #666;
                    margin: 2px 0;
                }

                .report-title {
                    text-align: center;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                .report-title h1 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    font-weight: bold;
                }

                .report-title p {
                    font-size: 10px;
                    color: #666;
                }

                .periode-text {
                    margin-bottom: 5px;
                    font-size: 11px;
                    color: #555;
                }

                .filter-info {
                    margin-bottom: 12px;
                    padding: 8px;
                    background-color: #ecf0f1;
                    border-left: 4px solid #3498db;
                    font-size: 10px;
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .summary-card {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                }

                .summary-label {
                    font-size: 10px;
                    color: #64748b;
                    margin-bottom: 4px;
                    font-weight: 600;
                }

                .summary-value {
                    font-size: 14px;
                    font-weight: bold;
                    color: #1e293b;
                }

                .penyewa-section {
                    margin-bottom: 25px;
                }

                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                }

                .signature {
                    margin-top: 30px;
                    display: flex;
                    justify-content: flex-end;
                }

                .signature-box {
                    text-align: center;
                    width: 180px;
                }

                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 35px;
                    margin-bottom: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="header-left">
                        <img src="${logoSrc}" alt="Logo" class="logo" />
                    </div>

                    <div class="header-center">
                        <h1>${filters.namaProperti}</h1>
                        <p>${filters.alamatProperti}</p>
                        <p>${filters.noTelpProperti}</p>
                    </div>
                </div>
                
                <div class="report-title">
                    <h1>LAPORAN PIUTANG</h1>
                    <p>Tanggal Cetak: ${currentDate}</p>
                </div>

                <p class="periode-text">
                    Periode: ${filterText || 'Semua Data'}
                </p>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-label">Total Piutang</div>
                        <div class="summary-value">${formatCurrency(data.summary?.totalPiutang || 0)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Menunggak</div>
                        <div class="summary-value">${formatCurrency(data.summary?.totalMenunggak || 0)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Belum Jatuh Tempo</div>
                        <div class="summary-value">${formatCurrency(data.summary?.totalBelumJatuhTempo || 0)}</div>
                    </div>
                </div>

                <div class="penyewa-section">
                    ${penyewaRows}
                </div>

                <div class="signature">
                    <div class="signature-box">
                        <p style="font-size: 11px; margin-bottom: 30px;">Manager</p>
                        <div class="signature-line"></div>
                        <p style="font-size: 10px; margin-top: 5px;">Nama & Tanda Tangan</p>
                    </div>
                </div>

                <div class="footer">
                    <p>Dokumen ini dicetak dari sistem Manajemen Kos</p>
                </div>
            </div>
        </body>
        </html>
    `
}

const formatMasukKeluarCell = (value) => {
    const num = parseFloat(value || 0)
    if (!num) return '-'
    return formatCurrency(num)
}

const buildPeriodeText = (filters = {}) => {
    if (filters.startDate && filters.endDate) {
        return `${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }
    if (filters.startDate) {
        return `Dari ${new Date(filters.startDate).toLocaleDateString('id-ID')}`
    }
    if (filters.endDate) {
        return `Hingga ${new Date(filters.endDate).toLocaleDateString('id-ID')}`
    }
    return 'Semua Data'
}

export const generatePdfMutasiKasOperasional = async (data, filters = {}) => {
    try {
        console.log('Starting Puppeteer for Mutasi Kas Operasional...')
        const htmlContent = generateMutasiKasOperasionalHTML(data, filters)
        return await renderPdfFromHtml(htmlContent, 'Mutasi Kas Operasional PDF')
    } catch (error) {
        console.error('Error in generatePdfMutasiKasOperasional:', error.message)
        console.error('Error stack:', error.stack)
        throw error
    }
}

const generateMutasiKasOperasionalHTML = (data, filters = {}) => {
    const currentDate = new Date().toLocaleDateString('id-ID')
    const rows = Array.isArray(data?.data) ? data.data : []
    const saldoAwal = parseFloat(data?.saldoAwal || 0)
    const saldoAkhir = parseFloat(data?.saldoAkhir ?? saldoAwal)

    const totalMasuk = rows.reduce((sum, item) => sum + parseFloat(item.masuk || 0), 0)
    const totalKeluar = rows.reduce((sum, item) => sum + parseFloat(item.keluar || 0), 0)

    const dataRows = rows.length > 0
        ? rows.map((item) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.tanggalMutasiKas ? new Date(item.tanggalMutasiKas).toLocaleDateString('id-ID') : '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.keterangan || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.properti?.nama || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;" class="masuk">${formatMasukKeluarCell(item.masuk)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;" class="keluar">${formatMasukKeluarCell(item.keluar)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600;">${formatCurrency(item.saldo || 0)}</td>
        </tr>
    `).join('')
        : `<tr><td colspan="6" style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #6b7280;">Tidak ada mutasi pada periode ini.</td></tr>`

    const filterText = buildPeriodeText(filters)
    const kasLabel = filters.idKas || rows[0]?.idKas || 'KAS-1'

    return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Laporan Mutasi Kas Operasional</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #333;
                }
                .header {
                    display: flex;
                    align-items: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    gap: 10px;
                }
                .logo { width: 90px; height: auto; object-fit: contain; }
                .header-center h1 {
                    font-size: 18px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }
                .header-center p {
                    font-size: 10px;
                    color: #666;
                }
                .report-title {
                    text-align: center;
                    margin: 12px 0;
                }
                .report-title h1 {
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }
                .report-title p {
                    font-size: 10px;
                    color: #666;
                }
                .periode-text {
                    margin-bottom: 10px;
                    font-size: 11px;
                    color: #555;
                }
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-bottom: 14px;
                }
                .summary-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 10px;
                    background: #f9fafb;
                }
                .summary-label {
                    font-size: 9px;
                    color: #6b7280;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .summary-value {
                    font-size: 12px;
                    font-weight: 800;
                    color: #111827;
                }
                .summary-value.masuk { color: #15803d; }
                .summary-value.keluar { color: #dc2626; }
                .summary-value.akhir { color: #1d4ed8; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 12px;
                }
                thead {
                    background-color: #f1f5f9;
                    color: #334155;
                }
                thead th {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 10px;
                }
                thead th:nth-child(n+4) { text-align: right; }
                tbody tr:nth-child(even) { background-color: #f9f9f9; }
                .masuk { color: #15803d; }
                .keluar { color: #dc2626; }
                .footer {
                    margin-top: 16px;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoSrc}" alt="Logo" class="logo" />
                    <div class="header-center">
                        <h1>Manajemen Kos</h1>
                        <p>Kas Operasional: ${kasLabel}</p>
                    </div>
                </div>

                <div class="report-title">
                    <h1>LAPORAN MUTASI KAS OPERASIONAL</h1>
                    <p>Tanggal Cetak: ${currentDate}</p>
                </div>

                <p class="periode-text">Periode: ${filterText}</p>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-label">Saldo Awal</div>
                        <div class="summary-value">${formatCurrency(saldoAwal)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Masuk</div>
                        <div class="summary-value masuk">${formatCurrency(totalMasuk)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Keluar</div>
                        <div class="summary-value keluar">${formatCurrency(totalKeluar)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Saldo Akhir</div>
                        <div class="summary-value akhir">${formatCurrency(saldoAkhir)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Keterangan</th>
                            <th>Nama Properti</th>
                            <th>Masuk</th>
                            <th>Keluar</th>
                            <th>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataRows}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Dokumen ini dicetak dari sistem Manajemen Kos</p>
                </div>
            </div>
        </body>
        </html>
    `
}

const exportMutasiKasOperasionalPdfCli = async () => {
    const args = process.argv.slice(2)

    const parseArg = (key) => {
        const inline = args.find((arg) => arg.startsWith(`--${key}=`))
        if (inline) return inline.split('=').slice(1).join('=')
        const index = args.indexOf(`--${key}`)
        if (index !== -1 && args[index + 1]) return args[index + 1]
        return undefined
    }

    const now = new Date()
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const startDate = parseArg('startDate') || defaultStart
    const endDate = parseArg('endDate') || defaultEnd
    const idKas = parseArg('idKas') || 'KAS-1'

    const { get } = await import('../models/LaporanMutasiKasOperasional.js')
    const results = await get({
        query: {
            startDate,
            endDate,
            idKas,
            limit: 999999
        }
    })

    const filters = { startDate, endDate, idKas }
    const pdfBuffer = await generatePdfMutasiKasOperasional(results, filters)

    const tmpDir = path.resolve(__dirname, '../tmp')
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
    }

    const outputPath = parseArg('output')
        || path.join(tmpDir, `laporan-mutasi-kas-operasional-${Date.now()}.pdf`)

    await fs.promises.writeFile(outputPath, pdfBuffer)
    console.log('PDF mutasi kas operasional disimpan di:', outputPath)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const reportType = process.argv[2]
    if (reportType === 'mutasi-kas-operasional') {
        exportMutasiKasOperasionalPdfCli().catch((error) => {
            console.error('Gagal membuat PDF mutasi kas operasional:', error)
            process.exit(1)
        })
    } else {
        console.error('Report type tidak dikenali. Gunakan: mutasi-kas-operasional')
        process.exit(1)
    }
}
