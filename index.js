/**
 * Index.js
 *
 * Express app that uses Twilio and Spotify APIs to return a song from a SMS
 * with a song title.
 */

// Note: ES6 changes present in this file.

// const = A value that can't be reassigned to anything.
// Doesn't mean that value can't be changed.
const express = require('express')
const bodyParser = require('body-parser')
const twilio = require('twilio')
const request = require('request')

// Create our app. Create our routes and start our server up.
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

// Pass in Account SID and Auth Token to twilio() if not set as environment
// variables.
const client = twilio()

// When a GET request comes into this root URL.
app.get('/', function (req, res) {
  res.send('Hello, World!')
})

app.get('/song', function (req, res) {
  const query = req.query.q
  const twiml = new twilio.TwimlResponse()

  // Call our getSong() function.
  getSong(query)
    .then(function (song) {
      twiml.say('Please enjoy this rad jam!')
      twiml.play(song)
      twiml.say('I hope you enjoyed the tune.')
      res.send(twiml.toString())
    })
    .catch(function (err) {
      twiml.say(err.message)
      res.send(twiml.toString())
    })
})

app.post('/sms', function (req, res){
  // See: https://www.twilio.com/docs/api/twiml/sms/twilio_request
  const from = req.body.From
  const body = req.body.Body
  client.makeCall({
    to: from,
    from: '+13474640283',
    // using ngrok to map localhost:3000 to an accessible url.
    // start ngrok like this: ngrok http 3000
    url: `http://ac449ddc.ngrok.io/song?q=${encodeURIComponent(body)}`,
    method: 'GET'
  })
    .then(function (result) {
      const twiml = new twilio.TwimlResponse()
      twiml.message('Your jam is on the way!')
      res.send(twiml.toString())
    })
    .catch(function (err) {
      const twiml = new twilio.TwimlResponse()
      twiml.message(`Something went terribly wrong: ${err.message}`)
      res.send(twiml.toString())
    })
})

// Get the song from Spotify.
function getSong (song) {
  return new Promise(function (resolve, reject) {
    // See https://api.spotify.com/v1/search?type=track&q=beat%20it
    // No authentication needed!
    // JSON Collection of tracks and has preview of songs
    request({
      url: 'https://api.spotify.com/v1/search',
      method: 'GET',
      qs: {
        type: 'track',
        q: song,
        limit: 1
      },
      json: true
    }, function (err, resp, body) {
      if (err) {
        return reject(err)
      }

      try {
        const trackUrl = body.tracks.items[0].preview_url
        return resolve(trackUrl)
      } catch (e) {
        return reject(new Error('Sorry, track not found.'))
      }
    })
  })
}

// Listen on port 3000.
app.listen(3000)
