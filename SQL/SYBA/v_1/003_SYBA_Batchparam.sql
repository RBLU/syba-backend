BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.BATCHPARAM (
  boid varchar(40),
  itsBatchconfig varchar(40),
  itsSyriusBatch varchar(40),
  paramname varchar(40),
  paramclause varchar(100),
  active number(1),
  CONSTRAINT batchparam_boid unique(boid))';

END;