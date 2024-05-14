const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const create = each => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  }
}

//API 1

app.get('/players/', async (request, response) => {
  const getQuery = `SELECT * FROM player_details`
  const result = await db.all(getQuery)
  response.send(result.map(each => convertObject(each)))
})

//API 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details
  WHERE player_id=${playerId};`
  const dbresponse = await db.get(getPlayerQuery)
  response.send(convertObject(dbresponse))
})

//API 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updateQuery = `UPDATE player_details
  SET
  player_name="${playerName}"
  WHERE player_id=${playerId};`
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

//API 4

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `SELECT * FROM match_details
  WHERE match_id=${matchId};`
  const matchDetails = await db.get(getQuery)
  response.send(create(matchDetails))
})

//API 5

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `SELECT * from player_match_score NATURAL JOIN match_details
  WHERE player_id=${playerId};`
  const result = await db.all(getQuery)

  response.send(result.map(each => create(each)))
})

//API 6
app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `SELECT * from player_match_score NATURAL JOIN player_details
  where match_id=${matchId};`
  const result = await db.all(getQuery)
  response.send(result.map(each => convertObject(each)))
})

//API 7
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `SELECT player_details.player_id as playerID,
  player_details.player_name as playerName,
  SUM(player_match_score.score) as totalScore,
  SUM(fours) as totalFours,
  SUM(sixes) as totalSixes FROM 
  player_details INNER JOIN player_match_score ON 
  player_details.player_id=player_match_score.player_id
  WHERE player_details.player_id=${playerId};`
  const result = await db.get(getQuery)
  response.send(result)
})

module.exports = app
