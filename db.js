const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'cities.db'), (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');

        db.run(`CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            population INTEGER NOT NULL,
            country TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table ' + err.message);
            } else {
                db.get('SELECT COUNT(*) AS count FROM cities', [], (err, row) => {
                    if (row.count === 0) {
                        const cities = [
                            { name: 'New York', population: 8419000, country: 'USA', latitude: 40.7128, longitude: -74.0060 },
                            { name: 'Los Angeles', population: 3980000, country: 'USA', latitude: 34.0522, longitude: -118.2437 },
                            { name: 'Chicago', population: 2716000, country: 'USA', latitude: 41.8781, longitude: -87.6298 },
                            { name: 'Houston', population: 2328000, country: 'USA', latitude: 29.7604, longitude: -95.3698 },
                            { name: 'Phoenix', population: 1663000, country: 'USA', latitude: 33.4484, longitude: -112.0740 }
                        ];

                        const stmt = db.prepare('INSERT INTO cities (name, population, country, latitude, longitude) VALUES (?, ?, ?, ?, ?)');
                        cities.forEach(city => {
                            stmt.run(city.name, city.population, city.country, city.latitude, city.longitude);
                        });
                        stmt.finalize();
                    }
                });
            }
        });
    }
});

module.exports = db;
