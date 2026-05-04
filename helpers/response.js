export const success = (res, data, message = "success", pagination = null) => {
    const response = {
        error: false,
        message,
        pagination,
        data
    }

    if (pagination) {
        response.pagination = pagination
    }

    return res.status(200).send(response)
}

export const created = (res, data, message = "data created") => {
    return res.status(201).send({
        error: false,
        message,
        data
    })
}

export const notFound = (res, message = "resource not found") => {
    return res.status(404).send({
        error: true,
        message,
        data: null
    })
}

export const error = (res, err, status = 500) => {
    return res.status(status).send({
        error: true,
        message: err.message || err
    })
}