class ApiError extends Error {
    constructor(
        statusCode,
        message = "Somthing went wrong",
        errors =[],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode,
        this.data = null,
        this.message = false,
        this.success = false,
        this.errors = errors

        if(stack) {
            this.stack = stack 
        }
        else {
            Error.prepareStackTrace(this, this.constructor);
        }   
    }
}

export {ApiError}