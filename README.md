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

* You might as well need to do, pm2 save, pm2 startup (*DO NOT RUN sudo with this command*) if you have not done that
  yet.  pm2 monit seems to be usable command as well.

* Deploy data using command: ./icons.js --server https://cardamon.ffff.lt

* Deploy behind nginx and Let's Encrypt certificate. Follow instructions here:
    https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04

Related projects
----------------

* https://github.com/daliusd/saffron - Card-a-mon front-end.

* https://github.com/daliusd/basil - Library to generate Card-a-mon PDF and PNG files.

* https://github.com/daliusd/pepper - Various tools for Card-a-mon.

Database nuances
----------------

Create migration using sequelize-cli. E.g.:

```
npx sequelize migration:create --name admin
```

Edit created migration.
