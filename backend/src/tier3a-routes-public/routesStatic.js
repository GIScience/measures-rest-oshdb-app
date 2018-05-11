const express = require('express')

module.exports.runRoutesStatic = (use, get, post) => {
  // static
  use('/static/vs', express.static('./../frontend/node_modules/monaco-editor/min/vs'))
  use('/static/libs', express.static('./../backend/libs'))
  use('/static/help', express.static('./../backend/help'))
}