class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        errorStack = ""
    ) {
        // to override, we use super, now message has been passed, so it'll be overridden definitely
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (errorStack) {
            this.stack = errorStack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export {ApiError}
