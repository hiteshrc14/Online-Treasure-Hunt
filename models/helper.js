function Helper() {
    this.noResultMsg="No result found";
    this.ResultMsg="Result Found";
    this.Success="Success";
    this.Error = "Error";
    this.successStatusCode = 1;
    this.errorStatusCode = 0;
    this.activeStatusCode=1;
    this.inactiveStatusCode=0;
    this.authError = "Failed to authenticate.";

    this.createResponse = function (status, code, message, document) {
        return { "Status": status, "Code": code, "Message": message, "Document": document };
    };

    this.hasOwnProperty = function (obj,propertyName) {
        if(propertyName in obj){
            return true;
        }else{
            return false;
        }
    };

    //verifying tokens
    this.verifyToken = function(req,res,next){
        //getting auth value
        var headerToken = req.headers['authorization'];
        console.log("headerToken");
        //checking if its not undefined
        if(typeof headerToken !== 'undefined'){
            var bearerToken = headerToken.split(" ")[1];
            req.token = bearerToken;
            next();
        }
        else{
            res.sendStatus(403);
        }


    }
}

module.exports = new Helper();