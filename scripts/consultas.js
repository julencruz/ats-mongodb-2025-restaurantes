use('practica1');

// Tareas obligatorias

// Schemas de validación JSON

db.createCollection("restaurants", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["address", "address line 2", "name", "postcode"],
            properties: {
                address: {
                    bsonType: "string",
                    description: "Calle y número del restaurante",
                },
                "address line 2": {
                    bsonType: "string",
                    description: "Población",
                },
                name: {
                    bsonType: "string",
                    description: "Nombre del restaurante",
                },
                postcode: {
                    bsonType: "string",
                    description: "Código postal (3 caracteres alfanuméricos)",
                    pattern: "^[A-Z0-9]{3}$"
                }
            }
        }
    }});

db.createCollection("inspections", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["id", "restaurant_id", "certificate_number", "date", "result"],
            properties: {
                id: {
                    bsonType: "string",
                    description: "Identificador de la inspección"
                },
                restaurant_id: {
                    bsonType: "string",
                    description: "Identificador del restaurant"
                },
                certificate_number: {
                    bsonType: "int",
                    description: "Numero de certificado",
                    pattern: "^[0-9]{8}$"
                },
                date: {
                    bsonType: "string",
                    description: "Fecha"
                },
                result: {
                    bsonType: "string",
                    description: "Resultado de la inspección",
                    enum: [ "Pass", "Warning Issued", "Fail", "Violation Issued", "No Violation Issued"]
                }
            }
        }
    }});


// 2. Consultas
//  a) Todos los restaurantes de comida china:
 db.restaurants.find({"type_of_food": "Chinese"});

//  b) Listar las inspecciones con violaciones, ordenadas por fecha.
 db.inspections.find({"result": "Violation Issued"}).sort({date: 1});

//  c) Encontrar restaurantes con una calificación superior a 4.
 db.restaurants.find({rating: {$gt: 4}}).sort({rating: 1})

// 3. Uso de agregaciones
//  a) Agrupar restaurantes por tipo de comida y calcular la calificación promedio.
    db.restaurants.aggregate([
      {
        $group: {
          _id: '$type_of_food',
          average_rating: { $avg: '$rating' }
        }
      },
      { $sort: { average_rating: -1 } }
    ],
      );

//  b) Contar el número de inspecciones por resultado y mostrar los porcentajes. 
    db.inspections.aggregate(
    [
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          results: {
            $push: {
              result: '$_id',
              count: '$count'
            }
          }
        }
      },
      { $unwind: '$results' },
      {
        $project: {
          _id: 0,
          result: '$results.result',
          count: '$results.count',
          percentage: {
            $multiply: [
              {
                $divide: [
                  '$results.count',
                  '$total'
                ]
              },
              100
            ]
          }
        }
      }
    ],
  );

//  c) Unir restaurantes con sus inspecciones utilizando $lookup
db.restaurants.aggregate([
    {
      "$lookup": {
        from: "inspections",
        let: { "restaurantId": "$_id" },  
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$restaurant_id", { $toString: "$$restaurantId" }] }
            }
          }
        ],
        as: "inspections"
      }
    }
  ])

// Tareas avanzadas
// Creacion de los indices:
// a) Por tipo de comida
db.restaurants.createIndex({"type_of_food": 1})
// b) Por valoración del restaurante
db.restaurants.createIndex({rating: -1})
// c) Por fecha de la inspección y nombre de restaurante
db.inspections.createIndex({business_name: 1, date: 1})
  
  
  