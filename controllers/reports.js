const nodemailer = require('nodemailer');

module.exports = {
    async create(req, res) {
        let transporter = nodemailer.createTransport({
            sendmail: true,
            path: '/usr/sbin/sendmail',
            args: ['-t', '-f', 'dalius'],
        });
        let headers = JSON.stringify(req.headers, null, 4);
        await transporter.sendMail({
            from: 'dalius',
            to: 'dalius@ffff.lt',
            subject: 'cardamon: client side error',
            text: `${req.body.message}\n\n${req.body.stack}\n\n${req.body.state}\n\n${headers}`,
        });

        return res.status(201).send({ message: 'sent' });
    },
};
