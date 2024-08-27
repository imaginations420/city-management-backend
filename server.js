const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Add City API
app.post('/cities', (req, res) => {
    const { name, population, country, latitude, longitude } = req.body;

    const sql = 'INSERT INTO cities (name, population, country, latitude, longitude) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [name, population, country, latitude, longitude], function (err) {
        if (err) {
            return res.status(400).json({ error: 'City with this name already exists.' });
        }
        res.status(201).json({ message: 'City added successfully!', city: { id: this.lastID, name, population, country, latitude, longitude } });
    });
});

// Update City API
app.put('/cities/:id', (req, res) => {
    const { id } = req.params;
    const { name, population, country, latitude, longitude } = req.body;

    const sql = 'UPDATE cities SET name = ?, population = ?, country = ?, latitude = ?, longitude = ? WHERE id = ?';
    db.run(sql, [name, population, country, latitude, longitude, id], function (err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'City not found.' });
        }
        res.json({ message: 'City updated successfully!', city: { id, name, population, country, latitude, longitude } });
    });
});

// Delete City API
app.delete('/cities/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM cities WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'City not found.' });
        }
        res.json({ message: 'City deleted successfully!' });
    });
});

// Get Cities API
app.get('/cities', (req, res) => {
    const { page = 1, limit = 10, filter, sort, search, projection } = req.query;

    let query = 'SELECT * FROM cities';
    const params = [];
    
    // Filter cities based on specified criteria
    if (filter) {
        const filterObj = JSON.parse(filter);
        const filterConditions = [];
        for (const key in filterObj) {
            filterConditions.push(`${key} = ?`);
            params.push(filterObj[key]);
        }
        query += ' WHERE ' + filterConditions.join(' AND ');
    }

    // Search cities based on a search term
    if (search) {
        query += (filter ? ' AND' : ' WHERE') + ' name LIKE ?';
        params.push(`%${search}%`);
    }

    // Sort cities based on a specified field and order
    if (sort) {
        const [sortField, sortOrder] = sort.split(':');
        query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    db.all(query, params, (err, cities) => {
        if (err) {
            return res.status(500).json({ error: 'An error occurred while retrieving cities.' });
        }

        // Projection: include/exclude specific fields
        if (projection) {
            const projectionFields = projection.split(',');
            cities = cities.map(city => {
                const filteredCity = {};
                projectionFields.forEach(field => {
                    if (city[field] !== undefined) {
                        filteredCity[field] = city[field];
                    }
                });
                return filteredCity;
            });
        }

        // Get total cities count for pagination
        db.get('SELECT COUNT(*) AS total FROM cities', (err, countRow) => {
            if (err) {
                return res.status(500).json({ error: 'An error occurred while counting cities.' });
            }

            res.json({
                page: Number(page),
                limit: Number(limit),
                totalCities: countRow.total,
                cities
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
