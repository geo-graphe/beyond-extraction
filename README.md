# Beyond Extraction Resources

To scrape exhibitor data, simply run the following command from the terminal:

```sh
python pdac_scrape.py -p 'data/path/'
```

To populate a PostGIS database, first create the database and enable the PostGIS extension:

```sql
CREATE DATABASE pdac;
CREATE EXTENSION postgis;
```

You can then run the provided `.sql` file from the command line using the `psql` utility.

```sh
psql -h localhost -d -U postgres -f ./sql/create-populate.sql
```