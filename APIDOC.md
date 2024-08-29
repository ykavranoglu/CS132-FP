
# CS132 TeaStore API Documentation
**Author:** A. Yusuf Kavranoglu
**Last Updated:** 08/28/2024

The TeaStore API allows clients to receive country and product information from the server for the
Tea Hunter website. This is an e-commerce website that allows users to explore the world map and
shop for tea from different countries. The API also allows the client to get in touch with the
project owners through a message passed as a POST request.

Summary of endpoints:
* GET /countries
* GET /countries/:country
* GET /products/:product
* GET /geography/:country
* POST /sendMessage

Any 500 error code represents some problem in the server side.
Any 400 error code represents some problem in the client side.

Contact me by emailing ykavranoglu@caltech.edu if anything goes wrong.

## *GET /countries*
**Returned Data Format**: JSON

**Description:**
Returns a JSON collection of all country names that exists in the store.

**Example Request:** `/countries`

**Example Response:**
```json
[
  "China",
  "India",
  "Turkey"
]
```

## *GET /countries/:country*
**Returned Data Format**: JSON

**Description:**
Returns a JSON collection of all the products from the country and also general information text
about the country.

**Parameters**
* country
  * Returns information about the given country

**Example Request:** `/countries/Turkey`

**Example Response:**
```json
{
  "products":[
    {"id":"caykur-altinbas","name":"Caykur Loose Leaf Altinbas"},
    {"id":"caykur-organic","name":"Caykur Organic Black Tea"},
    {"id":"caykur-turist-cayi","name":"Caykur Tourist Tea"},
    {"id":"dogus-gurme","name":"Dogus Gurme Tea"}
    ],
  "general-information":"Tea (Turkish: çay) is a popular drink throughout Turkey and the Turkish diaspora. Turkey has the highest per capita tea consumption in the world with an annual total consumption of over 3 kilograms per person. Turkey is a large exporter of tea, ranking fifth among the top exporting countries. Tea plays a big role in social gatherings that take place in tea houses and gardens. --- Source: Wikipedia contributors. \"Tea in Turkey.\" Wikipedia, The Free Encyclopedia."
}
```

## *GET /products/:product*
**Returned Data Format**: JSON

**Description:**
Returns a JSON collection that has information about a product

**Parameters**
* product
  * Returns information about the given product

**Example Request:** `/products/caykur-organic`

**Example Response:**
```json
{
  "name":"Caykur Organic Black Tea",
  "statistics":{
    "strength":"3",
    "caffeine":"4",
    "room-note":"5",
    "moisture":"2",
    "shelf-life":"2"
  },
  "description":"Product description for caykur-organic",
  "country":"Turkey",
  "price":"10.55"
}
```

## *GET /geography/:country*
**Returned Data Format**: JSON

**Description:**
Returns a JSON collection that has information about different country properties related to their properties on the map displayed on the website.

**Parameters**
* country
  * Returns map related information about the given country

**Example Request:** `/geography/Turkey`

**Example Response:**
```json
{
  "x":35.2433,
  "y":38.9637,
  "color":"#ff0000",
  "zoom":5
}
```

## *POST /sendMessage*
**Returned Data Format**: JSON

**Description:** 
Sends message information in JSON format and stores it on a json file of array of messages. Sent
from the client to the server. Response is in plain text.

**Supported Parameters**
* POST body parameters: 
  * `name` (required) - name of user
  * `email` (required) - email of user
  * `message` (required) - message sent by the user

**Example Request:** `/sendMessage`
```json
{
  "name":"Yusuf K.",
  "email":"yusuf@gmail.com",
  "message":"Keep up the good work!"
}
```

**Example Response:**
```Your message was successfully received!```
