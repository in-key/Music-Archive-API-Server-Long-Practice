const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    if (req.method == "GET" && req.url.startsWith("/artists")){
      let urlParts = req.url.split('/');
      if (urlParts.length == 2){
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(Object.values(artists)));
      } else if (urlParts.length == 3){
        let artId = urlParts[2];
        let artist = {...artists[artId], albums: []};
        for (let a in albums){
          if (albums[a].artistId == artId){
            artist['albums'].push(albums[a]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(artist));
      } else if (urlParts.length == 4){
        if (urlParts[3] == 'albums'){
          let artId = urlParts[2];
          let returnJSON = [];
          for (let a in albums){
            if (albums[a].artistId == artId){
              returnJSON.push(albums[a]);
            }
          }
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          return res.end(JSON.stringify(returnJSON));
        } else if (urlParts[3] == 'songs'){
          let artId = urlParts[2];
          let albumId;
          for (let a in albums){
            if (albums[a].artistId == artId){
              albumId = albums[a].albumId;
            }
          }
          let returnJSON = [];
          for (let s in songs){
            if (songs[s].albumId == albumId){
              returnJSON.push(songs[s]);
            }
          }
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          return res.end(JSON.stringify(returnJSON));
        }
      }
    }

    if (req.method == "GET" && req.url.startsWith("/albums")){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let albumId = urlParts[2];
        let returnJSON = {};
        for (let a in albums){
          if (albums[a].albumId == albumId){
            returnJSON = {
              ...albums[a],
              "songs": [],
              "artist": artists[albums[a].artistId],
            };
          }
        }
        for (let s in songs){
          if (songs[s].albumId == albumId){
            returnJSON["songs"].push(songs[s]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      } else if (urlParts.length == 4){
        let albumId = urlParts[2];
        let returnJSON = [];
        for (let s in songs){
          if (songs[s].albumId == albumId){
            returnJSON.push(songs[s]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == "GET" && req.url.startsWith("/trackNumbers")){
      let urlParts = req.url.split('/');
      if (urlParts.length == 4){
        let trackNum = urlParts[2];
        let returnJSON = [];
        for (let s in songs){
          if (songs[s].trackNumber == trackNum){
            returnJSON.push(songs[s]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == "GET" && req.url.startsWith("/songs")){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let songId = urlParts[2];
        let returnJSON = [];
        for (let s in songs){
          if (songs[s].songId == songId){
            returnJSON.push(songs[s]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == "POST" && req.url.startsWith('/artists')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 2){
        let newId = getNewArtistId();
        artists[newId] = {
          name: req.body['name'],
          artistId: newId,
        }
        res.method = 201;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(artists[newId]));
      } else if (urlParts.length == 4){
        if (urlParts[3] == 'albums'){
          let artistId = urlParts[2];
          let newAlbum = {
            albumId: getNewAlbumId(),
            name: req.body['name'],
            artistId: artistId,
          }
          albums[newAlbum['albumId']] = newAlbum;
          res.method = 201;
          res.setHeader('content-type', 'application/json');
          return res.end(JSON.stringify(newAlbum));
        }
      }
    }

    if (req.method == "POST" && req.url.startsWith('/albums')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 4){
        let albumId = urlParts[2];
        let newSong = {
          name: req.body.name,
          lyrics: req.body.lyrics ? req.body.lyrics : null,
          trackNumber: req.body.trackNumber ? req.body.trackNumber : null,
          songId: getNewSongId(),
          albumId: albumId,
        }
        songs[newSong.songId] = newSong;
        let returnJSON = {};
        for (let a in albums){
          if (albums[a].albumId == albumId){
            returnJSON = {
              ...albums[a],
              "songs": [],
              "artist": artists[albums[a].artistId],
            };
          }
        }
        for (let s in songs){
          if (songs[s].albumId == albumId){
            returnJSON["songs"].push(songs[s]);
          }
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == 'PUT' && req.url.startsWith('/artists')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let artId = urlParts[2];
        artists[artId].name = req.body['name'];
        let returnJSON = {
          ...artists[artId],
          'updatedAt': new Date().toISOString(),
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }


    if (req.method == 'PUT' && req.url.startsWith('/albums')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let albumId = urlParts[2];
        albums[albumId].name = req.body["name"];
        let returnJSON = {
          ...albums[albumId],
          "updatedAt": new Date().toISOString(),
        };
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == 'PUT' && req.url.startsWith('/songs')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let songId = urlParts[2];
        let song = songs[songId];
        song.name = req.body.name,
        song.lyrics = req.body.lyrics ? req.body.lyrics : song.lyrics,
        song.trackNumber = req.body.trackNumber ? req.body.trackNumber : song.trackNumber,
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(song));
      }
    }

    if (req.method == 'DELETE' && req.url.startsWith('/artists')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let artId = urlParts[2];
        delete artists[artId];
        let returnJSON = {
          message: "Sucessfully deleted",
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == 'DELETE' && req.url.startsWith('/albums')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let albumId = urlParts[2];
        delete albums[albumId];
        let returnJSON = {
          message: "Sucessfully deleted",
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    if (req.method == 'DELETE' && req.url.startsWith('/songs')){
      let urlParts = req.url.split('/');
      if (urlParts.length == 3){
        let songId = urlParts[2];
        delete songs[songId];
        let returnJSON = {
          "message": "Sucessfully deleted"
        };
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(returnJSON));
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
