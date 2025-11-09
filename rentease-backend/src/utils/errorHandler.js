export const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const errorHandler = (error, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(error);

    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Internal server error';

    res.status(status).json({ error: message });
};
