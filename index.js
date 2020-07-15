import express from 'express';
import cors from 'cors';
import { filter, sortBy } from 'lodash';
import { buildConfirmationMail } from './mailBuilder';
import bodyParser from 'body-parser';
import './lib/cron';
import path from 'path';
import crypto from 'crypto';

const MongoClient = require('mongodb').MongoClient;
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const connectionString =
  'mongodb+srv://abhinav:zqR143nfUQfPJzp5@cluster0-cygaf.mongodb.net/test?retryWrites=true&w=majority';

MongoClient.connect(
  connectionString,
  {
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) return console.error(err);
    console.log('Connected to Database');
    const db = client.db('jobs-db');
    const jobsCollection = db.collection('jobs');
    const subscriberCollection = db.collection('subscribers');

    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get(`/all-jobs`, async (req, res, next) => {
      const index = +req.query.index || 0;

      // get the scrape data
      jobsCollection
        .find()
        .toArray()
        .then((allJobs) => {
          const sortedList = sortBy(allJobs, [
            'jobDescription.postingDate',
          ]).reverse();
          const slicedList = sortedList.slice(index, index + 50);

          // respond with json
          return res.json(slicedList);
        });
    });

    app.get(`/search-jobs`, async (req, res, next) => {
      const index = +req.query.index || 0;
      const query = req.query.query.toLowerCase();

      // get the scrape data
      jobsCollection
        .find()
        .toArray()
        .then((allJobs) => {
          let filteredList = [];
          try {
            filteredList = filter(allJobs, (row) => {
              return (
                row.jobTitle.toLowerCase().indexOf(query) > -1 ||
                row.companyName.toLowerCase().indexOf(query) > -1 ||
                row.jobDescription.briefDescription
                  .toLowerCase()
                  .indexOf(query) > -1 ||
                row.location.toLowerCase().indexOf(query) > -1
              );
            });
          } catch (err) {
            console.log('error filtering in search');
          }

          const sortedList = sortBy(filteredList, [
            'jobDescription.postingDate',
          ]).reverse();
          const slicedList = sortedList.slice(index, index + 50);

          return res.json(slicedList);
        });
    });

    app.get('/get-subscriber-count', async (req, res, next) => {
      subscriberCollection
        .find({})
        .toArray()
        .then((x) => {
          return res.json({ count: x.length });
        });
    });

    app.get('/subscribe', async (req, res, next) => {
      const confirmToken = crypto.randomBytes(64).toString('hex');
      const unsubscribeToken = crypto.randomBytes(64).toString('hex');

      subscriberCollection
        .insertOne({
          email: req.query.email,
          query: req.query.query,
          verified: false,
          token: confirmToken,
          unsubscribeToken,
          unsubscribed: false,
        })
        .then((x) => {
          const msg = {
            to: req.query.email,
            from: 'abhinavdinesh95@gmail.com',
            subject: 'Just one more step!',
            text: `Just click on the link to start getting jobs tailored for you right in your inbox. Don't miss out on oppurtunities ever again - https://immense-basin-85534.herokuapp.com/verify-email?token=${confirmToken}`,
            html: buildConfirmationMail(confirmToken),
          };

          sgMail
            .send(msg)
            .then(() => {
              console.log('Message sent');
            })
            .catch((error) => {
              console.log(error.response.body);
            });
          return res.json({ success: true });
        });
    });

    app.get('/verify-email', async (req, res, next) => {
      subscriberCollection
        .findOneAndUpdate(
          { token: req.query.token, verified: false },
          { $set: { verified: true } }
        )
        .then(
          () => {
            return res.json({ success: true });
          },
          (error) => {
            console.log(error);
          }
        );
    });

    app.get('/unsubscribe', async (req, res, next) => {
      subscriberCollection
        .findOneAndUpdate(
          { unsubscribeToken: req.query.token },
          { $set: { unsubscribed: true } }
        )
        .then(
          () => {
            return res.json({ success: true });
          },
          (error) => {
            console.log(error);
          }
        );
    });

    if (process.env.NODE_ENV === 'production') {
      app.use(express.static('client/out'));

      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client/out', 'index.html'));
      });
    }

    const PORT = process.env.PORT || 2000;
    app.listen(PORT, () => {
      console.log(`Our app is running on port ${PORT}`);
    });
  }
);
