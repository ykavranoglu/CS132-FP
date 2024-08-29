"use strict";

/**
 * @author A. Yusuf Kavranoglu
 * CS132 Spring 2024
 * Final Project
 * 
 * Project name: Tea Hunter
 * Project description: This is an e-commerce website that allows the user to shop for different
 * kinds of tea based on their country of origin, with a map integration.
 * 
 * File description: This is the main and only server file, app.js. Handles all the following 
 * end-points:
 *  GET /countries
 *  GET /countries/:country
 *  GET /products/:product
 *  GET /geography/:country
 *  POST /sendMessage
 */

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const globby = require("globby");
const multer = require("multer");

const SERVER_ERROR = "Something went wrong on the server, please try again later.";
const CLIENT_ERROR = "Something went wrong on the client, please re-check your parameters.";
const SERVER_ERR_CODE = 500;
const CLIENT_ERR_CODE = 400;
const DEBUG = false;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

app.use(express.static("public"));

/**
 * Returns a list of countries as a JSON response.
 * If anything goes wrong on the server side, 500 error code is returned.
 */
app.get("/countries", async (req, res, next) => {
    try {
        let countries = await fs.readdir("countries");
        countries = countries.filter(item => !item.startsWith('.'));
        res.json(countries);
    } catch (error) {
        res.status(SERVER_ERR_CODE);
        error.message = SERVER_ERROR;
        next(error);
    }
} );

/**
 * Returns an object as a JSON response that has key and values for different country properties.
 * Has two key values, "products" whose value is a list of products and "general-information" whose
 * value is a string that contains general information relating to that countries tea products.
 * If anything goes wrong on the server, 500 error code is returned.
 * If the client asks for an inappropriate country name (which doesn't exist), which is the only
 * possible client side error for this case, then 400 error code is returned.
 */
app.get("/countries/:country", async (req, res, next) => {
    let countryDir = req.params.country;
    try {
        await fs.access(`countries/${countryDir}`);

        let productDirs = await fs.readdir(`countries/${countryDir}/products`);
        
        let promises = [];
        for (let productDir of productDirs) {
            const productPath = path.join("countries", countryDir, "products", productDir);
            const promise = fs.readFile(productPath, 'utf8');
            promises.push(promise);
        }
        let products = await Promise.all(promises);

        for (let i = 0; i < products.length; i++) {
            const properties = products[i].split("\n");

            let productObject = {}

            for (let line of properties) {
                const keyAndValue = line.split(":");
                const [key, value] = [keyAndValue[0].trim(), keyAndValue[1].trim()];
                productObject[key] = value;
            }
            products[i] = productObject;
        }

        const generalInformationPath = 
            path.join("countries", countryDir, "general-information.txt");
        const generalInformation = await fs.readFile(generalInformationPath, 'utf8');

        const viewContents = {
            products: products,
            "general-information": generalInformation
        };
        res.json(viewContents);
    } catch (error) {
        if (error.code == "ENOENT") {
            res.status(CLIENT_ERR_CODE);
            error.message = CLIENT_ERROR;
        }
        else {
            res.status(SERVER_ERR_CODE);
            error.message = SERVER_ERROR;
        }
        next(error);
    }
});

/**
 * Returns an object in JSON format that has information about a product, organized in keys and
 * values. Files that are read from are in JSON format so there is no need for reorganizing the
 * data in any way.
 * If anything goes wrong on the server, 500 error code is returned.
 * If the client asks for an inappropriate product name (which doesn't exist), which is the only
 * possible client side error for this case, then 400 error code is returned.
 */
app.get("/products/:product", async (req, res, next) => {
    const productDir = req.params.product;
    try {
        await fs.access(`products/${productDir}.json`);

        const productPath = path.join(`products/${productDir}.json`);
        const productInfo = await fs.readFile(productPath, 'utf8');
        res.json(JSON.parse(productInfo));

    } catch (error) {
        if (error.code == "ENOENT") {
            res.status(CLIENT_ERR_CODE);
            error.message = CLIENT_ERROR;
        }
        else {
            res.status(SERVER_ERR_CODE);
            error.message = SERVER_ERROR;
        }
        next(error);
    }
});

/**
 * Returns an object as a JSON response that has key and values for different country properties
 * related to their properties on the map displayed on the website. Files that are read from are in
 * JSON format so there is no need for reorganizing the data in any way.
 * If anything goes wrong on the server, 500 error code is returned.
 * If the client asks for an inappropriate country name (which doesn't exist), which is the only
 * possible client side error for this case, then 400 error code is returned.
 */
app.get("/geography/:country", async (req, res, next) => {
    const countryDir = req.params.country;
    try {
        await fs.access(`countries/${countryDir}/map-info.json`);

        const countryPath = path.join(`countries/${countryDir}/map-info.json`);
        const mapInfo = await fs.readFile(countryPath, 'utf8');
        res.json(JSON.parse(mapInfo));

    } catch (error) {
        if (error.code == "ENOENT") {
            res.status(CLIENT_ERR_CODE);
            error.message = CLIENT_ERROR;
        }
        else {
            res.status(SERVER_ERR_CODE);
            error.message = SERVER_ERROR;
        }
        next(error);
    }
});

/**
 * Receives message information in JSON format and stores it on a json file of array of messages.
 * If anything goes wrong on the server, 500 error code is sent.
 * If the required parameters are not present, a client side error code of 400 is returned.
 */
app.post("/sendMessage", async (req, res, next) => {
    
    let result = null;
    if (req.body.name && req.body.email && req.body.message) {
        result = {
            name: req.body.name,
            email: req.body.email,
            message: req.body.message
        };
    }

    if (!result) {
        res.status(CLIENT_ERR_CODE);
        next(Error("Required POST parameters for /contact: name, email, message."));
    }
    
    try {
        let messages = await fs.readFile("messages.json", "utf8");
        messages = JSON.parse(messages);
        messages.push(result);
        await fs.writeFile("messages.json", JSON.stringify(messages), "utf8");
        res.type("text");
        res.send("Your message was successfully received!");
    } catch (error) {
        res.status(SERVER_ERR_CODE);
        error.message = SERVER_ERROR;
        next(error);
    }
});


// Start the app on port 8000
const PORT = process.env.PORT || 8000;
app.listen(PORT);

