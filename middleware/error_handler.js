
const errorHandler = (err,req,res,next) => { 
    if (err.status){
        res.redirect(`/error_page.html?status=${err.status}`)
    }
    else{
        res.redirect(`/error_page.html?status=${500}`)
    }
};
export default errorHandler;