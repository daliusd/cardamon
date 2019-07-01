const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (app.get('env') !== 'test') {
    app.use(logger('dev'));
}

app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

require('./routes')(app);

app.get('/__OOPS__', () => {
    throw Error('oops');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');

    let transporter = nodemailer.createTransport({
        sendmail: true,
        path: '/usr/sbin/sendmail',
        args: ['-t', '-f', 'dalius'],
    });
    transporter.sendMail(
        {
            from: 'dalius',
            to: 'dalius@ffff.lt',
            subject: 'cardamon: server side error',
            text: `${err.stack}\n\n${err}\n\n${JSON.stringify(req.headers, null, 4)}`,
        },
        err => {
            if (err) {
                // eslint-disable-next-line no-console
                console.error(err);
            }
        },
    );
});

module.exports = app;
