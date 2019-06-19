const { check, validationResult } = require('express-validator/check');

class Helper {

    isValidQuery() {
        return [check('title').isLength({
                min: 4
            }).withMessage('Title must be more than 4 characters'),
            check('author').isLength({
                min: 5
            }).withMessage('Author must be more than 5 characters'),
            check('author_birth_year').custom(year => {
                if (!this.isValidYear(year)) {
                    throw new Error('Author year must be a valid year')
                } else {
                    // weird bug with validator requires true to be added here
                    return true
                }
            }),
            check('author_death_year').custom(year => {
                if (!this.isValidYear(year)) {
                    throw new Error('Death year must be a valid year')
                } else {
                    // weird bug with validator requires true to be added here
                    return true
                }
            }),
            check('url').isURL().withMessage('Must be Valid URL')
        ]
    }

    isValidHex() {
        return [check('id').custom(id => {
            if (!this.checkHex(id)) {
                throw new Error('Invalid Hex')
            } else {
                return true
            }
        })]
    }

    checkHex(id) {
        var regex = new RegExp("^[0-9a-fA-F]{24}$");
        return regex.test(id)
    }


    isValidYear(year) {
        var result = parseInt(year);
        return /\d{4}/.test(result)
    }

    // some sort of search object constructor?
    generateSearchObject(query, request) {
        const searchObject = {};
        query.map(key => {
            searchObject[key] = request.query[key];
        })
        return searchObject
    }

    isObjectEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

}

module.exports = { Helper };
