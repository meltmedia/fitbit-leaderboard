# Fitbit Leaderboard

Where the steps come to roam.

## Setup

Clone the repository into your local git directory, install dependencies and run the project.

```
git clone git@github.com:meltmedia/fitbit-leaderboard.git
cd fitbit-leaderboard
npm install
npm install -g grunt-cli
grunt dev
```

## Install Project Packages
#### nvm
https://github.com/creationix/nvm

#### MongoDB
Click the link and follow the instructions to install Mongo.<br>
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/

## Environment Variables

You will need the following environment variables:

### General

- `FITBIT_APP_SECRET`: a secret passphrase for encryption
- `FITBIT_UPDATE_INTERVAL`: interval in milliseconds to update leaderboard (optional, defaults to 300000)
- `FITBIT_APP_HOST`: the host for your app (not used in local dev)
- `FITBIT_LEADERBOARD_START`: start date for challenge (format: YYYY-MM-DD)
- `FITBIT_LEADERBOARD_END`: end date for challenge (format: YYYY-MM-DD)
- `FITBIT_REGISTRATION_NAME`: a username to share with users to restrict ability to join leaderboard (optional, defaults to empty string)
- `FITBIT_REGISTRATION_PASSPHRASE`: a passphrase to share with users to restrict ability to join leaderboard (optional, ability to join is unrestricted when env var is not present)

The update interval, dates and host can also be configured in a `config.json` file placed in the root of the project. Environment variables will override the `config.json` settings. See example below:

```json
{
  "dates": {
    "startDate": "2015-01-30",
    "endDate": "2015-02-28"
  },
  "host": "fitbit.mysite.com",
  "updateInterval": 150000
}
```

### Fitbit API

- `FITBIT_API_KEY`: Fitbit API key
- `FITBIT_API_SECRET`: Fitbit API secret

### Mongo

- `FITBIT_MONGO_USER`: Mongo username (optional in local dev, defaults to empty string)
- `FITBIT_MONGO_PASSPHRASE`: Mongo passphrase (optional in local dev, defaults to empty string)
- `FITBIT_MONGO_HOST`: Mongo host (optional in local dev, defaults to `localhost`)
- `FITBIT_MONGO_DB`: Mongo database name (optional in local dev, defaults to `fitbit-leaderboard`)

### Loggly

The Loggly environment variables are not required for your app to run. If using Loggly, either `FITBIT_LOGGLY_INPUTTOKEN` or `FITBIT_LOGGLY_INPUTNAME` is required. If using `FITBIT_LOGGLY_INPUTNAME`, then `FITBIT_LOGGLY_USERNAME` and `FITBIT_LOGGLY_PASSWORD` are also required.

- `FITBIT_LOGGLY_SUBDOMAIN`: The subdomain of your Loggly account
- `FITBIT_LOGGLY_INPUTTOKEN`: The input token of the input this instance should log to
- `FITBIT_LOGGLY_INPUTNAME`: The name of the input this instance should log to
- `FITBIT_LOGGLY_USERNAME`: The username for your Loggly account.
- `FITBIT_LOGGLY_PASSWORD`: The password for your Loggly account.

## Other commands

- Run the project locally: `grunt dev` (will open app at http://127.0.0.1:5455/)
- Build the dist files: `grunt build`
- Run in not production mode: `grunt not-prod`
- Run in production mode: `grunt prod`
- `grunt` is an alias of `grunt dev`
