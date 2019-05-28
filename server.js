// https://developerhowto.com/2018/12/29/build-a-rest-api-with-node-js-and-express-js/

// Create express app
const express = require("express")
const app = express()
const db = require("./database.js")

const defaultOffset = 100;
const avvikandeURL = "avvikande" // avvikande
const felaktigtURL = "felaktigt" // felaktigt
const mestadelsFelaktigaURL = "mestadels_felaktiga" // mestadels_felaktiga

// Server port
const HTTP_PORT = 3000

// Start server
app.listen(HTTP_PORT, () => {

    let today = new Date();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log(`\n${time} Server running on port ${HTTP_PORT}`)
});

// Root endpoint
app.get("/", (req, res, next) => {
    res.json({ "message": "ok" })
});


// ############## avvikande ##############

// Hämta alla (långsam)
app.get(`/api/${avvikandeURL}`, (req, res, next) => {
    var sql = `Select byline, count(distinct mediaLicense) as licenses from items 
    where byline is not null
    group by byline
    having licenses > 1
    ;`
    
    var params = []
    serveRequest(sql, res, params);
});


// Välj start index
app.get(`/api/${avvikandeURL}/:startIndex`, (req, res, next) => {
    var sql = `Select byline, count(distinct mediaLicense) as licenses from items 
    where byline is not null
    group by byline
    having licenses > 1
    limit (?*${defaultOffset}), ${defaultOffset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});


// Välj start index och offset
app.get(`/api/${avvikandeURL}/:startIndex/:offset`, (req, res, next) => {
    var sql = `Select byline, count(distinct mediaLicense) as licenses from items 
    where byline is not null
    group by byline
    having licenses > 1
    limit (?*${req.params.offset}), ${req.params.offset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});


// ############## felaktigt ##############

// Hämta alla (långsam)
app.get(`/api/${felaktigtURL}`, (req, res, next) => {
    var sql = `SELECT itemId, mediaLicense FROM items
    where mediaLicense is null
    ;`

    var params = []
    serveRequest(sql, res, params);
});

// Välj start index
app.get(`/api/${felaktigtURL}/:startIndex`, (req, res, next) => {

    var sql = `SELECT itemId, mediaLicense FROM items
    where mediaLicense is null
    limit (?*${defaultOffset}), ${defaultOffset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});

// Välj start index och offset
app.get(`/api/${felaktigtURL}/:startIndex/:offset`, (req, res, next) => {

    var sql = `SELECT itemId, mediaLicense FROM items
    where mediaLicense is null
    limit (?*${req.params.offset}), ${req.params.offset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});


// ############## Mestadels felaktiga ##############

// Hämta alla (långsam)
app.get(`/api/${mestadelsFelaktigaURL}`, (req, res, next) => {
    var sql = `SELECT itemId, mediaLicense FROM items 
    WHERE create_fromTime < (2019-70-60) 
    AND create_fromTime >= 1826 
    AND create_fromTime < 2020
    AND mediaLicense IS NOT NULL
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#pdmark"
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#cc0"
    ORDER BY create_fromTime DESC
    ;`

    var params = []
    serveRequest(sql, res, params);
});

// Välj start index
app.get(`/api/${mestadelsFelaktigaURL}/:startIndex`, (req, res, next) => {

    var sql = `SELECT id, itemId, mediaLicense FROM items 
    WHERE create_fromTime < (2019-70-60) 
    AND create_fromTime >= 1826 
    AND create_fromTime < 2020
    AND mediaLicense IS NOT NULL
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#pdmark"
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#cc0"
    ORDER BY create_fromTime DESC
    limit (?*${defaultOffset}), ${defaultOffset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});

// Välj start index och offset
app.get(`/api/${mestadelsFelaktigaURL}/:startIndex/:offset`, (req, res, next) => {

    var sql = `SELECT id, itemId, mediaLicense FROM items 
    WHERE create_fromTime < (2019-70-60) 
    AND create_fromTime >= 1826 
    AND create_fromTime < 2020
    AND mediaLicense IS NOT NULL
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#pdmark"
    AND mediaLicense IS NOT "http://kulturarvsdata.se/resurser/License#cc0"
    ORDER BY create_fromTime DESC
    limit (?*${req.params.offset}), ${req.params.offset}
    ;`

    var params = [req.params.startIndex]
    serveRequest(sql, res, params);
});

// Default response for any other request
app.use(function (req, res) {
    res.status(404);
});

function serveRequest(sql, res, params) {

    res.header("Access-Control-Allow-Origin", "*"); // Fixar "cors policy no 'access-control-allow-origin'"
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        fixerUpper(rows)
        res.json({
            "message": "success",
            "count": rows.length,
            "data": rows
        })
    });
}

function fixerUpper(rows) {
    let base = 'http://www.kringla.nu/kringla/objekt?referens=';

    rows.forEach(function (entry) {

        // Null check
        if (entry.itemId != null) {
            // Fixar länken till objektet
            let url = entry.itemId.split('.se/')[1];
            entry.link = base + url;

            // Fixar id
            let arr = entry.itemId.split('/');
            entry.itemId = arr[arr.length - 1]
        }

        // Null check
        if (entry.mediaLicense != null && entry.mediaLicense.length !== '') {
            // Fixar media license
            if (entry.mediaLicense.includes("#")) {
                entry.mediaLicense = entry.mediaLicense.toLowerCase().split('#')[1];
            } else {
                entry.mediaLicense = entry.mediaLicense.toLowerCase().split('.org/')[1];
            }
        }

    });
}
