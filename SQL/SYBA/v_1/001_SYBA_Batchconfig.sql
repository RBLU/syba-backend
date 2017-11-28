BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.BATCHCONFIG (
  boid varchar(40),
  itsSyriusBatch varchar(40),
  name varchar(100),
  description varchar(100),
  fromDate date,
  toDate date,
  active number(1),
  CONSTRAINT bc_boid unique(boid))';
END;