const dotenv = require('dotenv')
const express = require('express')
const mongodb = require('mongodb')
const { check, validationResult, oneOf } = require('express-validator/check');
const { Helper } = require("./helper.js");
const helper = new Helper();
dotenv.config()

const app = express()
app.use(express.json())

const port = process.env.PORT || 3000

const uri = process.env.DATABASE_URI


app.post('/api/books', helper.isValidQuery(), function(request, response) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(422).json({
            errors: errors.array()
        });
    }

    const client = new mongodb.MongoClient(uri, {
        useNewUrlParser: true
    });


    const query = Object.keys(request.query);
    const searchObject = helper.generateSearchObject(query, request);
    if (helper.isObjectEmpty(searchObject)) {
        return response.status(400).json(`Error: Invalid criteria`)
    }

    client.connect(function() {
        const db = client.db('literature')
        const collection = db.collection('books')
        collection.findOne(searchObject, function(error, book) {
            if (book) {
                return response.status(400).json(`Error: ${book.title} by ${book.author} already exists in this collection!`)
            } else if (error) {
                return response.status(400).json(error)
            } else {
                collection.insertOne(searchObject, function(error, result) {
                    response.status(200).send(error || result.ops[0])
                    client.close()

                })

            }

        })

    })


})

app.delete('/api/books/:id', helper.isValidHex(), function(request, response) {

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(422).json({
            errors: errors.array()
        });
    }

    const client = new mongodb.MongoClient(uri)

    client.connect(function() {
        const db = client.db('literature')
        const collection = db.collection('books')

        let id
        try {
            id = new mongodb.ObjectID(request.params.id)
        } catch (error) {
            return response.status(400).json('Invalid Hex')
        }

        const searchObject = {
            _id: id
        }

        collection.deleteOne(searchObject, function(error, result) {
            if (error) {
                response.status(500).send(error)
            } else if (result.deletedCount) {
                response.sendStatus(204)
            } else {
                response.sendStatus(404)
            }

            client.close()
        })
    })
})

app.put('/api/books/:id', oneOf(helper.isValidHex() || helper.isValidQuery()), function(request, response) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(422).json({
            errors: errors.array()
        });
    }

    const client = new mongodb.MongoClient(uri, {
        useNewUrlParser: true
    })


    let id
    try {
        id = new mongodb.ObjectID(request.params.id)
    } catch (error) {
        return response.status(400).json('Invalid Hex')
    }

    const query = Object.keys(request.query);
    const requestObject = helper.generateSearchObject(query, request);
    if (helper.isObjectEmpty(requestObject)) {
        return response.status(400).json(`Error: Invalid criteria`)
    }

    client.connect(function() {
        const db = client.db('literature')
        const collection = db.collection('books')

        const searchObject = {
            _id: id
        }
        const updateObject = {
            $set: requestObject
        }

        const options = {
            returnOriginal: false
        }

        collection.findOneAndUpdate(searchObject, updateObject, options, function(
            error, result) {
            if (result.value !== null) {
                return response.status(200).json(result.value);
            } else if (result) {
                return response.status(404).json(`Error: ID: ${queryId} is ${result.value}`);
            } else {
                return response.status(200).json(error);
            }
            client.close()
        })

    })
})

app.get('/api/books', function(request, response) {
    const client = new mongodb.MongoClient(uri)

    client.connect(function() {
        const db = client.db('literature')
        const collection = db.collection('books')

        const searchObject = {}

        if (request.query.title) {
            searchObject.title = request.query.title
        }

        if (request.query.author) {
            searchObject.author = request.query.author
        }

        collection.find(searchObject).toArray(function(error, books) {
            response.send(error || books)
            client.close()
        })
    })
})

app.get('/api/books/:id', function(request, response) {
    const client = new mongodb.MongoClient(uri)

    let id
    try {
        id = new mongodb.ObjectID(request.params.id)
    } catch (error) {
        response.sendStatus(400)
        return
    }

    client.connect(function() {
        const db = client.db('literature')
        const collection = db.collection('books')

        const searchObject = {
            _id: id
        }

        collection.findOne(searchObject, function(error, book) {
            if (!book) {
                response.sendStatus(404)
            } else {
                response.send(error || book)
            }

            client.close()
        })
    })
})

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html')
})

app.get('/books/new', function(request, response) {
    response.sendFile(__dirname + '/new-book.html')
})

app.get('/books/:id', function(request, response) {
    response.sendFile(__dirname + '/book.html')
})

app.get('/books/:id/edit', function(request, response) {
    response.sendFile(__dirname + '/edit-book.html')
})

app.get('/authors/:name', function(request, response) {
    response.sendFile(__dirname + '/author.html')
})

app.listen(port || 3001, function() {
    console.log(`Running at \`http://localhost:${port}\`...`)
})
