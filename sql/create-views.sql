
DROP VIEW IF EXISTS exhibitor_addresses;
DROP VIEW IF EXISTS investor_to_countries;
DROP VIEW IF EXISTS booth_to_investor;
DROP VIEW IF EXISTS investor_by_countries;

CREATE VIEW exhibitor_addresses AS
    SELECT
        e.name, 
        MAX(e.add) AS add, 
        MAX(e.country) AS country, 
        STRING_AGG(b.type, ', ') AS types, 
        STRING_AGG(eb.booth_no, ', ') AS booths
    FROM exhibitors e
        LEFT JOIN exhibitor_by_booth eb 
        ON e.name = eb.name
            LEFT JOIN booths b 
            ON eb.booth_no=b.booth_no
    GROUP BY e.name
    ORDER BY types;

CREATE VIEW investor_to_countries AS
    SELECT
        e.name AS investor, 
        MAX(eb.booth_no) AS booth_no,
        COUNT(c.country) AS country_cnt,
        ST_UNION(ST_MAKELINE(e.geom, ST_CENTROID(c.geom))) AS geom
    FROM 
        exhibitors AS e
        INNER JOIN ix_by_country AS ic
        ON e.name=ic.name
            INNER JOIN countries AS c
            ON ic.country=c.country
        INNER JOIN exhibitor_by_booth AS eb
        ON e.name=eb.name
            INNER JOIN booths AS b
            ON eb.booth_no=b.booth_no
    WHERE b.type='ix'
    GROUP BY e.name;

CREATE VIEW investor_by_countries AS
    SELECT
        e.name AS investor, 
        MAX(eb.booth_no) AS booth_no,
        COUNT(c.country) AS country_cnt,
        e.geom AS geom
    FROM 
        exhibitors AS e
        INNER JOIN ix_by_country AS ic
        ON e.name=ic.name
            INNER JOIN countries AS c
            ON ic.country=c.country
        INNER JOIN exhibitor_by_booth AS eb
        ON e.name=eb.name
            INNER JOIN booths AS b
            ON eb.booth_no=b.booth_no
    WHERE b.type='ix'
    GROUP BY e.name, e.geom;

CREATE VIEW booth_to_investor AS
    SELECT
        eb.id AS id,
        e.name AS investor, 
        eb.booth_no AS booth_no,
        ST_MAKELINE(e.geom, ST_CENTROID(b.geom)) AS geom,
        ST_DISTANCE(e.geom::geography, ST_CENTROID(b.geom)::geography) / 1000 AS dist
    FROM 
        exhibitors AS e
        INNER JOIN exhibitor_by_booth AS eb
        ON e.name=eb.name
            INNER JOIN booths AS b
            ON eb.booth_no=b.booth_no
    WHERE b.type='ix';