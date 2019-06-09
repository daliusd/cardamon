const nodemailer = require('nodemailer');

module.exports = {
    async create(req, res) {
        let transporter = nodemailer.createTransport({
            sendmail: true,
            path: '/usr/sbin/sendmail',
            args: ['-t', '-f', 'dalius'],
        });
        await transporter.sendMail({
            from: 'dalius',
            to: 'dalius@ffff.lt',
            subject: 'cardamon: client side error',
            text: `${req.body.message}\n\n${req.body.stack}`,
        });

        return res.status(201).send({ message: 'sent' });
    },
};
