export const success = (res, message, data, status = 200) => {
    return res.status(status).json({
        succes: true,
        message,
        data
    })
}

export const error = (res, message, errorCode, status = 400) => {
    return res.status(status).json({
        success: false,
        message,
        errorCode
    })
}