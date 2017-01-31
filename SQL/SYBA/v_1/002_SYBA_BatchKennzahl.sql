BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE SYBA.BatchKennzahl (
  boid varchar(40),
  itsSyriusBatch varchar(40),
  itskennzahl varchar(40)
)';
END;
