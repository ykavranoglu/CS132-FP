/**
 * CS 132
 * Final Project
 * Author: A. Yusuf Kavranoglu
 * 
 * Summary: The main client side .js file of the project. Handles all client side logic.
 * Fetches data from the API to get country and product information.
 * 
 */

(function() {
    "use strict";

    const IMGS_DIR = "images/";

    let cart = {};
    let map = null;

    /**
     * Creates the map object and assigns it to the module global variable "map"
     * Initializes all event listeners for the buttons that exist at the time of initialization.
     * Populates countries list in the main-view by fetching information from the server.
     * Calculates the cart information (initializes).
     */
    function init() {
        // creation of the map
        map = new maplibregl.Map({
            container: 'map', // container id
            style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=s3W8rf4EisIGnZAMsdaB', // style URL
            center: [50, 40], // starting position [longitude, latitude]
            zoom: 2.8 // starting zoom
        });

        // Add event listener to go-back button
        const goBackBtn = qs("#go-back");
        goBackBtn.addEventListener("click", goBack);

        // Add event listener to contact-us button
        const contactUsBtn = qs("#contact-us");
        contactUsBtn.addEventListener("click", selectContactView);

        // Add event listener to submit button in contact-view
        const submitButton = qs("#submit");
        submitButton.addEventListener("click", sendMessage);

        // Add event listener to cart button
        const cartBtn = qs("#cart");
        cartBtn.addEventListener("click", selectCartView);

        // Populate countries and initialize cart button
        populateCountries();
        calculateCartNumbers();
        
    }

    /**
     * Populates the country list on the main-view by fetching country data from the API
     * After fetching, the required DOM elements are generated with the appropriate hierarchy
     * 
     * An event listener is added to every country button generated, to open the country view when
     * clicked.
     */
    async function populateCountries() {

        let countries = await fetchCountryList();
        qs("#message-area").classList.add(".hidden");

        const countryList = qs('#country-list');
        for (let country of countries) {
            const section = gen('section');
            countryList.appendChild(section);

            const h2 = gen('h2');
            h2.textContent = country;
            section.appendChild(h2);

            section.addEventListener('click', (event) => selectCountryView(country, event));

            // fetch map info and highlight country on map
            const mapInfo = await fetchMapInfo(country);
            qs("#message-area").classList.add(".hidden");
            highlightCountryOnMap(country, mapInfo.x, mapInfo.y, mapInfo.color);
            createEventListenerForHighlight(country);
        }
    }

    /**
     * Fetches the map information for a country. Fetches the x and y coordinates, as well as the
     * zoom information, which depends on how big the country is.
     * @param {String} country 
     * @returns {Object} response from the server as an object in key and value form.
     */
    async function fetchMapInfo(country) {
        try {
            let resp = await fetch(`/geography/${country}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            checkStatus(resp);
            
            const respData = await resp.json();
            return respData;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Creates a circular highlighting object on the given country with the specified coordinates
     * and the color.
     * Used for MapLibre map API.
     * @param {String} countryName 
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} color 
     */
    function highlightCountryOnMap(countryName, x, y, color) {
        map.on('load', function () {
            // Highlight Turkey by putting a circle at the center of it
            map.addLayer({
                "id": `highlight-${countryName}`,
                "type": "circle",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Point",
                            "coordinates": [x, y]
                        }
                    }
                },
                "paint": {
                    "circle-radius": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        1, 10,
                        15, 500
                    ],
                    "circle-color": color,
                    "circle-opacity": 0.3
                }
            });
        });
    }

    function createEventListenerForHighlight(countryName) {
        map.on('click', `highlight-${countryName}`, () => {
            selectCountryView(countryName, null);
        });
    }

    /**
     * Fetches the list of countries that exist in the website with a GET request.
     * @returns {Array} Coutries array.
     */
    async function fetchCountryList() {
        try {
            let resp = await fetch("/countries", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            checkStatus(resp);
            
            const respData = await resp.json();
            return respData;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Switches the view to main-view. Hides all other views and the goBack button
     */
    function selectMainView() {
        // Hide other views, and display main-view
        qs("#product-view").classList.add("hidden");
        qs("#cart-view").classList.add("hidden");
        qs("#country-view").classList.add("hidden");
        qs("#go-back").classList.add("hidden");
        qs("#contact-view").classList.add("hidden");
        qs("#main-view").classList.remove("hidden");

        calculateCartNumbers();
    }

    /**
     * Switches the view to country-view for the specified country name.
     * Fetches the information about that specific country and then creates the required DOM
     * elements.
     * 
     * Hides all other views and displays the goBack button.
     * 
     * @param {String} countryName 
     * @param {Object} event 
     */
    async function selectCountryView(countryName, event) {

        // Make call to API to assign viewContents
        let viewContents = await fetchCountryInfo(countryName);
        qs("#message-area").classList.add(".hidden");

        // Hide other views, and display country-view
        qs("#main-view").classList.add("hidden");
        qs("#product-view").classList.add("hidden");
        qs("#cart-view").classList.add("hidden");
        qs("#contact-view").classList.add("hidden");
        qs("#country-view").classList.remove("hidden");
        qs("#go-back").classList.remove("hidden");

        // Display the products belonging to this country by creating the required dom elements
        // for each product.
        const productsSection = qs("#product-list");
        productsSection.innerHTML = "";
        for (let product of viewContents.products) {
            const article = gen("article");
            productsSection.appendChild(article);

            const img = gen("img");
            // is the below OK?
            img.src = IMGS_DIR + product.id + ".png";
            img.alt = product.name;
            article.appendChild(img);

            const p = gen("p");
            p.textContent = product.name;
            article.appendChild(p);

            article.addEventListener("click", (event) => selectProductView(product.id, event));
        }

        // Clear previous country information and display the selected one
        const countryInfo = qs("#country-info");
        countryInfo.innerHTML = "";

        const h2 = gen("h2");
        h2.textContent = countryName;
        countryInfo.appendChild(h2);

        const p = gen("p");
        p.textContent = viewContents["general-information"];
        countryInfo.appendChild(p);

        calculateCartNumbers();

        // Move the map to the selected country smoothly
        moveMapToCountry(countryName);
    }

    /**
     * Moves the map to the target country with a smooth animation. Sets the zoom level.
     * Gets the zoom level to be set and the coordinations of the country from the server by doing a
     * GET request.
     * Used for MapLibre map API.
     * @param {String} countryName 
     */
    async function moveMapToCountry(countryName) {
        const mapInfo = await fetchMapInfo(countryName);
        map.flyTo({
            center: [mapInfo.x, mapInfo.y],
            zoom: mapInfo.zoom,
            essential: true
        });
    }

    /**
     * Fetches information about a country with a GET request.
     * @param {String} countryName 
     * @returns {Object} Country information in an object form with keys and values.
     */
    async function fetchCountryInfo(countryName) {
        try {
            let resp = await fetch(`/countries/${countryName}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            checkStatus(resp);
            
            const respData = await resp.json();
            return respData;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Mock function to create country info. Replaced by API.
     * @param {String} countryName 
     */
    function createMockDataCountry(countryName) {
        let products = [];
        let generalInformation = null;

        if (countryName === "Turkey") {
            let tea1 = {
                id: "caykur-turist-cayi",
                name: "Caykur Tourist Tea",
                otherInfo: "other info"
            }
            let tea2 = {
                id: "caykur-organic",
                name: "Caykur Organic Black Tea",
                otherInfo: "other info"
            }
            let tea3 = {
                id: "caykur-altinbas",
                name: "Caykur Loose Leaf Altinbas",
                otherInfo: "other info"
            }
            let tea4 = {
                id: "dogus-gurme",
                name: "Dogus Gourmet Tea",
                otherInfo: "other info"
            }
            products.push(tea1);
            products.push(tea2);
            products.push(tea3);
            products.push(tea4);

            // Taken from Wikipedia. Cite if gonna keep it.
            generalInformation = 
                `Tea (Turkish: çay pronounced is a popular drink throughout Turkey and the 
                 Turkish diaspora. Turkey has the highest per capita tea consumption in the world 
                 with an annual total consumption of over 3 kilograms per person. Turkey is a 
                 large exporter of tea, ranking fifth among the top exporting countries. Tea plays 
                 a big role in social gatherings that take place in tea houses and gardens.`;
        }

        if (countryName === "China") {
            let tea1 = {
                id: "tian-hu-shan-oolong",
                name: "Tian Hu Shan Premium Oolong Tea Loose Leaf",
                otherInfo: "other info"
            }
            let tea2 = {
                id: "tian-hu-shan-puerh",
                name: "Tian Hu Shan Premium Aged Puerh Black Tea",
                otherInfo: "other info"
            }
            let tea3 = {
                id: "grand-tea-imports-jasmine-green",
                name: "Grand Tea and Imports Jasmine Green Tea",
                otherInfo: "other info"
            }
            let tea4 = {
                id: "tenfu-youqing-jasmine",
                name: "Tenfu Youqing Jasmine Tea",
                otherInfo: "other info"
            }
            products.push(tea1);
            products.push(tea2);
            products.push(tea3);
            products.push(tea4);

            // Taken from Wikipedia. Cite if gonna keep it.
            generalInformation = 
                `Chinese tea can be classified into six distinctive categories: white, green, 
                 yellow, oolong, black and post-fermented. Others add categories for scented and 
                 compressed teas. All of these come from varieties of the Camellia sinensis plant. 
                 Most Chinese teas are cultivated and consumed in China. It is commonly available 
                 in Chinese restaurants and grocery shops worldwide. Green tea is the most common 
                 type of tea consumed in China.`;
        }

        let countryInfo = {
            products: products,
            generalInformation: generalInformation
        }

        return countryInfo;
    }

    /**
     * Mock function to create product info. Replaced by API.
     * @param {String} productId 
     */
    function createMockDataProduct(productId) {
        let productName = null;
        let productStatistics = null;
        let productDescription = null;
        let productCountry = null;
        let productPrice = null;

        if (productId === "tian-hu-shan-oolong") {
            productName = "Tian Hu Shan Premium Oolong Tea Loose Leaf";

            productStatistics = {
                strength: "4",
                caffeine: "3",
                "room-note": "3",
                moisture: "2",
                "shelf-life": "3"
            };

            productDescription = "Product description for " + productId;

            productCountry = "China";

            productPrice = "14.99";
        }

        if (productId === "caykur-organic") {
            productName = "Caykur Organic Black Tea";

            productStatistics = {
                strength: "3",
                caffeine: "4",
                "room-note": "5",
                moisture: "2",
                "shelf-life": "2"
            };

            productDescription = "Product description for " + productId;

            productCountry = "Turkey";

            productPrice = "10.55";
        }

        let productInfo = {
            name: productName,
            statistics: productStatistics,
            description: productDescription,
            country: productCountry,
            price: productPrice
        }

        return productInfo;
    }

    /**
     * Switch the view to the product selected by productId.
     * The product information is fetched from the API
     * A lot of product information is displayed so lots of DOM element generation.
     * @param {String} productId 
     * @param {Object} event 
     */
    async function selectProductView(productId, event) {

        // Make call to API with productId
        let viewContents = await fetchProduct(productId);
        qs("#message-area").classList.add(".hidden");

        // Hide other views, and display country-view
        qs("#main-view").classList.add("hidden");
        qs("#country-view").classList.add("hidden");
        qs("#cart-view").classList.add("hidden");
        qs("#contact-view").classList.add("hidden");
        qs("#product-view").classList.remove("hidden");
        qs("#go-back").classList.remove("hidden");

        // Select the section to be populated
        const productInfo = qs("#product-info");
        productInfo.innerHTML = ""

        // Product name
        const h2 = gen("h2");
        h2.textContent = viewContents.name;
        productInfo.appendChild(h2);

        // Product image
        const img = gen("img");
        // is the below OK?
        img.src = IMGS_DIR + productId + ".png";
        img.alt = viewContents.name;
        productInfo.appendChild(img);

        // A separate section for price and add to cart button
        const section = gen("section");
        section.id = "add-to-cart";
        productInfo.appendChild(section);

        const button = gen("button");
        button.textContent = "Add to cart";
        button.addEventListener("click", (event) => addToCart(productId, event))
        section.appendChild(button);

        const pPrice = gen("p");
        pPrice.textContent = "$" + viewContents.price;
        section.appendChild(pPrice);


        // General description of the product
        const p = gen("p");
        p.textContent = viewContents.description;
        productInfo.appendChild(p);

        // Country info
        const pCountry = gen("p");
        pCountry.id = "country-name";
        pCountry.textContent = "Country: " + viewContents.country;
        productInfo.appendChild(pCountry);

        // Generate the unordered list and the items for it for the statistics
        const ul = gen("ul");
        productInfo.appendChild(ul);
        const li1 = gen("li");
        li1.textContent = "Strength: " + viewContents.statistics.strength + "/5";
        ul.appendChild(li1);
        const li2 = gen("li");
        li2.textContent = "Caffeine: " + viewContents.statistics.caffeine + "/5";
        ul.appendChild(li2);
        const li3 = gen("li");
        li3.textContent = "Room note: " + viewContents.statistics["room-note"] + "/5";
        ul.appendChild(li3);
        const li4 = gen("li");
        li4.textContent = "Moisture: " + viewContents.statistics.moisture + "/5";
        ul.appendChild(li4);
        const li5 = gen("li");
        li5.textContent = "Shelf life: " + viewContents.statistics["shelf-life"] + " years";
        ul.appendChild(li5);

        calculateCartNumbers();
    }

    /**
     * Fetches information about a product by using the products productId.
     * @param {String} productId 
     * @returns 
     */
    async function fetchProduct(productId) {
        try {
            let resp = await fetch(`/products/${productId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            checkStatus(resp);
            
            const respData = await resp.json();
            return respData;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Switches the view to the cart view, displays all elements in cart by fetching 
     * product information from the API by using the product IDs stored on client.
     */
    async function selectCartView() {
        // Hide other views, and display country-view
        qs("#main-view").classList.add("hidden");
        qs("#product-view").classList.add("hidden");
        qs("#country-view").classList.add("hidden");
        qs("#contact-view").classList.add("hidden");
        qs("#go-back").classList.remove("hidden");
        qs("#cart-view").classList.remove("hidden");

        // Clear the previous contents
        const cartList = qs("#cart-list");
        cartList.innerHTML = "";

        // If the cart is empty, display the appropriate text
        if (Object.entries(cart).length === 0) {
            const p = gen("p");
            p.textContent = "Your cart is empty!";
            cartList.appendChild(p);
        }
        // If the cart is not empty
        else {
            // for each product in cart
            for (const [productId, quantity] of Object.entries(cart)) {
                // Fetch product information
                // Make call to API with productId
                let viewContents = await fetchProduct(productId);
                qs("#message-area").classList.add(".hidden");

                // Generate the dom elements
                const section = gen("section");
                section.classList.add("cart-item");
                cartList.appendChild(section);
                
                const p1 = gen("p");
                p1.textContent = viewContents.name;
                section.appendChild(p1);

                // Whenever input changes, update the cart and reset cart view
                const input = gen("input");
                input.type = "number";
                input.value = quantity;
                input.addEventListener("input", (event) => {
                    if (input.value > 0) {
                        cart[productId] = parseInt(input.value);
                    }
                    else {
                        delete cart[productId];
                    }
                    selectCartView();
                });
                section.appendChild(input);
            }
        }

        calculateCartNumbers();
    }

    /**
     * Add product to cart. If the product is already in the cart, increase the quantity of it 
     * in the cart.
     * @param {String} productId 
     * @param {Object} event 
     */
    function addToCart(productId, event) {
        if (productId in cart) {
            cart[productId]++;
        }
        else {
            cart[productId] = 1;
        }

        calculateCartNumbers();
    }

    /**
     * Go to the previous view (except for cart-view)
     * This means go to the main view from any country-view or the cart-view
     */
    function goBack() {
        // If the country-view is active, select main-view
        if (! qs("#country-view").classList.contains("hidden")
            || ! qs("#cart-view").classList.contains("hidden")
            || ! qs("#contact-view").classList.contains("hiddem")){

            selectMainView();
        }
        // If a product view is active when the function is invoked, check which country that
        // product is from.
        else if (! qs("#product-view").classList.contains("hidden")){
            let countryNameRaw = qs("#product-view #country-name").textContent;
            let countryName = sanitizeCountryName(countryNameRaw);
            selectCountryView(countryName);
        }
        
    }

    /**
     * Selects the contact-view and hides all other views. Display the go-back button.
     */
    function selectContactView() {
        // Hide other views, and display country-view
        qs("#main-view").classList.add("hidden");
        qs("#product-view").classList.add("hidden");
        qs("#country-view").classList.add("hidden");
        qs("#cart-view").classList.add("hidden");
        qs("#go-back").classList.remove("hidden");
        qs("#contact-view").classList.remove("hidden");
    }

    
    /**
     * // Sanitize a string taken from a product view to be displayed. TODO: instead of this, fetch 
     * info from the API?
     * @param {String} countryNameRaw 
     * @returns {String} the sanitized version of the country name
     */
    function sanitizeCountryName(countryNameRaw) {
        return countryNameRaw.split('Country: ')[1];
    }

    /**
     * Calculates how many items from how many countries are in the cart.
     * This is done by fetching product info from the API and checking country name for product IDs.
     * 
     * This function is called whenever a view changes or whenever the cart changes.
     */
    async function calculateCartNumbers() {
        let setOfCountries = new Set();
        let noOfItems = 0;

        // For each product in the cart
        for (const [productId, quantity] of Object.entries(cart)) {
            // Make call to API with product.id
            let viewContents = await fetchProduct(productId);
            qs("#message-area").classList.add(".hidden");

            // Add the country of product to the set of countries (no repetition)
            setOfCountries.add(viewContents.country);
            // Append the quantity of product to the noOfItems
            noOfItems += quantity;
        }

        // The number of countries is the size of countries set
        const noOfCountries = setOfCountries.size;

        const cartP = qs("#cart p");
        
        // four different possibilities: cart is empty, cart has 1 item and 1 country,
        // cart has plural item and 1 country, cart has plural item and plural country
        if (! noOfItems) {
            cartP.textContent = "Cart is empty!"
            return;
        }
        const item = null;
        if ((noOfItems > 1) && (noOfCountries > 1)) {
            cartP.textContent = `${noOfItems} items from ${noOfCountries} countries in your cart!`;
            return;
        }
        else if ((noOfItems > 1)) {
            cartP.textContent = `${noOfItems} items from 1 country in your cart!`;
            return;
        }
        else {
            cartP.textContent = `1 item from 1 country in your cart!`;
            return;
        }
    }

    /**
     * Senda user message to the server to be stored on the server by doing a POST request.
     */
    async function sendMessage() {
        const msgName = qs("#name-area").value;
        const msgEmail = qs("#email-area").value;
        const msgContent = qs("#message-content-area").value;

        try {
            let resp = await fetch("/sendMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: msgName,
                    email: msgEmail,
                    message: msgContent
                })
            });
            checkStatus(resp);
            const respData = await resp.text();
        } catch (error) {
            handleError(error);
        }
    }

    /**
     * Will be replaced with my own
     * TAKEN FROM HW3
     * Displays an error message on the page, hiding any previous results.
     * If errMsg is passed as a string, the string is used to customize an error message.
     * Otherwise (the errMsg is an object or missing), a generic message is displayed.
     * @param {String} errMsg - optional specific error message to display on page.
     */
    function handleError(errMsg) {
        if (typeof errMsg === "string") {
            qs("#message-area").textContent = errMsg;
        } else {
            // the err object was passed, don"t want to show it on the page;
            // instead use generic error message.
            qs("#message-area").textContent =
                "An error ocurred fetching the data. Please try again later.";
        }
        qs("#message-area").classList.remove("hidden");
    }

    // Run the init because we are using the defer method and not an event listener.
    init();
  })();