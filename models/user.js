function user() {
    var helper = require('../models/helper');
    var url = require('url');
    var jwt = require('jsonwebtoken');
    var md5 = require('md5');

    //get all values for displaying the leaderboard
    this.get = function (req, res, next) {
        try {
            req.getConnection(function (connectionError, conn) {
                if (connectionError) {
                    //console.error('SQL Connection Error:', connectionError);
                    return next(connectionError);
                } else {
                    var query = "select * from user order by currentQuestion desc, answeredAt asc";
                    conn.query(query, function (sqlError, result) {
                        if (sqlError) {
                            //console.error('SQL Error:', sqlError);
                            return next(sqlError);
                        }
                        if (result.length >= 1) {
                            for(var i = 0;i<result.length;i++)
                                result[i].currentQuestion = --result[i].currentQuestion;
                            res.send(helper.createResponse(helper.Success, helper.successStatusCode, helper.ResultMsg, result));
                        } else {
                            res.send(helper.createResponse(helper.Error, helper.errorStatusCode, helper.noResultMsg, ""));
                        }
                    });
                }
            });
        } catch (internalError) {
            //console.error("Internal error:" + internalError);
            return next(internalError);
        }
    };

    //checks duplication with the email id and adds a new user
    this.add = function (req, res, next) {
        try {
            var reqObj = req.body;
            // var url_query = url.parse(req.url, true).query;
            // var userName = url_query.userName;
            // var emailID =   url_query.emailID;
            // var password =   url_query.password;
            // console.log(reqObj);
            req.getConnection(function (connectionError, conn) {
                if (connectionError) {
                    //console.error('SQL Connection Error:', connectionError);
                    return next(connectionError);
                } else {
                    var checkDuplication = "select * from user where UPPER(userName) ='" + reqObj.userName.toUpperCase() + "'";
                    // console.log(checkDuplication);
                    conn.query(checkDuplication, function (sqlError, checkDuplicateResult) {
                        if (sqlError) {
                            //console.error('Sql error:' + sqlError);
                            return next(sqlError);
                        }
                        if (checkDuplicateResult.length >= 1) {
                            res.send(helper.createResponse(helper.Error, helper.errorStatusCode, 'Username already exists!', ''));
                        } else {
                            var insertSql = "INSERT INTO user SET ?";
                            var insertValues = {
                                'emailID': reqObj.emailID,
                                'userName': reqObj.userName,
                                'password': md5(reqObj.password),
                            };
                            // console.log(insertSql);
                            conn.query(insertSql, insertValues, function (sqlError, result) {
                                if (sqlError) {
                                    //console.error('Sql error:' + sqlError);
                                    return next(sqlError);
                                }
                                if (result.affectedRows >= 1) {
                                    res.send(helper.createResponse(helper.Success, helper.successStatusCode, 'User added successfully', result.insertID));
                                } else {
                                    res.send(helper.createResponse(helper.Error, helper.errorStatusCode, 'Error while logging in!', ""));
                                }
                            });
                        }
                    });
                }
            });
        } catch (ex) {
            //console.error('Internal Server Error' + ex);
            next(ex);
        }
    };

    //to change to a new password
    this.updatePassword = function (req, res, next) {
        try {
            var reqObj = req.body;
            req.getConnection(function (err, conn) {
                if (err) {
                    //console.error('Sql Connection Error:', err);
                    return next(err);
                } else {
                            var query = "update user set password ='" + md5(reqObj.password) + "' where userName = '"+reqObj.userName+"'";
                            // console.log(query);
                            conn.query(query, function (err, result) {
                                if (err) {
                                    //console.error('Sql error', err);
                                    return next(err);
                                }
                                if (result.affectedRows >= 1) {
                                    res.send(helper.createResponse(helper.Success, helper.successStatusCode, "Updated successfully", ""));
                                } else {
                                    res.send(helper.createResponse(helper.Success, helper.errorStatusCode, helper.noResultMsg, "error while updating user password"));
                                }
                            });
                        }
                    });

        } catch (ex) {
            //console.error("Internal Error" + ex);
            return next(ex);
        }

    };

    //when the user gets a correct answer we update his currentQuestion by 1
    this.currentQuestion = function (req, res, next) {
        try {
            var reqObj = req.body;
            req.getConnection(function (err, conn) {
                if (err) {
                    //console.error('SQL Connection error: ', err);
                    return next(err);
                } else {
                    var currentAnswer = "select answer from answers where questionNumber="+reqObj.currentQuestion;
                    conn.query(currentAnswer,function (err,finalResult) {
                        if (err) {
                            //console.error('SQL error: ', err);
                            return next(err);
                        }

                        if (finalResult[0].answer.toLowerCase()=== reqObj.answer.toLowerCase()) {
                        // console.log("\nmy ans:"+reqObj.currentQuestion+"\ncorrect ans:"+finalResult[0].answer);
//
                            // res.send(helper.createResponse(helper.Success, helper.successStatusCode, "Correct answer", ""));
                            var nextQuestion = "update user set answeredAt = now(), currentQuestion = " + (++reqObj.currentQuestion) + " where userName = '" + reqObj.userName + "'";
                            // console.log(nextQuestion);
                            conn.query(nextQuestion, function (err, result) {
                                if (err) {
                                    //console.error('SQL error: ', err);
                                    return next(err);
                                }
                                if (result.affectedRows >= 1) {
                                    jwt.verify(req.token,'secret',(err,authData)=>{
                                        if(err){
                                            // console.log('err in token');
                                        }
                                        else{
                                            //   console.log(req.token);
                                              res.send(helper.createResponse(helper.Success, helper.successStatusCode, "Updated successfully", authData));  
                                        }
                                    });
                                } else {
                                    res.send(helper.createResponse(helper.Error, helper.errorStatusCode, "error while updating current Question", ""));
                                }
                            });
                        } else {
                            res.send(helper.createResponse(helper.Error, helper.errorStatusCode, "Wrong Answer", ""));
                        }

                    });

                }
            });

        } catch (ex) {
            //console.error("Internal error:" + ex);
            return next(ex);
        }
    };

    this.userLogin = function (req, res, next) {
        try {
            var url_query = url.parse(req.url, true).query;
            var userName = url_query.userName;
            var password =   md5(url_query.password);
            var user = userName;
            req.getConnection(function (connectionError, conn) {
                if (connectionError) {
                    //console.error('SQL Connection Error:', connectionError);
                    return next(connectionError);
                } else {
                    var query = "select count(*) as count from user where userName='"+userName+"' and password='"+password+"'";
                    // console.log(query);
                    conn.query(query, function (sqlError, result) {
                        if (sqlError) {
                            //console.error('SQL Error:', sqlError);
                            return next(sqlError);
                        }
                        if (result.length >= 1) {
                            var token = jwt.sign(
                                { 
                                    userName: this.userName,
                                    password: this.password
                                 },
                                'secret',
                                {
                                    expiresIn: '25h'   
                                }
                            );
                            result.push(token);
                            result.push({user:user});
                            res.send(helper.createResponse(helper.Success, helper.successStatusCode, helper.ResultMsg, result));
                        } else {
                            res.send(helper.createResponse(helper.Error, helper.errorStatusCode, helper.noResultMsg, ""));
                        }
                    });
                }
            });
        } catch (internalError) {
            //console.error("Internal error:" + internalError);
            return next(internalError);
        }
    };


    
 //get current question number
 this.questionNumber = function (req, res, next) {
    try {
        var url_query = url.parse(req.url, true).query;
        var userName = url_query.userName;
        req.getConnection(function (connectionError, conn) {
            if (connectionError) {
                //console.error('SQL Connection Error:', connectionError);
                return next(connectionError);
            } else {
                var query = "select * from user where userName="+userName;
                // console.log(query);
                conn.query(query, function (sqlError, result) {
                    if (sqlError) {
                        //console.error('SQL Error:', sqlError);
                        return next(sqlError);
                    }
                    if (result.length >= 1) {
                        res.send(helper.createResponse(helper.Success, helper.successStatusCode, helper.ResultMsg, result));
                    } else {
                        res.send(helper.createResponse(helper.Error, helper.errorStatusCode, helper.noResultMsg, ""));
                    }
                });
            }
        });
    } catch (internalError) {
        //console.error("Internal error:" + internalError);
        return next(internalError);
    }
};
}

module.exports = new user();