const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DataBase error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// get the list of all the states
// API 1

const ConvertAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = "SELECT * FROM state; ";
  const statesArray = await database.all(getStatesQuery);
  response.send(statesArray.map((eachState) => ConvertAPI1(eachState)));
});

//Returns a state based on state id
//API 2
const convertCovid19API = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const getStateQueryResponse = await database.get(getStateQuery);
  response.send(convertCovid19API(getStateQueryResponse));
});

// creates a new district
// API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictsQuery = `INSERT INTO district(district_name,state_id,cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, '${cases}', '${cured}', '${active}', '${deaths}');`;
  const createDistrictResponse = await database.run(addDistrictsQuery);
  response.send(`District Successfully Added`);
});

//Returns a district based on district id
//API 4
const convertCovid19API2 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const getDistrictQueryResponse = await database.get(getDistrictQuery);
  response.send(convertCovid19API2(getDistrictQueryResponse));
});

//deletes a district
//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send(`District Removed`);
});

//updates the details of a district
//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}', 
    state_id = ${stateId} , cases = '${cases}', cured = '${cured}',active = '${active}',
    deaths = '${deaths}'
     WHERE 
    district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send(`District Details Updated`);
});

//returns the statistics
//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `SELECT SUM(cases) AS totalCases, 
    SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS 
    totalDeaths 
    FROM
    district
    WHERE
    state_id = ${stateId};`;
  const getStateByIDStatsQueryResponse = await database.get(
    getStateByIDStatsQuery
  );
  response.send(getStateByIDStatsQueryResponse);
});

//API 8
// Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
