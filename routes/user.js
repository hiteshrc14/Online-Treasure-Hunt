var express = require('express');
var router = express.Router();
var user = require('../models/user');
var helper = require('../models/helper');

router.get('/get', function (req, res, next) {
    user.get(req, res, next);
});

router.post('/add', function (req, res, next) {
    user.add(req, res, next);
});
router.post('/update/password', function (req, res, next) {
    user.updatePassword(req, res, next);
});

router.post('/current/question', helper.verifyToken, function (req, res, next) {
    user.currentQuestion(req, res, next);
});

router.get('/login', function (req, res, next) {
    user.userLogin(req, res, next);
});
router.get('/question/number', function (req, res, next) {
    user.questionNumber(req, res, next);
});


module.exports = router;