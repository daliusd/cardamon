Installation
============

npm i

Development
-----------

* `npm run start:dev` - to run server. Create "cardamon" database and run `npx sequelize db:migrate` before.

* `npx jest` - to run tests. Create "cardamon_test" database before.

* `npm test` - to run tests with coverage

Deployment
----------

* Create superuser for your user: sudo -u postgres createuser --interactive

* Create database "cardamon"

* Run: npm install --production

* Run: npx sequelize db:migrate

* Start: pm2 start ecosystem.config.js --env production
