
const express = require("express");
const singerController = require('../controller/singer.controller')
const singerRouter = express.Router();

singerRouter.get('/:singer', singerController.getSingerProfile)
module.exports = singerRouter