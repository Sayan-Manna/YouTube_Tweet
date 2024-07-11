// Using Promise
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) =>
            next(error)
        );
    };
};

// Using async/await
// asyncHandler is a higher order function so it can accept a function as an argument and return a new function.
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Something went wrong",
//         });
//     }
// };
export { asyncHandler };
