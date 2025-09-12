
const errorHandler = (err,req,res,next) => { 
    if (err.status){
        res.redirect(`/error_page.html?status=${err.status}&msg=${err.message}`)
    }
    else{
        res.redirect(`/error_page.html?status=${500}&msg=${err.message}`)
    }
};
export default errorHandler;