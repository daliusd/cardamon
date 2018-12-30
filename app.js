const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (app.get('env') !== 'test') {
    app.use(logger('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

require('./routes')(app);

app.get('/', (req, res) =>
    res.status(200).send({
        message: 'Welcome to the beginning of nothingness.',
    }),
);

app.get('/__OOPS__', () => {
    throw 'oops';
});

app.use(function(req, res, next) {
    next(createError(404));
});

// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
