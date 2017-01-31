BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.Kennzahl (
  boid varchar(40),
  itsSyriusBatch varchar(40),
  name varchar(40),
  description varchar(255),
  unit varchar(40)
)';
END;