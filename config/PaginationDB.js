class PaginationDB {
    constructor(totalRowCount, page, limit, data) {
        this.totalRowCount = parseInt(totalRowCount)
        this.page = parseInt(page)
        this.limit = parseInt(limit)
        this.data = data
    }

    getRemarkPagination(){
        const remarkPagination = {}
        const totalNumberOfPages = Math.ceil((this.totalRowCount) / this.limit)

        remarkPagination.totalNumberOfPages = totalNumberOfPages
        remarkPagination.currentPage = this.page

        if (this.page < totalNumberOfPages) {
            remarkPagination.next = {
                page: this.page + 1,
                limit: this.limit
            }
        }

        if (this.page > 1) {
            remarkPagination.previous = {
                page: this.page - 1,
                limit: this.limit
            }
        }

        return remarkPagination
    }
}

export default PaginationDB
