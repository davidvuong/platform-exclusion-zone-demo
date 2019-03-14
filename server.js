const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(
  express.json({
    limit: '5mb',
  }),
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Platform API //
const clientId = process.env.PLATFORM_CLIENT_ID;
const clientSecret = process.env.PLATFORM_CLIENT_SECRET;

function getToken() {
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId, clientSecret,
    }),
  };

  return fetch('https://api.imageintelligence.com/v2/oauth/token', options)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(`Got token - ${data.accessToken}`);
      return data.accessToken;
    });
}

function getDetectJob(id, token) {
  const options = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  return fetch(`https://api.imageintelligence.com/v2/detect/${id}`, options)
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      console.log(`Got job - ${JSON.stringify(response)}`);
      return response;
    });
}

function createDetectJob(url, classes, token) {
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      images: [
        { url },
      ],
      classes,
    }),
  };
  return fetch('https://api.imageintelligence.com/v2/detect', options)
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      console.log(`Sent job - ${JSON.stringify(response)}`);
      return response;
    });
}

app.post('/detect', (req, res) => {
  let token, job;
  return getToken()
    .then((token_) => {
      token = token_;
    })
    .then(() => {
      const classes = [
        {
          class: 'person',
          verify: 'NEVER',
          exclusionZones: {
            size: req.body.gridSize,
            zones: req.body.zones,
          },
        },
      ];
      return createDetectJob(req.body.url, classes, token);
    })
    .then((response) => {
      job = response;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 3500);
      });
    })
    .then(() => {
      return getDetectJob(job.id, token);
    })
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      console.error(error);
      console.error(error.stack);
      res.status(500).json();
    });
});

app.listen(9091, () => {
  console.log('demo server started and listening to requests 0.0.0.0:9091');
});
