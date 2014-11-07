
###Spark server数据库表设计文档

Device Server选择mongoDB作为数据库. 同时使用mongoose作为管理工具 [Mongoose](http://mongoosejs.com/) is a elegant mongodb object modeling for node.js.

下面是我们的数据库设计文档:
1. User table
Model:
{
  "_id": "zVBYszPXZXexAaCsIszRzOz9+2zVIhse",
  "username": "lxtech2013@gmail.com",
  "password_hash": "n9+ASCTgh7wPg+6kVXGSrGKIyqipV3p1TETjmYExx4U27CZpsZ7FLS7akreDTM6nR4ckVW9geoAKp1mdJ71RqA==",
  "salt": "HZiE7FHNUjtkro2IUszbgp+ux8XhHkzFkyLppXl1Fazs0G+Gv41yvYifhTB52VaRDg25jjLCUj5EDzcP0HZc9w==",
  "access_tokens": [
    {
      "user_id": "zVBYszPXZXexAaCsIszRzOz9+2zVIhse",
      "client_id": "spark",
      "token": "6c90d460763be138603e8e287da0322b56a280b6",
      "expires": "2015-02-03T10:45:10.310Z",
      "_id": "6c90d460763be138603e8e287da0322b56a280b6"
    }
  ]
}
