DROP TABLE BigData;
CREATE TABLE BigData(id INT, val1 TEXT, val2 TEXT, category INT);

CREATE OR REPLACE FUNCTION GenerateData(_start_id INT, _count INT)
RETURNS VOID AS $$
INSERT INTO BigData(id, val1, val2, category)
SELECT generate_series(_start_id, _start_id + _count - 1), md5(random()::TEXT), md5(random()::TEXT), floor(_count*random()/1000);
$$ LANGUAGE sql;

CREATE INDEX idx_id ON BigData(id);
CREATE INDEX idx_category ON BigData(category);
